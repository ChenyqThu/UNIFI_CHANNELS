#!/usr/bin/env python3
"""
Unifi Distributor Tracking System CLI
Command-line interface for managing the distributor tracking system
"""

import click
import asyncio
import json
from datetime import datetime
from typing import Optional

from config.database import SessionLocal, init_db
from config.settings import settings
from config.logging import setup_logging
from services.region_mapping_manager import RegionMappingManager
from models.database import Distributor, Company, ChangeHistory

# Setup logging
setup_logging()

@click.group()
@click.version_option(version='1.0.0')
def cli():
    """Unifi Distributor Tracking System CLI"""
    pass

@cli.command()
def init():
    """Initialize the database"""
    try:
        init_db()
        click.echo("✅ Database initialized successfully")
    except Exception as e:
        click.echo(f"❌ Error initializing database: {str(e)}")
        raise click.Abort()

@cli.command()
@click.option('--sync-notion', is_flag=True, help='Sync results to Notion')
@click.option('--verbose', is_flag=True, help='Verbose output')
@click.option('--refresh-mappings', is_flag=True, help='Refresh region mappings before scraping')
def scrape(sync_notion: bool, verbose: bool, refresh_mappings: bool):
    """Scrape distributor data from Unifi website using JSON API"""
    try:
        if verbose:
            click.echo("Starting distributor scraping...")
        
        # Use JSON API scraper (best method)
        from services.distributor_scraper import JsonDistributorScraper
        scraper = JsonDistributorScraper()
        click.echo("🚀 Using JSON API scraper")
        
        # Refresh mappings if requested
        if refresh_mappings:
            click.echo("🔄 Refreshing region mappings...")
            if scraper.refresh_mappings():
                click.echo("✅ Region mappings refreshed successfully")
            else:
                click.echo("⚠️  Failed to refresh mappings, using existing ones")
        
        # Scrape data
        distributors = scraper.scrape_all_distributors()
        
        if not distributors:
            click.echo("❌ No distributors found")
            raise click.Abort()
        
        click.echo(f"✅ Successfully scraped {len(distributors)} distributors")
        
        # Process data
        from services.enhanced_data_processor import EnhancedDataProcessor
        
        try:
            processor = EnhancedDataProcessor()
            processing_results = processor.process_distributors(distributors)
        except Exception as e:
            processing_results = {'created': 0, 'updated': 0, 'skipped': 0, 'errors': [str(e)]}
            
        click.echo(f"📊 Processing results:")
        click.echo(f"  - Created: {processing_results['created']}")
        click.echo(f"  - Updated: {processing_results['updated']}")
        click.echo(f"  - Skipped: {processing_results['skipped']}")
        click.echo(f"  - Errors: {len(processing_results['errors'])}")
        
        if processing_results['errors'] and verbose:
            click.echo("❌ Errors:")
            for error in processing_results['errors']:
                click.echo(f"  - {error}")
        
        # Sync to Notion
        if sync_notion:
            if settings.notion_sync_enabled:
                click.echo("🔄 Syncing to Notion...")
                
                try:
                    from services.notion_sync import NotionSync
                    
                    sync_service = NotionSync()
                    sync_results = sync_service.sync_all_distributors()
                    
                    click.echo(f"✅ Notion sync completed:")
                    click.echo(f"  - Created: {sync_results['created']}")
                    click.echo(f"  - Updated: {sync_results['updated']}")
                    click.echo(f"  - Skipped: {sync_results['skipped']}")
                    click.echo(f"  - JSON API records: {sync_results['json_api_records']}")
                    click.echo(f"  - Legacy records: {sync_results['legacy_records']}")
                    click.echo(f"  - Sync time: {sync_results['sync_time']:.1f}s")
                    
                    if sync_results['errors']:
                        click.echo(f"  - Errors: {len(sync_results['errors'])}")
                        if verbose:
                            for error in sync_results['errors'][:3]:
                                click.echo(f"    • {error}")
                            if len(sync_results['errors']) > 3:
                                click.echo(f"    ... and {len(sync_results['errors']) - 3} more errors")
                        
                except Exception as e:
                    click.echo(f"❌ Notion sync failed: {str(e)}")
                    if verbose:
                        import traceback
                        click.echo(traceback.format_exc())
                    
                else:
                    click.echo("⚠️  Notion sync is not enabled")
            
    except Exception as e:
        click.echo(f"❌ Error during scraping: {str(e)}")
        raise click.Abort()

@cli.command()
@click.option('--format', type=click.Choice(['json', 'table', 'csv']), default='table', help='Output format')
@click.option('--region', help='Filter by region')
@click.option('--partner-type', type=click.Choice(['master', 'simple']), help='Filter by partner type')
@click.option('--active-only', is_flag=True, default=True, help='Only show active distributors')
@click.option('--limit', type=int, default=50, help='Maximum number of results')
def list(format: str, region: Optional[str], partner_type: Optional[str], active_only: bool, limit: int):
    """List distributors"""
    try:
        db = SessionLocal()
        try:
            query = db.query(Distributor).join(Company)
            
            # Apply filters
            if active_only:
                query = query.filter(Distributor.is_active == True)
            
            if region:
                query = query.filter(Distributor.region == region)
            
            if partner_type:
                query = query.filter(Distributor.partner_type == partner_type)
            
            # Get results
            distributors = query.order_by(
                Distributor.partner_type.desc(),
                Company.name
            ).limit(limit).all()
            
            if format == 'json':
                data = []
                for dist in distributors:
                    data.append({
                        'id': dist.id,
                        'company_name': dist.company.name,
                        'partner_type': dist.partner_type,
                        'region': dist.region,
                        'country_state': dist.country_state,
                        'address': dist.address,
                        'phone': dist.phone,
                        'email': dist.contact_email,
                        'is_active': dist.is_active
                    })
                click.echo(json.dumps(data, indent=2))
                
            elif format == 'csv':
                click.echo("ID,Company Name,Partner Type,Region,Country/State,Address,Phone,Email,Active")
                for dist in distributors:
                    click.echo(f"{dist.id},{dist.company.name},{dist.partner_type},{dist.region},{dist.country_state},{dist.address},{dist.phone},{dist.contact_email},{dist.is_active}")
                    
            else:  # table format
                click.echo(f"{'ID':<5} {'Company Name':<30} {'Type':<8} {'Region':<6} {'State':<8} {'Active':<6}")
                click.echo("-" * 80)
                for dist in distributors:
                    click.echo(f"{dist.id:<5} {dist.company.name[:29]:<30} {dist.partner_type:<8} {dist.region or 'N/A':<6} {dist.country_state or 'N/A':<8} {'Yes' if dist.is_active else 'No':<6}")
                
                click.echo(f"\nTotal: {len(distributors)} distributors")
                
        finally:
            db.close()
            
    except Exception as e:
        click.echo(f"❌ Error listing distributors: {str(e)}")
        raise click.Abort()

@cli.command()
@click.argument('distributor_id', type=int)
def info(distributor_id: int):
    """Get detailed information about a specific distributor"""
    try:
        db = SessionLocal()
        try:
            distributor = db.query(Distributor).filter(Distributor.id == distributor_id).first()
            
            if not distributor:
                click.echo(f"❌ Distributor with ID {distributor_id} not found")
                raise click.Abort()
            
            click.echo(f"📊 Distributor Information")
            click.echo(f"ID: {distributor.id}")
            click.echo(f"Company: {distributor.company.name}")
            click.echo(f"Partner Type: {distributor.partner_type}")
            click.echo(f"Address: {distributor.address}")
            click.echo(f"Region: {distributor.region}")
            click.echo(f"Country/State: {distributor.country_state}")
            click.echo(f"Phone: {distributor.phone or 'N/A'}")
            click.echo(f"Email: {distributor.contact_email or 'N/A'}")
            click.echo(f"Contact URL: {distributor.contact_url or 'N/A'}")
            click.echo(f"Website: {distributor.company.website_url or 'N/A'}")
            click.echo(f"Coordinates: {distributor.latitude}, {distributor.longitude}" if distributor.latitude and distributor.longitude else "Coordinates: N/A")
            click.echo(f"Active: {'Yes' if distributor.is_active else 'No'}")
            click.echo(f"Created: {distributor.created_at}")
            click.echo(f"Updated: {distributor.updated_at}")
            
        finally:
            db.close()
            
    except Exception as e:
        click.echo(f"❌ Error getting distributor info: {str(e)}")
        raise click.Abort()

@cli.command()
def stats():
    """Show enhanced system statistics with JSON API insights"""
    try:
        # Use enhanced data processor for detailed stats
        from services.enhanced_data_processor import EnhancedDataProcessor
        
        processor = EnhancedDataProcessor()
        stats = processor.get_processing_statistics()
        
        click.echo("📊 Enhanced System Statistics")
        click.echo(f"Total Active Distributors: {stats['total_active_distributors']}")
        click.echo(f"Total Companies: {stats['total_companies']}")
        
        click.echo("\n📈 Data Source Distribution:")
        for source, count in stats['data_source_distribution'].items():
            source_name = "JSON API" if source == "json_api" else "HTML Legacy" if source == "html_legacy" else source or 'Unknown'
            click.echo(f"  {source_name}: {count} distributors")
        
        # JSON API enhancement details
        json_enhancements = stats['json_api_enhancements']
        if json_enhancements['total'] > 0:
            click.echo(f"\n🚀 JSON API Enhanced Data Quality:")
            click.echo(f"  Total JSON API records: {json_enhancements['total']}")
            click.echo(f"  With Unifi ID: {json_enhancements['with_unifi_id']} ({json_enhancements['with_unifi_id']/json_enhancements['total']*100:.1f}%)")
            click.echo(f"  With Last Modified: {json_enhancements['with_last_modified']} ({json_enhancements['with_last_modified']/json_enhancements['total']*100:.1f}%)")
            click.echo(f"  With Order Weight: {json_enhancements['with_order_weight']} ({json_enhancements['with_order_weight']/json_enhancements['total']*100:.1f}%)")
            click.echo(f"  SunMax Partners: {json_enhancements['sunmax_partners']}")
            
            if json_enhancements['last_scrape']:
                click.echo(f"  Last Scrape: {json_enhancements['last_scrape']}")
        
        # Legacy fallback for region distribution
        try:
            db = SessionLocal()
            try:
                from models.database import Distributor
                from sqlalchemy import func
                region_query = db.query(Distributor.region, func.count(Distributor.id)).filter(
                    Distributor.is_active == True
                ).group_by(Distributor.region).all()
                
                if region_query:
                    click.echo("\n🌍 Distribution by Region:")
                    for region, count in sorted(region_query):
                        region_name = region.upper() if region else 'Unknown'
                        click.echo(f"  {region_name}: {count}")
                        
            finally:
                db.close()
        except Exception as e:
            click.echo(f"\n⚠️  Could not load region distribution: {str(e)}")
            
    except Exception as e:
        click.echo(f"❌ Error getting enhanced statistics: {str(e)}")
        raise click.Abort()

@cli.command()
@click.option('--days', type=int, default=7, help='Number of days to show')
@click.option('--limit', type=int, default=20, help='Maximum number of changes to show')
def changes(days: int, limit: int):
    """Show recent changes"""
    try:
        db = SessionLocal()
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            changes = db.query(ChangeHistory).filter(
                ChangeHistory.detected_at >= cutoff_date
            ).order_by(
                ChangeHistory.detected_at.desc()
            ).limit(limit).all()
            
            if not changes:
                click.echo(f"No changes found in the last {days} days")
                return
            
            click.echo(f"📈 Recent Changes (last {days} days)")
            click.echo(f"{'Date':<12} {'Type':<8} {'Distributor ID':<12} {'Details':<50}")
            click.echo("-" * 90)
            
            for change in changes:
                date_str = change.detected_at.strftime('%Y-%m-%d')
                details = "Data updated" if change.change_type == 'updated' else f"Distributor {change.change_type}"
                click.echo(f"{date_str:<12} {change.change_type:<8} {change.distributor_id or 'N/A':<12} {details:<50}")
                
        finally:
            db.close()
            
    except Exception as e:
        click.echo(f"❌ Error getting changes: {str(e)}")
        raise click.Abort()

@cli.group()
def mapping():
    """Region mapping management commands"""
    pass

@mapping.command()
def refresh():
    """Refresh region mappings from Unifi website"""
    try:
        click.echo("🔍 Refreshing region mappings from Unifi website...")
        
        manager = RegionMappingManager()
        result = manager.refresh_mappings()
        
        if result['success']:
            click.echo("✅ Mappings refreshed successfully!")
            click.echo(f"📊 Results:")
            click.echo(f"  - New mappings: {result['new_mappings']}")
            click.echo(f"  - Updated mappings: {result['updated_mappings']}")
            click.echo(f"  - Total active mappings: {result['total_mappings']}")
            click.echo(f"  - Regions covered: {len(result['regions'])}")
            
            if result['regions']:
                click.echo(f"  - Regions: {', '.join(result['regions'])}")
        else:
            click.echo(f"❌ Failed to refresh mappings: {result.get('error')}")
            raise click.Abort()
            
    except Exception as e:
        click.echo(f"❌ Error refreshing mappings: {str(e)}")
        raise click.Abort()

@mapping.command()
def stats():
    """Show region mapping statistics"""
    try:
        manager = RegionMappingManager()
        stats = manager.get_mapping_statistics()
        
        click.echo("📊 Region Mapping Statistics")
        click.echo(f"Total active mappings: {stats['total_active_mappings']}")
        click.echo(f"Total inactive mappings: {stats['total_inactive_mappings']}")
        click.echo(f"Active regions: {stats['active_regions']}")
        click.echo(f"Recent updates (7 days): {stats['recent_updates']}")
        
        click.echo("\n🌍 Distribution by Region:")
        for region, count in sorted(stats['region_distribution'].items()):
            click.echo(f"  {region.upper()}: {count} countries/states")
            
    except Exception as e:
        click.echo(f"❌ Error getting mapping statistics: {str(e)}")
        raise click.Abort()

@mapping.command()
@click.option('--format', type=click.Choice(['table', 'json']), default='table', help='Output format')
def list(format: str):
    """List current region mappings"""
    try:
        manager = RegionMappingManager()
        mappings = manager.get_current_mappings()
        
        if format == 'json':
            click.echo(json.dumps(mappings, indent=2))
        else:
            click.echo("🗺️  Current Region Mappings:")
            for region, countries in sorted(mappings.items()):
                click.echo(f"\n{region.upper()} ({len(countries)} countries/states):")
                # Show countries in rows of 8
                for i in range(0, len(countries), 8):
                    row = countries[i:i+8]
                    click.echo(f"  {' '.join(f'{c:<4}' for c in row)}")
                    
    except Exception as e:
        click.echo(f"❌ Error listing mappings: {str(e)}")
        raise click.Abort()

@mapping.command()
@click.argument('region')
@click.argument('country')
def test_combination():
    """Test if a specific region-country combination returns distributors"""
    try:
        from services.enhanced_scraper import EnhancedDistributorScraper
        
        scraper = EnhancedDistributorScraper(use_dynamic_mapping=False)
        click.echo(f"🔍 Testing {region}-{country} combination...")
        
        distributors = scraper.fetch_region_country_data(region, country)
        
        if distributors:
            click.echo(f"✅ Found {len(distributors)} distributors for {region}-{country}")
            if len(distributors) <= 3:
                for dist in distributors:
                    click.echo(f"  - {dist.company_name} ({dist.partner_type})")
        else:
            click.echo(f"❌ No distributors found for {region}-{country}")
            
    except Exception as e:
        click.echo(f"❌ Error testing combination: {str(e)}")
        raise click.Abort()

@mapping.command()
def discover():
    """Discover and add new region mappings"""
    try:
        click.echo("🔍 Starting comprehensive mapping discovery...")
        click.echo("⚠️  This may take several minutes...")
        
        manager = RegionMappingManager()
        
        # 首先尝试从网站提取
        website_mappings = manager.extract_mappings_from_website()
        
        if website_mappings:
            click.echo(f"✅ Extracted mappings from website for {len(website_mappings)} regions")
            
            # 更新数据库
            new_count, updated_count = manager.update_mappings_in_database(website_mappings)
            click.echo(f"📊 Database updated: {new_count} new, {updated_count} updated mappings")
        else:
            click.echo("⚠️  Website extraction failed, falling back to exploratory discovery")
            result = manager.refresh_mappings()
            
            if result['success']:
                click.echo(f"✅ Discovery completed: {result['new_mappings']} new mappings found")
            else:
                click.echo(f"❌ Discovery failed: {result.get('error')}")
                raise click.Abort()
                
    except Exception as e:
        click.echo(f"❌ Error during discovery: {str(e)}")
        raise click.Abort()

@cli.group()
def notion():
    """Notion integration commands"""
    pass

@notion.command()
def test():
    """Test Notion connection"""
    try:
        if not settings.notion_token:
            click.echo("❌ Notion token not configured")
            raise click.Abort()
        
        notion = NotionIntegration()
        if notion.test_connection():
            click.echo("✅ Notion connection successful")
        else:
            click.echo("❌ Notion connection failed")
            raise click.Abort()
            
    except Exception as e:
        click.echo(f"❌ Error testing Notion connection: {str(e)}")
        raise click.Abort()

@notion.command()
def info():
    """Get Notion database information"""
    try:
        notion = NotionIntegration()
        info = notion.get_database_info()
        
        if info['success']:
            db_info = info['database']
            click.echo("📊 Notion Database Information")
            click.echo(f"ID: {db_info['id']}")
            click.echo(f"Title: {db_info['title']}")
            click.echo(f"Created: {db_info['created_time']}")
            click.echo(f"Last Edited: {db_info['last_edited_time']}")
            click.echo(f"Properties: {', '.join(db_info['properties'])}")
        else:
            click.echo(f"❌ Error getting database info: {info['error']}")
            raise click.Abort()
            
    except Exception as e:
        click.echo(f"❌ Error getting Notion info: {str(e)}")
        raise click.Abort()

@notion.command()
def stats():
    """Show Notion sync statistics with JSON API insights"""
    try:
        from services.notion_sync import NotionSync
        
        sync_service = NotionSync()
        stats = sync_service.get_enhanced_sync_statistics()
        
        click.echo("📊 Notion Sync Statistics")
        click.echo(f"Total active distributors: {stats['total_active_distributors']}")
        click.echo(f"Synced to Notion: {stats['synced_to_notion']}")
        click.echo(f"Sync rate: {stats['sync_rate']}%")
        
        click.echo("\n📈 Data Source Distribution:")
        for source, data in stats['source_distribution'].items():
            source_name = "JSON API" if source == "json_api" else "HTML Legacy" if source == "html_legacy" else source or 'Unknown'
            click.echo(f"  {source_name}: {data['total']} total, {data['synced']} synced")
        
        # JSON API enhancement details
        json_api = stats['json_api_enhancement']
        if json_api['total'] > 0:
            click.echo(f"\n🚀 JSON API Enhanced Fields:")
            click.echo(f"  Total JSON API records: {json_api['total']}")
            click.echo(f"  With Unifi ID: {json_api['with_unifi_id']} ({json_api['with_unifi_id']/json_api['total']*100:.1f}%)")
            click.echo(f"  With Last Modified: {json_api['with_last_modified']} ({json_api['with_last_modified']/json_api['total']*100:.1f}%)")
            click.echo(f"  With Order Weight: {json_api['with_order_weight']} ({json_api['with_order_weight']/json_api['total']*100:.1f}%)")
            click.echo(f"  SunMax Partners: {json_api['sunmax_partners']}")
            
    except Exception as e:
        click.echo(f"❌ Error getting sync statistics: {str(e)}")
        raise click.Abort()

@notion.command()
@click.confirmation_option(prompt='Are you sure you want to sync all distributors to Notion?')
def sync():
    """Sync all distributors to Notion with complete field support"""
    try:
        from services.notion_sync import NotionSync
        
        sync_service = NotionSync()
        
        click.echo("🔄 Syncing all distributors to Notion...")
        results = sync_service.sync_all_distributors()
        
        click.echo(f"✅ Sync complete:")
        click.echo(f"  - Created: {results['created']}")
        click.echo(f"  - Updated: {results['updated']}")
        click.echo(f"  - Skipped: {results['skipped']}")
        click.echo(f"  - Total processed: {results['total_processed']}")
        click.echo(f"  - JSON API records: {results['json_api_records']}")
        click.echo(f"  - Legacy records: {results['legacy_records']}")
        click.echo(f"  - Sync time: {results['sync_time']:.1f}s")
        click.echo(f"  - Errors: {len(results['errors'])}")
        
        if results['errors']:
            click.echo(f"❌ Errors encountered:")
            for error in results['errors']:
                click.echo(f"   {error}")
                
    except Exception as e:
        click.echo(f"❌ Sync failed: {str(e)}")
        raise click.Abort()

@notion.command()
@click.argument('company_name')
@click.argument('address')
@click.argument('note')
def add_note(company_name: str, address: str, note: str):
    """Add a note to a specific distributor in Notion"""
    try:
        notion = NotionIntegration()
        result = notion.add_note_to_distributor(company_name, address, note)
        
        if result['success']:
            click.echo(f"✅ Note added to {company_name}")
        else:
            click.echo(f"❌ Error: {result['error']}")
            raise click.Abort()
            
    except Exception as e:
        click.echo(f"❌ Error adding note: {str(e)}")
        raise click.Abort()

@notion.command()
@click.argument('company_name')
@click.argument('address')
@click.argument('status', type=click.Choice(['未分析', '进行中', '已完成']))
@click.option('--priority', type=click.Choice(['高', '中', '低']), help='Set priority level')
def update_analysis(company_name: str, address: str, status: str, priority: str):
    """Update analysis status for a distributor in Notion"""
    try:
        notion = NotionIntegration()
        result = notion.update_analysis_status(company_name, address, status, priority)
        
        if result['success']:
            status_msg = f"✅ Analysis status updated for {company_name}: {status}"
            if priority:
                status_msg += f" (Priority: {priority})"
            click.echo(status_msg)
        else:
            click.echo(f"❌ Error: {result['error']}")
            raise click.Abort()
            
    except Exception as e:
        click.echo(f"❌ Error updating analysis status: {str(e)}")
        raise click.Abort()

@notion.command()
@click.argument('company_name')
@click.argument('address')
def update_changes(company_name: str, address: str):
    """Update change count for a distributor in Notion"""
    try:
        db = SessionLocal()
        try:
            # Find the distributor
            distributor = db.query(Distributor).join(Company).filter(
                Company.name == company_name,
                Distributor.address == address
            ).first()
            
            if not distributor:
                click.echo(f"❌ Distributor not found: {company_name}")
                raise click.Abort()
            
            # Get change count
            processor = DataProcessor(db)
            change_count = processor.get_distributor_change_count(distributor.id)
            
            # Update in Notion
            notion = NotionIntegration()
            result = notion.update_change_count(company_name, address, change_count)
            
            if result['success']:
                click.echo(f"✅ Change count updated for {company_name}: {change_count}")
            else:
                click.echo(f"❌ Error: {result['error']}")
                raise click.Abort()
                
        finally:
            db.close()
            
    except Exception as e:
        click.echo(f"❌ Error updating change count: {str(e)}")
        raise click.Abort()

@cli.command()
def health():
    """Check system health"""
    try:
        click.echo("🔍 Checking system health...")
        
        # Database check
        try:
            db = SessionLocal()
            db.execute("SELECT 1")
            db.close()
            click.echo("✅ Database: OK")
        except Exception as e:
            click.echo(f"❌ Database: FAILED - {str(e)}")
        
        # Notion check
        try:
            if settings.notion_token:
                notion = NotionIntegration()
                if notion.test_connection():
                    click.echo("✅ Notion: OK")
                else:
                    click.echo("❌ Notion: FAILED")
            else:
                click.echo("⚠️  Notion: Not configured")
        except Exception as e:
            click.echo(f"❌ Notion: ERROR - {str(e)}")
        
        # External API check
        try:
            import requests
            response = requests.get(settings.unifi_distributors_url, timeout=10)
            if response.status_code == 200:
                click.echo("✅ External API: OK")
            else:
                click.echo(f"⚠️  External API: Status {response.status_code}")
        except Exception as e:
            click.echo(f"❌ External API: FAILED - {str(e)}")
            
    except Exception as e:
        click.echo(f"❌ Error checking health: {str(e)}")
        raise click.Abort()

if __name__ == '__main__':
    cli()