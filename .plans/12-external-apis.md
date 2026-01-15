# Sub-Plan 12: External API Integrations

## Status: Not Started

## Scope
Integrate with external services: Fakturoid (invoicing), DigiSign (contracts), and Google Calendar.

## Goals
- [ ] Implement Fakturoid integration for invoice creation
- [ ] Implement DigiSign integration for electronic signatures
- [ ] Implement Google Calendar integration
- [ ] Set up webhooks for status updates

## Integrations Overview

| Service | Purpose | Type |
|---------|---------|------|
| Fakturoid | Create and track invoices | REST API + Webhooks |
| DigiSign | Electronic contract signing | REST API + Webhooks |
| Google Calendar | Sync meetings, send invites | OAuth + Calendar API |

---

## 1. Fakturoid Integration

### Features
- Create invoice from CRM data
- Store Fakturoid ID and URL
- Track payment status via webhook
- Link to issued_invoices table

### Implementation

#### Edge Function: fakturoid-create-invoice
- [ ] Accept invoice data from frontend
- [ ] Map to Fakturoid invoice format
- [ ] Create invoice via Fakturoid API
- [ ] Return fakturoid_id and fakturoid_url
- [ ] Update issued_invoices record

#### Webhook: fakturoid-webhook
- [ ] Receive payment status updates
- [ ] Update invoice status (paid)
- [ ] Update paid_at timestamp

### API Details
```
Base URL: https://app.fakturoid.cz/api/v2
Auth: API key in header
```

### Environment Variables
- FAKTUROID_ACCOUNT_SLUG
- FAKTUROID_API_KEY
- FAKTUROID_WEBHOOK_SECRET

---

## 2. DigiSign Integration

### Features
- Generate contract from template
- Send for electronic signature
- Track signing status
- Store signed document URL

### Implementation

#### Edge Function: digisign-create-contract
- [ ] Accept contract data (client, services, terms)
- [ ] Generate contract document (or use template)
- [ ] Send to DigiSign
- [ ] Return contract ID
- [ ] Update lead.contract_url

#### Edge Function: digisign-send-for-signing
- [ ] Send contract to signatories
- [ ] Track contract_sent_at

#### Webhook: digisign-webhook
- [ ] Receive signing status updates
- [ ] Update contract_signed_at when complete
- [ ] Store signed document URL

### Environment Variables
- DIGISIGN_API_KEY
- DIGISIGN_WEBHOOK_SECRET

---

## 3. Google Calendar Integration

### Features
- Create calendar events for meetings
- Send invites to participants
- Sync meeting status
- Two-way sync (optional)

### Implementation

#### OAuth Setup
- [ ] Configure Google OAuth in Supabase
- [ ] Store refresh tokens securely
- [ ] Handle token refresh

#### Edge Function: calendar-create-event
- [ ] Create calendar event
- [ ] Add participants as attendees
- [ ] Store event ID
- [ ] Update calendar_invites_sent_at

#### Edge Function: calendar-update-event
- [ ] Update event details
- [ ] Handle cancellations

### Environment Variables
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/fakturoid-create-invoice/index.ts` | Create Fakturoid invoice |
| `supabase/functions/fakturoid-webhook/index.ts` | Handle Fakturoid webhooks |
| `supabase/functions/digisign-create-contract/index.ts` | Create DigiSign contract |
| `supabase/functions/digisign-webhook/index.ts` | Handle DigiSign webhooks |
| `supabase/functions/calendar-create-event/index.ts` | Create calendar event |

## Frontend Integration

### Invoicing Page
- [ ] "Create in Fakturoid" button
- [ ] Display Fakturoid link
- [ ] Show payment status

### Lead/Engagement
- [ ] "Create Contract" button
- [ ] "Send for Signing" button
- [ ] Display signing status

### Meetings
- [ ] "Send Calendar Invites" button
- [ ] Display summary in sheet

## Webhook Setup

Configure in each service's dashboard:
- Fakturoid: Settings → Webhooks → Add endpoint
- DigiSign: Settings → Webhooks → Add endpoint

Webhook URLs:
```
https://<project>.supabase.co/functions/v1/fakturoid-webhook
https://<project>.supabase.co/functions/v1/digisign-webhook
```

## Testing Checklist
- [ ] Fakturoid invoice creation works
- [ ] Fakturoid ID/URL stored in database
- [ ] Fakturoid webhook updates payment status
- [ ] DigiSign contract creation works
- [ ] DigiSign signing flow works
- [ ] DigiSign webhook updates contract status
- [ ] Google Calendar event creation works
- [ ] Calendar invites sent to participants
- [ ] All integrations handle errors gracefully
- [ ] Webhook signatures validated

## Notes
- Start with Fakturoid as it's most commonly used
- DigiSign may require template setup in their dashboard
- Google Calendar requires per-user OAuth consent
- Webhook endpoints should validate signatures
