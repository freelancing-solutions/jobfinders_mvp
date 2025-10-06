#!/bin/bash

set -e

# Configuration
BACKUP_DIR="/opt/jobfinders/backups"
RESTORE_DIR="/tmp/jobfinders_restore_$(date +%s)"
LOG_FILE="/opt/jobfinders/logs/disaster-recovery.log"
COMPOSE_FILE="/opt/jobfinders/docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Error handling
error_exit() {
    log "${RED}CRITICAL: $1${NC}"
    log "${RED}Disaster recovery failed! System may be in inconsistent state.${NC}"
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

# Info message
info() {
    log "${BLUE}INFO: $1${NC}"
}

# Confirm critical action
confirm() {
    echo -e "${YELLOW}$1${NC}"
    read -p "Type 'yes' to continue: " response
    if [ "$response" != "yes" ]; then
        error_exit "Disaster recovery cancelled by user"
    fi
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."

    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        error_exit "This script must be run as root"
    fi

    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        error_exit "Docker is not running"
    fi

    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        error_exit "docker-compose is not available"
    fi

    # Check backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        error_exit "Backup directory does not exist: $BACKUP_DIR"
    fi

    success "Prerequisites check passed"
}

# List available backups
list_backups() {
    info "Available backups:"
    echo

    # Find the most recent backup
    LATEST_BACKUP=$(find $BACKUP_DIR -name "backup_manifest_*.json" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

    if [ -z "$LATEST_BACKUP" ]; then
        error_exit "No backup manifests found"
    fi

    echo "Latest backup: $(basename $LATEST_BACKUP)"
    echo "Backup date: $(jq -r '.backup_date' $LATEST_BACKUP)"
    echo "Components:"
    jq -r '.components | to_entries[] | "  \(.key): \(.value.status) - \(.value.size)"' $LATEST_BACKUP
    echo

    # List all backup manifests
    info "All available backups:"
    find $BACKUP_DIR -name "backup_manifest_*.json" -type f -exec basename {} \; | sort
    echo
}

# Select backup to restore
select_backup() {
    if [ -z "$BACKUP_DATE" ]; then
        list_backups
        read -p "Enter backup date (format: YYYYMMDD_HHMMSS) or 'latest': " BACKUP_DATE
    fi

    if [ "$BACKUP_DATE" = "latest" ]; then
        MANIFEST_FILE=$(find $BACKUP_DIR -name "backup_manifest_*.json" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    else
        MANIFEST_FILE="$BACKUP_DIR/backup_manifest_${BACKUP_DATE}.json"
    fi

    if [ ! -f "$MANIFEST_FILE" ]; then
        error_exit "Backup manifest not found: $MANIFEST_FILE"
    fi

    info "Selected backup: $(basename $MANIFEST_FILE)"
    jq -r '.backup_date' $MANIFEST_FILE
}

# Stop services
stop_services() {
    info "Stopping services..."

    if docker-compose -f $COMPOSE_FILE down; then
        success "Services stopped successfully"
    else
        warning "Some services may not have stopped properly"
    fi

    # Wait for services to fully stop
    sleep 10
}

# Create restore directory
create_restore_dir() {
    info "Creating restore directory..."
    mkdir -p $RESTORE_DIR
    success "Restore directory created: $RESTORE_DIR"
}

# Restore database
restore_database() {
    info "Restoring database..."

    DB_BACKUP=$(jq -r '.components.database.file' $MANIFEST_FILE)
    DB_BACKUP_PATH="$BACKUP_DIR/$DB_BACKUP"

    if [ ! -f "$DB_BACKUP_PATH" ]; then
        error_exit "Database backup not found: $DB_BACKUP_PATH"
    fi

    # Copy backup to restore directory
    cp "$DB_BACKUP_PATH" $RESTORE_DIR/

    # Extract backup if compressed
    if [[ $DB_BACKUP == *.gz ]]; then
        info "Extracting database backup..."
        gunzip -c "$RESTORE_DIR/$(basename $DB_BACKUP)" > "$RESTORE_DIR/database.sql"
        DB_FILE="$RESTORE_DIR/database.sql"
    else
        DB_FILE="$RESTORE_DIR/$(basename $DB_BACKUP)"
    fi

    # Start database service only
    info "Starting database service..."
    docker-compose -f $COMPOSE_FILE up -d postgres

    # Wait for database to be ready
    info "Waiting for database to be ready..."
    for i in {1..30}; do
        if docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U $POSTGRES_USER > /dev/null 2>&1; then
            success "Database is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            error_exit "Database failed to start within 30 seconds"
        fi
        sleep 1
    done

    # Drop existing database
    info "Dropping existing database..."
    docker-compose -f $COMPOSE_FILE exec -T postgres psql -U $POSTGRES_USER -c "DROP DATABASE IF EXISTS $POSTGRES_DB;" || true

    # Create new database
    info "Creating new database..."
    docker-compose -f $COMPOSE_FILE exec -T postgres psql -U $POSTGRES_USER -c "CREATE DATABASE $POSTGRES_DB;"

    # Restore database
    info "Restoring database from backup..."
    if docker-compose -f $COMPOSE_FILE exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB < $DB_FILE; then
        success "Database restored successfully"
    else
        error_exit "Database restore failed"
    fi

    # Verify database
    info "Verifying database..."
    TABLE_COUNT=$(docker-compose -f $COMPOSE_FILE exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    if [ "$TABLE_COUNT" -gt 0 ]; then
        success "Database verification passed - $TABLE_COUNT tables found"
    else
        error_exit "Database verification failed - no tables found"
    fi
}

# Restore files
restore_files() {
    info "Restoring files..."

    FILES_BACKUP=$(jq -r '.components.files.file' $MANIFEST_FILE)
    FILES_BACKUP_PATH="$BACKUP_DIR/$FILES_BACKUP"

    if [ ! -f "$FILES_BACKUP_PATH" ]; then
        error_exit "Files backup not found: $FILES_BACKUP_PATH"
    fi

    # Backup existing files
    if [ -d "/opt/jobfinders/uploads" ]; then
        info "Backing up existing files..."
        mv /opt/jobfinders/uploads /opt/jobfinders/uploads.backup.$(date +%s)
    fi

    if [ -d "/opt/jobfinders/ssl" ]; then
        info "Backing up existing SSL certificates..."
        mv /opt/jobfinders/ssl /opt/jobfinders/ssl.backup.$(date +%s)
    fi

    # Extract files
    info "Extracting files..."
    if tar -xzf "$FILES_BACKUP_PATH" -C /opt/jobfinders/; then
        success "Files restored successfully"
    else
        error_exit "Files restore failed"
    fi

    # Set correct permissions
    chown -R root:root /opt/jobfinders/uploads
    chmod -R 755 /opt/jobfinders/uploads
    chown -R root:root /opt/jobfinders/ssl
    chmod -R 600 /opt/jobfinders/ssl/*
}

# Restore configurations
restore_configs() {
    info "Restoring configurations..."

    CONFIGS_BACKUP=$(jq -r '.components.configs.file' $MANIFEST_FILE)
    CONFIGS_BACKUP_PATH="$BACKUP_DIR/$CONFIGS_BACKUP"

    if [ ! -f "$CONFIGS_BACKUP_PATH" ]; then
        error_exit "Configuration backup not found: $CONFIGS_BACKUP_PATH"
    fi

    # Backup existing configurations
    if [ -f "/opt/jobfinders/.env.production" ]; then
        cp /opt/jobfinders/.env.production /opt/jobfinders/.env.production.backup.$(date +%s)
    fi

    if [ -f "$COMPOSE_FILE" ]; then
        cp $COMPOSE_FILE $COMPOSE_FILE.backup.$(date +%s)
    fi

    # Extract configurations
    info "Extracting configurations..."
    if tar -xzf "$CONFIGS_BACKUP_PATH" -C /opt/jobfinders/; then
        success "Configurations restored successfully"
    else
        error_exit "Configurations restore failed"
    fi

    # Set correct permissions
    chmod 600 /opt/jobfinders/.env.production
    chmod 644 $COMPOSE_FILE
}

# Run database migrations
run_migrations() {
    info "Running database migrations..."

    # Start application service
    docker-compose -f $COMPOSE_FILE up -d app

    # Wait for application to be ready
    info "Waiting for application to be ready..."
    for i in {1..60}; do
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            success "Application is ready"
            break
        fi
        if [ $i -eq 60 ]; then
            error_exit "Application failed to start within 60 seconds"
        fi
        sleep 1
    done

    # Run migrations
    if docker-compose -f $COMPOSE_FILE exec app npm run db:migrate; then
        success "Database migrations completed successfully"
    else
        warning "Database migrations may have failed - check logs"
    fi
}

# Start all services
start_services() {
    info "Starting all services..."

    if docker-compose -f $COMPOSE_FILE up -d; then
        success "All services started successfully"
    else
        error_exit "Failed to start services"
    fi

    # Wait for services to be ready
    info "Waiting for services to be ready..."
    sleep 30

    # Health check
    info "Performing health check..."
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        success "Health check passed"
    else
        error_exit "Health check failed"
    fi
}

# Verify restore
verify_restore() {
    info "Verifying restore..."

    # Check database
    DB_TABLES=$(docker-compose -f $COMPOSE_FILE exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    info "Database tables: $DB_TABLES"

    # Check application
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        success "Application is responding"
    else
        error_exit "Application is not responding"
    }

    # Check file uploads directory
    if [ -d "/opt/jobfinders/uploads" ]; then
        UPLOAD_SIZE=$(du -sh /opt/jobfinders/uploads | cut -f1)
        info "Upload directory size: $UPLOAD_SIZE"
    fi

    success "Restore verification completed"
}

# Cleanup
cleanup() {
    info "Cleaning up..."

    if [ -d "$RESTORE_DIR" ]; then
        rm -rf $RESTORE_DIR
        success "Temporary files cleaned up"
    fi
}

# Send notification
send_notification() {
    if [ ! -z "$RECOVERY_NOTIFICATION_WEBHOOK" ]; then
        info "Sending recovery notification..."

        PAYLOAD=$(cat << EOF
{
    "text": "🚨 JobFinders disaster recovery completed successfully",
    "attachments": [
        {
            "color": "good",
            "fields": [
                {
                    "title": "Recovery Date",
                    "value": "$(date)",
                    "short": true
                },
                {
                    "title": "Backup Used",
                    "value": "$(basename $MANIFEST_FILE)",
                    "short": true
                },
                {
                    "title": "Database Tables",
                    "value": "$DB_TABLES",
                    "short": true
                },
                {
                    "title": "Status",
                    "value": "✅ Fully Restored",
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
            "$RECOVERY_NOTIFICATION_WEBHOOK" > /dev/null 2>&1; then
            success "Recovery notification sent"
        else
            warning "Failed to send recovery notification"
        fi
    fi
}

# Main disaster recovery function
main() {
    log "🚨 Starting disaster recovery process..."

    check_prerequisites
    select_backup

    confirm "This will restore the system from backup: $(basename $MANIFEST_FILE)"
    confirm "All current data will be overwritten. Are you sure you want to continue?"

    stop_services
    create_restore_dir
    restore_database
    restore_files
    restore_configs
    run_migrations
    start_services
    verify_restore
    cleanup
    send_notification

    success "🎉 Disaster recovery completed successfully!"
    info "System has been restored from backup: $(basename $MANIFEST_FILE)"
    info "Please verify all functionality is working correctly."

    exit 0
}

# Handle script arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backup-date)
            BACKUP_DATE="$2"
            shift 2
            ;;
        --list)
            list_backups
            exit 0
            ;;
        --help)
            echo "Usage: $0 [--backup-date YYYYMMDD_HHMMSS] [--list] [--help]"
            echo "  --backup-date: Use specific backup date (default: latest)"
            echo "  --list: List available backups"
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