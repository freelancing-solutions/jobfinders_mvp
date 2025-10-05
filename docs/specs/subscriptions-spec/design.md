# Subscription System Design

## Architecture
```mermaid
graph TD
    A[Frontend] -->|Subscribe| B[API Routes]
    B -->|Process| C[PayPal API]
    C -->|Webhook| D[Backend]
    D -->|Update| E[Database]
    D -->|Notify| F[User]
```

## Database Schema
```prisma
model Subscription {
    id        String   @id @default(cuid())
    userId    String
    planId    String
    status    SubscriptionStatus
    startDate DateTime
    endDate   DateTime
    paypalId  String?
    features  Json
    metadata  Json?
}

enum SubscriptionStatus {
    ACTIVE
    CANCELLED
    PAST_DUE
    PENDING
}
```

## API Routes
- `/api/subscriptions/create`
- `/api/subscriptions/cancel`
- `/api/subscriptions/upgrade`
- `/api/subscriptions/webhook`

## Components
- SubscriptionCard
- PaymentForm
- PlanComparison
- BillingHistory