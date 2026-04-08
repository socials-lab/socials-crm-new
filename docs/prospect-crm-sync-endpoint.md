# Prospect CRM Sync Endpoint

Endpoint for syncing webinar / lead magnet / survey events into CRM prospects.

## Endpoint

- URL: `POST /functions/v1/prospect-crm-sync`
- Auth: header `x-webhook-secret: <secret>` or `Authorization: Bearer <secret>`
- Secret env var on Supabase: `PROSPECT_SYNC_WEBHOOK_SECRET` (fallback: `WEBHOOK_SECRET`)

## Request payload

```json
{
  "name": "Jan Novak",
  "email": "jan@example.com",
  "phone": "+420777123456",
  "company": "Acme s.r.o.",
  "event_type": "webinar_registration",
  "event_title": "Webinar: Jak skalovat Meta Ads",
  "occurred_at": "2026-04-08T10:15:00.000Z",
  "source_system": "webinar_platform",
  "external_contact_id": "ext-123",
  "metadata": {
    "campaign": "spring-webinar",
    "form_id": "frm_987"
  }
}
```

## Supported `event_type`

- `webinar_registration`
- `webinar_attended`
- `lead_magnet_registration`
- `lead_magnet_download`
- `satisfaction_survey_submitted`
- `custom`

## Behavior

- Upsert prospect by email (case-insensitive):
  - existing prospect -> updates `name`, optional `phone`, optional `company`
  - new prospect -> creates a new row in `prospects`
- Inserts one row into `prospect_interactions` with:
  - mapped CRM interaction type
  - `event_title`
  - metadata including original event type and source fields
- If the prospect is already converted to lead, appends a lead note + lead history entry.

## Response example

```json
{
  "success": true,
  "action": "updated",
  "prospect_id": "1f2e3d4c-...",
  "lead_id": "7a8b9c0d-...",
  "interaction_type": "lead_magnet_download"
}
```
