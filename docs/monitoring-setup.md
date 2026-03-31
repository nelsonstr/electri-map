# Monitoring & Logging Setup

## Overview

This document describes the monitoring and logging setup for NeighborPulse. It covers error tracking, metrics collection, log aggregation, and alerting configuration.

---

## 📊 Components

### 1. Error Tracking

#### Sentry Setup

Sentry is used for error tracking, performance monitoring, and user feedback collection.

**Installation:**

```bash
pnpm add @sentry/nextjs @sentry/react
pnpm add -D @types/sentry-nextjs @types/sentry-react
```

**Configuration (.env):**

```bash
# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
SENTRY_ORG=your-organization
SENTRY_PROJECT=neighborpulse

# Sampling (reduce Sentry costs)
SENTRY_SAMPLE_RATE=1.0          # 100% for production issues
SENTRY_TRACES_SAMPLE_RATE=0.1   # 10% for performance monitoring
```

**Next.js Setup:**

```typescript
// instrumentation.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  samplesPercentage: parseFloat(process.env.SENTRY_SAMPLE_RATE || '100'),
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '10'),
  environment: process.env.NODE_ENV,
  release: process.env.CI ? process.env.GIT_COMMIT : undefined,
})
```

**React App Setup:**

```typescript
// app/layout.tsx or app/providers.tsx
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  samplesPercentage: parseFloat(process.env.SENTRY_SAMPLE_RATE || '100'),
})
```

### 2. Metrics Collection

#### Prometheus + Grafana

For infrastructure and application metrics:

**Prometheus Configuration:**

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'nextjs'
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['your-app:3000']

  - job_name: 'nodejs'
    static_configs:
      - targets: ['your-app:3000']
```

**Grafana Dashboard:**

Import pre-built dashboard or create custom panels for:
- Error rate by severity
- API latency percentiles
- Active users/concurrent connections
- Database query performance

### 3. Log Aggregation

#### ELK Stack (Elasticsearch, Logstash, Kibana)

**Log Format:**

```json
{
  "timestamp": "2026-03-31T12:00:00.000Z",
  "level": "info",
  "service": "sos-service",
  "message": "SOS alert created",
  "userId": "uuid-123",
  "alertId": "sos_123",
  "duration": 150,
  "stack": "Error: Database connection timeout"
}
```

**Winston Logger Configuration:**

```typescript
// utils/logger.ts
import winston from 'winston'
import transport from 'winston-daily-rotate-file'

const transports = [
  new transport.DailyRotateFile(
    'logs/combined.log',
    {
      maxSize: '20m',
      maxFiles: '14d',
    }
  ),
]

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports,
})

export default logger
```

### 4. Alerting

#### PagerDuty / OpsGenie

**Alert Rules:**

```yaml
# alerts.yml
groups:
  - name: Critical Alerts
    rules:
      - alert: SOSAlertsHighVolume
        expr: |
          sum(rate(sos_alerts_created[5m])) > 10
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: High SOS alert volume
          runbook_url: https://wiki.example.com/runbooks/sos-alerts

      - alert: DatabaseConnectionFailed
        expr: |
          up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: Database connection lost

      - alert: SLABreachDetected
        expr: |
          sla_breach_rate > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: SLA breach rate exceeded 10%
```

#### Email Alerts

```bash
# Alert via email
curl -X POST https://sendgrid.api/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -d '{"to":"alerts@example.com","subject":"Production Alert","text":"..."}'
```

---

## 📈 Custom Metrics

### Application Metrics

Add custom metrics to track:

```typescript
// metrics/index.ts
import client from 'prom-client'

const sosAlertsCreated = new Counter({
  name: 'sos_alerts_created_total',
  help: 'Total SOS alerts created',
  labelNames: ['severity', 'type'],
})

const apiLatency = new Histogram({
  name: 'api_latency_seconds',
  help: 'API request latency',
  buckets: [0.1, 0.5, 1, 5, 10],
})

export { sosAlertsCreated, apiLatency }
```

### Service Metrics

```typescript
// lib/services/sos-service.ts
import { sosAlertsCreated } from '@/metrics'

export async function createSOSAlert(...) {
  const start = Date.now()

  try {
    // ... create alert logic
    sosAlertsCreated.labels('critical', 'sos').inc()
    return alert
  } catch (error) {
    sosAlertsCreated.labels('critical', 'error').inc()
    throw error
  }
}
```

---

## 🔧 Setup Scripts

### Initialize Monitoring

```bash
# Install monitoring dependencies
pnpm add prom-client @sentry/nextjs winston winston-daily-rotate-file
pnpm add -D @types/prom-client @types/winston

# Generate Grafana dashboard
pnpm grafana:generate
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    services: {
      database: await checkDatabase(),
      cache: await checkCache(),
      sms: await checkSMS(),
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
}
```

---

## 📊 Dashboard Examples

### Grafana Dashboard Variables

```json
{
  "dashboard": {
    "variables": [
      {
        "name": "environment",
        "type": "query",
        "query": "label_values()"
      },
      {
        "name": "service",
        "type": "query",
        "query": "label_values()"
      }
    ]
  }
}
```

### Key Metrics to Track

| Metric | Description | Alert Threshold |
|-------|------------|----------------|
| `sos_alerts_created_total` | Total SOS alerts | Spike detection |
| `api_latency_seconds` | API response time | > 1s warning, > 5s critical |
| `alert_delivery_success` | Alert delivery rate | < 95% critical |
| `vital_signs_readings` | Vital signs data points | N/A |
| `sla_compliance_rate` | SLA compliance | < 95% warning |

---

## 🔐 Security

### Metrics Exposed in Production

**NEVER expose these in production:**
- User PII in logs
- Database credentials
- API keys
- Stack traces with sensitive data

**Safe to expose:**
- Anonymous error counts
- Aggregate metrics
- Non-sensitive stack traces (sanitized)

### Log Sanitization

```typescript
// utils/sanitize.ts
export function sanitizeLogData(data: unknown) {
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /email/i,
    /phone/i,
  ]

  const sanitize = (value: string) => {
    sensitivePatterns.forEach((pattern) => {
      value = value.replace(pattern, '****')
    })
    return value
  }

  // ... sanitize logic
}
```

---

## 📝 Best Practices

1. **Monitor early**: Set up monitoring before going to production
2. **Alert wisely**: Avoid alert fatigue with appropriate thresholds
3. **Log consistently**: Use structured logging with consistent formats
4. **Track business metrics**: Monitor user-facing metrics, not just technical ones
5. **Review regularly**: Weekly review of alerts and metrics

---

## 🆘 Troubleshooting

### High Error Rate

1. Check Sentry dashboard for error stack traces
2. Review recent deployments in git history
3. Check database connection pool settings
4. Increase log level temporarily: `LOG_LEVEL=debug`

### Slow API Responses

1. Check Grafana for latency percentiles
2. Review database query performance
3. Check cache hit rates
4. Profile hot paths in code

### Alert Fatigue

1. Review alert rules in PagerDuty/OpsGenie
2. Add `for` clause to prevent flapping alerts
3. Group related alerts
4. Set appropriate severity levels

---

**Last Updated**: 2026-03-31
