# SMS Notification Service - Design

## Architecture Overview

The SMS Notification Service follows a provider-agnostic architecture that supports multiple SMS providers with automatic failover capabilities. The service integrates with the existing notification system through a queue-based approach for scalability and reliability.

## System Components

### 1. SMSService (Core Service)
**Location:** `src/lib/sms/sms-service.ts`

**Responsibilities:**
- Coordinate SMS delivery across multiple providers
- Handle provider selection and failover logic
- Manage delivery status tracking
- Process SMS templates with dynamic content

**Key Methods:**
```typescript
class SMSService {
  async sendSMS(smsData: SMSData): Promise<SMSDeliveryResult>
  async sendBulkSMS(messages: SMSData[]): Promise<SMSDeliveryResult[]>
  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus>
  async processOptOut(phoneNumber: string, keyword: string): Promise<void>
}
```

### 2. SMS Provider Adapters
**Location:** `src/lib/sms/providers/`

**TwilioProvider** (`twilio-provider.ts`):
- Primary SMS provider implementation
- Handles Twilio API integration
- Manages Twilio-specific error codes and responses

**AWSSNSProvider** (`aws-sns-provider.ts`):
- Backup SMS provider implementation
- AWS SNS integration for SMS delivery
- Cost-effective option for bulk messaging

**Provider Interface:**
```typescript
interface SMSProvider {
  name: string
  isAvailable(): Promise<boolean>
  sendSMS(message: SMSMessage): Promise<ProviderResult>
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>
  validatePhoneNumber(phoneNumber: string): Promise<ValidationResult>
}
```

### 3. Phone Number Validator
**Location:** `src/lib/sms/phone-validator.ts`

**Responsibilities:**
- Validate international phone number formats
- Perform carrier lookup for number verification
- Normalize phone numbers to E.164 format
- Cache validation results for performance

**Key Methods:**
```typescript
class PhoneValidator {
  async validatePhoneNumber(phoneNumber: string, countryCode?: string): Promise<ValidationResult>
  async normalizePhoneNumber(phoneNumber: string): Promise<string>
  async getCarrierInfo(phoneNumber: string): Promise<CarrierInfo>
}
```

### 4. SMS Template Manager
**Location:** `src/lib/sms/sms-template-manager.ts`

**Responsibilities:**
- Manage SMS-specific templates
- Handle character count optimization
- Process template variables
- Support for multi-part messages

**Key Methods:**
```typescript
class SMSTemplateManager {
  async renderTemplate(templateId: string, variables: Record<string, any>): Promise<string>
  async optimizeForSMS(content: string): Promise<string>
  async splitLongMessage(content: string): Promise<string[]>
}
```

### 5. SMS Queue Processor
**Location:** `src/lib/sms/sms-queue-processor.ts`

**Responsibilities:**
- Process SMS jobs from message queue
- Handle priority-based processing
- Manage retry logic and dead letter queue
- Support bulk SMS campaigns

## Data Models

### SMSData Interface
```typescript
interface SMSData {
  id: string
  userId: string
  phoneNumber: string
  message: string
  templateId?: string
  templateVariables?: Record<string, any>
  priority: 'high' | 'medium' | 'low'
  scheduledAt?: Date
  campaignId?: string
  metadata?: Record<string, any>
}
```

### SMSDeliveryResult Interface
```typescript
interface SMSDeliveryResult {
  messageId: string
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  providerId: string
  cost?: number
  errorCode?: string
  errorMessage?: string
  deliveredAt?: Date
  segments: number
}
```

### SMSProvider Configuration
```typescript
interface SMSProviderConfig {
  name: string
  apiKey: string
  apiSecret?: string
  region?: string
  priority: number
  enabled: boolean
  rateLimits: {
    messagesPerSecond: number
    messagesPerMinute: number
    messagesPerHour: number
  }
}
```

## Database Schema Extensions

### SMS-Specific Fields in Notification Table
```sql
-- Add SMS-specific columns to existing Notification table
ALTER TABLE Notification ADD COLUMN smsMessageId VARCHAR(255);
ALTER TABLE Notification ADD COLUMN smsSegments INTEGER DEFAULT 1;
ALTER TABLE Notification ADD COLUMN smsCost DECIMAL(10,4);
ALTER TABLE Notification ADD COLUMN smsProvider VARCHAR(50);
```

### SMS Delivery Log Table
```sql
CREATE TABLE SMSDeliveryLog (
  id VARCHAR(36) PRIMARY KEY,
  notificationId VARCHAR(36) NOT NULL,
  phoneNumber VARCHAR(20) NOT NULL,
  providerId VARCHAR(50) NOT NULL,
  providerMessageId VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  segments INTEGER DEFAULT 1,
  cost DECIMAL(10,4),
  errorCode VARCHAR(50),
  errorMessage TEXT,
  sentAt TIMESTAMP,
  deliveredAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (notificationId) REFERENCES Notification(id),
  INDEX idx_phone_number (phoneNumber),
  INDEX idx_provider_message_id (providerMessageId),
  INDEX idx_status (status),
  INDEX idx_sent_at (sentAt)
);
```

### SMS Opt-Out Table
```sql
CREATE TABLE SMSOptOut (
  id VARCHAR(36) PRIMARY KEY,
  phoneNumber VARCHAR(20) NOT NULL UNIQUE,
  userId VARCHAR(36),
  optOutKeyword VARCHAR(20),
  optOutAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(50) DEFAULT 'user_request',
  
  FOREIGN KEY (userId) REFERENCES User(id),
  INDEX idx_phone_number (phoneNumber),
  INDEX idx_user_id (userId)
);
```

## Configuration

### Environment Variables
```env
# Primary SMS Provider (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Backup SMS Provider (AWS SNS)
AWS_SNS_ACCESS_KEY_ID=your_access_key
AWS_SNS_SECRET_ACCESS_KEY=your_secret_key
AWS_SNS_REGION=us-east-1

# SMS Service Configuration
SMS_DEFAULT_PROVIDER=twilio
SMS_ENABLE_FAILOVER=true
SMS_MAX_RETRIES=3
SMS_RETRY_DELAY_MS=5000

# Phone Validation
PHONE_VALIDATION_PROVIDER=twilio_lookup
PHONE_VALIDATION_CACHE_TTL=3600
```

### Provider Priority Configuration
```typescript
const SMS_PROVIDER_CONFIG: SMSProviderConfig[] = [
  {
    name: 'twilio',
    priority: 1,
    enabled: true,
    rateLimits: {
      messagesPerSecond: 10,
      messagesPerMinute: 600,
      messagesPerHour: 36000
    }
  },
  {
    name: 'aws-sns',
    priority: 2,
    enabled: true,
    rateLimits: {
      messagesPerSecond: 5,
      messagesPerMinute: 300,
      messagesPerHour: 18000
    }
  }
];
```

## Integration Points

### 1. Message Queue Integration
- **Queue Name:** `sms-notifications`
- **Message Format:** SMSData interface
- **Processing:** Batch processing with configurable batch size
- **Dead Letter Queue:** `sms-notifications-dlq` for failed messages

### 2. Notification Service Integration
```typescript
// Enhanced Notification Service integration
class EnhancedNotificationService {
  private smsService: SMSService;
  
  async sendNotification(notification: NotificationData) {
    // ... existing logic
    
    if (channels.includes('sms') && userPrefs.canReceiveSMS(notification.type)) {
      const smsResult = await this.smsService.sendSMS({
        userId: notification.userId,
        phoneNumber: userPrefs.phoneNumber,
        templateId: notification.templateId,
        templateVariables: notification.data,
        priority: notification.priority
      });
      
      await this.updateNotificationStatus(notification.id, 'sms', smsResult.status);
    }
  }
}
```

### 3. User Preferences Integration
```typescript
// Extend NotificationPreferencesManager
class NotificationPreferencesManager {
  async canReceiveSMS(userId: string, notificationType: string): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    
    // Check if SMS is enabled and user hasn't opted out
    return preferences.smsEnabled && 
           preferences[`${notificationType}SMS`] && 
           !await this.isPhoneOptedOut(preferences.phoneNumber);
  }
  
  async isPhoneOptedOut(phoneNumber: string): Promise<boolean> {
    // Check SMS opt-out table
    const optOut = await prisma.sMSOptOut.findUnique({
      where: { phoneNumber }
    });
    return !!optOut;
  }
}
```

## Error Handling Strategy

### 1. Provider Failures
- **Primary Provider Down:** Automatic failover to backup provider
- **Rate Limiting:** Queue messages and retry with exponential backoff
- **Invalid Credentials:** Alert administrators and disable provider

### 2. Message Failures
- **Invalid Phone Number:** Reject immediately with validation error
- **Delivery Failure:** Retry up to 3 times with increasing delays
- **Permanent Failure:** Move to dead letter queue and notify administrators

### 3. Opt-Out Handling
- **STOP Keywords:** Process immediately and update preferences
- **Invalid Opt-Out:** Log and continue processing
- **Duplicate Opt-Out:** Acknowledge but don't duplicate records

## Security Considerations

### 1. Data Protection
- **Phone Number Encryption:** Encrypt phone numbers at rest using AES-256
- **PII Handling:** Minimize SMS content to avoid exposing sensitive data
- **Audit Logging:** Log all SMS activities for compliance

### 2. Access Control
- **API Key Management:** Store provider credentials in secure vault
- **Service Authentication:** Use service-to-service authentication
- **Rate Limiting:** Implement per-user and global rate limits

### 3. Compliance
- **TCPA Compliance:** Verify consent before sending promotional SMS
- **GDPR Compliance:** Support data deletion and export requests
- **Carrier Compliance:** Follow carrier-specific guidelines and restrictions

## Performance Optimization

### 1. Caching Strategy
- **Phone Validation:** Cache validation results for 1 hour
- **Template Rendering:** Cache rendered templates for common variables
- **Provider Status:** Cache provider availability status

### 2. Batch Processing
- **Bulk SMS:** Process multiple messages in single API calls
- **Queue Batching:** Process queue messages in configurable batches
- **Database Batching:** Batch database updates for delivery status

### 3. Monitoring and Alerting
- **Delivery Metrics:** Track success rates, latency, and costs
- **Provider Health:** Monitor provider API response times
- **Queue Depth:** Alert on queue backlog and processing delays