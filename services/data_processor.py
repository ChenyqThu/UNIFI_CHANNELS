from typing import List, Dict, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from models.database import Company, Distributor, ChangeHistory
from models.schemas import ScrapedDistributor
from config.logging import LoggerMixin
import json
import hashlib
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation

class DataProcessor(LoggerMixin):
    """Process and manage distributor data"""
    
    def __init__(self, db: Session):
        self.db = db
        self.logger.info("Data processor initialized")
    
    def process_scraped_data(self, scraped_distributors: List[ScrapedDistributor]) -> Dict:
        """Process scraped distributor data and update database"""
        results = {
            'created': 0,
            'updated': 0,
            'skipped': 0,
            'errors': []
        }
        
        try:
            self.logger.info(f"Processing {len(scraped_distributors)} scraped distributors")
            
            for scraped in scraped_distributors:
                try:
                    # Process single distributor
                    result = self._process_single_distributor(scraped)
                    
                    if result['status'] == 'created':
                        results['created'] += 1
                    elif result['status'] == 'updated':
                        results['updated'] += 1
                    elif result['status'] == 'skipped':
                        results['skipped'] += 1
                        
                except Exception as e:
                    error_msg = f"Error processing {scraped.company_name}: {str(e)}"
                    self.logger.error(error_msg)
                    results['errors'].append(error_msg)
            
            # Commit all changes
            self.db.commit()
            
            self.logger.info(f"Processing complete: {results}")
            return results
            
        except Exception as e:
            self.db.rollback()
            error_msg = f"Error during batch processing: {str(e)}"
            self.logger.error(error_msg)
            results['errors'].append(error_msg)
            return results
    
    def _process_single_distributor(self, scraped: ScrapedDistributor) -> Dict:
        """Process a single distributor"""
        try:
            # Get or create company
            company = self._get_or_create_company(scraped.company_name, scraped.website_url)
            
            # Get or create distributor
            distributor = self._get_or_create_distributor(company, scraped)
            
            return distributor
            
        except Exception as e:
            self.logger.error(f"Error processing distributor {scraped.company_name}: {str(e)}")
            raise
    
    def _get_or_create_company(self, name: str, website_url: Optional[str]) -> Company:
        """Get existing company or create new one"""
        try:
            # Try to find existing company
            company = self.db.query(Company).filter(Company.name == name).first()
            
            if company:
                # Update website URL if provided and different
                if website_url and company.website_url != website_url:
                    company.website_url = website_url
                    company.updated_at = datetime.utcnow()
                    self.logger.debug(f"Updated company website for {name}")
                
                return company
            
            # Create new company
            company = Company(
                name=name,
                website_url=website_url
            )
            
            self.db.add(company)
            self.db.flush()  # Get the ID without committing
            
            self.logger.debug(f"Created new company: {name}")
            return company
            
        except SQLAlchemyError as e:
            self.logger.error(f"Database error creating/updating company {name}: {str(e)}")
            raise
    
    def _get_or_create_distributor(self, company: Company, scraped: ScrapedDistributor) -> Dict:
        """Get existing distributor or create new one"""
        try:
            # Try to find existing distributor
            distributor = self.db.query(Distributor).filter(
                Distributor.company_id == company.id,
                Distributor.address == scraped.address
            ).first()
            
            if distributor:
                # Check if update is needed
                if self._distributor_needs_update(distributor, scraped):
                    old_data = self._distributor_to_dict(distributor)
                    self._update_distributor(distributor, scraped)
                    new_data = self._distributor_to_dict(distributor)
                    
                    # Record change
                    self._record_change(distributor.id, 'updated', old_data, new_data)
                    
                    self.logger.debug(f"Updated distributor for {company.name}")
                    return {'status': 'updated', 'distributor': distributor}
                else:
                    self.logger.debug(f"No changes needed for distributor {company.name}")
                    return {'status': 'skipped', 'distributor': distributor}
            
            # Create new distributor
            distributor = self._create_distributor(company, scraped)
            
            # Record creation
            new_data = self._distributor_to_dict(distributor)
            self._record_change(distributor.id, 'created', None, new_data)
            
            self.logger.debug(f"Created new distributor for {company.name}")
            return {'status': 'created', 'distributor': distributor}
            
        except SQLAlchemyError as e:
            self.logger.error(f"Database error creating/updating distributor for {company.name}: {str(e)}")
            raise
    
    def _create_distributor(self, company: Company, scraped: ScrapedDistributor) -> Distributor:
        """Create new distributor from scraped data"""
        try:
            # Convert coordinates to Decimal
            latitude = self._safe_decimal_conversion(scraped.latitude)
            longitude = self._safe_decimal_conversion(scraped.longitude)
            
            distributor = Distributor(
                company_id=company.id,
                partner_type=scraped.partner_type,
                address=scraped.address,
                latitude=latitude,
                longitude=longitude,
                phone=scraped.phone,
                contact_email=scraped.contact_email,
                contact_url=scraped.contact_url,
                region=scraped.region,
                country_state=scraped.country_state,
                is_active=True
            )
            
            self.db.add(distributor)
            self.db.flush()  # Get the ID without committing
            
            return distributor
            
        except Exception as e:
            self.logger.error(f"Error creating distributor: {str(e)}")
            raise
    
    def _update_distributor(self, distributor: Distributor, scraped: ScrapedDistributor):
        """Update existing distributor with new data"""
        try:
            # Update fields
            distributor.partner_type = scraped.partner_type
            distributor.latitude = self._safe_decimal_conversion(scraped.latitude)
            distributor.longitude = self._safe_decimal_conversion(scraped.longitude)
            distributor.phone = scraped.phone
            distributor.contact_email = scraped.contact_email
            distributor.contact_url = scraped.contact_url
            distributor.region = scraped.region
            distributor.country_state = scraped.country_state
            distributor.is_active = True  # Mark as active since we found it
            distributor.updated_at = datetime.utcnow()
            
        except Exception as e:
            self.logger.error(f"Error updating distributor: {str(e)}")
            raise
    
    def _distributor_needs_update(self, distributor: Distributor, scraped: ScrapedDistributor) -> bool:
        """Check if distributor needs updating"""
        try:
            # Convert scraped coordinates for comparison
            scraped_lat = self._safe_decimal_conversion(scraped.latitude)
            scraped_lng = self._safe_decimal_conversion(scraped.longitude)
            
            # Check each field for changes
            changes = [
                distributor.partner_type != scraped.partner_type,
                distributor.latitude != scraped_lat,
                distributor.longitude != scraped_lng,
                distributor.phone != scraped.phone,
                distributor.contact_email != scraped.contact_email,
                distributor.contact_url != scraped.contact_url,
                distributor.region != scraped.region,
                distributor.country_state != scraped.country_state,
                distributor.is_active != True  # Should be active if found
            ]
            
            return any(changes)
            
        except Exception as e:
            self.logger.error(f"Error checking if distributor needs update: {str(e)}")
            return False
    
    def _safe_decimal_conversion(self, value: Optional[str]) -> Optional[Decimal]:
        """Safely convert string to Decimal"""
        if not value:
            return None
        
        try:
            return Decimal(str(value))
        except (InvalidOperation, ValueError):
            self.logger.warning(f"Invalid decimal value: {value}")
            return None
    
    def _distributor_to_dict(self, distributor: Distributor) -> Dict:
        """Convert distributor to dictionary for change tracking"""
        return {
            'company_name': distributor.company.name,
            'partner_type': distributor.partner_type,
            'address': distributor.address,
            'latitude': str(distributor.latitude) if distributor.latitude else None,
            'longitude': str(distributor.longitude) if distributor.longitude else None,
            'phone': distributor.phone,
            'contact_email': distributor.contact_email,
            'contact_url': distributor.contact_url,
            'region': distributor.region,
            'country_state': distributor.country_state,
            'is_active': distributor.is_active
        }
    
    def _record_change(self, distributor_id: int, change_type: str, old_data: Optional[Dict], new_data: Optional[Dict]):
        """Record a change in the change history"""
        try:
            change = ChangeHistory(
                distributor_id=distributor_id,
                change_type=change_type,
                old_data=json.dumps(old_data) if old_data else None,
                new_data=json.dumps(new_data) if new_data else None
            )
            
            self.db.add(change)
            self.db.flush()
            
        except Exception as e:
            self.logger.error(f"Error recording change: {str(e)}")
            # Don't raise here - change recording is not critical
    
    def detect_missing_distributors(self, scraped_distributors: List[ScrapedDistributor]) -> List[Distributor]:
        """Detect distributors that are no longer active (not found in scraped data)"""
        try:
            # Get all currently active distributors
            active_distributors = self.db.query(Distributor).filter(
                Distributor.is_active == True
            ).all()
            
            # Create set of scraped distributor keys
            scraped_keys = set()
            for scraped in scraped_distributors:
                key = (scraped.company_name.lower().strip(), scraped.address.lower().strip())
                scraped_keys.add(key)
            
            # Find distributors not in scraped data
            missing_distributors = []
            for distributor in active_distributors:
                key = (distributor.company.name.lower().strip(), distributor.address.lower().strip())
                if key not in scraped_keys:
                    missing_distributors.append(distributor)
            
            self.logger.info(f"Found {len(missing_distributors)} potentially missing distributors")
            return missing_distributors
            
        except Exception as e:
            self.logger.error(f"Error detecting missing distributors: {str(e)}")
            return []
    
    def mark_distributors_inactive(self, distributors: List[Distributor]) -> int:
        """Mark distributors as inactive"""
        try:
            count = 0
            for distributor in distributors:
                if distributor.is_active:
                    old_data = self._distributor_to_dict(distributor)
                    distributor.is_active = False
                    distributor.updated_at = datetime.utcnow()
                    new_data = self._distributor_to_dict(distributor)
                    
                    # Record change
                    self._record_change(distributor.id, 'updated', old_data, new_data)
                    count += 1
            
            self.db.commit()
            self.logger.info(f"Marked {count} distributors as inactive")
            return count
            
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error marking distributors inactive: {str(e)}")
            return 0
    
    def calculate_data_hash(self, data: Dict) -> str:
        """Calculate hash of data for change detection"""
        try:
            # Sort keys for consistent hashing
            data_str = json.dumps(data, sort_keys=True)
            return hashlib.md5(data_str.encode()).hexdigest()
        except Exception as e:
            self.logger.error(f"Error calculating data hash: {str(e)}")
            return ""
    
    def get_statistics(self) -> Dict:
        """Get database statistics"""
        try:
            stats = {
                'total_companies': self.db.query(Company).count(),
                'total_distributors': self.db.query(Distributor).count(),
                'active_distributors': self.db.query(Distributor).filter(Distributor.is_active == True).count(),
                'master_distributors': self.db.query(Distributor).filter(Distributor.partner_type == 'master').count(),
                'total_changes': self.db.query(ChangeHistory).count()
            }
            
            # Regional distribution
            from sqlalchemy import func
            region_stats = self.db.query(
                Distributor.region,
                func.count(Distributor.id).label('count')
            ).filter(
                Distributor.is_active == True
            ).group_by(Distributor.region).all()
            
            stats['region_distribution'] = {
                region: count for region, count in region_stats if region
            }
            
            return stats
            
        except Exception as e:
            self.logger.error(f"Error getting statistics: {str(e)}")
            return {}
    
    def cleanup_old_changes(self, days_to_keep: int = 90) -> int:
        """Clean up old change history records"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
            
            deleted_count = self.db.query(ChangeHistory).filter(
                ChangeHistory.detected_at < cutoff_date
            ).delete()
            
            self.db.commit()
            
            self.logger.info(f"Cleaned up {deleted_count} old change records")
            return deleted_count
            
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error cleaning up old changes: {str(e)}")
            return 0
    
    def get_distributor_change_count(self, distributor_id: int) -> int:
        """Get total change count for a distributor"""
        try:
            return self.db.query(ChangeHistory).filter(
                ChangeHistory.distributor_id == distributor_id
            ).count()
        except Exception as e:
            self.logger.error(f"Error getting change count for distributor {distributor_id}: {str(e)}")
            return 0
    
    def get_recent_changes_summary(self, days: int = 30) -> Dict:
        """Get summary of recent changes"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Get changes by type
            changes_by_type = self.db.query(
                ChangeHistory.change_type,
                self.db.func.count(ChangeHistory.id).label('count')
            ).filter(
                ChangeHistory.detected_at >= cutoff_date
            ).group_by(ChangeHistory.change_type).all()
            
            # Get most changed distributors
            most_changed = self.db.query(
                ChangeHistory.distributor_id,
                self.db.func.count(ChangeHistory.id).label('change_count')
            ).filter(
                ChangeHistory.detected_at >= cutoff_date
            ).group_by(ChangeHistory.distributor_id).order_by(
                self.db.func.count(ChangeHistory.id).desc()
            ).limit(10).all()
            
            return {
                'period_days': days,
                'changes_by_type': dict(changes_by_type),
                'most_changed_distributors': [
                    {'distributor_id': dist_id, 'change_count': count}
                    for dist_id, count in most_changed
                ],
                'total_changes': sum(count for _, count in changes_by_type)
            }
            
        except Exception as e:
            self.logger.error(f"Error getting recent changes summary: {str(e)}")
            return {}