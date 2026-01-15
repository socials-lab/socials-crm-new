# Token Refresh (Offline Access)

Source: https://developers.google.com/identity/protocols/oauth2/web-server

## Offline Access

To refresh access tokens without user interaction:

- Request `access_type=offline` during OAuth authorization.
- The authorization server returns a refresh token.
- Use the refresh token to obtain new access tokens when they expire.

## Notes

Refresh tokens are typically only returned for server-side applications and
require offline access to be requested during the consent flow.
