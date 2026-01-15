# Templates

Source: https://api.digisign.org/api/docs

## Envelope Templates

OpenAPI exposes endpoints for template management:

- `GET /api/envelope-templates` – list templates
- `POST /api/envelope-templates` – create template

## Account Default Template

- `GET /api/account/envelope-template` – get default template
- `PUT /api/account/envelope-template` – update default template

## Related Resources

The OpenAPI schema includes related template resources:

- `EnvelopeTemplateDocument`
- `EnvelopeTemplateRecipient`
- `EnvelopeTemplateTag`
- `EnvelopeTemplateNotification`
