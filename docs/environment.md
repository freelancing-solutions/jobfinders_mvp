# Environment Variables

## Required Variables

### OpenRouter Configuration
```env
OPENROUTER_API_KEY=your_api_key
OPENROUTER_API_URL=https://api.openrouter.ai/api/v1
OPENROUTER_ORGANIZATION=your_org_id
```

### Database Configuration
```env
DATABASE_URL=postgresql://user:password@localhost:5432/jobfinders
```

### Authentication
```env
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers (optional)
GITHUB_ID=your_github_oauth_id
GITHUB_SECRET=your_github_oauth_secret
GOOGLE_ID=your_google_oauth_id
GOOGLE_SECRET=your_google_oauth_secret
```

### Payment Processing
```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
```

## Development Setup

1. Copy `.env.example` to `.env.local`
2. Fill in the required values
3. For development, you can use:
   - Sandbox PayPal credentials
   - Test OpenRouter API key
   - Local PostgreSQL database

## Production Setup

1. Ensure all variables are set in your production environment
2. Use production credentials for all services
3. Set `NODE_ENV=production`
4. Configure proper CORS settings

## Security Notes

- Never commit `.env` files to version control
- Rotate secrets regularly
- Use different values for development and production
- Keep backup of production credentials in a secure location
