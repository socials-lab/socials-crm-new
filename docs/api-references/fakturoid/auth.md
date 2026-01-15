# Authentication

Source: https://www.fakturoid.cz/api/v3/authorization

## OAuth 2.0 Flows

Fakturoid supports OAuth 2.0 with:

- Authorization Code Flow (multi-tenant apps)
- Client Credentials Flow (single account/scripts)

### Authorization Code Flow

Start authorization by redirecting to:

`https://app.fakturoid.cz/api/v3/oauth`

Required query params: `client_id`, `redirect_uri`, `response_type=code`, optional `state`.

### Token Exchange

Use `POST /oauth/token` to exchange code for access and refresh tokens.

### Refresh Token

Access tokens expire after 2 hours. Refresh with `POST /oauth/token` (refresh flow).

### Revoke

`POST /oauth/revoke` revokes access and refresh tokens.

## Using the Token

Include in requests:

`Authorization: Bearer <access_token>`

Required headers:

- `User-Agent: YourAppName (contact@example.com)`
- `Content-Type: application/json` (for JSON payloads)
