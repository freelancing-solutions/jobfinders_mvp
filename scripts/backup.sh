#!/bin/bash

set -e

# Configuration
BACKUP_DIR="/opt/jobfinders/backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/opt/jobfinders/logs/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Error handling
error_exit() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

# Success message
success() {
    log "${GREEN}SUCCESS: $1${NC}"
}

# Warning message
warning() {
    log "${YELLOW}WARNING: $1${NC}"
}

# Create backup directory
mkdir -p $BACKUP_DIR
mkdir -p $BACKUP_DIR/database
mkdir -p $BACKUP_DIR/files
mkdir -p $BACKUP_DIR/configs
mkdir -p $BACKUP_DIR/logs

log "🚀 Starting backup process..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error_exit "Docker is not running"
fi

# Database backup
log "📦 Creating database backup..."
DB_BACKUP_FILE="$BACKUP_DIR/database/jobfinders_db_$DATE.sql"

if docker-compose -f /opt/jobfinders/docker-compose.prod.yml exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > $DB_BACKUP_FILE; then
    # Compress the backup
    gzip $DB_BACKUP_FILE
    success "Database backup completed: ${DB_BACKUP_FILE}.gz"

    # Verify backup file
    if [ -f "${DB_BACKUP_FILE}.gz" ] && [ -s "${DB_BACKUP_FILE}.gz" ]; then
        BACKUP_SIZE=$(du -h "${DB_BACKUP_FILE}.gz" | cut -f1)
        log "Database backup size: $BACKUP_SIZE"
    else
        error_exit "Database backup file is empty or missing"
    fi
else
    error_exit "Database backup failed"
fi

# Files backup
log "📁 Creating files backup..."
FILES_BACKUP_FILE="$BACKUP_DIR/files/jobfinders_files_$DATE.tar.gz"

if tar -czf $FILES_BACKUP_FILE \
    /opt/jobfinders/uploads \
    /opt/jobfinders/ssl \
    --exclude='*.tmp' \
    --exclude='*.log'; then
    success "Files backup completed: $FILES_BACKUP_FILE"
    FILES_SIZE=$(du -h $FILES_BACKUP_FILE | cut -f1)
    log "Files backup size: $FILES_SIZE"
else
    error_exit "Files backup failed"
fi

# Configuration backup
log "⚙️ Creating configuration backup..."
CONFIG_BACKUP_FILE="$BACKUP_DIR/configs/jobfinders_configs_$DATE.tar.gz"

if tar -czf $CONFIG_BACKUP_FILE \
    /opt/jobfinders/.env.production \
    /opt/jobfinders/docker-compose.prod.yml \
    /opt/jobfinders/nginx \
    /opt/jobfinders/monitoring; then
    success "Configuration backup completed: $CONFIG_BACKUP_FILE"
    CONFIG_SIZE=$(du -h $CONFIG_BACKUP_FILE | cut -f1)
    log "Configuration backup size: $CONFIG_SIZE"
else
    error_exit "Configuration backup failed"
fi

# Logs backup (last 7 days)
log "📋 Creating logs backup..."
LOGS_BACKUP_FILE="$BACKUP_DIR/logs/jobfinders_logs_$DATE.tar.gz"

if find /opt/jobfinders/logs -name "*.log" -mtime -7 -print0 | tar -czf $LOGS_BACKUP_FILE --null -T -; then
    success "Logs backup completed: $LOGS_BACKUP_FILE"
    LOGS_SIZE=$(du -h $LOGS_BACKUP_FILE | cut -f1)
    log "Logs backup size: $LOGS_SIZE"
else
    warning "Logs backup failed or no recent logs found"
fi

# Create backup manifest
MANIFEST_FILE="$BACKUP_DIR/backup_manifest_$DATE.json"
cat > $MANIFEST_FILE << EOF
{
  "backup_date": "$(date -Iseconds)",
  "backup_type": "full",
  "components": {
    "database": {
      "file": "database/jobfinders_db_$DATE.sql.gz",
      "size": "$BACKUP_SIZE",
      "status": "success"
    },
    "files": {
      "file": "files/jobfinders_files_$DATE.tar.gz",
      "size": "$FILES_SIZE",
      "status": "success"
    },
    "configs": {
      "file": "configs/jobfinders_configs_$DATE.tar.gz",
      "size": "$CONFIG_SIZE",
      "status": "success"
    },
    "logs": {
      "file": "logs/jobfinders_logs_$DATE.tar.gz",
      "size": "$LOGS_SIZE",
      "status": "$([ -f "$LOGS_BACKUP_FILE" ] && echo "success" || echo "failed")"
    }
  },
  "total_size": "$(du -sh $BACKUP_DIR/*_$DATE* | awk '{sum+=$1} END {print sum"B"}')",
  "retention_days": $RETENTION_DAYS
}
EOF

success "Backup manifest created: $MANIFEST_FILE"

# Test database backup integrity
log "🔍 Testing database backup integrity..."
if gunzip -t "${DB_BACKUP_FILE}.gz"; then
    success "Database backup integrity test passed"
else
    error_exit "Database backup integrity test failed"
fi

# Cleanup old backups
log "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
DELETED_COUNT=0

# Delete old database backups
DELETED=$(find $BACKUP_DIR/database -name "jobfinders_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
DELETED_COUNT=$((DELETED_COUNT + DELETED))

# Delete old file backups
DELETED=$(find $BACKUP_DIR/files -name "jobfinders_files_*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
DELETED_COUNT=$((DELETED_COUNT + DELETED))

# Delete old config backups
DELETED=$(find $BACKUP_DIR/configs -name "jobfinders_configs_*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
DELETED_COUNT=$((DELETED_COUNT + DELETED))

# Delete old log backups (keep only 7 days)
DELETED=$(find $BACKUP_DIR/logs -name "jobfinders_logs_*.tar.gz" -mtime +7 -delete -print | wc -l)
DELETED_COUNT=$((DELETED_COUNT + DELETED))

# Delete old manifests
DELETED=$(find $BACKUP_DIR -name "backup_manifest_*.json" -mtime +$RETENTION_DAYS -delete -print | wc -l)
DELETED_COUNT=$((DELETED_COUNT + DELETED))

success "Cleaned up $DELETED_COUNT old backup files"

# Sync to remote storage (optional)
if [ ! -z "$REMOTE_BACKUP_ENABLED" ] && [ "$REMOTE_BACKUP_ENABLED" = "true" ]; then
    log "☁️ Syncing backups to remote storage..."

    if command -v aws &> /dev/null && [ ! -z "$AWS_S3_BUCKET" ]; then
        # AWS S3 sync
        if aws s3 sync $BACKUP_DIR s3://$AWS_S3_BUCKET/backups/ --delete; then
            success "Remote backup sync completed"
        else
            warning "Remote backup sync failed"
        fi
    elif command -v rclone &> /dev/null && [ ! -z "$RCLONE_REMOTE" ]; then
        # Rclone sync
        if rclone sync $BACKUP_DIR $RCLONE_REMOTE:backups/; then
            success "Remote backup sync completed"
        else
            warning "Remote backup sync failed"
        fi
    else
        warning "Remote backup enabled but no configured storage provider found"
    fi
fi

# Calculate backup statistics
TOTAL_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
BACKUP_COUNT=$(find $BACKUP_DIR -type f \( -name "*.gz" -o -name "*.json" \) | wc -l)

log "📊 Backup Statistics:"
log "  Total backup size: $TOTAL_SIZE"
log "  Number of backup files: $BACKUP_COUNT"
log "  Retention period: $RETENTION_DAYS days"

# Send notification (optional)
if [ ! -z "$BACKUP_NOTIFICATION_WEBHOOK" ]; then
    log "📢 Sending backup notification..."

    PAYLOAD=$(cat << EOF
{
    "text": "✅ JobFinders backup completed successfully",
    "attachments": [
        {
            "color": "good",
            "fields": [
                {
                    "title": "Backup Date",
                    "value": "$(date)",
                    "short": true
                },
                {
                    "title": "Total Size",
                    "value": "$TOTAL_SIZE",
                    "short": true
                },
                {
                    "title": "Files Backed Up",
                    "value": "$BACKUP_COUNT",
                    "short": true
                },
                {
                    "title": "Retention",
                    "value": "$RETENTION_DAYS days",
                    "short": true
                }
            ]
        }
    ]
}
EOF
    )

    if curl -X POST -H 'Content-type: application/json' \
        --data "$PAYLOAD" \
        "$BACKUP_NOTIFICATION_WEBHOOK" > /dev/null 2>&1; then
        success "Backup notification sent"
    else
        warning "Failed to send backup notification"
    fi
fi

success "🎉 Backup process completed successfully!"
log "Backup location: $BACKUP_DIR"
log "Manifest file: $MANIFEST_FILE"

exit 0