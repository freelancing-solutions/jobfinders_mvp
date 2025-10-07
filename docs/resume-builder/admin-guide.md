# Resume Builder Admin Guide

## Table of Contents

1. [System Overview](#system-overview)
2. [Admin Dashboard](#admin-dashboard)
3. [User Management](#user-management)
4. [Monitoring and Analytics](#monitoring-and-analytics)
5. [Performance Optimization](#performance-optimization)
6. [Security Management](#security-management)
7. [Troubleshooting](#troubleshooting)
8. [Backup and Recovery](#backup-and-recovery)
9. [Maintenance Procedures](#maintenance-procedures)
10. [Emergency Procedures](#emergency-procedures)

## System Overview

The Resume Builder system consists of multiple interconnected components:

### Architecture Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │  API Gateway    │    │  AI Services    │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│  (OpenRouter)   │
│                 │    │                 │    │                 │
│ • Resume Upload │    │ • Rate Limiting │    │ • Analysis      │
│ • Templates     │    │ • Auth          │    │ • Suggestions   │
│ • Editing       │    │ • Validation    │    │ • Scoring       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   File Storage  │    │   Database      │    │   Cache Layer   │
│   (AWS S3)      │    │   (PostgreSQL)  │    │   (Redis)       │
│                 │    │                 │    │                 │
│ • Resume Files  │    │ • User Data     │    │ • AI Responses  │
│ • Templates     │    │ • Analysis      │    │ • Sessions      │
│ • Exports       │    │ • Metadata      │    │ • Templates     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Services

#### Resume Builder Service
- **Port**: 3000
- **Health Check**: `/api/health`
- **Metrics**: `/api/metrics`
- **Ready Check**: `/api/ready`

#### Supporting Services
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **AWS S3**: File storage
- **OpenRouter API**: AI analysis service

## Admin Dashboard

### Accessing Admin Dashboard

1. Navigate to `/admin/resume-builder`
2. Requires admin role privileges
3. Two-factor authentication required

### Dashboard Overview

The admin dashboard provides:

#### System Health Panel
```
🟢 Service Status: Healthy
📊 Active Users: 1,247
⚡ Current Load: Normal
💾 Storage Used: 45.2 GB / 100 GB
🔥 AI API Calls Today: 8,923 / 10,000
```

#### Key Metrics
- **User Activity**: Active users, new registrations
- **Processing Stats**: Uploads, analyses, exports
- **Performance**: Response times, error rates
- **Resource Usage**: CPU, memory, storage

### Navigation Menu

#### 1. Overview
- Real-time system metrics
- Recent activity timeline
- Quick actions and shortcuts

#### 2. Users
- User management and search
- Subscription management
- Activity monitoring

#### 3. Content
- Resume analytics
- Template performance
- File storage management

#### 4. Monitoring
- Performance metrics
- Error tracking
- AI service status

#### 5. Settings
- System configuration
- AI service settings
- Security policies

## User Management

### User Search and Filtering

#### Search Options
- **Email Address**: Exact match search
- **User ID**: Internal user identifier
- **Registration Date**: Date range filter
- **Subscription Level**: Free, Premium, Enterprise
- **Activity Status**: Active, Inactive, Suspended

#### Advanced Filters
```
📊 Filter Options:
├── Registration Period: Last 30 days
├── Subscription Level: All
├── Resume Count: > 5 resumes
├── Last Active: Within 7 days
├── Account Status: Active only
└── Export Count: > 10 exports
```

### User Details Panel

#### Account Information
```
👤 User Details:
├── Name: John Doe
├── Email: john.doe@example.com
├── User ID: user_12345
├── Registration: Jan 15, 2024
├── Last Active: 2 hours ago
├── Subscription: Premium
└── Status: Active
```

#### Usage Statistics
```
📈 Usage Analytics:
├── Resumes Created: 12
├── AI Analyses: 45
├── Exports: 23
├── Templates Used: 8
├── Storage Used: 125 MB
└── API Calls: 234 / 500
```

#### Activity Timeline
```
🕐 Recent Activity:
├── 2 hours ago: Exported resume (Software Engineer)
├── 5 hours ago: Updated resume sections
├── 1 day ago: Completed AI analysis
├── 2 days ago: Uploaded new resume
└── 1 week ago: Subscribed to Premium
```

### User Actions

#### Account Management
- **Suspend Account**: Temporarily disable access
- **Reset Password**: Force password reset
- **Clear Cache**: Remove user's cached data
- **Export Data**: Download user's data (GDPR)

#### Subscription Management
- **Upgrade/Downgrade**: Change subscription level
- **Extend Trial**: Add trial period
- **Apply Credit**: Add account credit
- **Cancel Subscription**: End recurring billing

#### Support Actions
- **Contact User**: Send support email
- **View Logs**: Access user activity logs
- **Reset Quotas**: Reset usage limits
- **Manual Refund**: Process refunds

## Monitoring and Analytics

### System Health Monitoring

#### Key Performance Indicators (KPIs)

##### Response Time Metrics
```
⏱️ Response Times (Last 24h):
├── API Average: 245ms
├── API 95th Percentile: 1.2s
├── File Upload: 3.4s
├── AI Analysis: 28.5s
└── Export Generation: 15.2s
```

##### Error Rate Metrics
```
❌ Error Rates (Last 24h):
├── Overall Error Rate: 0.8%
├── Upload Failures: 1.2%
├── AI Service Errors: 2.1%
├── Export Failures: 0.5%
└── Database Errors: 0.1%
```

##### Resource Utilization
```
💻 Resource Usage:
├── CPU Usage: 45% / 80% (Alert at 70%)
├── Memory Usage: 3.2GB / 4GB
├── Disk Usage: 125GB / 200GB
├── Network I/O: 125MB/s
└── Database Connections: 45 / 100
```

### AI Service Monitoring

#### OpenRouter API Status
```
🤖 AI Service Status:
├── API Status: 🟢 Operational
├── Response Time: 1.2s
├── Error Rate: 0.5%
├── Daily Quota: 8,234 / 10,000
├── Cost Today: $124.50
└── Queue Size: 0
```

#### AI Analysis Performance
```
📊 Analysis Metrics:
├── Total Analyses: 45,678
├── Success Rate: 98.5%
├── Average Time: 28.5s
├── Queue Wait Time: 2.1s
└── Cache Hit Rate: 67%
```

### User Analytics

#### Active User Metrics
```
👥 User Activity (Last 7 days):
├── Daily Active Users: 1,247
├── Weekly Active Users: 3,456
├── Monthly Active Users: 8,901
├── New Registrations: 234
└── Churn Rate: 2.3%
```

#### Feature Usage
```
🎯 Feature Usage:
├── Resume Uploads: 5,678
├── AI Analyses: 12,345
├── Template Changes: 3,456
├── Exports: 2,345
└── Share Actions: 1,234
```

#### Subscription Analytics
```
💳 Subscription Stats:
├── Free Users: 15,678 (65%)
├── Premium Users: 7,890 (33%)
├── Enterprise Users: 234 (2%)
├── MRR (Monthly Recurring): $78,234
└── ARPU (Average Revenue): $3.26
```

### Performance Optimization

#### Database Optimization

##### Query Performance
```
🗄️ Database Queries:
├── Average Query Time: 45ms
├── Slow Queries: 3 (>1s)
├── Connection Pool Usage: 67%
├── Index Hit Rate: 98.5%
└── Cache Hit Rate: 75%
```

##### Index Recommendations
```
📈 Optimization Suggestions:
├── Add index on resumes.user_id (estimated 50% improvement)
├── Add index on analyses.created_at (estimated 30% improvement)
├── Consider partitioning large tables
└── Optimize query for user resume list
```

#### Cache Optimization

##### Redis Cache Metrics
```
⚡ Cache Performance:
├── Hit Rate: 78%
├── Memory Usage: 1.2GB / 2GB
├── Keyspace Hits: 1,234,567
├── Keyspace Misses: 345,678
└── Evictions: 456
```

##### Cache Optimization Actions
- **Warm Cache**: Pre-load popular templates
- **Clear Cache**: Remove stale data
- **Adjust TTL**: Optimize cache expiration
- **Monitor Memory**: Prevent OOM conditions

## Security Management

### Security Dashboard

#### Security Overview
```
🔒 Security Status:
├── Overall Security: 🟢 Good
├── Failed Logins (24h): 23 / 1,234 (1.9%)
├── Suspicious Activity: 0
├── Security Alerts: 2
└── Last Security Scan: 2 hours ago
```

#### Threat Detection
```
🚨 Security Alerts:
├── Suspicious Upload: Malicious file detected and blocked
├── Rate Limit Exceeded: User temporarily blocked
├── Unusual API Usage: Investigating potential abuse
└── Failed Login Attempts: Multiple attempts from unusual location
```

### Access Control

#### Role-Based Access Control (RBAC)
```
👥 Role Management:
├── Super Admin: Full system access
├── Admin: User management, monitoring
├── Support: User support, limited access
├── Analyst: Read-only analytics access
└── User: Standard resume builder access
```

#### Admin Permissions
```
🔐 Admin Permissions:
├── ✅ View all user data
├── ✅ Modify user accounts
├── ✅ Access system logs
├── ✅ Manage subscriptions
├── ❌ Delete user data (requires confirmation)
├── ❌ Access billing information
└── ❌ Modify system configuration
```

### File Security

#### Upload Security Measures
```
🛡️ File Security:
├── Virus Scanning: Enabled (ClamAV)
├── File Type Validation: Strict
├── Size Limits: Enforced (10MB max)
├── Content Scanning: AI-powered
├── Quarantine: Suspicious files isolated
└── Audit Log: All uploads tracked
```

#### Security Incidents
```
⚠️ Recent Security Events:
├── Malicious Upload Blocked: PDF with embedded executable
├── Rate Limit Triggered: User exceeded upload limits
├── Suspicious Pattern: Automated upload behavior detected
└── API Abuse: Excessive AI analysis requests
```

## Troubleshooting

### Common Issues and Solutions

#### Upload Issues

##### Problem: File Upload Fails
**Symptoms**:
- Upload gets stuck at 100%
- Error: "File processing failed"
- Large files failing more frequently

**Diagnostic Steps**:
1. Check user's internet connection
2. Verify file size and format
3. Check storage space availability
4. Review system logs for errors

**Solutions**:
```
🔧 Upload Troubleshooting:
├── Check File: Ensure valid format and size <10MB
├── Network: Verify stable internet connection
├── Storage: Confirm adequate disk space
├── Queue: Check processing queue status
└── Service: Restart upload service if needed
```

##### Problem: AI Analysis Fails
**Symptoms**:
- Analysis stuck at "Processing"
- Error: "AI service unavailable"
- High analysis failure rate

**Diagnostic Steps**:
1. Check OpenRouter API status
2. Verify API key and quota
3. Review AI service logs
4. Check Redis cache for issues

**Solutions**:
```
🤖 AI Analysis Troubleshooting:
├── API Status: Check OpenRouter service health
├── Quota: Verify daily/ monthly limits not exceeded
├── API Key: Confirm valid authentication
├── Queue: Check for AI processing bottlenecks
└── Fallback: Enable backup AI service if available
```

#### Performance Issues

##### Problem: Slow Response Times
**Symptoms**:
- API response times >5 seconds
- Database queries running slowly
- High CPU/memory usage

**Diagnostic Steps**:
1. Check system resource utilization
2. Review database query performance
3. Analyze application logs for bottlenecks
4. Monitor network connectivity

**Solutions**:
```
⚡ Performance Troubleshooting:
├── Resources: Scale up if CPU/memory >80%
├── Database: Optimize slow queries, add indexes
├── Cache: Clear or warm Redis cache
├── Load Balancer: Distribute traffic evenly
└── Code: Review recent deployments for issues
```

### Log Analysis

#### Accessing System Logs
```
📋 Log Locations:
├── Application Logs: /var/log/resume-builder/app.log
├── Error Logs: /var/log/resume-builder/error.log
├── Access Logs: /var/log/nginx/access.log
├── Database Logs: PostgreSQL server logs
└── System Logs: /var/log/syslog
```

#### Log Analysis Commands
```bash
# View recent application logs
tail -f /var/log/resume-builder/app.log

# Search for specific errors
grep "ERROR" /var/log/resume-builder/error.log

# Analyze access patterns
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr

# Monitor database queries
tail -f /var/log/postgresql/postgresql.log | grep "resume"
```

#### Critical Log Patterns
```
🚨 Critical Log Patterns:
├── Database Connection Failed: Check DB credentials
├── AI Service Error: Verify API status and quota
├── File Upload Virus: Security threat detected
├── Out of Memory: System resource exhaustion
└── Authentication Failed: Potential security issue
```

## Backup and Recovery

### Backup Strategy

#### Automated Backups
```
💾 Backup Schedule:
├── Database: Daily at 2:00 AM (30-day retention)
├── File Storage: Daily incremental backups
├── Configuration: Weekly full backups
├── Logs: Weekly, 90-day retention
└── Snapshots: Hourly system snapshots
```

#### Backup Verification
```
✅ Backup Verification:
├── Integrity Check: SHA-256 checksums verified
├── Restore Test: Monthly test restores
├── Monitoring: Automated backup success alerts
├── Off-site: Copies stored in multiple regions
└── Encryption: All backups encrypted at rest
```

### Recovery Procedures

#### Database Recovery
```bash
# Stop application services
sudo systemctl stop resume-builder

# Restore from backup
pg_restore --verbose --clean --no-acl --no-owner \
  -h localhost -U postgres \
  -d resume_builder_db \
  /backups/resume_builder_20240115.sql

# Restart services
sudo systemctl start resume-builder

# Verify data integrity
psql -U postgres -d resume_builder_db -c "SELECT COUNT(*) FROM resumes;"
```

#### File Storage Recovery
```bash
# Restore from S3 backup
aws s3 sync s3://jobfinders-backups/resume-files/20240115/ \
  /app/uploads/resumes/

# Verify file integrity
find /app/uploads/resumes/ -type f -exec sha256sum {} + \
  > /tmp/current_checksums.txt

# Compare with backup checksums
diff /tmp/backup_checksums.txt /tmp/current_checksums.txt
```

### Disaster Recovery

#### Recovery Time Objectives (RTO)
```
⏱️ Recovery Targets:
├── Critical Systems: <1 hour
├── Database Recovery: <2 hours
├── File Storage: <4 hours
├── Full System: <8 hours
└── Data Loss Target: <15 minutes
```

#### Disaster Recovery Plan
1. **Assessment**: Evaluate damage and scope
2. **Communication**: Notify stakeholders
3. **Isolation**: Prevent further damage
4. **Recovery**: Restore from backups
5. **Verification**: Confirm system integrity
6. **Monitoring**: Enhanced monitoring post-recovery

## Maintenance Procedures

### Routine Maintenance

#### Daily Tasks
```
📅 Daily Maintenance Checklist:
├── ☐ Check system health dashboard
├── ☐ Review error logs for issues
├── ☐ Monitor resource utilization
├── ☐ Verify backup completion
├── ☐ Check AI service quota usage
└── ☐ Review security alerts
```

#### Weekly Tasks
```
📆 Weekly Maintenance Checklist:
├── ☐ Performance review and optimization
├── ☐ User activity and growth analysis
├── ☐ Security scan and vulnerability assessment
├── ☐ Database optimization and index review
├── ☐ Cache cleanup and optimization
└── ☐ Backup verification test
```

#### Monthly Tasks
```
🗓️ Monthly Maintenance Checklist:
├── ☐ Full system security audit
├── ☐ Capacity planning review
├── ☐ Disaster recovery test
├── ☐ User feedback review
├── ☐ Feature usage analysis
└── ☐ Cost optimization review
```

### System Updates

#### Application Updates
```
🔄 Update Process:
├── 1. Staging deployment testing
├── 2. Database migration preparation
├── 3. Blue-green deployment
├── 4. Health check verification
├── 5. Traffic cutover
├── 6. Monitor for issues
└── 7. Rollback if necessary
```

#### Dependency Updates
```
📦 Dependency Management:
├── Security Patches: Immediate deployment
├── Node.js Updates: Monthly review
├── Database Updates: Quarterly planning
├── System Libraries: As needed
└── Third-party APIs: Monitor for changes
```

### Capacity Planning

#### Resource Planning
```
📊 Capacity Planning:
├── User Growth: +20% monthly projection
├── Storage Growth: +500GB monthly
├── AI API Usage: +30% monthly
├── Database Growth: +200GB monthly
└── Bandwidth: +1TB monthly
```

#### Scaling Triggers
```
📈 Auto-scaling Rules:
├── CPU >70% for 5 minutes: Scale up
├── Memory >80% for 3 minutes: Scale up
├── Response time >2s: Scale up
├── Queue size >100: Scale up
└── Error rate >5%: Alert admin
```

## Emergency Procedures

### Incident Response

#### Severity Levels
```
🚨 Severity Classification:
├── P1 - Critical: System down, data loss
├── P2 - High: Major feature unavailable
├── P3 - Medium: Performance degradation
├── P4 - Low: Minor issues
└── P5 - Informational: General notifications
```

#### Response Team
```
👥 Incident Response Team:
├── Incident Commander: Overall coordination
├── Technical Lead: Technical resolution
├── Communications: Stakeholder updates
├── Support Lead: User impact management
└── Documentation: Incident recording
```

### Emergency Contacts

#### Internal Contacts
```
📞 Emergency Contacts:
├── System Administrator: +1-555-0101
├── Database Administrator: +1-555-0102
├── Security Officer: +1-555-0103
├── DevOps Engineer: +1-555-0104
└── Product Manager: +1-555-0105
```

#### External Contacts
```
🌐 External Contacts:
├── OpenRouter Support: support@openrouter.ai
├── AWS Support: 1-800-AWS-SUPPORT
├── Security Team: security@jobfinders.com
├── Legal Team: legal@jobfinders.com
└── PR Team: pr@jobfinders.com
```

### Communication Procedures

#### Stakeholder Notifications
```
📢 Communication Plan:
├── P1 Incidents: Immediate notification
├── P2 Incidents: Within 15 minutes
├── P3 Incidents: Within 1 hour
├── P4 Incidents: Daily digest
└── P5 Incidents: Weekly report
```

#### Status Updates
```
📝 Status Update Template:
├── Incident ID: INC-YYYY-MMDD-001
├── Severity: P1-P5
├── Status: Investigating / Identified / Monitoring / Resolved
├── Impact: Description of user impact
├── Timeline: Estimated resolution time
├── Next Update: Time of next communication
└── Contact: Incident commander details
```

---

**For technical support or urgent issues:**
- **Emergency Hotline**: +1-555-0000 (24/7)
- **Slack Channel**: #resume-builder-emergency
- **Email**: emergency@jobfinders.com

**Regular business hours support:**
- **Email**: admin-support@jobfinders.com
- **Slack**: #resume-builder-admin
- **Documentation**: https://docs.jobfinders.com/admin