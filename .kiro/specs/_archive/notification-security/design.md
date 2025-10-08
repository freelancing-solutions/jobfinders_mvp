# Notification Security - Design Specification

## Architecture Overview

The Notification Security system implements a comprehensive security framework that protects the entire notification infrastructure through layered security controls, encryption, access management, and compliance enforcement. The design follows zero-trust principles with defense-in-depth strategies.

### Core Design Principles
- **Zero Trust Architecture:** Never trust, always verify
- **Defense in Depth:** Multiple layers of security controls
- **Least Privilege:** Minimal access rights for users and services
- **Data Protection by Design:** Security built into every component
- **Compliance by Default:** Automatic compliance with regulations
- **Fail Secure:** System fails to a secure state

## System Components

### 1. SecurityManager (Central Security Service)
**Purpose:** Central coordination of all security policies and enforcement

**Key Responsibilities:**
- Coordinate security policies across all notification services
- Manage security configurations and policy updates
- Provide centralized security decision making
- Monitor security events and coordinate responses
- Integrate with external security systems and SIEM

**Key Methods:**
```typescript
interface SecurityManager {
  enforcePolicy(resource: string, action: string, context: SecurityContext): Promise<boolean>
  validateAccess(user: User, resource: Resource, operation: Operation): Promise<AccessResult>
  logSecurityEvent(event: SecurityEvent): Promise<void>
  updateSecurityPolicy(policy: SecurityPolicy): Promise<void>
  getSecurityStatus(): Promise<SecurityStatus>
}
```

### 2. EncryptionService
**Purpose:** Handles all encryption and decryption operations for notification data

**Key Responsibilities:**
- Encrypt sensitive data at rest and in transit
- Manage encryption keys and key rotation
- Provide field-level encryption for PII data
- Handle secure key derivation and storage
- Support multiple encryption algorithms and key sizes

**Encryption Features:**
- **AES-256-GCM:** For data at rest encryption
- **ChaCha20-Poly1305:** For high-performance encryption
- **RSA-4096:** For key exchange and digital signatures
- **ECDH:** For perfect forward secrecy
- **PBKDF2/Argon2:** For password-based key derivation

**Key Methods:**
```typescript
interface EncryptionService {
  encryptData(data: any, keyId: string, context?: EncryptionContext): Promise<EncryptedData>
  decryptData(encryptedData: EncryptedData, keyId: string): Promise<any>
  generateDataKey(keyId: string): Promise<DataKey>
  rotateKey(keyId: string): Promise<void>
  encryptField(value: string, fieldType: FieldType): Promise<string>
}
```

### 3. AccessControlManager
**Purpose:** Manages authentication, authorization, and access control policies

**Key Responsibilities:**
- Implement role-based access control (RBAC)
- Handle user authentication and session management
- Enforce API access controls and rate limiting
- Manage service-to-service authentication
- Provide fine-grained permission management

**Access Control Features:**
- **Multi-Factor Authentication (MFA):** Support for TOTP, SMS, and hardware tokens
- **Single Sign-On (SSO):** Integration with enterprise identity providers
- **API Key Management:** Secure generation, rotation, and revocation
- **Session Management:** Secure session handling with timeout controls
- **Permission Inheritance:** Hierarchical permission structures

**Key Methods:**
```typescript
interface AccessControlManager {
  authenticate(credentials: Credentials): Promise<AuthenticationResult>
  authorize(user: User, resource: string, action: string): Promise<boolean>
  createRole(role: Role): Promise<void>
  assignPermission(roleId: string, permission: Permission): Promise<void>
  validateApiKey(apiKey: string): Promise<ApiKeyValidation>
}
```

### 4. ConsentManager
**Purpose:** Manages user consent and privacy preferences across all notification channels

**Key Responsibilities:**
- Track user consent for different notification types
- Enforce opt-in/opt-out preferences
- Handle consent withdrawal and data deletion
- Maintain consent audit trails
- Support granular consent management

**Consent Features:**
- **Channel-Specific Consent:** Separate consent for email, SMS, push notifications
- **Purpose-Based Consent:** Consent for marketing, transactional, security notifications
- **Consent Versioning:** Track consent changes over time
- **Legal Basis Tracking:** GDPR legal basis documentation
- **Consent Proof:** Cryptographic proof of consent collection

**Key Methods:**
```typescript
interface ConsentManager {
  recordConsent(userId: string, consentData: ConsentData): Promise<void>
  checkConsent(userId: string, channel: Channel, purpose: Purpose): Promise<boolean>
  withdrawConsent(userId: string, consentId: string): Promise<void>
  getConsentHistory(userId: string): Promise<ConsentHistory[]>
  enforceDataRetention(): Promise<void>
}
```

### 5. AuditLogger
**Purpose:** Provides comprehensive audit logging and compliance reporting

**Key Responsibilities:**
- Log all security-relevant events and operations
- Generate compliance reports and audit trails
- Support forensic analysis and incident investigation
- Integrate with external SIEM and logging systems
- Provide real-time security event streaming

**Audit Features:**
- **Structured Logging:** JSON-formatted logs with consistent schema
- **Event Correlation:** Link related security events across services
- **Tamper-Proof Logging:** Cryptographic integrity protection
- **Long-Term Retention:** Secure archival of audit logs
- **Real-Time Streaming:** Live security event feeds

**Key Methods:**
```typescript
interface AuditLogger {
  logEvent(event: AuditEvent): Promise<void>
  queryEvents(criteria: QueryCriteria): Promise<AuditEvent[]>
  generateReport(reportType: ReportType, period: TimePeriod): Promise<Report>
  streamEvents(filter: EventFilter): AsyncIterable<AuditEvent>
  verifyIntegrity(logId: string): Promise<boolean>
}
```

### 6. ThreatDetector
**Purpose:** Monitors for security threats and anomalous behavior

**Key Responsibilities:**
- Detect unusual access patterns and potential threats
- Implement rate limiting and DDoS protection
- Monitor for injection attacks and malicious input
- Provide real-time threat intelligence integration
- Coordinate automated threat response

**Threat Detection Features:**
- **Behavioral Analysis:** Machine learning-based anomaly detection
- **Signature-Based Detection:** Known attack pattern recognition
- **Rate Limiting:** Adaptive rate limiting based on threat levels
- **Geolocation Analysis:** Unusual location-based access detection
- **Device Fingerprinting:** Device-based authentication and tracking

**Key Methods:**
```typescript
interface ThreatDetector {
  analyzeRequest(request: Request): Promise<ThreatAssessment>
  detectAnomaly(user: User, activity: Activity): Promise<AnomalyResult>
  updateThreatIntelligence(intelligence: ThreatIntelligence): Promise<void>
  blockThreat(threatId: string, duration: number): Promise<void>
  generateThreatReport(): Promise<ThreatReport>
}
```

### 7. ComplianceEngine
**Purpose:** Ensures compliance with data protection regulations and industry standards

**Key Responsibilities:**
- Enforce GDPR, CCPA, and other privacy regulations
- Manage data retention and deletion policies
- Generate compliance reports and certifications
- Handle data subject rights requests
- Maintain compliance documentation

**Compliance Features:**
- **Regulation Templates:** Pre-configured compliance rules for major regulations
- **Data Mapping:** Automatic data flow mapping and classification
- **Rights Management:** Automated handling of data subject rights
- **Breach Notification:** Automated breach detection and notification
- **Compliance Monitoring:** Continuous compliance status monitoring

**Key Methods:**
```typescript
interface ComplianceEngine {
  checkCompliance(operation: Operation, data: Data): Promise<ComplianceResult>
  handleDataSubjectRequest(request: DataSubjectRequest): Promise<void>
  enforceRetentionPolicy(policy: RetentionPolicy): Promise<void>
  generateComplianceReport(regulation: Regulation): Promise<ComplianceReport>
  notifyBreach(breach: DataBreach): Promise<void>
}
```

## Data Models

### SecurityContext
```typescript
interface SecurityContext {
  userId?: string
  sessionId: string
  ipAddress: string
  userAgent: string
  timestamp: Date
  requestId: string
  serviceId: string
  resource: string
  action: string
  riskScore: number
  deviceFingerprint?: string
  geolocation?: Geolocation
}
```

### EncryptedData
```typescript
interface EncryptedData {
  ciphertext: string
  algorithm: string
  keyId: string
  iv: string
  authTag: string
  metadata: EncryptionMetadata
  version: number
  createdAt: Date
}

interface EncryptionMetadata {
  keyVersion: number
  encryptionContext: Record<string, string>
  dataClassification: DataClassification
  retentionPolicy: string
}
```

### ConsentData
```typescript
interface ConsentData {
  userId: string
  channel: NotificationChannel
  purpose: ConsentPurpose
  granted: boolean
  timestamp: Date
  version: string
  legalBasis: LegalBasis
  source: ConsentSource
  proof: ConsentProof
  expiresAt?: Date
}

interface ConsentProof {
  method: 'checkbox' | 'double_opt_in' | 'verbal' | 'written'
  evidence: string
  ipAddress: string
  userAgent: string
  signature?: string
}
```

### AuditEvent
```typescript
interface AuditEvent {
  id: string
  timestamp: Date
  eventType: AuditEventType
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  sessionId?: string
  serviceId: string
  resource: string
  action: string
  outcome: 'success' | 'failure' | 'error'
  details: Record<string, any>
  ipAddress: string
  userAgent?: string
  correlationId?: string
  hash: string
}
```

## Database Schema Extensions

### security_policies
```sql
CREATE TABLE security_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  rules JSONB NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

CREATE INDEX idx_security_policies_type ON security_policies(type);
CREATE INDEX idx_security_policies_status ON security_policies(status);
```

### encryption_keys
```sql
CREATE TABLE encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id VARCHAR(255) NOT NULL UNIQUE,
  algorithm VARCHAR(50) NOT NULL,
  key_size INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  rotated_at TIMESTAMP,
  expires_at TIMESTAMP,
  metadata JSONB
);

CREATE INDEX idx_encryption_keys_status ON encryption_keys(status);
CREATE INDEX idx_encryption_keys_expires_at ON encryption_keys(expires_at);
```

### user_consents
```sql
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel VARCHAR(50) NOT NULL,
  purpose VARCHAR(100) NOT NULL,
  granted BOOLEAN NOT NULL,
  legal_basis VARCHAR(50) NOT NULL,
  consent_version VARCHAR(20) NOT NULL,
  proof JSONB NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  withdrawn_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_channel_purpose ON user_consents(channel, purpose);
CREATE UNIQUE INDEX idx_user_consents_active 
ON user_consents(user_id, channel, purpose) 
WHERE withdrawn_at IS NULL;
```

### audit_events
```sql
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  user_id UUID,
  session_id VARCHAR(255),
  service_id VARCHAR(100) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  outcome VARCHAR(20) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  correlation_id VARCHAR(255),
  event_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_events_timestamp ON audit_events(created_at);
CREATE INDEX idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX idx_audit_events_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_severity ON audit_events(severity);
```

### security_incidents
```sql
CREATE TABLE security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  affected_users INTEGER DEFAULT 0,
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  assigned_to UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_security_incidents_status ON security_incidents(status);
CREATE INDEX idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_security_incidents_detected_at ON security_incidents(detected_at);
```

### threat_intelligence
```sql
CREATE TABLE threat_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_type VARCHAR(100) NOT NULL,
  indicator_type VARCHAR(50) NOT NULL,
  indicator_value VARCHAR(255) NOT NULL,
  confidence_level INTEGER NOT NULL CHECK (confidence_level BETWEEN 0 AND 100),
  severity VARCHAR(20) NOT NULL,
  source VARCHAR(100) NOT NULL,
  description TEXT,
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_threat_intelligence_type ON threat_intelligence(threat_type);
CREATE INDEX idx_threat_intelligence_indicator ON threat_intelligence(indicator_type, indicator_value);
CREATE INDEX idx_threat_intelligence_expires_at ON threat_intelligence(expires_at);
```

## Configuration Management

### Environment Variables
```bash
# Encryption Configuration
ENCRYPTION_MASTER_KEY_ID=notification-master-key
ENCRYPTION_ALGORITHM=AES-256-GCM
ENCRYPTION_KEY_ROTATION_DAYS=90
ENCRYPTION_CONTEXT_REQUIRED=true

# Access Control Configuration
JWT_SECRET_KEY=
JWT_EXPIRATION_TIME=3600
API_RATE_LIMIT_PER_MINUTE=1000
SESSION_TIMEOUT_MINUTES=30
MFA_REQUIRED=true

# Audit Configuration
AUDIT_LOG_LEVEL=INFO
AUDIT_RETENTION_DAYS=2555  # 7 years
AUDIT_ENCRYPTION_ENABLED=true
AUDIT_REAL_TIME_STREAMING=true

# Compliance Configuration
GDPR_ENABLED=true
CCPA_ENABLED=true
DATA_RETENTION_DAYS=2555
BREACH_NOTIFICATION_ENABLED=true
CONSENT_EXPIRATION_DAYS=365

# Threat Detection Configuration
THREAT_DETECTION_ENABLED=true
ANOMALY_DETECTION_SENSITIVITY=medium
RATE_LIMITING_ENABLED=true
GEO_BLOCKING_ENABLED=false
DEVICE_FINGERPRINTING_ENABLED=true

# Integration Configuration
SIEM_INTEGRATION_ENABLED=true
SIEM_ENDPOINT=https://siem.company.com/api
THREAT_INTELLIGENCE_FEEDS=["feed1", "feed2"]
SECURITY_MONITORING_WEBHOOK=https://security.company.com/webhook
```

### Security Policy Configuration
```typescript
const securityPolicies: SecurityPolicy[] = [
  {
    name: 'data-encryption-policy',
    type: 'encryption',
    rules: {
      encryptAtRest: {
        enabled: true,
        algorithm: 'AES-256-GCM',
        keyRotationDays: 90,
        requiredFields: ['email', 'phone', 'personalData']
      },
      encryptInTransit: {
        enabled: true,
        minTlsVersion: '1.3',
        certificateValidation: true,
        perfectForwardSecrecy: true
      }
    },
    priority: 100
  },
  {
    name: 'access-control-policy',
    type: 'access',
    rules: {
      authentication: {
        mfaRequired: true,
        sessionTimeout: 1800,
        maxFailedAttempts: 5,
        lockoutDuration: 900
      },
      authorization: {
        rbacEnabled: true,
        leastPrivilege: true,
        regularReview: true,
        emergencyAccess: false
      }
    },
    priority: 90
  }
];
```

## Integration Points

### 1. Notification Services Integration
```typescript
// Security middleware for all notification services
class SecurityMiddleware {
  async validateRequest(req: Request, res: Response, next: NextFunction) {
    try {
      // Authentication check
      const authResult = await this.accessControlManager.authenticate(req.headers.authorization);
      if (!authResult.success) {
        return res.status(401).json({ error: 'Authentication failed' });
      }

      // Authorization check
      const authorized = await this.accessControlManager.authorize(
        authResult.user,
        req.path,
        req.method
      );
      if (!authorized) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Threat detection
      const threatAssessment = await this.threatDetector.analyzeRequest(req);
      if (threatAssessment.riskLevel === 'high') {
        await this.auditLogger.logEvent({
          eventType: 'threat_detected',
          severity: 'high',
          details: threatAssessment
        });
        return res.status(429).json({ error: 'Request blocked due to security concerns' });
      }

      // Add security context to request
      req.securityContext = {
        userId: authResult.user.id,
        sessionId: authResult.sessionId,
        riskScore: threatAssessment.riskScore
      };

      next();
    } catch (error) {
      await this.auditLogger.logEvent({
        eventType: 'security_error',
        severity: 'medium',
        details: { error: error.message }
      });
      res.status(500).json({ error: 'Security validation failed' });
    }
  }
}
```

### 2. Database Security Integration
```typescript
// Secure database operations with encryption
class SecureNotificationRepository {
  async saveNotification(notification: Notification): Promise<void> {
    // Encrypt sensitive fields
    const encryptedData = await this.encryptionService.encryptData(
      {
        recipientEmail: notification.recipientEmail,
        recipientPhone: notification.recipientPhone,
        personalData: notification.personalData
      },
      'notification-data-key'
    );

    // Save with encrypted data
    await this.repository.save({
      ...notification,
      encryptedData,
      recipientEmail: null, // Remove plaintext
      recipientPhone: null,
      personalData: null
    });

    // Log audit event
    await this.auditLogger.logEvent({
      eventType: 'notification_created',
      severity: 'low',
      resource: 'notification',
      action: 'create',
      outcome: 'success'
    });
  }

  async getNotification(id: string): Promise<Notification> {
    const notification = await this.repository.findById(id);
    
    // Decrypt sensitive data
    if (notification.encryptedData) {
      const decryptedData = await this.encryptionService.decryptData(
        notification.encryptedData,
        'notification-data-key'
      );
      
      return {
        ...notification,
        ...decryptedData
      };
    }

    return notification;
  }
}
```

### 3. External Provider Security
```typescript
// Secure external provider integration
class SecureProviderClient {
  private apiKey: string;
  private encryptionService: EncryptionService;

  async sendNotification(notification: Notification): Promise<void> {
    // Encrypt sensitive data before sending
    const encryptedPayload = await this.encryptionService.encryptData(
      notification,
      'provider-encryption-key'
    );

    // Add security headers
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Request-ID': generateRequestId(),
      'X-Timestamp': new Date().toISOString(),
      'Content-Type': 'application/json'
    };

    // Add request signature
    const signature = await this.generateSignature(encryptedPayload, headers);
    headers['X-Signature'] = signature;

    try {
      const response = await this.httpClient.post('/send', encryptedPayload, { headers });
      
      // Log successful request
      await this.auditLogger.logEvent({
        eventType: 'external_api_call',
        severity: 'low',
        resource: 'provider_api',
        action: 'send_notification',
        outcome: 'success'
      });

    } catch (error) {
      // Log failed request
      await this.auditLogger.logEvent({
        eventType: 'external_api_call',
        severity: 'medium',
        resource: 'provider_api',
        action: 'send_notification',
        outcome: 'failure',
        details: { error: error.message }
      });
      throw error;
    }
  }
}
```

## Error Handling and Security Resilience

### Security Error Handling
```typescript
class SecurityErrorHandler {
  async handleSecurityError(error: SecurityError, context: SecurityContext): Promise<void> {
    // Log security error
    await this.auditLogger.logEvent({
      eventType: 'security_error',
      severity: this.calculateSeverity(error),
      details: {
        errorType: error.type,
        errorMessage: error.message,
        context: context
      }
    });

    // Determine response based on error type
    switch (error.type) {
      case 'authentication_failure':
        await this.handleAuthenticationFailure(error, context);
        break;
      case 'authorization_failure':
        await this.handleAuthorizationFailure(error, context);
        break;
      case 'encryption_failure':
        await this.handleEncryptionFailure(error, context);
        break;
      case 'threat_detected':
        await this.handleThreatDetection(error, context);
        break;
      default:
        await this.handleGenericSecurityError(error, context);
    }
  }

  private async handleThreatDetection(error: SecurityError, context: SecurityContext): Promise<void> {
    // Block suspicious IP
    if (context.riskScore > 80) {
      await this.threatDetector.blockThreat(context.ipAddress, 3600); // 1 hour
    }

    // Create security incident
    await this.createSecurityIncident({
      type: 'threat_detected',
      severity: 'high',
      description: `Threat detected: ${error.message}`,
      context: context
    });

    // Notify security team
    await this.notifySecurityTeam(error, context);
  }
}
```

### Fail-Secure Mechanisms
```typescript
class FailSecureHandler {
  async executeSecureOperation<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
    securityChecks: SecurityCheck[]
  ): Promise<T> {
    try {
      // Perform security checks
      for (const check of securityChecks) {
        const result = await check.execute();
        if (!result.passed) {
          throw new SecurityError(`Security check failed: ${check.name}`);
        }
      }

      // Execute operation
      return await operation();
    } catch (error) {
      // Log security failure
      await this.auditLogger.logEvent({
        eventType: 'fail_secure_triggered',
        severity: 'medium',
        details: { error: error.message }
      });

      // Execute secure fallback
      return await fallback();
    }
  }
}
```

## Performance Optimization

### Security Performance Optimization
```typescript
class SecurityPerformanceOptimizer {
  private authCache = new Map<string, AuthResult>();
  private permissionCache = new Map<string, boolean>();

  async optimizedAuthentication(token: string): Promise<AuthResult> {
    // Check cache first
    const cached = this.authCache.get(token);
    if (cached && !this.isExpired(cached)) {
      return cached;
    }

    // Perform authentication
    const result = await this.accessControlManager.authenticate(token);
    
    // Cache result
    this.authCache.set(token, result);
    
    return result;
  }

  async optimizedAuthorization(userId: string, resource: string, action: string): Promise<boolean> {
    const cacheKey = `${userId}:${resource}:${action}`;
    
    // Check cache
    const cached = this.permissionCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Perform authorization
    const result = await this.accessControlManager.authorize(userId, resource, action);
    
    // Cache result with TTL
    this.permissionCache.set(cacheKey, result);
    setTimeout(() => this.permissionCache.delete(cacheKey), 300000); // 5 minutes
    
    return result;
  }
}
```

## Monitoring and Observability

### Security Metrics Collection
```typescript
class SecurityMetricsCollector {
  private metrics = {
    authenticationAttempts: new Counter('security_authentication_attempts_total'),
    authenticationFailures: new Counter('security_authentication_failures_total'),
    authorizationChecks: new Counter('security_authorization_checks_total'),
    threatsDetected: new Counter('security_threats_detected_total'),
    encryptionOperations: new Counter('security_encryption_operations_total'),
    securityIncidents: new Counter('security_incidents_total')
  };

  recordAuthenticationAttempt(success: boolean, method: string): void {
    this.metrics.authenticationAttempts
      .labels({ method, success: success.toString() })
      .inc();

    if (!success) {
      this.metrics.authenticationFailures
        .labels({ method })
        .inc();
    }
  }

  recordThreatDetection(threatType: string, severity: string): void {
    this.metrics.threatsDetected
      .labels({ type: threatType, severity })
      .inc();
  }
}
```

### Security Health Monitoring
```typescript
class SecurityHealthMonitor {
  async getSecurityHealth(): Promise<SecurityHealthStatus> {
    const checks = await Promise.all([
      this.checkEncryptionService(),
      this.checkAccessControlService(),
      this.checkAuditLogging(),
      this.checkThreatDetection(),
      this.checkComplianceEngine()
    ]);

    const overallStatus = checks.every(check => check.healthy) ? 'healthy' : 'unhealthy';
    const criticalIssues = checks.filter(check => !check.healthy && check.critical);

    return {
      status: overallStatus,
      timestamp: new Date(),
      checks: checks,
      criticalIssues: criticalIssues.length,
      securityScore: this.calculateSecurityScore(checks)
    };
  }

  private async checkEncryptionService(): Promise<HealthCheck> {
    try {
      // Test encryption/decryption
      const testData = 'security-health-check';
      const encrypted = await this.encryptionService.encryptData(testData, 'health-check-key');
      const decrypted = await this.encryptionService.decryptData(encrypted, 'health-check-key');
      
      return {
        name: 'encryption_service',
        healthy: decrypted === testData,
        critical: true,
        message: 'Encryption service operational'
      };
    } catch (error) {
      return {
        name: 'encryption_service',
        healthy: false,
        critical: true,
        message: `Encryption service error: ${error.message}`
      };
    }
  }
}
```