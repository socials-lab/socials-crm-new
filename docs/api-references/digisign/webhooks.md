# Webhooks

Source: https://help.digisign.org/cs/articles/9766606-webhooky

## Register Webhook

`POST /api/webhooks`

Example payload:

```
{ "event": "envelopeCompleted", "url": "https://example.com/webhook" }
```

Test delivery:

`POST /api/webhooks/{id}/test`

## Envelope Events

- `envelopeSent`
- `envelopeCompleted`
- `envelopeExpired`
- `envelopeDeclined`
- `envelopeDisapproved`
- `envelopeCancelled`
- `envelopeDeleted`
- `recipientSent`
- `recipientDelivered`
- `recipientNonDelivered`
- `recipientAuthFailed`
- `recipientSigned`
- `recipientDownloaded`
- `recipientDeclined`
- `recipientDisapproved`
- `recipientCanceled`

## Delivery and Retries

- Webhook must respond with HTTP 2xx.
- Timeout is 5 seconds.
- Retries: up to 12 attempts with exponential backoff.

## Signature Verification

Requests include a `Signature` header:

`Signature: t=<timestamp>,s=<signature>`

Verification steps:

1. Extract `t` and `s` from header.
2. Reject if timestamp is older than 5 minutes.
3. Build payload: `{timestamp}.{requestBody}`.
4. Compute HMAC-SHA256 using webhook secret.
5. Compare with `s`.

## OAuth Secured Webhooks

Webhook can be secured with OAuth 2.0 by providing:

- `oAuthTokenEndpoint`
- `oAuthClientId`
- `oAuthClientSecret`
- optional `oAuthScopes`
