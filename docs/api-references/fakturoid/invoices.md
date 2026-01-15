# Invoices

Source: https://www.fakturoid.cz/api/v3/invoices

## Endpoints

- `GET /accounts/{slug}/invoices.json` – list invoices (includes all document types).
- `GET /accounts/{slug}/invoices/search.json` – fulltext search (number, variable_symbol, client_name, note, tags, lines).
- `GET /accounts/{slug}/invoices/{id}.json` – invoice detail.
- `POST /accounts/{slug}/invoices.json` – create invoice.
- `PATCH /accounts/{slug}/invoices/{id}.json` – update invoice.
- `DELETE /accounts/{slug}/invoices/{id}.json` – delete invoice.

## PDF and Attachments

- `GET /accounts/{slug}/invoices/{id}/download.pdf`
  - Returns `204 No Content` if PDF is not ready.
- `GET /accounts/{slug}/invoices/{invoice_id}/attachments/{id}/download`

## Invoice Actions

Trigger state changes:

- `POST /accounts/{slug}/invoices/{id}/fire.json`

Events include: `mark_as_sent`, `cancel`, `undo_cancel`, `lock`, `unlock`,
`mark_as_uncollectible`, `undo_uncollectible`.

## Create/Update Notes

- Create success: `201 Created` with `Location` header.
- Update success: `200 OK`.
- Validation errors: `422 Unprocessable Content`.
- `403 Forbidden` if no bank account is configured.
