#!/bin/bash

set -e

# Configuration
BACKUP_DIR="/opt/jobfinders/backups"
MONITORING_LOG="/opt/jobfinders/logs/backup-monitoring.log"
ALERT_THRESHOLD_HOURS=24
MAX_BACKUP_SIZE_GB=50
MIN_BACKUP_SIZE_MB=100

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $MONITORING_LOG
}

# Error handling
error_exit() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

# Warning message
warning() {
    log "${YELLOW}WARNING: $1${NC}"
}

# Success message
success() {
    log "${GREEN}SUCCESS: $1${NC}"
}

# Check latest backup
check_latest_backup() {
    log "Checking latest backup..."

    LATEST_MANIFEST=$(find $BACKUP_DIR -name "backup_manifest_*.json" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

    if [ -z "$LATEST_MANIFEST" ]; then
        error_exit "No backup manifests found"
    fi

    BACKUP_DATE=$(jq -r '.backup_date' $LATEST_MANIFEST)
    BACKUP_TIMESTAMP=$(date -d "$BACKUP_DATE" +%s)
    CURRENT_TIMESTAMP=$(date +%s)
    HOURS_SINCE_BACKUP=$(( (CURRENT_TIMESTAMP - BACKUP_TIMESTAMP) / 3600 ))

    if [ $HOURS_SINCE_BACKUP -gt $ALERT_THRESHOLD_HOURS ]; then
        warning "Latest backup is $HOURS_SINCE_BACKUP hours old (threshold: $ALERT_THRESHOLD_HOURS hours)"
        return 1
    else
        success "Latest backup is $HOURS_SINCE_BACKUP hours old"
        return 0
    fi
}

# Check backup sizes
check_backup_sizes() {
    log "Checking backup sizes..."

    LATEST_MANIFEST=$(find $BACKUP_DIR -name "backup_manifest_*.json" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

    # Check database backup size
    DB_SIZE_BYTES=$(jq -r '.components.database.size' $LATEST_MANIFEST | sed 's/[^0-9]//g')
    DB_SIZE_MB=$((DB_SIZE_BYTES / 1024 / 1024))

    if [ $DB_SIZE_MB -lt $MIN_BACKUP_SIZE_MB ]; then
        warning "Database backup is suspiciously small: ${DB_SIZE_MB}MB (minimum: ${MIN_BACKUP_SIZE_MB}MB)"
    else
        success "Database backup size is reasonable: ${DB_SIZE_MB}MB"
    fi

    # Check total backup size
    TOTAL_SIZE=$(jq -r '.total_size' $LATEST_MANIFEST | sed 's/[^0-9.]//g')
    TOTAL_SIZE_GB=$(echo "$TOTAL_SIZE" | sed 's/G//g' | sed 's/B//g')

    if (( $(echo "$TOTAL_SIZE_GB > $MAX_BACKUP_SIZE_GB" | bc -l) )); then
        warning "Total backup size is large: ${TOTAL_SIZE}GB (threshold: ${MAX_BACKUP_SIZE_GB}GB)"
    else
        success "Total backup size is acceptable: ${TOTAL_SIZE}"
    fi
}

# Check backup integrity
check_backup_integrity() {
    log "Checking backup integrity..."

    LATEST_MANIFEST=$(find $BACKUP_DIR -name "backup_manifest_*.json" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

    # Check database backup integrity
    DB_BACKUP=$(jq -r '.components.database.file' $LATEST_MANIFEST)
    DB_BACKUP_PATH="$BACKUP_DIR/$DB_BACKUP"

    if [ -f "$DB_BACKUP_PATH" ]; then
        if gunzip -t "$DB_BACKUP_PATH" 2>/dev/null; then
            success "Database backup integrity check passed"
        else
            warning "Database backup integrity check failed"
            return 1
        fi
    else
        warning "Database backup file not found"
        return 1
    fi

    # Check file backup integrity
    FILES_BACKUP=$(jq -r '.components.files.file' $LATEST_MANIFEST)
    FILES_BACKUP_PATH="$BACKUP_DIR/$FILES_BACKUP"

    if [ -f "$FILES_BACKUP_PATH" ]; then
        if tar -tzf "$FILES_BACKUP_PATH" >/dev/null 2>&1; then
            success "Files backup integrity check passed"
        else
            warning "Files backup integrity check failed"
            return 1
        fi
    else
        warning "Files backup file not found"
        return 1
    fi

    return 0
}

# Check backup retention
check_backup_retention() {
    log "Checking backup retention policy..."

    TOTAL_BACKUPS=$(find $BACKUP_DIR -name "backup_manifest_*.json" -type f | wc -l)
    RETENTION_DAYS=$(jq -r '.retention_days' $(find $BACKUP_DIR -name "backup_manifest_*.json" -type f | head -1))

    if [ -z "$RETENTION_DAYS" ]; then
        RETENTION_DAYS=30
    fi

    OLD_BACKUPS=$(find $BACKUP_DIR -name "backup_manifest_*.json" -type f -mtime +$RETENTION_DAYS | wc -l)

    if [ $OLD_BACKUPS -gt 0 ]; then
        warning "Found $OLD_BACKUPS backups older than $RETENTION_DAYS days"
    else
        success "No backups older than $RETENTION_DAYS days found"
    fi

    success "Total backups: $TOTAL_BACKUPS, Retention period: $RETENTION_DAYS days"
}

# Check disk space
check_disk_space() {
    log "Checking disk space for backups..."

    BACKUP_USAGE=$(df $BACKUP_DIR | awk 'NR==2 {print $5}' | sed 's/%//')
    AVAILABLE_SPACE=$(df -h $BACKUP_DIR | awk 'NR==2 {print $4}')

    if [ $BACKUP_USAGE -gt 90 ]; then
        error_exit "Backup directory is $BACKUP_USAGE% full (critical)"
    elif [ $BACKUP_USAGE -gt 80 ]; then
        warning "Backup directory is $BACKUP_USAGE% full (warning)"
    else
        success "Backup directory usage: $BACKUP_USAGE% ($AVAILABLE_SPACE available)"
    fi
}

# Check remote backup sync
check_remote_sync() {
    if [ ! -z "$REMOTE_BACKUP_ENABLED" ] && [ "$REMOTE_BACKUP_ENABLED" = "true" ]; then
        log "Checking remote backup sync status..."

        if command -v aws &> /dev/null && [ ! -z "$AWS_S3_BUCKET" ]; then
            # Check AWS S3 sync
            LATEST_LOCAL=$(find $BACKUP_DIR -name "backup_manifest_*.json" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2- | xargs basename)
            LATEST_REMOTE=$(aws s3 ls s3://$AWS_S3_BUCKET/backups/ | grep backup_manifest | sort | tail -1 | awk '{print $4}')

            if [ "$LATEST_LOCAL" = "$LATEST_REMOTE" ]; then
                success "Remote backup sync is up to date"
            else
                warning "Remote backup sync may be out of date (local: $LATEST_LOCAL, remote: $LATEST_REMOTE)"
            fi
        else
            warning "Remote backup enabled but no valid configuration found"
        fi
    else
        success "Remote backup sync is disabled"
    fi
}

# Generate monitoring report
generate_report() {
    log "Generating monitoring report..."

    REPORT_FILE="/opt/jobfinders/logs/backup-monitoring-report-$(date +%Y%m%d).txt"

    cat > $REPORT_FILE << EOF
JobFinders Backup Monitoring Report
Generated: $(date)
=====================================

Latest Backup Status:
$(check_latest_backup 2>&1)

Backup Sizes:
$(check_backup_sizes 2>&1)

Backup Integrity:
$(check_backup_integrity 2>&1)

Backup Retention:
$(check_backup_retention 2>&1)

Disk Space:
$(check_disk_space 2>&1)

Remote Sync:
$(check_remote_sync 2>&1)

Backup Directory Contents:
$(ls -la $BACKUP_DIR | head -20)

EOF

    success "Monitoring report generated: $REPORT_FILE"
}

# Send alert if needed
send_alert() {
    if [ "$ALERT_NEEDED" = "true" ]; then
        if [ ! -z "$BACKUP_ALERT_WEBHOOK" ]; then
            log "Sending backup alert..."

            PAYLOAD=$(cat << EOF
{
    "text": "🚨 JobFinders Backup Alert",
    "attachments": [
        {
            "color": "warning",
            "fields": [
                {
                    "title": "Alert Type",
                    "value": "Backup Monitoring Alert",
                    "short": true
                },
                {
                    "title": "Timestamp",
                    "value": "$(date)",
                    "short": true
                },
                {
                    "title": "Issues Detected",
                    "value": "$ALERT_MESSAGE",
                    "short": false
                }
            ]
        }
    ]
}
EOF
            )

            if curl -X POST -H 'Content-type: application/json' \
                --data "$PAYLOAD" \
                "$BACKUP_ALERT_WEBHOOK" > /dev/null 2>&1; then
                success "Backup alert sent"
            else
                warning "Failed to send backup alert"
            fi
        fi
    fi
}

# Main monitoring function
main() {
    log "Starting backup monitoring..."

    ALERT_NEEDED="false"
    ALERT_MESSAGE=""

    # Run all checks
    if ! check_latest_backup; then
        ALERT_NEEDED="true"
        ALERT_MESSAGE="$ALERT_MESSAGE Latest backup is too old; "
    fi

    check_backup_sizes
    if ! check_backup_integrity; then
        ALERT_NEEDED="true"
        ALERT_MESSAGE="$ALERT_MESSAGE Backup integrity issues detected; "
    fi

    check_backup_retention
    check_disk_space
    check_remote_sync

    generate_report
    send_alert

    if [ "$ALERT_NEEDED" = "true" ]; then
        warning "Backup monitoring completed with alerts"
    else
        success "Backup monitoring completed successfully"
    fi
}

# Handle script arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --report-only)
            generate_report
            exit 0
            ;;
        --help)
            echo "Usage: $0 [--report-only] [--help]"
            echo "  --report-only: Generate report only"
            echo "  --help: Show this help message"
            exit 0
            ;;
        *)
            error_exit "Unknown option: $1"
            ;;
    esac
done

# Run main function
main