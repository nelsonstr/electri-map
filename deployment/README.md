# Deployment Checklist & Runbook

## Deployment Checklist

Use this checklist before deploying NeighborPulse to any environment.

---

## ✅ Pre-Deployment Checklist

### 1. Code Quality

- [ ] Run `pnpm test` - All tests passing
- [ ] Run `pnpm lint` - No linting errors
- [ ] Run `pnpm typecheck` - No TypeScript errors
- [ ] Review recent commits
- [ ] Check for merge conflicts
- [ ] Verify branch is up to date with upstream

### 2. Environment Setup

- [ ] Copy `.env.example` to `.env`
- [ ] Fill in all required environment variables
- [ ] **NEVER** commit `.env` file
- [ ] Rotate any exposed secrets
- [ ] Verify environment is correct (production vs staging)

**Required Environment Variables:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `DATABASE_URL`
- [ ] `SENTRY_DSN` (optional)
- [ ] `TWILIO_ACCOUNT_SID` (if using SMS)
- [ ] `TWILIO_AUTH_TOKEN` (if using SMS)

### 3. Database Preparation

- [ ] Run `pnpm migrate` to apply schema changes
- [ ] Verify database connection
- [ ] Check existing data integrity
- [ ] Prepare seed data if needed
- [ ] Verify migration files in `docs/migrations/`

**Migration Files to Run:**
- [ ] `docs/migrations/002_add_sos_message_columns.sql`
- [ ] `docs/migrations/003_add_sla_vital_signs_columns.sql`

### 4. Build Verification

- [ ] Run `pnpm build` - Build completes successfully
- [ ] Check build artifacts in `.next/`
- [ ] Verify no build warnings
- [ ] Test health check endpoint: `curl http://localhost:3000/api/health`

### 5. Smoke Tests

- [ ] Application starts successfully
- [ ] Homepage loads
- [ ] SOS button is visible
- [ ] Alerts display correctly
- [ ] Login/logout flow works
- [ ] Database queries execute

---

## 🚀 Deployment Steps

### Option A: Automated Deployment (Recommended)

```bash
# Using deployment script
pnpm deploy:prod

# Or with explicit parameters
./scripts/deploy.sh production main
```

### Option B: Manual Deployment

#### Step 1: Pull Latest Code

```bash
cd /path/to/deployment
git pull origin main
```

#### Step 2: Install Dependencies

```bash
pnpm install --frozen-lockfile
```

#### Step 3: Apply Migrations

```bash
pnpm migrate
# or execute migrations directly
psql -d neighborpulse -f docs/migrations/002_add_sos_message_columns.sql
psql -d neighborpulse -f docs/migrations/003_add_sla_vital_signs_columns.sql
```

#### Step 4: Build Application

```bash
pnpm build
```

#### Step 5: Start Application

```bash
pnpm start
# or
pm2 start npm --name "neighborpulse" --start "pnpm start"
```

### Option C: CI/CD Pipeline

1. Push to `main` branch
2. GitHub Actions triggers CI pipeline
3. Pipeline runs: lint, test, build, security scan
4. On success, deploy to target environment
5. Monitor deployment status in Actions tab

---

## 🔍 Post-Deployment Verification

### 1. Health Checks

```bash
# Application health
curl https://your-domain.com/api/health

# Database connectivity
psql -h your-db -d neighborpulse -c "SELECT 1"

# Check active connections
psql -h your-db -d neighborpulse -c "SELECT count(*) FROM pg_stat_activity"
```

**Expected Health Check Response:**
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "cache": "connected"
  }
}
```

### 2. Smoke Test Checklist

- [ ] Homepage loads correctly
- [ ] SOS button is visible and clickable
- [ ] Alerts appear in notification panel
- [ ] Safe zone locator works
- [ ] Login/register flows work
- [ ] Map displays correctly
- [ ] Emergency contact form submits

### 3. Monitor Logs

```bash
# View application logs
pm2 logs neighborpulse --lines 100
# or
tail -f .next/server.log

# Check for errors
grep -i "error" logs/*.log | tail -50
```

### 4. Verify Metrics

- [ ] Check Sentry for new errors
- [ ] Review Grafana dashboards
- [ ] Verify alert delivery to test contacts
- [ ] Check SLA metrics are being calculated

---

## 🆘 Rollback Procedure

If deployment fails or critical issues occur:

### 1. Immediate Rollback

```bash
# Revert to previous version
git reset --hard HEAD~1
git pull origin main

# Restart application
pm2 restart neighborpulse
# or
pnpm restart
```

### 2. Emergency Procedures

**Disable SMS:**
```bash
# Update .env
nano .env
# Set TWILIO_AUTH_TOKEN=disabled
```

**Disable Non-Critical Features:**
```bash
# In .env
ENABLE_IOT_INTEGRATION=false
ENABLE_AI_PREDICTIONS=false
```

### 3. Incident Response

1. **Assess impact**: What features are broken?
2. **Notify stakeholders**: Use PagerDuty/OpsGenie
3. **Mitigate**: Rollback if necessary
4. **Investigate**: Check logs, Sentry, metrics
5. **Fix and redeploy**: Fix issue and deploy hotfix

---

## 📊 Monitoring

### Key Metrics to Watch

| Metric | Normal | Warning | Critical |
|-------|-------|--------|---------|
| Error Rate | < 0.1% | 0.1-1% | > 1% |
| API Latency (p95) | < 500ms | 500-1000ms | > 1000ms |
| DB Connections | < 50 | 50-100 | > 100 |
| Memory Usage | < 500MB | 500-800MB | > 800MB |

### Alert Channels

- **PagerDuty**: Critical production issues
- **Slack**: Non-critical alerts
- **Email**: Digest of issues

---

## 📝 Environment-Specific Notes

### Production

- Higher security settings
- Reduced logging (cost)
- Full feature set enabled
- Real users accessing

### Staging

- Same as production (test thoroughly)
- Can enable debug logging
- Test new features

### Development

- All features enabled
- Full logging
- Debug mode on

---

## 📞 Emergency Contacts

| Role | Contact |
|------|--------|
| On-Call Engineer | [oncall@example.com](mailto:oncall@example.com) |
| Tech Lead | [techlead@example.com](mailto:techlead@example.com) |
| Database Admin | [dba@example.com](mailto:dba@example.com) |
| PagerDuty | [your-pagerduty-url](https://your-pagerduty.com) |

---

## ✅ Post-Deployment Sign-Off

After successful deployment:

- [ ] All smoke tests passing
- [ ] No errors in logs
- [ ] Health check endpoint responding
- [ ] Stakeholders notified
- [ ] Incident ticket created (if needed)

**Deployed by:** _________________

**Date:** _________________

**Verified by:** _________________

---

## 📚 Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [PagerDuty Alerts](https://support.pagerduty.com/docs/alerts)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Last Updated**: 2026-03-31
