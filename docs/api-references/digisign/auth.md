# Authentication

Source: https://help.digisign.org/cs/articles/9766040-zakladni-pouziti-rest-api

## API Key Creation

Generate API keys in selfcare:

`Nastavení → Pro vývojáře → API klíče`

You receive:

- `accessKey`
- `secretKey`

API keys can be restricted to IP ranges.

## Token Exchange

Exchange keys for a bearer token:

`POST /api/auth-token`

Use `accessKey` and `secretKey` in the request body.

## Authorization Header

The API uses bearer auth (RFC 6750):

`Authorization: Bearer <token>`
