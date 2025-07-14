import asyncio
import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session

from config.database import SessionLocal
from config.settings import settings
from config.logging import setup_logging
from services.scraper import UnifiDistributorScraper
from services.data_processor import DataProcessor
from services.notion_integration import NotionIntegration

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

class DistributorScheduler:
    """Scheduler for automated distributor data collection and processing"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.logger = logger
        self.logger.info("Distributor scheduler initialized")
    
    async def scrape_and_process(self):
        """Main task: scrape and process distributor data"""
        try:
            self.logger.info("Starting scheduled scrape and process task")
            
            # Create database session
            db = SessionLocal()
            
            try:
                # Scrape data
                scraper = UnifiDistributorScraper()
                scraping_result = scraper.scrape_distributors()
                
                if not scraping_result.success:
                    self.logger.error(f"Scraping failed: {scraping_result.error_message}")
                    return
                
                self.logger.info(f"Successfully scraped {scraping_result.total_found} distributors")
                
                # Process data
                processor = DataProcessor(db)
                processing_results = processor.process_scraped_data(scraping_result.distributors)
                
                self.logger.info(f"Processing complete: {processing_results}")
                
                # Detect missing distributors
                missing_distributors = processor.detect_missing_distributors(scraping_result.distributors)
                if missing_distributors:
                    inactive_count = processor.mark_distributors_inactive(missing_distributors)
                    self.logger.info(f"Marked {inactive_count} distributors as inactive")
                
                # Sync to Notion if enabled
                if settings.notion_sync_enabled:
                    await self.sync_to_notion(db)
                
                # Clean up old change history
                cleanup_count = processor.cleanup_old_changes()
                if cleanup_count > 0:
                    self.logger.info(f"Cleaned up {cleanup_count} old change records")
                
            finally:
                db.close()
                
        except Exception as e:
            self.logger.error(f"Error in scheduled task: {str(e)}", exc_info=True)
    
    async def sync_to_notion(self, db: Session):
        """Sync data to Notion"""
        try:
            self.logger.info("Starting Notion sync")
            
            notion = NotionIntegration()
            
            # Get active distributors
            from models.database import Distributor
            active_distributors = db.query(Distributor).filter(
                Distributor.is_active == True
            ).all()
            
            # Convert to response models
            from models.schemas import DistributorResponse
            distributor_responses = [
                DistributorResponse.from_orm(dist) for dist in active_distributors
            ]
            
            # Sync to Notion
            results = notion.sync_distributors_to_notion(distributor_responses)
            
            self.logger.info(f"Notion sync complete: {results}")
            
        except Exception as e:
            self.logger.error(f"Error syncing to Notion: {str(e)}", exc_info=True)
    
    async def health_check(self):
        """Periodic health check"""
        try:
            self.logger.info("Running health check")
            
            # Check database connection
            db = SessionLocal()
            try:
                db.execute("SELECT 1")
                self.logger.info("Database connection: OK")
            except Exception as e:
                self.logger.error(f"Database connection failed: {str(e)}")
            finally:
                db.close()
            
            # Check Notion connection
            if settings.notion_sync_enabled:
                try:
                    notion = NotionIntegration()
                    if notion.test_connection():
                        self.logger.info("Notion connection: OK")
                    else:
                        self.logger.warning("Notion connection: FAILED")
                except Exception as e:
                    self.logger.error(f"Notion connection error: {str(e)}")
            
            # Check external API
            try:
                import requests
                response = requests.get(settings.unifi_distributors_url, timeout=10)
                if response.status_code == 200:
                    self.logger.info("External API connection: OK")
                else:
                    self.logger.warning(f"External API responded with status: {response.status_code}")
            except Exception as e:
                self.logger.error(f"External API connection failed: {str(e)}")
                
        except Exception as e:
            self.logger.error(f"Health check failed: {str(e)}", exc_info=True)
    
    async def generate_daily_report(self):
        """Generate daily statistics report"""
        try:
            self.logger.info("Generating daily report")
            
            db = SessionLocal()
            try:
                processor = DataProcessor(db)
                stats = processor.get_statistics()
                
                # Log daily statistics
                self.logger.info(f"Daily Report - Total Companies: {stats.get('total_companies', 0)}")
                self.logger.info(f"Daily Report - Total Distributors: {stats.get('total_distributors', 0)}")
                self.logger.info(f"Daily Report - Active Distributors: {stats.get('active_distributors', 0)}")
                self.logger.info(f"Daily Report - Master Distributors: {stats.get('master_distributors', 0)}")
                self.logger.info(f"Daily Report - Total Changes: {stats.get('total_changes', 0)}")
                
                # Log region distribution
                region_dist = stats.get('region_distribution', {})
                for region, count in region_dist.items():
                    self.logger.info(f"Daily Report - {region}: {count} distributors")
                
            finally:
                db.close()
                
        except Exception as e:
            self.logger.error(f"Error generating daily report: {str(e)}", exc_info=True)
    
    def start(self):
        """Start the scheduler"""
        try:
            # Main scraping and processing task
            self.scheduler.add_job(
                self.scrape_and_process,
                trigger=IntervalTrigger(hours=settings.scraping_interval_hours),
                id='scrape_and_process',
                name='Scrape and Process Distributors',
                replace_existing=True
            )
            
            # Health check every 30 minutes
            self.scheduler.add_job(
                self.health_check,
                trigger=IntervalTrigger(minutes=30),
                id='health_check',
                name='Health Check',
                replace_existing=True
            )
            
            # Daily report at 9 AM
            self.scheduler.add_job(
                self.generate_daily_report,
                trigger=CronTrigger(hour=9, minute=0),
                id='daily_report',
                name='Daily Report',
                replace_existing=True
            )
            
            # Start scheduler
            self.scheduler.start()
            self.logger.info("Scheduler started successfully")
            
            # Keep the scheduler running
            return self.scheduler
            
        except Exception as e:
            self.logger.error(f"Error starting scheduler: {str(e)}")
            raise
    
    def stop(self):
        """Stop the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            self.logger.info("Scheduler stopped")

async def main():
    """Main function to run the scheduler"""
    scheduler = DistributorScheduler()
    
    try:
        # Start the scheduler
        scheduler_instance = scheduler.start()
        
        # Run an initial scrape
        await scheduler.scrape_and_process()
        
        # Keep the scheduler running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            logger.info("Received shutdown signal")
            scheduler.stop()
            
    except Exception as e:
        logger.error(f"Error in main: {str(e)}", exc_info=True)
        scheduler.stop()

if __name__ == "__main__":
    asyncio.run(main())