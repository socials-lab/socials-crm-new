# Webhooks

Source: https://www.fakturoid.cz/api/v3/webhooks

## Endpoints

- `GET /accounts/{slug}/webhooks.json` – list webhooks
- `GET /accounts/{slug}/webhooks/{id}.json` – webhook detail
- `POST /accounts/{slug}/webhooks.json` – create
- `PATCH /accounts/{slug}/webhooks/{id}.json` – update
- `DELETE /accounts/{slug}/webhooks/{id}.json` – delete

## Attributes

- `webhook_url` – endpoint URL
- `auth_header` – value sent as `Authorization` header (optional)
- `events` – array of event names
- `active` – boolean

## Delivery

- Webhooks are delivered as HTTP `POST` with JSON payload.
- Receiver must respond with 2xx within 30 seconds.
- Retries: up to 5 attempts with exponential backoff.

## Restrictions

- Webhooks are available only on paid plans.
- OAuth integrations must be authorized to manage webhooks.
