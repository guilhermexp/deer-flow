#!/bin/bash
# Database backup cron script for DeerFlow

# Add this to your crontab with:
# crontab -e
# Then add one of these lines:

# Daily backup at 2 AM
# 0 2 * * * /path/to/deerflow/scripts/backup_cron.sh >> /var/log/deerflow-backup.log 2>&1

# Hourly backup (for critical data)
# 0 * * * * /path/to/deerflow/scripts/backup_cron.sh >> /var/log/deerflow-backup.log 2>&1

# Weekly backup on Sundays at 3 AM
# 0 3 * * 0 /path/to/deerflow/scripts/backup_cron.sh >> /var/log/deerflow-backup.log 2>&1

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment
source "$PROJECT_ROOT/.env"

# Run backup
cd "$PROJECT_ROOT"
/usr/bin/env python3 "$SCRIPT_DIR/backup_database.py"