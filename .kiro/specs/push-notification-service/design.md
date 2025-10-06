# Push Notification Service - Design

## Architecture Overview

The Push Notification Service implements a multi-provider architecture supporting Firebase Cloud Messaging (FCM), Apple Push Notification Service (APNs), and Web Push API. The service provides device management, rich notification support, and comprehensive analytics while maintaining high performance and reliability.

## System Components

### 1. PushNotificationService (Core Service)
**Location:** `src/lib/push/push-notification-service.ts`

**Responsibilities:**
- Coordinate push notification delivery across multiple providers
- Handle device token management and validation
- Process rich notification content and deep links
- Manage delivery status tracking and analytics

**Key Methods:**
```typescript
class PushNotificationService {
  async sendPushNotification(pushData: PushNotificationData): Promise<PushDeliveryResult>
  async sendBulkPushNotifications(notifications: PushNotificationData[]): Promise<PushDeliveryResult[]>
  async registerDevice(deviceData: DeviceRegistrationData): Promise<void>
  async unregisterDevice(deviceToken: string): Promise<void>
  async updateDeviceToken(oldToken: string, newToken: string): Promise<void>
  async getDeliveryStatus(notificationId: string): Promise<DeliveryStatus>
}
```

### 2. Push Provider Adapters
**Location:** `src/lib/push/providers/`

**FCMProvider** (`fcm-provider.ts`):
- Firebase Cloud Messaging integration
- Android and iOS push notification support
- Topic-based messaging support
- Rich notification features

**APNsProvider** (`apns-provider.ts`):
- Apple Push Notification Service integration
- iOS-specific features (badge, sound, category)
- Certificate and token-based authentication
- Silent notification support

**WebPushProvider** (`web-push-provider.ts`):
- Web Push API integration
- VAPID key management
- Browser-specific notification handling
- Service worker integration

**Provider Interface:**
```typescript
interface PushProvider {
  name: string
  platform: 'ios' | 'android' | 'web'
  isAvailable(): Promise<boolean>
  sendNotification(notification: PushNotification): Promise<ProviderResult>
  validateToken(token: string): Promise<ValidationResult>
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>
}
```

### 3. Device Manager
**Location:** `src/lib/push/device-manager.ts`

**Responsibilities:**
- Manage device token registration and lifecycle
- Handle token refresh and expiration
- Track device metadata and preferences
- Clean up inactive devices

**Key Methods:**
```typescript
class DeviceManager {
  async registerDevice(deviceData: DeviceRegistrationData): Promise<Device>
  async updateDevice(deviceId: string, updates: Partial<DeviceData>): Promise<void>
  async getDevicesByUser(userId: string): Promise<Device[]>
  async validateDeviceToken(token: string, platform: string): Promise<boolean>
  async cleanupInactiveDevices(): Promise<void>
  async refreshDeviceToken(deviceId: string, newToken: string): Promise<void>
}
```

### 4. Rich Notification Builder
**Location:** `src/lib/push/notification-builder.ts`

**Responsibilities:**
- Build platform-specific notification payloads
- Handle rich content (images, actions, deep links)
- Optimize payload size for platform limits
- Generate platform-specific formatting

**Key Methods:**
```typescript
class NotificationBuilder {
  async buildForPlatform(notification: NotificationData, platform: string): Promise<PlatformNotification>
  async addRichContent(notification: NotificationData, media: MediaContent): Promise<NotificationData>
  async generateDeepLink(action: string, parameters: Record<string, any>): Promise<string>
  async optimizePayload(payload: any, platform: string): Promise<any>
}
```

### 5. Push Queue Processor
**Location:** `src/lib/push/push-queue-processor.ts`

**Responsibilities:**
- Process push notification jobs from message queue
- Handle priority-based processing
- Manage retry logic and dead letter queue
- Support scheduled notifications

**Key Methods:**
```typescript
class PushQueueProcessor {
  async processNotificationJob(job: PushNotificationJob): Promise<void>
  async processBulkNotifications(jobs: PushNotificationJob[]): Promise<void>
  async scheduleNotification(notification: PushNotificationData, scheduledAt: Date): Promise<void>
  async cancelScheduledNotification(notificationId: string): Promise<void>
}
```

## Data Models

### PushNotificationData Interface
```typescript
interface PushNotificationData {
  id: string
  userId: string
  deviceTokens?: string[]
  deviceIds?: string[]
  title: string
  body: string
  imageUrl?: string
  iconUrl?: string
  actions?: NotificationAction[]
  data?: Record<string, any>
  deepLink?: string
  badge?: number
  sound?: string
  priority: 'high' | 'normal' | 'low'
  ttl?: number
  scheduledAt?: Date
  campaignId?: string
  templateId?: string
  templateVariables?: Record<string, any>
}
```

### DeviceRegistrationData Interface
```typescript
interface DeviceRegistrationData {
  userId: string
  deviceToken: string
  platform: 'ios' | 'android' | 'web'
  deviceId?: string
  appVersion: string
  osVersion: string
  deviceModel?: string
  timezone?: string
  language?: string
  metadata?: Record<string, any>
}
```

### PushDeliveryResult Interface
```typescript
interface PushDeliveryResult {
  notificationId: string
  deviceResults: DeviceDeliveryResult[]
  totalSent: number
  totalDelivered: number
  totalFailed: number
  errors?: DeliveryError[]
}

interface DeviceDeliveryResult {
  deviceId: string
  deviceToken: string
  status: 'sent' | 'delivered' | 'failed' | 'invalid_token'
  providerId: string
  providerMessageId?: string
  errorCode?: string
  errorMessage?: string
  deliveredAt?: Date
}
```

### NotificationAction Interface
```typescript
interface NotificationAction {
  id: string
  title: string
  icon?: string
  action: 'open_app' | 'open_url' | 'custom'
  url?: string
  data?: Record<string, any>
}
```

## Database Schema Extensions

### Device Table
```sql
CREATE TABLE Device (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  deviceToken VARCHAR(500) NOT NULL,
  platform ENUM('ios', 'android', 'web') NOT NULL,
  deviceId VARCHAR(255),
  appVersion VARCHAR(50) NOT NULL,
  osVersion VARCHAR(50) NOT NULL,
  deviceModel VARCHAR(100),
  timezone VARCHAR(50),
  language VARCHAR(10),
  isActive BOOLEAN DEFAULT true,
  lastSeenAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  registeredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  metadata JSON,
  
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE KEY unique_device_token (deviceToken),
  INDEX idx_user_id (userId),
  INDEX idx_platform (platform),
  INDEX idx_active (isActive),
  INDEX idx_last_seen (lastSeenAt)
);
```

### Push Notification Delivery Log Table
```sql
CREATE TABLE PushDeliveryLog (
  id VARCHAR(36) PRIMARY KEY,
  notificationId VARCHAR(36) NOT NULL,
  deviceId VARCHAR(36) NOT NULL,
  deviceToken VARCHAR(500) NOT NULL,
  providerId VARCHAR(50) NOT NULL,
  providerMessageId VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  errorCode VARCHAR(50),
  errorMessage TEXT,
  sentAt TIMESTAMP,
  deliveredAt TIMESTAMP,
  openedAt TIMESTAMP,
  clickedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (notificationId) REFERENCES Notification(id),
  FOREIGN KEY (deviceId) REFERENCES Device(id),
  INDEX idx_notification_id (notificationId),
  INDEX idx_device_id (deviceId),
  INDEX idx_status (status),
  INDEX idx_sent_at (sentAt)
);
```

### Push Notification Template Table
```sql
CREATE TABLE PushNotificationTemplate (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  platform ENUM('ios', 'android', 'web', 'all') NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  imageUrl VARCHAR(500),
  iconUrl VARCHAR(500),
  actions JSON,
  data JSON,
  deepLinkTemplate VARCHAR(500),
  sound VARCHAR(100),
  badge INTEGER,
  priority ENUM('high', 'normal', 'low') DEFAULT 'normal',
  ttl INTEGER DEFAULT 86400,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_name (name),
  INDEX idx_platform (platform),
  INDEX idx_active (isActive)
);
```

## Configuration

### Environment Variables
```env
# Firebase Cloud Messaging
FCM_PROJECT_ID=your_project_id
FCM_PRIVATE_KEY_ID=your_private_key_id
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FCM_CLIENT_ID=your_client_id
FCM_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FCM_TOKEN_URI=https://oauth2.googleapis.com/token

# Apple Push Notification Service
APNS_KEY_ID=your_key_id
APNS_TEAM_ID=your_team_id
APNS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
APNS_BUNDLE_ID=com.yourapp.bundleid
APNS_ENVIRONMENT=sandbox # or production

# Web Push
WEB_PUSH_VAPID_PUBLIC_KEY=your_vapid_public_key
WEB_PUSH_VAPID_PRIVATE_KEY=your_vapid_private_key
WEB_PUSH_CONTACT_EMAIL=your-email@example.com

# Push Service Configuration
PUSH_DEFAULT_TTL=86400
PUSH_MAX_RETRIES=3
PUSH_RETRY_DELAY_MS=5000
PUSH_BATCH_SIZE=100
PUSH_CLEANUP_INACTIVE_DAYS=30
```

### Provider Configuration
```typescript
const PUSH_PROVIDER_CONFIG = {
  fcm: {
    name: 'Firebase Cloud Messaging',
    platforms: ['android', 'ios'],
    priority: 1,
    enabled: true,
    rateLimits: {
      messagesPerSecond: 100,
      messagesPerMinute: 6000
    }
  },
  apns: {
    name: 'Apple Push Notification Service',
    platforms: ['ios'],
    priority: 2,
    enabled: true,
    rateLimits: {
      messagesPerSecond: 50,
      messagesPerMinute: 3000
    }
  },
  webpush: {
    name: 'Web Push API',
    platforms: ['web'],
    priority: 1,
    enabled: true,
    rateLimits: {
      messagesPerSecond: 20,
      messagesPerMinute: 1200
    }
  }
};
```

## Integration Points

### 1. Message Queue Integration
- **Queue Name:** `push-notifications`
- **Message Format:** PushNotificationData interface
- **Processing:** Batch processing with platform grouping
- **Dead Letter Queue:** `push-notifications-dlq` for failed messages

### 2. Enhanced Notification Service Integration
```typescript
// Enhanced Notification Service integration
class EnhancedNotificationService {
  private pushService: PushNotificationService;
  
  async sendNotification(notification: NotificationData) {
    // ... existing logic
    
    if (channels.includes('push') && userPrefs.canReceivePush(notification.type)) {
      const devices = await this.deviceManager.getDevicesByUser(notification.userId);
      const activeDevices = devices.filter(d => d.isActive && userPrefs.isDeviceEnabled(d.id));
      
      if (activeDevices.length > 0) {
        const pushResult = await this.pushService.sendPushNotification({
          userId: notification.userId,
          deviceIds: activeDevices.map(d => d.id),
          title: notification.title,
          body: notification.message,
          templateId: notification.templateId,
          templateVariables: notification.data,
          priority: notification.priority,
          deepLink: this.generateDeepLink(notification.type, notification.data)
        });
        
        await this.updateNotificationStatus(notification.id, 'push', pushResult.totalSent > 0 ? 'sent' : 'failed');
      }
    }
  }
}
```

### 3. User Preferences Integration
```typescript
// Extend NotificationPreferencesManager
class NotificationPreferencesManager {
  async canReceivePush(userId: string, notificationType: string): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    return preferences.pushEnabled && preferences[`${notificationType}Push`];
  }
  
  async isDeviceEnabled(deviceId: string): Promise<boolean> {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { user: { include: { notificationPreferences: true } } }
    });
    
    if (!device || !device.isActive) return false;
    
    const preferences = device.user.notificationPreferences;
    return preferences?.pushEnabled && !this.isInQuietHours(preferences, device.timezone);
  }
}
```

## Platform-Specific Implementation

### 1. iOS (APNs) Implementation
```typescript
class APNsProvider implements PushProvider {
  async sendNotification(notification: PushNotification): Promise<ProviderResult> {
    const payload = {
      aps: {
        alert: {
          title: notification.title,
          body: notification.body
        },
        badge: notification.badge,
        sound: notification.sound || 'default',
        category: notification.category,
        'thread-id': notification.threadId
      },
      data: notification.data,
      deepLink: notification.deepLink
    };
    
    // Send via APNs HTTP/2 API
    return await this.sendToAPNs(notification.deviceToken, payload);
  }
}
```

### 2. Android (FCM) Implementation
```typescript
class FCMProvider implements PushProvider {
  async sendNotification(notification: PushNotification): Promise<ProviderResult> {
    const message = {
      token: notification.deviceToken,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl
      },
      data: {
        ...notification.data,
        deepLink: notification.deepLink
      },
      android: {
        priority: notification.priority === 'high' ? 'high' : 'normal',
        notification: {
          channelId: this.getChannelId(notification.type),
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      }
    };
    
    return await this.admin.messaging().send(message);
  }
}
```

### 3. Web Push Implementation
```typescript
class WebPushProvider implements PushProvider {
  async sendNotification(notification: PushNotification): Promise<ProviderResult> {
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.iconUrl,
      image: notification.imageUrl,
      badge: notification.badgeUrl,
      actions: notification.actions,
      data: {
        ...notification.data,
        deepLink: notification.deepLink
      },
      requireInteraction: notification.priority === 'high',
      ttl: notification.ttl
    });
    
    return await webpush.sendNotification(
      {
        endpoint: notification.endpoint,
        keys: notification.keys
      },
      payload,
      {
        vapidDetails: {
          subject: process.env.WEB_PUSH_CONTACT_EMAIL,
          publicKey: process.env.WEB_PUSH_VAPID_PUBLIC_KEY,
          privateKey: process.env.WEB_PUSH_VAPID_PRIVATE_KEY
        }
      }
    );
  }
}
```

## Error Handling Strategy

### 1. Token Management Errors
- **Invalid Token:** Remove from database and notify device to re-register
- **Expired Token:** Attempt refresh if refresh token available
- **Duplicate Token:** Update existing record with new device information

### 2. Provider Failures
- **Rate Limiting:** Queue messages and retry with exponential backoff
- **Service Unavailable:** Failover to alternative provider if available
- **Authentication Errors:** Alert administrators and disable provider

### 3. Delivery Failures
- **Network Errors:** Retry with exponential backoff up to max attempts
- **Payload Too Large:** Optimize payload and retry
- **Invalid Payload:** Log error and move to dead letter queue

## Security Considerations

### 1. Data Protection
- **Device Token Encryption:** Encrypt device tokens at rest using AES-256
- **Payload Security:** Avoid sensitive data in push payloads
- **Deep Link Validation:** Validate and sanitize deep link parameters

### 2. Authentication and Authorization
- **Device Registration:** Require user authentication for device registration
- **API Security:** Secure provider API keys and certificates
- **Token Validation:** Validate device tokens before sending notifications

### 3. Privacy Compliance
- **User Consent:** Verify user consent before device registration
- **Data Retention:** Implement data retention policies for device data
- **Right to Deletion:** Support GDPR deletion requests for device data

## Performance Optimization

### 1. Batching and Queuing
- **Batch Processing:** Group notifications by provider and platform
- **Queue Management:** Use priority queues for time-sensitive notifications
- **Load Balancing:** Distribute load across multiple worker processes

### 2. Caching Strategy
- **Device Cache:** Cache active device tokens for frequent users
- **Template Cache:** Cache rendered notification templates
- **Provider Status:** Cache provider availability status

### 3. Monitoring and Metrics
- **Delivery Metrics:** Track delivery rates, latency, and errors
- **Provider Performance:** Monitor provider response times and success rates
- **Queue Health:** Monitor queue depth and processing times