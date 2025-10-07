#!/bin/bash

# Resume Data Backup Script
# This script creates automated backups of resume data and configurations

set -euo pipefail

# Configuration
BACKUP_DIR="/backups/resume-builder"
RETENTION_DAYS=30
S3_BUCKET="jobfinders-backups"
NAMESPACE="jobfinders"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="resume_backup_${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    log_info "Creating backup directory..."
    mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"
    mkdir -p "${BACKUP_DIR}/logs"
}

# Backup database
backup_database() {
    log_info "Backing up database..."

    # Get database connection details from Kubernetes secrets
    DB_URL=$(kubectl get secret jobfinders-secrets -n "${NAMESPACE}" -o jsonpath='{.data.database-url}' | base64 -d)

    if [ -z "$DB_URL" ]; then
        log_error "Database URL not found in secrets"
        exit 1
    fi

    # Create database backup
    pg_dump "$DB_URL" --format=custom --compress=9 --verbose \
        --file="${BACKUP_DIR}/${BACKUP_NAME}/database.dump"

    # Verify backup
    if [ -f "${BACKUP_DIR}/${BACKUP_NAME}/database.dump" ]; then
        local file_size=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}/database.dump" | cut -f1)
        log_info "Database backup completed. Size: $file_size"
    else
        log_error "Database backup failed"
        exit 1
    fi
}

# Backup file storage
backup_file_storage() {
    log_info "Backing up file storage..."

    # Create temporary pod to access storage
    kubectl run backup-pod --image=busybox --rm -i --restart=Never -n "${NAMESPACE}" \
        -- tar -czf - -C /app/uploads . > "${BACKUP_DIR}/${BACKUP_NAME}/resume_files.tar.gz"

    # Verify backup
    if [ -f "${BACKUP_DIR}/${BACKUP_NAME}/resume_files.tar.gz" ]; then
        local file_size=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}/resume_files.tar.gz" | cut -f1)
        log_info "File storage backup completed. Size: $file_size"
    else
        log_error "File storage backup failed"
        exit 1
    fi
}

# Backup configurations
backup_configurations() {
    log_info "Backing up configurations..."

    # Export Kubernetes configurations
    kubectl get configmap -n "${NAMESPACE}" -o yaml > "${BACKUP_DIR}/${BACKUP_NAME}/configmaps.yaml"
    kubectl get secret -n "${NAMESPACE}" -o yaml > "${BACKUP_DIR}/${BACKUP_NAME}/secrets.yaml" \
        --exclude-secrets=true  # Exclude actual secret values for security

    # Backup application configuration files
    mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}/app-config"
    cp -r k8s/ "${BACKUP_DIR}/${BACKUP_NAME}/app-config/k8s/"
    cp -r monitoring/ "${BACKUP_DIR}/${BACKUP_NAME}/app-config/monitoring/"

    log_info "Configuration backup completed"
}

# Create backup manifest
create_manifest() {
    log_info "Creating backup manifest..."

    cat > "${BACKUP_DIR}/${BACKUP_NAME}/MANIFEST.txt" << EOF
Resume Builder Backup Manifest
============================

Backup Name: ${BACKUP_NAME}
Timestamp: ${TIMESTAMP}
Created By: Automated Backup Script
Namespace: ${NAMESPACE}

Contents:
--------
- database.dump: PostgreSQL database dump
- resume_files.tar.gz: Compressed resume files
- configmaps.yaml: Kubernetes ConfigMaps (sanitized)
- secrets.yaml: Kubernetes Secrets structure (sanitized)
- app-config/: Application configuration files

Backup Details:
--------------
Database Size: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}/database.dump" 2>/dev/null | cut -f1 || echo "N/A")
Files Size: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}/resume_files.tar.gz" 2>/dev/null | cut -f1 || echo "N/A")
Total Size: $(du -sh "${BACKUP_DIR}/${BACKUP_NAME}" | cut -f1)

Checksums:
----------
EOF

    # Add checksums for all files
    cd "${BACKUP_DIR}/${BACKUP_NAME}"
    find . -type f -exec sha256sum {} + | sort > checksums.txt
    cat checksums.txt >> MANIFEST.txt
    cd - > /dev/null

    log_info "Backup manifest created"
}

# Verify backup integrity
verify_backup() {
    log_info "Verifying backup integrity..."

    # Check checksums
    cd "${BACKUP_DIR}/${BACKUP_NAME}"
    if sha256sum -c checksums.txt > /dev/null 2>&1; then
        log_info "Backup integrity verified"
    else
        log_error "Backup integrity check failed"
        exit 1
    fi
    cd - > /dev/null
}

# Compress backup
compress_backup() {
    log_info "Compressing backup..."

    # Create compressed archive
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"

    # Remove uncompressed directory
    rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"

    local compressed_size=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)
    log_info "Backup compressed. Size: $compressed_size"
}

# Upload to S3 (if configured)
upload_to_s3() {
    if command -v aws &> /dev/null && [ -n "${S3_BUCKET}" ]; then
        log_info "Uploading backup to S3..."

        aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
            "s3://${S3_BUCKET}/resume-builder/${BACKUP_NAME}.tar.gz" \
            --storage-class STANDARD_IA

        # Upload manifest
        aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}/MANIFEST.txt" \
            "s3://${S3_BUCKET}/resume-builder/${BACKUP_NAME}_MANIFEST.txt"

        log_info "Backup uploaded to S3"
    else
        log_warn "AWS CLI not configured or S3 bucket not specified. Skipping S3 upload."
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."

    # Clean up local backups
    find "${BACKUP_DIR}" -name "resume_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

    # Clean up S3 backups (if AWS CLI is available)
    if command -v aws &> /dev/null && [ -n "${S3_BUCKET}" ]; then
        aws s3 ls "s3://${S3_BUCKET}/resume-builder/" | \
            while read -r line; do
                backup_date=$(echo "$line" | awk '{print $1}')
                backup_file=$(echo "$line" | awk '{print $4}')

                # Convert AWS date to timestamp for comparison
                backup_timestamp=$(date -d "$backup_date" +%s 2>/dev/null || echo "0")
                cutoff_timestamp=$(date -d "${RETENTION_DAYS} days ago" +%s)

                if [ "$backup_timestamp" -lt "$cutoff_timestamp" ]; then
                    log_info "Deleting old S3 backup: $backup_file"
                    aws s3 rm "s3://${S3_BUCKET}/resume-builder/$backup_file"
                fi
            done
    fi

    log_info "Cleanup completed"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2

    # Send to Slack (if webhook URL is configured)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local color="good"
        if [ "$status" = "error" ]; then
            color="danger"
        elif [ "$status" = "warning" ]; then
            color="warning"
        fi

        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Resume Builder Backup: $message\", \"color\":\"$color\"}" \
            "${SLACK_WEBHOOK_URL}" &>/dev/null || true
    fi

    # Send email (if configured)
    if [ -n "${BACKUP_EMAIL:-}" ]; then
        echo "$message" | mail -s "Resume Builder Backup: $status" "$BACKUP_EMAIL" || true
    fi
}

# Main execution
main() {
    log_info "Starting Resume Builder backup process..."

    # Set trap for error handling
    trap 'log_error "Backup process failed"; send_notification "error" "Backup failed with error on $(hostname)"; exit 1' ERR

    # Create backup
    create_backup_dir
    backup_database
    backup_file_storage
    backup_configurations
    create_manifest
    verify_backup
    compress_backup
    upload_to_s3
    cleanup_old_backups

    # Log success
    log_info "Backup completed successfully: ${BACKUP_NAME}.tar.gz"
    send_notification "success" "Backup completed successfully: ${BACKUP_NAME}.tar.gz ($(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1))"

    # Log to backup log file
    echo "$(date): Backup completed successfully - ${BACKUP_NAME}.tar.gz" >> "${BACKUP_DIR}/logs/backup.log"
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --dry-run    Show what would be backed up without actually doing it"
    echo "  --cleanup    Only run cleanup of old backups"
    echo "  --help       Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  BACKUP_DIR        Backup directory (default: /backups/resume-builder)"
    echo "  RETENTION_DAYS    Number of days to keep backups (default: 30)"
    echo "  S3_BUCKET         S3 bucket for remote backups"
    echo "  SLACK_WEBHOOK_URL Slack webhook for notifications"
    echo "  BACKUP_EMAIL      Email address for notifications"
    echo ""
}

# Parse command line arguments
case "${1:-}" in
    --dry-run)
        log_info "Dry run mode - showing what would be backed up:"
        echo "- Database: PostgreSQL database"
        echo "- Files: Resume files from /app/uploads"
        echo "- Configs: Kubernetes ConfigMaps and Secrets"
        echo "- Location: ${BACKUP_DIR}"
        exit 0
        ;;
    --cleanup)
        cleanup_old_backups
        exit 0
        ;;
    --help)
        usage
        exit 0
        ;;
    "")
        # No arguments, run main backup
        main
        ;;
    *)
        echo "Unknown option: $1"
        usage
        exit 1
        ;;
esac