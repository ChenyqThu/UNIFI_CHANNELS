#!/usr/bin/env python3
"""
Enhanced Data Processor for JSON API enriched data
Handles both legacy ScrapedDistributor and new JsonScrapedDistributor
"""

import sqlite3
from datetime import datetime
from typing import List, Union, Dict
from config.logging import LoggerMixin
from services.distributor_scraper import JsonScrapedDistributor
from models.schemas import ScrapedDistributor


class EnhancedDataProcessor(LoggerMixin):
    """Enhanced data processor with JSON API support"""
    
    def __init__(self, db_path: str = "unifi_distributors.db"):
        self.db_path = db_path
        self.logger.info("Enhanced data processor initialized")
    
    def process_distributors(self, distributors: List[Union[JsonScrapedDistributor, ScrapedDistributor]]) -> Dict:
        """Process distributors with enhanced JSON API field support"""
        
        results = {
            'created': 0,
            'updated': 0,
            'skipped': 0,
            'deactivated': 0,
            'errors': [],
            'missing_errors': [],
            'json_api_records': 0,
            'legacy_records': 0
        }
        
        if not distributors:
            return results
        
        # Count record types
        json_api_count = sum(1 for d in distributors if isinstance(d, JsonScrapedDistributor))
        legacy_count = len(distributors) - json_api_count
        
        results['json_api_records'] = json_api_count
        results['legacy_records'] = legacy_count
        
        self.logger.info(f"📊 Processing {len(distributors)} distributors:")
        self.logger.info(f"   🚀 JSON API records: {json_api_count}")
        self.logger.info(f"   🔧 Legacy records: {legacy_count}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            for distributor in distributors:
                try:
                    if isinstance(distributor, JsonScrapedDistributor):
                        result = self._process_json_distributor(cursor, distributor)
                    else:
                        result = self._process_legacy_distributor(cursor, distributor)
                    
                    results[result] += 1
                    
                except Exception as e:
                    error_msg = f"Error processing {distributor.company_name}: {str(e)}"
                    self.logger.error(error_msg)
                    results['errors'].append(error_msg)
                    continue
            
            conn.commit()
            
            # Detect missing distributors (existing in DB but not in current scrape)
            missing_results = self._detect_missing_distributors(cursor, distributors)
            results['deactivated'] = missing_results['deactivated']
            results['missing_errors'] = missing_results['errors']
            
            self.logger.info(f"✅ Processing completed: Created {results['created']}, Updated {results['updated']}, Deactivated {results['deactivated']}, Errors {len(results['errors']) + len(results['missing_errors'])}")
            
        except Exception as e:
            conn.rollback()
            error_msg = f"Database transaction failed: {str(e)}"
            self.logger.error(error_msg)
            results['errors'].append(error_msg)
        finally:
            conn.close()
        
        return results
    
    def _process_json_distributor(self, cursor, distributor: JsonScrapedDistributor) -> str:
        """Process JSON API distributor with enhanced fields"""
        
        # Handle company
        company_id = self._get_or_create_company(cursor, distributor.company_name, distributor.website_url)
        
        # Check if distributor exists (prefer unifi_id, fallback to company+address)
        existing_id = None
        
        if distributor.unifi_id:
            cursor.execute("SELECT id FROM distributors WHERE unifi_id = ?", (distributor.unifi_id,))
            result = cursor.fetchone()
            if result:
                existing_id = result[0]
        
        if not existing_id:
            cursor.execute("""
                SELECT id FROM distributors 
                WHERE company_id = ? AND address = ?
            """, (company_id, distributor.address))
            result = cursor.fetchone()
            if result:
                existing_id = result[0]
        
        current_time = datetime.now().isoformat()
        
        if existing_id:
            # Update existing distributor with enhanced fields
            cursor.execute("""
                UPDATE distributors SET
                    partner_type = ?, phone = ?, contact_email = ?,
                    latitude = ?, longitude = ?, region = ?, country_state = ?,
                    unifi_id = ?, last_modified_at = ?, order_weight = ?,
                    logo_url = ?, sunmax_partner = ?, data_source = ?, scraped_at = ?,
                    last_verified_at = ?, updated_at = ?
                WHERE id = ?
            """, (
                distributor.partner_type, distributor.phone, distributor.contact_email,
                distributor.latitude, distributor.longitude, distributor.region, distributor.country_state,
                distributor.unifi_id,
                distributor.last_modified.isoformat() if distributor.last_modified else None,
                distributor.order_weight, distributor.logo_url, distributor.sunmax_partner,
                distributor.data_source,
                distributor.scraped_at.isoformat() if distributor.scraped_at else current_time,
                current_time, current_time, existing_id
            ))
            return 'updated'
        else:
            # Create new distributor with enhanced fields
            cursor.execute("""
                INSERT INTO distributors (
                    company_id, partner_type, address, latitude, longitude,
                    phone, contact_email, region, country_state, is_active,
                    unifi_id, last_modified_at, order_weight, logo_url, sunmax_partner,
                    data_source, scraped_at,
                    first_discovered_at, last_verified_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                company_id, distributor.partner_type, distributor.address,
                distributor.latitude, distributor.longitude, distributor.phone,
                distributor.contact_email, distributor.region, distributor.country_state,
                distributor.unifi_id,
                distributor.last_modified.isoformat() if distributor.last_modified else None,
                distributor.order_weight, distributor.logo_url, distributor.sunmax_partner,
                distributor.data_source,
                distributor.scraped_at.isoformat() if distributor.scraped_at else current_time,
                current_time, current_time, current_time, current_time
            ))
            return 'created'
    
    def _process_legacy_distributor(self, cursor, distributor: ScrapedDistributor) -> str:
        """Process legacy distributor (HTML method)"""
        
        # Handle company
        company_id = self._get_or_create_company(cursor, distributor.company_name, distributor.website_url)
        
        # Check if distributor exists
        cursor.execute("""
            SELECT id FROM distributors 
            WHERE company_id = ? AND address = ?
        """, (company_id, distributor.address))
        
        existing_result = cursor.fetchone()
        current_time = datetime.now().isoformat()
        
        if existing_result:
            existing_id = existing_result[0]
            # Update existing distributor (legacy fields only)
            cursor.execute("""
                UPDATE distributors SET
                    partner_type = ?, phone = ?, contact_email = ?,
                    latitude = ?, longitude = ?, region = ?, country_state = ?,
                    data_source = ?, scraped_at = ?,
                    last_verified_at = ?, updated_at = ?
                WHERE id = ?
            """, (
                distributor.partner_type, distributor.phone, distributor.contact_email,
                distributor.latitude, distributor.longitude, distributor.region, distributor.country_state,
                'html_legacy', current_time,
                current_time, current_time, existing_id
            ))
            return 'updated'
        else:
            # Create new distributor
            cursor.execute("""
                INSERT INTO distributors (
                    company_id, partner_type, address, latitude, longitude,
                    phone, contact_email, region, country_state, is_active,
                    data_source, scraped_at,
                    first_discovered_at, last_verified_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
            """, (
                company_id, distributor.partner_type, distributor.address,
                distributor.latitude, distributor.longitude, distributor.phone,
                distributor.contact_email, distributor.region, distributor.country_state,
                'html_legacy', current_time,
                current_time, current_time, current_time, current_time
            ))
            return 'created'
    
    def _get_or_create_company(self, cursor, company_name: str, website_url: str = None) -> int:
        """Get existing company or create new one"""
        
        # Check if company exists
        cursor.execute("SELECT id FROM companies WHERE name = ?", (company_name,))
        result = cursor.fetchone()
        
        if result:
            company_id = result[0]
            # Update website if provided and different
            if website_url:
                cursor.execute("""
                    UPDATE companies SET website_url = ?, updated_at = datetime('now')
                    WHERE id = ? AND (website_url IS NULL OR website_url != ?)
                """, (website_url, company_id, website_url))
            return company_id
        else:
            # Create new company
            cursor.execute("""
                INSERT INTO companies (name, website_url, created_at, updated_at)
                VALUES (?, ?, datetime('now'), datetime('now'))
            """, (company_name, website_url))
            return cursor.lastrowid
    
    def get_processing_statistics(self) -> Dict:
        """Get processing statistics"""
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Basic counts
            cursor.execute("SELECT COUNT(*) FROM distributors WHERE is_active = 1")
            total_active = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM companies")
            total_companies = cursor.fetchone()[0]
            
            # Data source distribution
            cursor.execute("""
                SELECT data_source, COUNT(*)
                FROM distributors 
                WHERE is_active = 1
                GROUP BY data_source
            """)
            source_dist = dict(cursor.fetchall())
            
            # JSON API enhancement stats
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN unifi_id IS NOT NULL THEN 1 ELSE 0 END) as with_unifi_id,
                    SUM(CASE WHEN last_modified_at IS NOT NULL THEN 1 ELSE 0 END) as with_last_modified,
                    SUM(CASE WHEN order_weight IS NOT NULL THEN 1 ELSE 0 END) as with_order_weight,
                    SUM(CASE WHEN sunmax_partner = 1 THEN 1 ELSE 0 END) as sunmax_partners,
                    MAX(scraped_at) as last_scrape
                FROM distributors 
                WHERE is_active = 1 AND data_source = 'json_api'
            """)
            json_stats = cursor.fetchone()
            
            return {
                'total_active_distributors': total_active,
                'total_companies': total_companies,
                'data_source_distribution': source_dist,
                'json_api_enhancements': {
                    'total': json_stats[0] if json_stats else 0,
                    'with_unifi_id': json_stats[1] if json_stats else 0,
                    'with_last_modified': json_stats[2] if json_stats else 0,
                    'with_order_weight': json_stats[3] if json_stats else 0,
                    'sunmax_partners': json_stats[4] if json_stats else 0,
                    'last_scrape': json_stats[5] if json_stats else None
                }
            }
            
        finally:
            conn.close()
    
    def _detect_missing_distributors(self, cursor, current_distributors: List[Union[JsonScrapedDistributor, ScrapedDistributor]]) -> Dict:
        """Detect distributors that exist in DB but missing from current scrape"""
        results = {'deactivated': 0, 'errors': []}
        
        try:
            # Get all unifi_ids from current scrape
            current_unifi_ids = set()
            for dist in current_distributors:
                if isinstance(dist, JsonScrapedDistributor) and dist.unifi_id:
                    current_unifi_ids.add(dist.unifi_id)
            
            if not current_unifi_ids:
                self.logger.warning("No unifi_ids found in current scrape, skipping missing detection")
                return results
            
            # Get all active distributors from database
            cursor.execute("""
                SELECT unifi_id, id FROM distributors 
                WHERE is_active = 1 AND unifi_id IS NOT NULL
            """)
            db_distributors = cursor.fetchall()
            
            # Find missing unifi_ids (in DB but not in current scrape)
            db_unifi_ids = {row[0] for row in db_distributors}
            missing_unifi_ids = db_unifi_ids - current_unifi_ids
            
            if missing_unifi_ids:
                self.logger.info(f"🔍 Detected {len(missing_unifi_ids)} missing distributors")
                
                # Deactivate missing distributors
                current_time = datetime.now().isoformat()
                for unifi_id in missing_unifi_ids:
                    try:
                        cursor.execute("""
                            UPDATE distributors 
                            SET is_active = 0, 
                                updated_at = ?,
                                last_verified_at = ?
                            WHERE unifi_id = ? AND is_active = 1
                        """, (current_time, current_time, unifi_id))
                        
                        if cursor.rowcount > 0:
                            results['deactivated'] += 1
                            self.logger.debug(f"Deactivated distributor with unifi_id: {unifi_id}")
                    
                    except Exception as e:
                        error_msg = f"Error deactivating distributor {unifi_id}: {str(e)}"
                        self.logger.error(error_msg)
                        results['errors'].append(error_msg)
                
                self.logger.info(f"✅ Deactivated {results['deactivated']} missing distributors")
            else:
                self.logger.info("✅ No missing distributors detected")
                
        except Exception as e:
            error_msg = f"Error detecting missing distributors: {str(e)}"
            self.logger.error(error_msg)
            results['errors'].append(error_msg)
        
        return results