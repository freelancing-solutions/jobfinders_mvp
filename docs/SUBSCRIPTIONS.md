# Subscription System Documentation

## PayPal Integration

### Setup Requirements
```typescript
interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
  webhookId: string;
}
```

### Webhook Events
- `PAYMENT.SALE.COMPLETED`
- `BILLING.SUBSCRIPTION.CREATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.RENEWED`

### Error Handling
- Payment failures
- Subscription cancellations
- Refund processing
- Webhook retries

## Database Schema
```prisma
model Subscription {
  id        String   @id @default(cuid())
  userId    String
  planId    String
  status    String
  startDate DateTime
  endDate   DateTime
  paypalSubscriptionId String?
  
  user      User     @relation(fields: [userId], references: [id])
  plan      Plan     @relation(fields: [planId], references: [id])
}

model Plan {
  id          String   @id @default(cuid())
  name        String
  price       Float
  interval    String
  features    String[]
  limits      Json
}
```

## API Routes
```typescript
// POST /api/subscriptions/create
// POST /api/subscriptions/cancel
// GET /api/subscriptions/status
// POST /api/webhooks/paypal
```

## Feature Flag System
```typescript
interface FeatureAccess {
  canAccessAI: boolean;
  maxJobPostings: number;
  maxApplications: number;
  priority: boolean;
}
```