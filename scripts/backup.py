#!/usr/bin/env python3
"""
Database backup script for Unifi Distributor Tracking System
"""

import os
import subprocess
import shutil
from datetime import datetime
from pathlib import Path
import json
import sqlite3
import boto3
from config.settings import settings
from config.logging import setup_logging

setup_logging()
import logging
logger = logging.getLogger(__name__)

class DatabaseBackup:
    """Handle database backups"""
    
    def __init__(self):
        self.backup_dir = Path("backups")
        self.backup_dir.mkdir(exist_ok=True)
        
    def create_backup(self) -> str:
        """Create a database backup"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if settings.database_url.startswith("sqlite"):
            return self._backup_sqlite(timestamp)
        elif settings.database_url.startswith("postgresql"):
            return self._backup_postgresql(timestamp)
        else:
            raise ValueError("Unsupported database type")
    
    def _backup_sqlite(self, timestamp: str) -> str:
        """Backup SQLite database"""
        try:
            # Extract database file path from URL
            db_path = settings.database_url.replace("sqlite:///", "")
            
            if not os.path.exists(db_path):
                raise FileNotFoundError(f"Database file not found: {db_path}")
            
            backup_filename = f"unifi_distributors_sqlite_{timestamp}.db"
            backup_path = self.backup_dir / backup_filename
            
            # Copy database file
            shutil.copy2(db_path, backup_path)
            
            logger.info(f"SQLite backup created: {backup_path}")
            return str(backup_path)
            
        except Exception as e:
            logger.error(f"SQLite backup failed: {str(e)}")
            raise
    
    def _backup_postgresql(self, timestamp: str) -> str:
        """Backup PostgreSQL database"""
        try:
            backup_filename = f"unifi_distributors_pg_{timestamp}.sql"
            backup_path = self.backup_dir / backup_filename
            
            # Use pg_dump to create backup
            cmd = [
                "pg_dump",
                settings.database_url,
                "-f", str(backup_path),
                "--no-owner",
                "--no-acl",
                "--verbose"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                raise Exception(f"pg_dump failed: {result.stderr}")
            
            logger.info(f"PostgreSQL backup created: {backup_path}")
            return str(backup_path)
            
        except Exception as e:
            logger.error(f"PostgreSQL backup failed: {str(e)}")
            raise
    
    def create_data_export(self) -> str:
        """Create JSON export of all data"""
        try:
            from config.database import SessionLocal
            from models.database import Company, Distributor, ChangeHistory
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            export_filename = f"unifi_distributors_export_{timestamp}.json"
            export_path = self.backup_dir / export_filename
            
            db = SessionLocal()
            try:
                # Export companies
                companies = db.query(Company).all()
                companies_data = []
                for company in companies:
                    companies_data.append({
                        'id': company.id,
                        'name': company.name,
                        'website_url': company.website_url,
                        'created_at': company.created_at.isoformat(),
                        'updated_at': company.updated_at.isoformat()
                    })
                
                # Export distributors
                distributors = db.query(Distributor).all()
                distributors_data = []
                for distributor in distributors:
                    distributors_data.append({
                        'id': distributor.id,
                        'company_id': distributor.company_id,
                        'partner_type': distributor.partner_type,
                        'address': distributor.address,
                        'latitude': str(distributor.latitude) if distributor.latitude else None,
                        'longitude': str(distributor.longitude) if distributor.longitude else None,
                        'phone': distributor.phone,
                        'contact_email': distributor.contact_email,
                        'contact_url': distributor.contact_url,
                        'region': distributor.region,
                        'country_state': distributor.country_state,
                        'is_active': distributor.is_active,
                        'created_at': distributor.created_at.isoformat(),
                        'updated_at': distributor.updated_at.isoformat()
                    })
                
                # Export change history (last 30 days)
                from datetime import timedelta
                cutoff_date = datetime.utcnow() - timedelta(days=30)
                changes = db.query(ChangeHistory).filter(
                    ChangeHistory.detected_at >= cutoff_date
                ).all()
                
                changes_data = []
                for change in changes:
                    changes_data.append({
                        'id': change.id,
                        'distributor_id': change.distributor_id,
                        'change_type': change.change_type,
                        'old_data': change.old_data,
                        'new_data': change.new_data,
                        'detected_at': change.detected_at.isoformat()
                    })
                
                # Create export data
                export_data = {
                    'export_info': {
                        'timestamp': timestamp,
                        'version': '1.0.0',
                        'total_companies': len(companies_data),
                        'total_distributors': len(distributors_data),
                        'total_changes': len(changes_data)
                    },
                    'companies': companies_data,
                    'distributors': distributors_data,
                    'changes': changes_data
                }
                
                # Write to file
                with open(export_path, 'w', encoding='utf-8') as f:
                    json.dump(export_data, f, indent=2, ensure_ascii=False)
                
                logger.info(f"Data export created: {export_path}")
                return str(export_path)
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Data export failed: {str(e)}")
            raise
    
    def upload_to_s3(self, file_path: str) -> bool:
        """Upload backup to S3"""
        try:
            if not os.getenv('AWS_ACCESS_KEY_ID'):
                logger.warning("AWS credentials not configured, skipping S3 upload")
                return False
            
            bucket_name = os.getenv('S3_BACKUP_BUCKET')
            if not bucket_name:
                logger.warning("S3 backup bucket not configured")
                return False
            
            s3_client = boto3.client('s3')
            filename = os.path.basename(file_path)
            s3_key = f"backups/{filename}"
            
            s3_client.upload_file(file_path, bucket_name, s3_key)
            
            logger.info(f"Backup uploaded to S3: s3://{bucket_name}/{s3_key}")
            return True
            
        except Exception as e:
            logger.error(f"S3 upload failed: {str(e)}")
            return False
    
    def cleanup_old_backups(self, days_to_keep: int = 7):
        """Clean up old backup files"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days_to_keep)
            
            deleted_count = 0
            for backup_file in self.backup_dir.glob("unifi_distributors_*"):
                if backup_file.stat().st_mtime < cutoff_date.timestamp():
                    backup_file.unlink()
                    deleted_count += 1
                    logger.info(f"Deleted old backup: {backup_file}")
            
            logger.info(f"Cleaned up {deleted_count} old backup files")
            
        except Exception as e:
            logger.error(f"Backup cleanup failed: {str(e)}")
    
    def restore_from_backup(self, backup_path: str):
        """Restore database from backup"""
        try:
            if not os.path.exists(backup_path):
                raise FileNotFoundError(f"Backup file not found: {backup_path}")
            
            if backup_path.endswith('.db'):
                self._restore_sqlite(backup_path)
            elif backup_path.endswith('.sql'):
                self._restore_postgresql(backup_path)
            else:
                raise ValueError("Unsupported backup file format")
                
        except Exception as e:
            logger.error(f"Restore failed: {str(e)}")
            raise
    
    def _restore_sqlite(self, backup_path: str):
        """Restore SQLite database"""
        try:
            db_path = settings.database_url.replace("sqlite:///", "")
            
            # Create backup of current database
            if os.path.exists(db_path):
                current_backup = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                shutil.copy2(db_path, current_backup)
                logger.info(f"Current database backed up to: {current_backup}")
            
            # Restore from backup
            shutil.copy2(backup_path, db_path)
            
            logger.info(f"SQLite database restored from: {backup_path}")
            
        except Exception as e:
            logger.error(f"SQLite restore failed: {str(e)}")
            raise
    
    def _restore_postgresql(self, backup_path: str):
        """Restore PostgreSQL database"""
        try:
            # This is a destructive operation, so we need to be careful
            cmd = [
                "psql",
                settings.database_url,
                "-f", backup_path,
                "-v", "ON_ERROR_STOP=1"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                raise Exception(f"psql restore failed: {result.stderr}")
            
            logger.info(f"PostgreSQL database restored from: {backup_path}")
            
        except Exception as e:
            logger.error(f"PostgreSQL restore failed: {str(e)}")
            raise

def main():
    """Main backup function"""
    backup = DatabaseBackup()
    
    try:
        # Create database backup
        backup_path = backup.create_backup()
        print(f"✅ Database backup created: {backup_path}")
        
        # Create data export
        export_path = backup.create_data_export()
        print(f"✅ Data export created: {export_path}")
        
        # Upload to S3 if configured
        if backup.upload_to_s3(backup_path):
            print("✅ Backup uploaded to S3")
        
        if backup.upload_to_s3(export_path):
            print("✅ Export uploaded to S3")
        
        # Cleanup old backups
        backup.cleanup_old_backups()
        print("✅ Old backups cleaned up")
        
        print(f"🎉 Backup process completed successfully!")
        
    except Exception as e:
        print(f"❌ Backup failed: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())