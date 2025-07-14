#!/usr/bin/env python3
"""
Notion Sync for Unifi Distributor Tracking System
Comprehensive synchronization with all JSON API fields
"""

import sqlite3
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from notion_client import Client
from notion_client.errors import APIResponseError
from config.settings import settings
from config.logging import LoggerMixin
import time


class NotionSync(LoggerMixin):
    """Notion sync with complete JSON API field support"""
    
    def __init__(self):
        if not settings.notion_token:
            raise ValueError("Notion token is required")
        
        self.client = Client(auth=settings.notion_token)
        self.database_id = settings.notion_database_id
        self.batch_size = settings.notion_batch_size
        self.db_path = "unifi_distributors.db"
        self.logger.info("Notion sync initialized")
    
    def sync_all_distributors(self) -> Dict:
        """Complete sync with all JSON API fields"""
        self.logger.info("🚀 Starting Notion sync...")
        
        results = {
            'created': 0,
            'updated': 0,
            'skipped': 0,
            'errors': [],
            'total_processed': 0,
            'sync_time': 0,
            'json_api_records': 0,
            'legacy_records': 0
        }
        
        start_time = time.time()
        
        try:
            # Get distributors with complete data
            distributors = self._get_enhanced_distributors()
            
            if not distributors:
                self.logger.warning("No distributors found for sync")
                return results
            
            # Count data sources
            json_api_count = sum(1 for d in distributors if d.get('data_source') == 'json_api')
            legacy_count = len(distributors) - json_api_count
            
            results['json_api_records'] = json_api_count
            results['legacy_records'] = legacy_count
            
            self.logger.info(f"📊 Syncing {len(distributors)} distributors:")
            self.logger.info(f"   🚀 JSON API: {json_api_count}")
            self.logger.info(f"   🔧 Legacy: {legacy_count}")
            
            # Process in batches
            for i in range(0, len(distributors), self.batch_size):
                batch = distributors[i:i + self.batch_size]
                batch_results = self._sync_enhanced_batch(batch)
                
                results['created'] += batch_results['created']
                results['updated'] += batch_results['updated']
                results['skipped'] += batch_results['skipped']
                results['errors'].extend(batch_results['errors'])
                results['total_processed'] += len(batch)
                
                # Rate limiting
                if i + self.batch_size < len(distributors):
                    time.sleep(0.5)
                
                # Progress update
                progress = ((i + len(batch)) / len(distributors)) * 100
                self.logger.info(f"📈 Progress: {progress:.1f}% ({i + len(batch)}/{len(distributors)})")
            
            results['sync_time'] = time.time() - start_time
            
            self.logger.info(f"✅ Sync completed: {results}")
            return results
            
        except Exception as e:
            error_msg = f"Error during sync: {str(e)}"
            self.logger.error(error_msg)
            results['errors'].append(error_msg)
            results['sync_time'] = time.time() - start_time
            return results
    
    def _get_enhanced_distributors(self) -> List[Dict]:
        """Get distributors with complete JSON API fields"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT 
                    d.id, c.name as company_name, d.partner_type, d.address, 
                    d.phone, d.contact_email, d.region, d.country_state,
                    d.latitude, d.longitude, d.is_active, d.created_at, d.updated_at,
                    c.website_url, d.notion_page_id, d.notion_last_sync, d.notion_sync_status,
                    d.unifi_id, d.last_modified_at, d.order_weight, d.logo_url,
                    d.sunmax_partner, d.data_source, d.scraped_at, d.full_country_name, d.city,
                    d.last_verified_at
                FROM distributors d
                JOIN companies c ON d.company_id = c.id
                ORDER BY d.is_active DESC, d.data_source DESC, d.order_weight DESC NULLS LAST, d.created_at DESC
            """)
            
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
            
        finally:
            conn.close()
    
    def _sync_enhanced_batch(self, distributors: List[Dict]) -> Dict:
        """Sync batch with enhanced field support"""
        results = {'created': 0, 'updated': 0, 'skipped': 0, 'errors': []}
        
        for dist in distributors:
            try:
                # Check if page exists
                existing_page = self._find_existing_page(dist)
                
                if existing_page:
                    # Update existing page with enhanced fields
                    self._update_enhanced_notion_page(existing_page['id'], dist)
                    results['updated'] += 1
                    self.logger.debug(f"📝 Updated: {dist['company_name']}")
                else:
                    # Create new page with enhanced fields
                    page_response = self._create_enhanced_notion_page(dist)
                    if page_response:
                        # Update local notion_page_id
                        self._update_notion_page_id(dist['id'], page_response['id'])
                        results['created'] += 1
                        self.logger.debug(f"✨ Created: {dist['company_name']}")
                    else:
                        results['skipped'] += 1
                
            except Exception as e:
                error_msg = f"Error syncing {dist['company_name']}: {str(e)}"
                self.logger.error(error_msg)
                results['errors'].append(error_msg)
        
        return results
    
    def _find_existing_page(self, dist: Dict) -> Optional[Dict]:
        """Find existing Notion page"""
        try:
            # First try by stored notion_page_id
            if dist.get('notion_page_id'):
                try:
                    page = self.client.pages.retrieve(dist['notion_page_id'])
                    return page
                except:
                    # Page ID invalid, clear it and search by other criteria
                    self._update_notion_page_id(dist['id'], None)
            
            # Search by Unifi ID (most reliable)
            if dist.get('unifi_id'):
                response = self.client.databases.query(
                    database_id=self.database_id,
                    filter={
                        "property": "unifi_id",
                        "number": {
                            "equals": dist['unifi_id']
                        }
                    }
                )
                if response['results']:
                    return response['results'][0]
            
            # Fallback to company name + address
            response = self.client.databases.query(
                database_id=self.database_id,
                filter={
                    "and": [
                        {
                            "property": "Company Name",
                            "title": {
                                "equals": dist['company_name']
                            }
                        },
                        {
                            "property": "Address",
                            "rich_text": {
                                "equals": dist['address']
                            }
                        }
                    ]
                }
            )
            
            return response['results'][0] if response['results'] else None
            
        except Exception as e:
            self.logger.error(f"Error finding existing page: {str(e)}")
            return None
    
    def _create_enhanced_notion_page(self, dist: Dict) -> Optional[Dict]:
        """Create Notion page with enhanced JSON API fields"""
        try:
            properties = self._build_enhanced_properties(dist)
            
            response = self.client.pages.create(
                parent={"database_id": self.database_id},
                properties=properties
            )
            
            return response
            
        except APIResponseError as e:
            self.logger.error(f"Notion API error creating page: {str(e)}")
            return None
        except Exception as e:
            self.logger.error(f"Error creating enhanced page: {str(e)}")
            return None
    
    def _update_enhanced_notion_page(self, page_id: str, dist: Dict) -> Optional[Dict]:
        """Update Notion page with enhanced fields"""
        try:
            properties = self._build_enhanced_properties(dist)
            
            response = self.client.pages.update(
                page_id=page_id,
                properties=properties
            )
            
            # Update local notion_page_id if needed
            if not dist.get('notion_page_id'):
                self._update_notion_page_id(dist['id'], page_id)
            
            return response
            
        except APIResponseError as e:
            self.logger.error(f"Notion API error updating page: {str(e)}")
            return None
        except Exception as e:
            self.logger.error(f"Error updating enhanced page: {str(e)}")
            return None
    
    def _build_enhanced_properties(self, dist: Dict) -> Dict:
        """Build enhanced Notion properties with JSON API fields"""
        properties = {
            # Basic information
            "Company Name": {
                "title": [{"text": {"content": dist['company_name']}}]
            },
            "Partner Type": {
                "select": {
                    "name": "Master Distributor" if dist['partner_type'] == "master" else "Authorized Reseller"
                }
            },
            "Address": {
                "rich_text": [{"text": {"content": dist['address']}}]
            },
            "Status": {
                "select": {
                    "name": "Active" if dist['is_active'] else "Inactive"
                }
            },
            
            # Enhanced JSON API fields
            "Data Source": {
                "select": {
                    "name": "JSON API" if dist.get('data_source') == 'json_api' else "HTML Legacy"
                }
            },
            "Last Updated": {
                "date": {"start": datetime.now().isoformat()}
            },
            "Notion Sync Date": {
                "date": {"start": datetime.now().isoformat()}
            },
            "Sync Status": {
                "select": {
                    "name": "JSON Updated" if dist.get('data_source') == 'json_api' else "Synced"
                }
            }
        }
        
        # JSON API enhanced fields
        if dist.get('unifi_id'):
            properties["unifi_id"] = {"number": dist['unifi_id']}
        
        if dist.get('last_modified_at'):
            properties["last_modified_at"] = {
                "date": {"start": dist['last_modified_at']}
            }
        
        if dist.get('order_weight'):
            properties["order_weight"] = {"number": dist['order_weight']}
        
        if dist.get('logo_url'):
            properties["logo_url"] = {"url": dist['logo_url']}
        
        if dist.get('sunmax_partner') is not None:
            properties["sunmax_partner"] = {"checkbox": bool(dist['sunmax_partner'])}
        
        if dist.get('last_verified_at'):
            properties["Last Verified"] = {
                "date": {"start": dist['last_verified_at']}
            }
        elif dist.get('scraped_at'):
            properties["Last Verified"] = {
                "date": {"start": dist['scraped_at']}
            }
        
        # Local database reference
        properties["Database ID"] = {"number": dist['id']}
        
        # Optional standard fields
        if dist.get('website_url'):
            properties["Website"] = {"url": str(dist['website_url'])}
        
        if dist.get('phone'):
            properties["Phone"] = {"phone_number": dist['phone']}
        
        if dist.get('contact_email'):
            properties["Contact Email"] = {"email": dist['contact_email']}
        
        if dist.get('region'):
            region_mapping = {
                "usa": "USA", "eur": "EUR", "as": "AS", "af": "AF",
                "can": "CAN", "lat-a": "LAT-A", "mid-e": "MID-E", "aus-nzl": "AUS-NZL"
            }
            region_name = region_mapping.get(dist['region'].lower(), dist['region'].upper())
            properties["Region"] = {"select": {"name": region_name}}
        
        if dist.get('country_state'):
            properties["Country/State"] = {"select": {"name": str(dist['country_state'])}}
        
        if dist.get('full_country_name'):
            properties["Full Country Name"] = {"select": {"name": str(dist['full_country_name'])}}
        
        if dist.get('city'):
            properties["City"] = {"select": {"name": str(dist['city'])}}
        
        if dist.get('latitude') and dist.get('longitude'):
            properties["Coordinates"] = {
                "rich_text": [{"text": {"content": f"{dist['latitude']}, {dist['longitude']}"}}]
            }
        
        if dist.get('created_at'):
            properties["First Discovered"] = {"date": {"start": dist['created_at']}}
        
        return properties
    
    def _update_notion_page_id(self, distributor_id: int, page_id: Optional[str]):
        """Update notion_page_id and sync status in local database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                UPDATE distributors 
                SET notion_page_id = ?, 
                    notion_last_sync = datetime('now'),
                    notion_sync_status = ?
                WHERE id = ?
            """, (page_id, 'synced' if page_id else 'pending', distributor_id))
            conn.commit()
            
        finally:
            conn.close()
    
    def get_enhanced_sync_statistics(self) -> Dict:
        """Get enhanced sync statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Basic stats
            cursor.execute("SELECT COUNT(*) FROM distributors WHERE is_active = 1")
            total_active = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM distributors WHERE notion_page_id IS NOT NULL")
            synced_count = cursor.fetchone()[0]
            
            # Enhanced stats by data source
            cursor.execute("""
                SELECT data_source, COUNT(*), 
                       SUM(CASE WHEN notion_page_id IS NOT NULL THEN 1 ELSE 0 END) as synced
                FROM distributors 
                WHERE is_active = 1
                GROUP BY data_source
            """)
            source_stats = cursor.fetchall()
            
            # JSON API specific stats
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN unifi_id IS NOT NULL THEN 1 ELSE 0 END) as with_unifi_id,
                    SUM(CASE WHEN last_modified_at IS NOT NULL THEN 1 ELSE 0 END) as with_last_modified,
                    SUM(CASE WHEN order_weight IS NOT NULL THEN 1 ELSE 0 END) as with_order_weight,
                    SUM(CASE WHEN sunmax_partner = 1 THEN 1 ELSE 0 END) as sunmax_partners
                FROM distributors 
                WHERE is_active = 1 AND data_source = 'json_api'
            """)
            json_api_stats = cursor.fetchone()
            
            return {
                'total_active_distributors': total_active,
                'synced_to_notion': synced_count,
                'sync_rate': round(synced_count / total_active * 100, 1) if total_active > 0 else 0,
                'source_distribution': {row[0]: {'total': row[1], 'synced': row[2]} for row in source_stats},
                'json_api_enhancement': {
                    'total': json_api_stats[0] if json_api_stats else 0,
                    'with_unifi_id': json_api_stats[1] if json_api_stats else 0,
                    'with_last_modified': json_api_stats[2] if json_api_stats else 0,
                    'with_order_weight': json_api_stats[3] if json_api_stats else 0,
                    'sunmax_partners': json_api_stats[4] if json_api_stats else 0
                }
            }
            
        finally:
            conn.close()