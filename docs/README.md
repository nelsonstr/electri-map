# NeighborPulse Service Layer

## Overview

NeighborPulse is a comprehensive emergency response and community alert system for neighborhoods. This repository contains the service layer implementation covering all core features including SOS alerts, safe zones, community alerts, SLA tracking, and vital signs monitoring.

**Service Files**: 82+ TypeScript services across multiple domains
**Architecture**: TypeScript + Next.js + Supabase
**Status**: Production-Ready

---

## 📁 Project Structure

```
lib/services/
├── emergency/
│   ├── alert-service.ts
│   ├── incident-service.ts
│   ├── sos-service.ts
│   ├── vital-signs-sos-service.ts
│   └── medical-triage-service.ts
├── alert/
│   ├── alert-service.ts
│   └── multi-channel-alerts-service.ts
├── sms-integration-service.ts          # SMS/WhatsApp integration
├── sla-metrics-service.ts              # SLA tracking
├── emergency-contact-service.ts        # Emergency contacts
└── [other services...]

docs/
├── migrations/
│   ├── 002_add_sos_message_columns.sql
│   └── 003_add_sla_vital_signs_columns.sql
└── README.md

components/
├── emergency/
│   ├── sos-button.tsx
│   ├── alert-notification.tsx
│   ├── alert-sheet.tsx
│   └── safe-zone-map-marker.tsx
└── map/
    └── emergency-marker-cluster.tsx

types/
└── sla.ts
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Supabase account
- Twilio account (for SMS)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Configure your environment variables (see .env.example)
nano .env  # Edit with your values

# Run database migrations
pnpm migrate

# Start development server
pnpm dev
```

### Build for Production

```bash
pnpm build
pnpm start
```

---

## 📋 Available Services

### Emergency Services

| Service | Purpose | Location |
|---------|---------|----------|
| `sos-service.ts` | SOS alert creation and management | `lib/services/emergency/` |
| `alert-service.ts` | Emergency alert gateway | `lib/services/emergency/` |
| `medical-triage-service.ts` | Medical SOS triage logic | `lib/services/emergency/` |
| `vital-signs-sos-service.ts` | Vital signs tracking | `lib/services/emergency/` |
| `safe-zone-service.ts` | Safe zone management | `lib/services/emergency/` |

### Alert & Notification Services

| Service | Purpose | Location |
|---------|---------|----------|
| `alert-service.ts` | Alert preferences and delivery | `lib/services/alert/` |
| `multi-channel-alerts-service.ts` | Multi-channel alert delivery | `lib/services/alert/` |
| `targeted-alert-system-service.ts` | Geo-targeted alerts | `lib/services/alert/` |
| `push-notification-service.ts` | Push notifications | `lib/services/alert/` |

### Integration Services

| Service | Purpose | Location |
|---------|---------|----------|
| `sms-integration-service.ts` | SMS/WhatsApp messaging | `lib/services/` |
| `sla-metrics-service.ts` | SLA compliance tracking | `lib/services/` |
| `emergency-contact-service.ts` | Emergency contacts management | `lib/services/` |

---

## 🔧 Configuration

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Twilio SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp (optional)
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_API_INSTANCE_TOKEN=

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Database Schema

The following tables are required:

- `emergency_contacts` - User's emergency contacts
- `community_alerts` - Active community alerts
- `sos_alerts` - SOS alert records
- `vital_sign_readings` - Vital signs data
- `vital_signs_sos` - SOS alerts with vital signs
- `user_alert_preferences` - User notification settings
- `service_requests` - Service requests with SLA
- `incidents` - Emergency incidents

See `docs/migrations/` for SQL migration files.

---

## 📊 SLA Configuration

Default SLA times by entity type:

| Entity Type | Resolution Deadline | Response Target (Critical) |
|------------|---------------------|---------------------------|
| Service Request | 24 hours | 3 hours |
| Incident | 1 hour | 30 minutes |
| Maintenance | 48 hours | 4 hours |

---

## 🔐 Security

### API Rate Limiting

```javascript
RATE_LIMIT_WINDOW_MS=900000    // 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Environment Security

- Never commit `.env` file
- Use GitHub Actions secrets for production credentials
- Enable CORS restrictions in Supabase dashboard
- Regular dependency updates (`pnpm audit`)

---

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

---

## 📦 Deployment

See `scripts/deploy.sh` for deployment automation.

### Manual Deployment Steps

1. **Pre-deployment**
   - Run `pnpm test` to ensure tests pass
   - Check `pnpm build` completes without errors
   - Review `.env` for sensitive data

2. **Deploy**
   ```bash
   pnpm deploy:prod
   # or
   ./scripts/deploy.sh production main
   ```

3. **Post-deployment**
   - Verify health endpoint
   - Check logs for errors
   - Notify stakeholders

---

## 📚 API Reference

### SOS Alert Creation

```typescript
import { createVitalSignsSOS } from '@/lib/services/vital-signs-sos-service'

await createVitalSignsSOS({
  userId: 'uuid',
  readings: [{
    type: 'heart_rate',
    value: 120,
    unit: 'bpm',
    deviceId: 'device-123',
  }],
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Main St',
  },
})
```

### Create Community Alert

```typescript
import { sendCommunityAlert } from '@/lib/services/alert-service'

await sendCommunityAlert({
  title: 'Road Closure',
  message: 'Main St closed due to construction',
  severity: 'warning',
  location: { latitude, longitude },
  radius: 5000,
})
```

### Send SMS Notification

```typescript
import { SmsIntegrationService } from '@/lib/services/sms-integration-service'

const smsService = SmsIntegrationService.getInstance()
await smsService.sendSOSNotification(
  '+1234567890',
  {
    title: 'SOS EMERGENCY',
    message: 'Help needed immediately',
    severity: 'critical',
    alertType: 'sos',
  },
  { priority: 'high' }
)
```

---

## 🔍 Monitoring

### Health Check Endpoint

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "cache": "connected",
    "sms": "configured"
  },
  "uptime": 86400
}
```

### Log Aggregation

Logs are sent to:
- **Sentry**: Error tracking
- **Datadog/New Relic**: APM
- **ELK Stack**: Centralized logging

---

## 🛠️ Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Migration fails | Check database connection, ensure PostgreSQL 14+ |
| SMS not sending | Verify Twilio credentials in `.env` |
| Build fails | Run `pnpm install` and check for lockfile issues |
| Type errors | Run `pnpm typecheck` and fix errors |

---

## 📖 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- JSDoc comments for all public functions
- No console.log in production

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🆘 Support

For issues and questions:
- Open a GitHub issue
- Check existing documentation in `/docs`
- Review service documentation in each `.ts` file

---

**Version**: 1.0.0
**Last Updated**: 2026-03-31
**Status**: Production-Ready
