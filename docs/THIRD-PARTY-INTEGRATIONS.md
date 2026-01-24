# Third-Party Integrations – Current State

This document provides a comprehensive overview of all external service integrations in Socials CRM, including their implementation status, where they're used, and technical details.

---

## Integration Summary

| Service | Purpose | Status | Implementation Level |
|---------|---------|--------|---------------------|
| **Fakturoid** | Invoice creation & tracking | ✅ Implemented | Full (Edge Function + Webhook + UI) |
| **DigiSign** | Electronic contract signing | ✅ Implemented | Full (Edge Function + Webhook + UI) |
| **Google Calendar** | Meeting sync & invites | ✅ Implemented | Full (OAuth + Edge Functions + UI) |
| **ARES** | Czech company registry lookup | ✅ Implemented | Full (Edge Function + UI) |
| **Resend** | Email sending | ✅ Implemented | Full (Edge Function) |
| **Freelo** | Project management | 🔗 URL Only | Manual link storage |
| **Notion** | Documents & SOPs | 🔗 URL Only | Manual link storage |

---

## 1. Fakturoid Integration

### Overview
Fakturoid is the Czech invoicing system used to create, manage, and track invoices. The integration allows automatic creation of invoices from CRM data and receives status updates via webhooks.

### Implementation Components

#### Supabase Edge Functions

| Function | Path | Purpose |
|----------|------|---------|
| `fakturoid-create-invoice` | `supabase/functions/fakturoid-create-invoice/index.ts` | Creates invoice in Fakturoid from CRM invoice data |
| `fakturoid-webhook` | `supabase/functions/fakturoid-webhook/index.ts` | Receives payment status updates (paid, sent, overdue) |

#### Frontend Hook
- **File**: `src/hooks/useFakturoid.tsx`
- **Functions**:
  - `createInvoiceInFakturoid(invoiceId)` - Triggers invoice creation
  - `syncInvoiceStatus(invoiceId)` - Manual status sync (note: automatic via webhooks)

#### UI Integration
- **File**: `src/components/invoicing/InvoiceHistory.tsx`
- **Features**:
  - "Fakturoid" button to create invoice in Fakturoid
  - Direct link to invoice in Fakturoid (opens in new tab)
  - Status indicator showing Fakturoid sync state

#### Database Fields

**`clients` table:**
```sql
fakturoid_subject_id INTEGER  -- Links CRM client to Fakturoid subject
```

**`issued_invoices` table:**
```sql
fakturoid_id TEXT     -- Fakturoid invoice ID
fakturoid_url TEXT    -- Direct URL to invoice in Fakturoid
```

#### Environment Variables
```
FAKTUROID_ACCOUNT_SLUG  -- Your Fakturoid account slug
FAKTUROID_API_KEY       -- API key for authentication
FAKTUROID_WEBHOOK_SECRET -- Secret for webhook signature verification
```

#### Data Flow
```
CRM Invoice Created → User clicks "Fakturoid" →
Edge Function creates invoice in Fakturoid →
fakturoid_id + fakturoid_url saved to DB →
UI shows direct link

Fakturoid payment received → Webhook fires →
Edge Function updates invoice status in DB →
UI reflects new status (paid/overdue)
```

#### Current Limitations
- Uses API v2 (docs reference v3, but implementation uses v2)
- Basic auth used instead of OAuth
- Requires `fakturoid_subject_id` on client before creating invoices
- VAT rate hardcoded to 21%

---

## 2. DigiSign Integration

### Overview
DigiSign is an electronic signature platform used to send contracts for signing. The integration creates envelopes from lead data and tracks signing status via webhooks.

### Implementation Components

#### Supabase Edge Functions

| Function | Path | Purpose |
|----------|------|---------|
| `digisign-create-contract` | `supabase/functions/digisign-create-contract/index.ts` | Creates contract envelope from lead data |
| `digisign-webhook` | `supabase/functions/digisign-webhook/index.ts` | Receives signing status updates |

#### Frontend Hook
- **File**: `src/hooks/useDigiSign.tsx`
- **Functions**:
  - `createContract(leadId, templateId?)` - Creates contract for a lead
  - `getContractStatus(leadId)` - Fetches current contract status

#### UI Integration
- **File**: `src/components/leads/LeadDetailSheet.tsx`
- **Features**:
  - "Create Contract" button (visible after onboarding form completed)
  - Contract URL link to DigiSign
  - Signing status display with timestamps
  - Visual progress indicators (created → sent → signed)

#### Database Fields

**`leads` table:**
```sql
digisign_id TEXT           -- DigiSign envelope ID
contract_url TEXT          -- URL to contract/signing page
contract_created_at TIMESTAMPTZ  -- When contract was created
contract_signed_at TIMESTAMPTZ   -- When fully signed
```

#### Environment Variables
```
DIGISIGN_ACCESS_KEY         -- Access key for API auth (exchanged for bearer token)
DIGISIGN_SECRET_KEY         -- Secret key for API auth (exchanged for bearer token)
DIGISIGN_WEBHOOK_SECRET     -- Secret for webhook signature verification (REQUIRED)
PDF_GENERATOR_URL           -- URL of PDF generator service
```

#### Data Flow
```
Lead has onboarding completed → User clicks "Create Contract" →
Edge Function creates envelope in DigiSign and sends automatically →
digisign_id + contract_url saved to DB →
UI shows contract link and "Waiting for signature" status

Client signs contract → Webhook fires →
Edge Function updates contract_signed_at →
UI shows "Signed" status
```

#### Webhook Events Handled
- `envelopeCompleted` - All signatures collected (updates `contract_signed_at`)
- `envelopeDeclined` - Signer declined to sign (logged only)
- `envelopeExpired` - Envelope expired before completion (logged only)

#### Contract Data Sent
```typescript
{
  company_name, ico, dic,
  contact_name, contact_email, contact_phone,
  billing_street, billing_city, billing_zip, billing_country,
  services: [],
  estimated_price, currency
}
```

#### Implementation Details
- Uses correct API URL: `https://api.digisign.org/api`
- Implements full 7-step workflow (auth → envelope → upload → document → recipients → tags → send)
- HMAC-SHA256 webhook signature verification with 5-minute replay protection
- Supports 2 signers per contract (Socials representative + client signatory)
- Uses placeholder-based signature tags (`PODPIS1`, `PODPIS2`)
- PDF generated dynamically from contract template with client data

#### Current Limitations
- Hardcoded Socials signer info (should be environment variables)
- Only 2 signers supported (limited by PDF template placeholders)
- No contract template selection (templateId parameter unused)

---

## 3. Google Calendar Integration

### Overview
Google Calendar integration enables syncing meetings from CRM to users' Google Calendars and sending calendar invitations to participants.

### Implementation Components

#### Supabase Edge Functions

| Function | Path | Purpose |
|----------|------|---------|
| `calendar-oauth-callback` | `supabase/functions/calendar-oauth-callback/index.ts` | Handles OAuth callback, stores tokens |
| `calendar-refresh-token` | `supabase/functions/calendar-refresh-token/index.ts` | Refreshes expired access tokens |
| `calendar-create-event` | `supabase/functions/calendar-create-event/index.ts` | Creates calendar event from meeting |

#### Frontend Hook
- **File**: `src/hooks/useGoogleCalendar.tsx`
- **Functions**:
  - `connectGoogleCalendar()` - Initiates OAuth flow
  - `handleOAuthCallback(code)` - Processes OAuth callback
  - `createCalendarEvent(meetingId)` - Creates event in Google Calendar
  - `checkConnection()` - Verifies if user has valid token
  - `isConnected` - Boolean state for connection status

#### UI Integration

**Meetings Page** (`src/pages/Meetings.tsx`):
- "Connect Google Calendar" button when not connected
- Connection status indicator

**Meeting Detail Sheet** (`src/components/meetings/MeetingDetailSheet.tsx`):
- "Send Calendar Invites" button
- Sent status with timestamp
- Disabled when not connected

**Add Meeting Dialog** (`src/components/meetings/AddMeetingDialog.tsx`):
- Option to send calendar invites on meeting creation

#### Database Tables

**`calendar_tokens` table:**
```sql
CREATE TABLE calendar_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ
);
```

**`meetings` table:**
```sql
google_event_id TEXT           -- Google Calendar event ID
calendar_invites_sent_at TIMESTAMPTZ  -- When invites were sent
```

#### Environment Variables
```
GOOGLE_CLIENT_ID       -- OAuth client ID
GOOGLE_CLIENT_SECRET   -- OAuth client secret
VITE_GOOGLE_CLIENT_ID  -- Client-side client ID for OAuth redirect
```

#### OAuth Flow
```
User clicks "Connect Google Calendar" →
Redirect to Google OAuth consent screen →
User grants calendar access →
Callback with authorization code →
Edge Function exchanges code for tokens →
Tokens stored in calendar_tokens table →
User is now connected
```

#### Calendar Event Creation
```
User clicks "Send Calendar Invites" →
Edge Function fetches meeting + participants →
Creates event in user's primary calendar →
google_event_id stored in meetings table →
calendar_invites_sent_at updated →
UI shows "Sent" status
```

#### Event Data Sent
```typescript
{
  summary: meeting.title,
  description: meeting.description || meeting.agenda,
  start: { dateTime, timeZone: 'Europe/Prague' },
  end: { dateTime, timeZone: 'Europe/Prague' },
  location: meeting.location,
  attendees: [{ email }...],
  conferenceData: { ... }  // Optional Google Meet
}
```

#### Current Limitations
- Per-user OAuth required (no service account)
- No two-way sync (CRM → Calendar only)
- Token refresh not automatic before event creation
- Uses user's primary calendar only

---

## 4. ARES Integration

### Overview
ARES (Administrativní registr ekonomických subjektů) is the Czech business registry. The integration allows automatic lookup of company data by IČO (registration number).

### Implementation Components

#### Supabase Edge Function
- **Path**: `supabase/functions/ares-lookup/index.ts`
- **Endpoint**: `POST /ares-lookup`
- **Input**: `{ ico: string }`

#### Frontend Hook
- **File**: `src/hooks/useAresLookup.tsx`
- **Function**: `lookupCompany(ico)` - Returns company data or null

#### UI Integration
- **File**: `src/components/leads/AddLeadDialog.tsx`
- **Features**:
  - Lookup button next to IČO field
  - Auto-fills company name, address, DIČ on success
  - Loading indicator during lookup

#### Response Data
```typescript
{
  ico: string,      // Registration number
  name: string,     // Company name (obchodniJmeno)
  address: string,  // Full address (sidlo.textovaAdresa)
  dic: string | null,  // VAT ID
  legal_form: string | null  // Legal form (pravniForma)
}
```

#### Error Handling
- Invalid IČO format (must be 8 digits): 400 error
- Company not found: 404 error
- ARES API errors: 500 error

#### Rate Limits
According to ARES documentation:
- 500 requests per minute maximum
- May block repeated invalid/duplicate queries

---

## 5. Email Sending (Resend)

### Overview
Email functionality is powered by Resend, a modern email API. It's used for various transactional emails throughout the CRM.

### Implementation Component

#### Supabase Edge Function
- **Path**: `supabase/functions/send-email/index.ts`
- **Endpoint**: `POST /send-email`

#### Input Format
```typescript
{
  to: string,
  subject: string,
  html: string,
  from?: string  // Optional, defaults to FROM_EMAIL env var
}
```

#### Environment Variables
```
RESEND_API_KEY  -- API key from Resend
FROM_EMAIL      -- Default sender email address
```

#### Use Cases
1. **Access Request Email** - Request for ad account access from client
2. **Onboarding Form Link** - Link to onboarding form for client
3. **Interview Invitation** - Invite applicants to interviews
4. **Rejection Email** - Polite rejection for applicants
5. **User Invitation** - New CRM user account invitation

---

## 6. URL-Only Integrations

These services don't have API integrations but store URLs for manual access:

### Freelo
- **Purpose**: Project management tool
- **Storage**: `engagements.freelo_project_url`
- **Usage**: Link displayed in engagement details

### Notion
- **Purpose**: Documents, offers, SOPs
- **Storage**: `leads.offer_url`, dashboard SOP links
- **Usage**: Links open Notion pages in new tab

---

## Database Migration Reference

### Migration 008: Calendar Tokens
```sql
-- supabase/migrations/008_calendar_tokens.sql
CREATE TABLE calendar_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 009: External Integrations
```sql
-- supabase/migrations/009_external_integrations.sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fakturoid_subject_id INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS digisign_id TEXT;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS google_event_id TEXT;
```

---

## Environment Variables Summary

### Required for Full Integration

```env
# Fakturoid
FAKTUROID_ACCOUNT_SLUG=your-account-slug
FAKTUROID_API_KEY=your-api-key
FAKTUROID_WEBHOOK_SECRET=webhook-secret

# DigiSign
DIGISIGN_ACCESS_KEY=your-access-key
DIGISIGN_SECRET_KEY=your-secret-key
DIGISIGN_WEBHOOK_SECRET=webhook-secret  # REQUIRED for security
PDF_GENERATOR_URL=http://your-pdf-generator:8094

# Google Calendar
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
VITE_GOOGLE_CLIENT_ID=same-as-above  # For frontend

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxx
FROM_EMAIL=noreply@yourdomain.com

# Supabase (auto-configured)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

---

## Webhook Endpoints

Configure these URLs in each service's dashboard:

| Service | Webhook URL |
|---------|-------------|
| Fakturoid | `https://<project-ref>.supabase.co/functions/v1/fakturoid-webhook` |
| DigiSign | `https://<project-ref>.supabase.co/functions/v1/digisign-webhook` |

---

## UI Components Using Integrations

| Component | File | Integrations Used |
|-----------|------|-------------------|
| InvoiceHistory | `src/components/invoicing/InvoiceHistory.tsx` | Fakturoid |
| IssueInvoicesDialog | `src/components/invoicing/IssueInvoicesDialog.tsx` | Fakturoid |
| LeadDetailSheet | `src/components/leads/LeadDetailSheet.tsx` | DigiSign |
| AddLeadDialog | `src/components/leads/AddLeadDialog.tsx` | ARES |
| MeetingDetailSheet | `src/components/meetings/MeetingDetailSheet.tsx` | Google Calendar |
| AddMeetingDialog | `src/components/meetings/AddMeetingDialog.tsx` | Google Calendar |
| Meetings Page | `src/pages/Meetings.tsx` | Google Calendar |

---

## Testing Integrations

### Fakturoid
1. Ensure client has `fakturoid_subject_id` set
2. Create invoice in CRM
3. Click "Fakturoid" button in Invoice History
4. Verify invoice appears in Fakturoid
5. Mark as paid in Fakturoid
6. Verify webhook updates status in CRM

### DigiSign
1. Complete onboarding form for a lead
2. Click "Create Contract" in lead details
3. Verify envelope created in DigiSign
4. Complete signing in DigiSign
5. Verify webhook updates `contract_signed_at`

### Google Calendar
1. Click "Connect Google Calendar" in Meetings
2. Complete OAuth consent flow
3. Create a meeting with participants
4. Click "Send Calendar Invites"
5. Verify event appears in Google Calendar

### ARES
1. Open Add Lead dialog
2. Enter valid Czech IČO (e.g., 27074358)
3. Click lookup button
4. Verify company data is auto-filled

---

## Known Issues & Improvements Needed

### Fakturoid
- [ ] Upgrade to API v3 (currently using v2)
- [ ] Implement OAuth flow instead of API key
- [ ] Dynamic VAT rate based on service type
- [ ] Automatic subject creation when client is created

### DigiSign
- [x] ~~Verify correct API endpoint URL~~ (Fixed: uses `api.digisign.org`)
- [x] ~~Implement proper webhook signature verification~~ (Fixed: HMAC-SHA256 with replay protection, now required)
- [x] ~~Support multiple signers per contract~~ (Fixed: supports 2 signers)
- [ ] Move hardcoded signer info to environment variables
- [ ] Template selection UI
- [ ] Support more than 2 signers (requires PDF template changes)

### Google Calendar
- [ ] Automatic token refresh before operations
- [ ] Support calendar selection (not just primary)
- [ ] Two-way sync for meeting updates
- [ ] Handle event deletions

### General
- [ ] Add integration status dashboard
- [ ] Logging and error tracking for all webhooks
- [ ] Rate limiting awareness
- [ ] Retry logic for failed API calls
