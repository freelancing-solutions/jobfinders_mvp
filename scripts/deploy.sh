#!/bin/bash

set -e

echo "🚀 Starting production deployment..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "❌ .env.production file not found"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi

# Create necessary directories
mkdir -p logs uploads backups ssl

# Backup current database
echo "📦 Creating database backup..."
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build and deploy new version
echo "🔨 Building new Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm app npm run db:migrate

# Start services
echo "▶️ Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Run health checks
echo "🏥 Running health checks..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy"
else
    echo "❌ Application health check failed"
    exit 1
fi

if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Monitoring is healthy"
else
    echo "❌ Monitoring health check failed"
    exit 1
fi

# Clean up old Docker images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

# Log deployment
echo "📝 Logging deployment..."
echo "$(date): Deployment completed successfully" >> logs/deployments.log

echo "🎉 Deployment completed successfully!"
echo "📊 Monitoring dashboard: https://your-grafana-url.com"
echo "🔍 Application logs: docker-compose -f docker-compose.prod.yml logs -f app"