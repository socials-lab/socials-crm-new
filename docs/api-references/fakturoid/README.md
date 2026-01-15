# Fakturoid API v3

Documentation: https://www.fakturoid.cz/api/v3

## Base URL

`https://app.fakturoid.cz/api/v3`

Most endpoints include the account slug in the path, e.g.
`/accounts/{slug}/invoices.json`.

## Request Formalities

- All requests must be HTTPS.
- `User-Agent` header is required (include app name and contact email).
- JSON payloads require `Content-Type: application/json`.

## Rate Limiting

Rate-limit headers follow `X-RateLimit-Policy` and `X-RateLimit` with `429` on limit.

## Sections

- `auth.md` – OAuth flows and token usage.
- `subjects.md` – client (subject) CRUD.
- `invoices.md` – invoice CRUD and actions.
- `invoice-lines.md` – invoice line behavior and VAT notes.
- `webhooks.md` – webhook setup and delivery.
