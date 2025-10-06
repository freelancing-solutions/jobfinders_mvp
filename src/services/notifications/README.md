# JobFinders Notification Service

A comprehensive, scalable notification service supporting multiple channels (Email, SMS, Push, In-App) with real-time delivery, analytics, and monitoring.

## 🚀 Features

### Multi-Channel Support
- **Email**: Powered by Resend with template support and tracking
- **SMS**: Twilio integration with delivery confirmations
- **Push Notifications**: Firebase (Android) and APNs (iOS) support
- **In-App**: Real-time WebSocket delivery with offline storage

### Advanced Capabilities
- **Template System**: Dynamic content with variable substitution
- **Bulk Operations**: Efficient batch processing for large campaigns
- **Scheduling**: Send notifications at specific times
- **Rate Limiting**: Prevent spam and respect provider limits
- **Analytics**: Comprehensive delivery and engagement tracking
- **Webhooks**: Real-time delivery status updates
- **Retry Logic**: Automatic retry with exponential backoff
- **Health Monitoring**: System health checks and alerting

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (optional)

## 🛠️ Installation

### 1. Clone and Setup

```bash
# Navigate to notification service directory
cd src/services/notifications

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your actual values:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/jobfinders_notifications

# Redis
REDIS_URL=redis://localhost:6379

# Email (Resend)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@jobfinders.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Push (Firebase)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# JWT
JWT_SECRET=your-super-secret-jwt-key
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run migrate

# Setup initial data (templates, preferences, etc.)
npm run setup
```

### 4. Start the Service

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Start all services (notification service, Redis, PostgreSQL, monitoring)
npm run docker:run

# Stop all services
npm run docker:down
```

### Manual Docker Build

```bash
# Build Docker image
npm run docker:build

# Run container
docker run -p 3001:3001 --env-file .env jobfinders/notification-service
```

## 📚 API Documentation

### Authentication

All API endpoints require authentication via JWT token:

```bash
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Send Single Notification

```bash
POST /api/notifications/send
Content-Type: application/json

{
  "userId": "user-uuid",
  "type": "welcome_email",
  "channel": "email",
  "priority": "medium",
  "data": {
    "user_name": "John Doe",
    "app_name": "JobFinders"
  }
}
```

#### Send Bulk Notifications

```bash
POST /api/notifications/bulk
Content-Type: application/json

{
  "notifications": [
    {
      "userId": "user-1",
      "type": "job_alert",
      "channel": "email",
      "data": { "job_count": 5 }
    },
    {
      "userId": "user-2",
      "type": "job_alert",
      "channel": "push",
      "data": { "job_title": "Software Engineer" }
    }
  ]
}
```

#### Get Notification Status

```bash
GET /api/notifications/:id/status
```

#### User Notifications (In-App)

```bash
GET /api/notifications/user/:userId?page=1&limit=20
```

#### Analytics

```bash
GET /api/analytics/delivery?startDate=2024-01-01&endDate=2024-01-31
GET /api/analytics/engagement?channel=email
GET /api/analytics/performance
```

### Template Management

#### Create Template

```bash
POST /api/templates
Content-Type: application/json

{
  "name": "custom_email",
  "channel": "email",
  "subject": "Welcome {{user_name}}!",
  "content": "<h1>Hello {{user_name}}</h1><p>Welcome to {{app_name}}!</p>",
  "variables": ["user_name", "app_name"]
}
```

#### Update Template

```bash
PUT /api/templates/:id
```

#### Get Templates

```bash
GET /api/templates?channel=email&active=true
```

## 🔌 WebSocket Integration

### Connect to WebSocket

```javascript
import io from 'socket.io-client'

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
})

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification)
})

// Mark notification as read
socket.emit('notification:read', { notificationId: 'uuid' })

// Get user notifications
socket.emit('notifications:get', { page: 1, limit: 20 })
```

## 📊 Monitoring & Health Checks

### Health Check Endpoint

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "components": {
    "database": "healthy",
    "redis": "healthy",
    "email_service": "healthy",
    "sms_service": "healthy"
  }
}
```

### Metrics

The service exposes Prometheus metrics at `/metrics`:

- `notification_sent_total`: Total notifications sent by channel
- `notification_delivery_duration`: Delivery time histogram
- `notification_failure_total`: Failed notifications by reason
- `queue_size`: Current queue size
- `active_websocket_connections`: Active WebSocket connections

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Integration tests
npm run test:integration
```

### Load Testing

```bash
# Install Artillery globally
npm install -g artillery

# Run load test
npm run load-test
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Service port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `QUEUE_CONCURRENCY` | Queue processing concurrency | `5` |
| `BATCH_SIZE` | Default batch size | `50` |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit per window | `100` |

### Rate Limiting

Default rate limits:
- Email: 10 per user per hour
- SMS: 5 per user per day
- Push: 20 per user per hour
- Global email: 100 per minute

### Queue Configuration

- **Concurrency**: 5 jobs processed simultaneously
- **Retry**: 3 attempts with exponential backoff
- **Cleanup**: Keep last 100 completed, 50 failed jobs

## 🚨 Alerting

The service monitors key metrics and sends alerts when:

- Delivery failure rate > 10%
- Queue backlog > 1000 items
- System health degraded
- Average delivery latency > 30 seconds
- Email bounce rate > 5%

Alerts can be sent via:
- Email
- Slack webhook
- PagerDuty
- Custom webhooks

## 📈 Analytics & Reporting

### Available Metrics

- **Delivery Metrics**: Sent, delivered, failed, bounced
- **Engagement Metrics**: Opens, clicks, unsubscribes
- **Performance Metrics**: Latency, throughput, error rates
- **User Metrics**: Active users, preferences, engagement

### Data Retention

- Raw events: 90 days
- Daily aggregates: 2 years
- Monthly aggregates: 5 years

## 🔐 Security

### Authentication & Authorization

- JWT-based authentication
- Role-based access control
- API key support for webhooks
- Service-to-service authentication

### Data Protection

- Encryption at rest for sensitive data
- TLS encryption in transit
- Webhook signature verification
- Rate limiting and DDoS protection

### Privacy

- User preference management
- Unsubscribe handling
- Data retention policies
- GDPR compliance features

## 🛠️ Development

### Project Structure

```
src/
├── channels/           # Notification channel implementations
├── config/            # Configuration and environment setup
├── middleware/        # Express middleware (auth, validation, rate limiting)
├── monitoring/        # Health checks and alerting
├── routes/           # API route definitions
├── scripts/          # Setup and migration scripts
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── websocket/        # WebSocket handlers
├── __tests__/        # Test files
└── index.ts          # Main application entry point
```

### Adding New Channels

1. Create channel service in `src/channels/`
2. Implement `NotificationChannel` interface
3. Register in `ChannelOrchestrator`
4. Add configuration options
5. Write tests

### Database Migrations

```bash
# Create new migration
npm run migrate:create -- --name add_new_feature

# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Check migration status
npm run migrate:status
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards

- TypeScript strict mode
- ESLint + Prettier formatting
- 80%+ test coverage
- Comprehensive error handling
- Detailed logging

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/jobfinders/mvp/wiki)
- **Issues**: [GitHub Issues](https://github.com/jobfinders/mvp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jobfinders/mvp/discussions)
- **Email**: support@jobfinders.com

## 🗺️ Roadmap

- [ ] WhatsApp Business API integration
- [ ] Advanced A/B testing for templates
- [ ] Machine learning for send time optimization
- [ ] Multi-tenant support
- [ ] Advanced analytics dashboard
- [ ] Integration with more email providers
- [ ] Voice notification support
- [ ] Advanced template editor UI