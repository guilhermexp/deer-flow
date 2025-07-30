#!/usr/bin/env python3
# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

"""
Database backup script for DeerFlow
Supports both local SQLite and Supabase PostgreSQL backups
"""

import os
import sys
import logging
import subprocess
import datetime
import shutil
from pathlib import Path
from typing import Optional
import boto3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatabaseBackup:
    """Handle database backups for DeerFlow"""
    
    def __init__(self):
        self.backup_dir = Path(os.getenv("BACKUP_DIR", "./backups"))
        self.backup_dir.mkdir(exist_ok=True)
        
        # S3 configuration
        self.s3_bucket = os.getenv("BACKUP_S3_BUCKET")
        self.s3_prefix = os.getenv("BACKUP_S3_PREFIX", "deerflow-backups")
        self.aws_region = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
        
        # Database configuration
        self.database_url = os.getenv("DATABASE_URL")
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        # Retention policy
        self.local_retention_days = int(os.getenv("BACKUP_LOCAL_RETENTION_DAYS", "7"))
        self.s3_retention_days = int(os.getenv("BACKUP_S3_RETENTION_DAYS", "30"))
        
    def backup_sqlite(self) -> Optional[Path]:
        """Backup SQLite database"""
        if not self.database_url or not self.database_url.startswith("sqlite"):
            logger.info("No SQLite database configured")
            return None
            
        # Extract database path
        db_path = self.database_url.replace("sqlite:///", "")
        if not os.path.exists(db_path):
            logger.error(f"SQLite database not found: {db_path}")
            return None
            
        # Create backup filename
        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"deerflow_sqlite_{timestamp}.db"
        backup_path = self.backup_dir / backup_filename
        
        try:
            # Copy database file
            shutil.copy2(db_path, backup_path)
            logger.info(f"SQLite backup created: {backup_path}")
            
            # Compress backup
            compressed_path = self._compress_backup(backup_path)
            
            # Remove uncompressed backup
            backup_path.unlink()
            
            return compressed_path
            
        except Exception as e:
            logger.error(f"Failed to backup SQLite: {e}")
            return None
    
    def backup_supabase(self) -> Optional[Path]:
        """Backup Supabase PostgreSQL database"""
        if not self.supabase_url:
            logger.info("No Supabase database configured")
            return None
            
        # Extract connection details from Supabase URL
        # Format: https://<project-ref>.supabase.co
        project_ref = self.supabase_url.split("//")[1].split(".")[0]
        
        # Supabase provides database connection string
        db_host = f"db.{project_ref}.supabase.co"
        db_port = "5432"
        db_name = "postgres"
        db_user = "postgres"
        
        # Create backup filename
        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"deerflow_supabase_{timestamp}.sql"
        backup_path = self.backup_dir / backup_filename
        
        try:
            # Use pg_dump to create backup
            # Note: This requires PGPASSWORD to be set or .pgpass file
            env = os.environ.copy()
            env["PGPASSWORD"] = self.supabase_service_key
            
            cmd = [
                "pg_dump",
                "-h", db_host,
                "-p", db_port,
                "-U", db_user,
                "-d", db_name,
                "-f", str(backup_path),
                "--no-owner",
                "--no-privileges",
                "--clean",
                "--if-exists"
            ]
            
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"pg_dump failed: {result.stderr}")
                return None
                
            logger.info(f"Supabase backup created: {backup_path}")
            
            # Compress backup
            compressed_path = self._compress_backup(backup_path)
            
            # Remove uncompressed backup
            backup_path.unlink()
            
            return compressed_path
            
        except Exception as e:
            logger.error(f"Failed to backup Supabase: {e}")
            return None
    
    def _compress_backup(self, backup_path: Path) -> Path:
        """Compress backup file using gzip"""
        compressed_path = backup_path.with_suffix(backup_path.suffix + ".gz")
        
        try:
            subprocess.run(
                ["gzip", "-9", str(backup_path)],
                check=True,
                capture_output=True
            )
            
            # gzip replaces original file
            compressed_path = backup_path.with_suffix(backup_path.suffix + ".gz")
            logger.info(f"Compressed backup: {compressed_path}")
            
            return compressed_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to compress backup: {e}")
            return backup_path
    
    def upload_to_s3(self, backup_path: Path) -> bool:
        """Upload backup to S3"""
        if not self.s3_bucket:
            logger.info("S3 backup not configured")
            return False
            
        try:
            s3_client = boto3.client('s3', region_name=self.aws_region)
            
            # Generate S3 key
            s3_key = f"{self.s3_prefix}/{backup_path.name}"
            
            # Upload file
            s3_client.upload_file(
                str(backup_path),
                self.s3_bucket,
                s3_key,
                ExtraArgs={
                    'ServerSideEncryption': 'AES256',
                    'StorageClass': 'STANDARD_IA'  # Infrequent Access for cost savings
                }
            )
            
            logger.info(f"Backup uploaded to S3: s3://{self.s3_bucket}/{s3_key}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to upload to S3: {e}")
            return False
    
    def cleanup_old_backups(self):
        """Remove old backup files based on retention policy"""
        # Clean local backups
        cutoff_date = datetime.datetime.utcnow() - datetime.timedelta(days=self.local_retention_days)
        
        for backup_file in self.backup_dir.glob("deerflow_*.gz"):
            if backup_file.stat().st_mtime < cutoff_date.timestamp():
                backup_file.unlink()
                logger.info(f"Deleted old local backup: {backup_file}")
        
        # Clean S3 backups
        if self.s3_bucket:
            try:
                s3_client = boto3.client('s3', region_name=self.aws_region)
                
                # List objects
                response = s3_client.list_objects_v2(
                    Bucket=self.s3_bucket,
                    Prefix=self.s3_prefix
                )
                
                if 'Contents' not in response:
                    return
                
                # Filter old objects
                cutoff_date = datetime.datetime.utcnow() - datetime.timedelta(days=self.s3_retention_days)
                
                for obj in response['Contents']:
                    if obj['LastModified'].replace(tzinfo=None) < cutoff_date:
                        s3_client.delete_object(
                            Bucket=self.s3_bucket,
                            Key=obj['Key']
                        )
                        logger.info(f"Deleted old S3 backup: {obj['Key']}")
                        
            except Exception as e:
                logger.error(f"Failed to cleanup S3 backups: {e}")
    
    def run_backup(self):
        """Run the complete backup process"""
        logger.info("Starting database backup process...")
        
        backups_created = []
        
        # Backup SQLite if configured
        sqlite_backup = self.backup_sqlite()
        if sqlite_backup:
            backups_created.append(sqlite_backup)
        
        # Backup Supabase if configured
        supabase_backup = self.backup_supabase()
        if supabase_backup:
            backups_created.append(supabase_backup)
        
        # Upload backups to S3
        for backup_path in backups_created:
            self.upload_to_s3(backup_path)
        
        # Cleanup old backups
        self.cleanup_old_backups()
        
        logger.info("Backup process completed successfully")
        
        return len(backups_created) > 0


def main():
    """Main entry point"""
    backup = DatabaseBackup()
    success = backup.run_backup()
    
    if not success:
        logger.error("No backups were created")
        sys.exit(1)
    
    sys.exit(0)


if __name__ == "__main__":
    main()