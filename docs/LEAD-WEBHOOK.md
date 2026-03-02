# Lead Creation Webhook

This webhook creates a new lead in Socials CRM from an external system.

## Endpoint

- Method: `POST`
- URL: `https://bkemtvqmbpxopuasgxcq.supabase.co/functions/v1/create-lead-webhook`

## Authentication

The webhook uses a shared secret stored in Supabase Edge Function secrets as `WEBHOOK_SECRET`.

Pass the same token in one of these headers:

- `x-webhook-secret: <token>`
- `Authorization: Bearer <token>`

## Required fields

- `company_name` (string, non-empty)
- `ico` (string, non-empty)
- `contact_name` (string, non-empty)

## Optional fields

- Company and billing:
  - `dic`
  - `website`
  - `industry`
  - `billing_street`
  - `billing_city`
  - `billing_zip`
  - `billing_country`
  - `billing_email`
- Contact:
  - `contact_position`
  - `contact_email`
  - `contact_phone`
- Sales:
  - `stage`
  - `owner_id`
  - `source`
  - `source_custom`
  - `client_message`
  - `ad_spend_monthly`
  - `summary`
  - `potential_service`
  - `estimated_price`
  - `currency`
  - `probability_percent`
  - `offer_url`
- Court info:
  - `court_name`
  - `court_file_number`

## Validation rules

The function rejects invalid values with `400`.

- `source` must be one of:
  - `referral`, `inbound`, `cold_outreach`, `event`, `linkedin`, `website`, `other`
- `stage` must be one of:
  - `new_lead`, `meeting_done`, `waiting_access`, `access_received`, `preparing_offer`, `offer_sent`, `won`, `lost`, `postponed`
- `industry` must be one of:
  - `Ecommerce`, `LeadGen`
- `source_custom` is allowed only when `source = "other"`
- `owner_id` (if provided):
  - must exist in `colleagues`
  - colleague status must be `active`

## Request example

```bash
curl -X POST "https://bkemtvqmbpxopuasgxcq.supabase.co/functions/v1/create-lead-webhook" \
 -H "Content-Type: application/json" \
 -H "x-webhook-secret: your-shared-secret" \
 -d '{
  "company_name": "ACME s.r.o.",
  "ico": "12345678",
  "dic": "CZ12345678",
  "website": "https://acme.cz",
  "industry": "Ecommerce",
  "billing_street": "Vaclavske namesti 1",
  "billing_city": "Praha",
  "billing_zip": "11000",
  "billing_country": "Ceska republika",
  "billing_email": "fakturace@acme.cz",
  "contact_name": "Jan Novak",
  "contact_position": "CEO",
  "contact_email": "jan.novak@acme.cz",
  "contact_phone": "+420777123456",
  "stage": "new_lead",
  "owner_id": "00000000-0000-0000-0000-000000000000",
  "source": "website",
  "source_custom": "",
  "client_message": "Interested in growth support",
  "ad_spend_monthly": 120000,
  "summary": "Inbound lead from website",
  "potential_service": "Performance Marketing + Creative",
  "estimated_price": 45000,
  "currency": "CZK",
  "probability_percent": 30,
  "offer_url": "https://example.com/offer/acme",
  "court_name": "Mestsky soud v Praze",
  "court_file_number": "C 123456"
 }'
```

## Success response

- Status: `201`
- Body:

```json
{
  "success": true,
  "lead_id": "uuid"
}
```

## Error responses

- `400` invalid payload or invalid enum value
- `401` missing/invalid webhook secret
- `405` method is not `POST`
- `500` internal error or webhook secret not configured

## Logging

Each request is logged into `integration_log` with:

- `service = "lead_webhook"`
- `action = "create_lead"`
- success/error status, payload, error message, and duration
