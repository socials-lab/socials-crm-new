# Debugging Guide

This document provides comprehensive debugging tips for the Socials CRM application, covering all layers: frontend, backend (Supabase Edge Functions), database, and external integrations.

---

## Table of Contents

1. [Frontend Debugging (React + Sentry)](#frontend-debugging)
2. [Database Audit Logs](#database-audit-logs)
3. [Edge Function Logs](#edge-function-logs)
4. [Integration Logs](#integration-logs)
5. [Common Issues & Solutions](#common-issues--solutions)

---

## Frontend Debugging

### Sentry Error Tracking

Sentry is integrated for automatic error capture, performance monitoring, and session replay.

#### Configuration
- DSN is configured via `VITE_SENTRY_DSN` environment variable
- If DSN is not set, Sentry is disabled (app still works)
- Environment is automatically set based on `import.meta.env.MODE`

#### What Sentry Captures Automatically
- **Unhandled exceptions** - JavaScript errors anywhere in the app
- **Console logs** - All `console.log`, `console.error`, etc. are captured as breadcrumbs
- **Network requests** - XHR/Fetch requests are logged
- **User actions** - Clicks, navigation, form submissions
- **Session replay** - Video-like recordings of user sessions (on errors)

#### Manual Action Tracking

Use the `trackAction` utility for explicit breadcrumbs:

```typescript
import { trackAction, trackPageView, trackApiCall } from '@/lib/analytics';

// Track user actions
trackAction('lead_stage_changed', { leadId: '123', from: 'new_lead', to: 'meeting_done' });

// Track page views
trackPageView('/clients');

// Track API calls
trackApiCall('/api/invoices', 'POST', true, { invoiceId: '456' });
```

#### Viewing Errors in Sentry

1. Go to [sentry.io](https://sentry.io) and select your project
2. Navigate to **Issues** to see all errors
3. Click on an issue to see:
   - Stack trace
   - Breadcrumbs (user actions leading to error)
   - User info (id, email)
   - Session replay (if available)

#### User Context

User info is automatically set on login and cleared on logout:
- `id` - Supabase user ID
- `email` - User email

---

## Database Audit Logs

### History Tables

All key entities have dedicated history tables with human-readable audit trails:

| Entity | History Table | Change Types |
|--------|---------------|--------------|
| Leads | `lead_history` | created, stage_change, status_change, field_update, note_added, owner_change, converted, lost, deleted |
| Engagements | `engagement_history` | created, status_change, field_update, assignment_added, assignment_removed, service_added, service_removed, deleted |
| Clients | `client_history` | created, status_change, tier_change, field_update, contact_added, contact_removed, deleted |
| Applicants | `applicant_history` | created, stage_change, field_update, note_added, converted, deleted |
| Extra Work | `extra_work_history` | created, status_change, invoiced, field_update, deleted |
| Meetings | `meeting_history` | created, status_change, rescheduled, cancelled, field_update, participant_added, participant_removed, deleted |

### Querying History

```sql
-- Get all changes for a specific lead
SELECT * FROM lead_history 
WHERE lead_id = 'uuid-here' 
ORDER BY created_at DESC;

-- Get all changes by a specific user
SELECT * FROM lead_history 
WHERE changed_by = 'user-uuid-here' 
ORDER BY created_at DESC;

-- Get all changes in the last 24 hours
SELECT * FROM lead_history 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Get stage changes only
SELECT * FROM lead_history 
WHERE change_type = 'stage_change'
ORDER BY created_at DESC;
```

### System Changes

When `changed_by` is NULL and `changed_by_name` is 'System', the change was made by:
- Webhooks (Fakturoid, DigiSign)
- Scheduled jobs
- Edge Functions without user context

---

## Edge Function Logs

### Supabase Log Explorer

Access via: **Supabase Dashboard → Logs → Edge Functions**

All Edge Functions use structured JSON logging:

```typescript
console.log(JSON.stringify({
  event: 'invoice_created',
  invoice_id: '123',
  client_id: '456',
  amount: 50000,
  timestamp: new Date().toISOString()
}));
```

### Filtering Logs

In Log Explorer, use these filters:

```sql
-- Find all errors
SELECT * FROM edge_logs 
WHERE level = 'error'
ORDER BY timestamp DESC;

-- Find specific function logs
SELECT * FROM edge_logs 
WHERE function_name = 'fakturoid-create-invoice'
ORDER BY timestamp DESC;

-- Search for specific invoice
SELECT * FROM edge_logs 
WHERE message LIKE '%invoice_id%123%'
ORDER BY timestamp DESC;
```

---

## Integration Logs

### Integration Log Table

All external API calls are logged to the `integration_log` table:

```sql
-- Schema
CREATE TABLE integration_log (
  id UUID PRIMARY KEY,
  service TEXT,              -- 'fakturoid', 'digisign', 'ares', 'google_calendar'
  action TEXT,               -- 'create_invoice', 'webhook_invoice_update', etc.
  related_table TEXT,        -- 'leads', 'issued_invoices', 'meetings'
  related_record_id UUID,
  request_payload JSONB,
  response_status INTEGER,
  response_payload JSONB,
  is_success BOOLEAN,
  error_message TEXT,
  triggered_by UUID,         -- User who triggered (NULL for webhooks)
  duration_ms INTEGER,
  created_at TIMESTAMPTZ
);
```

### Querying Integration Logs

```sql
-- Get all failed API calls
SELECT * FROM integration_log 
WHERE is_success = FALSE 
ORDER BY created_at DESC;

-- Get all Fakturoid errors in last 7 days
SELECT * FROM integration_log 
WHERE service = 'fakturoid' 
  AND is_success = FALSE 
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Get slow API calls (> 5 seconds)
SELECT * FROM integration_log 
WHERE duration_ms > 5000 
ORDER BY duration_ms DESC;

-- Get all actions for a specific invoice
SELECT * FROM integration_log 
WHERE related_table = 'issued_invoices' 
  AND related_record_id = 'invoice-uuid-here'
ORDER BY created_at DESC;

-- Get webhook history
SELECT * FROM integration_log 
WHERE action LIKE 'webhook%' 
ORDER BY created_at DESC;
```

### Service-Specific Debugging

#### Fakturoid
```sql
-- All Fakturoid invoice creation attempts
SELECT 
  created_at,
  is_success,
  error_message,
  request_payload->>'subject_id' as fakturoid_subject_id,
  response_status,
  duration_ms
FROM integration_log 
WHERE service = 'fakturoid' AND action = 'create_invoice'
ORDER BY created_at DESC;
```

#### DigiSign
```sql
-- All DigiSign contract creations
SELECT 
  created_at,
  is_success,
  related_record_id as lead_id,
  response_payload->>'id' as digisign_envelope_id,
  error_message
FROM integration_log 
WHERE service = 'digisign' AND action = 'create_contract'
ORDER BY created_at DESC;
```

#### ARES
```sql
-- Company lookups
SELECT 
  created_at,
  request_payload->>'ico' as ico,
  response_payload->>'name' as company_name,
  is_success,
  duration_ms
FROM integration_log 
WHERE service = 'ares'
ORDER BY created_at DESC;
```

---

## Common Issues & Solutions

### Issue: User action not logged

**Symptoms**: Change happened but no history entry

**Cause**: Trigger might not be active or user context is missing

**Solution**:
```sql
-- Check if triggers exist
SELECT tgname, tgenabled FROM pg_trigger 
WHERE tgrelid = 'leads'::regclass;

-- Check if RLS is blocking inserts
SELECT * FROM pg_policies WHERE tablename = 'lead_history';
```

### Issue: Webhook not processing

**Symptoms**: External system sent webhook, nothing happened

**Check**:
1. Look in `integration_log` for webhook entry
2. Check Edge Function logs in Supabase dashboard
3. Verify webhook secret is configured

```sql
-- Find recent webhook attempts
SELECT * FROM integration_log 
WHERE action LIKE 'webhook%' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Issue: Invoice creation failed

**Symptoms**: Error when sending to Fakturoid

**Debug steps**:
```sql
-- Get the error details
SELECT 
  error_message,
  request_payload,
  response_payload
FROM integration_log 
WHERE service = 'fakturoid' 
  AND related_record_id = 'invoice-uuid-here'
ORDER BY created_at DESC 
LIMIT 1;
```

Common causes:
- Missing `fakturoid_subject_id` on client
- Invalid VAT rate
- API credentials expired

### Issue: Frontend error without Sentry

**Symptoms**: User reports error, nothing in Sentry

**Causes**:
1. `VITE_SENTRY_DSN` not configured
2. Error in Sentry initialization itself
3. User has ad blocker blocking Sentry

**Solution**: Check browser console for Sentry initialization errors

### Issue: Slow queries

**Debug**:
```sql
-- Find slow integration calls
SELECT 
  service,
  action,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration,
  COUNT(*) as call_count
FROM integration_log 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY service, action
ORDER BY avg_duration DESC;
```

---

## Quick Reference

### Log Locations

| What | Where |
|------|-------|
| Frontend errors | Sentry Dashboard |
| Edge Function logs | Supabase Log Explorer |
| Database audit | `*_history` tables |
| Integration logs | `integration_log` table |
| Webhook events | `integration_log` (action LIKE 'webhook%') |

### Key Tables for Debugging

```sql
-- Recent history across all entities
SELECT 'lead' as entity, id, lead_id as record_id, change_type, changed_by_name, created_at 
FROM lead_history 
WHERE created_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 'engagement', id, engagement_id, change_type::text, changed_by_name, created_at 
FROM engagement_history 
WHERE created_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 'client', id, client_id, change_type::text, changed_by_name, created_at 
FROM client_history 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Useful Dashboard Queries

```sql
-- Daily error rate by service
SELECT 
  DATE(created_at) as date,
  service,
  COUNT(*) FILTER (WHERE is_success = TRUE) as success,
  COUNT(*) FILTER (WHERE is_success = FALSE) as errors,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_success = FALSE) / COUNT(*), 2) as error_rate
FROM integration_log 
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), service
ORDER BY date DESC, service;
```
