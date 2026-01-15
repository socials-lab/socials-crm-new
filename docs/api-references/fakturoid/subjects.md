# Subjects (Clients)

Source: https://www.fakturoid.cz/api/v3/subjects

## Endpoints

- `GET /accounts/{slug}/subjects.json` – list subjects (supports `since`, `updated_since`).
- `GET /accounts/{slug}/subjects/search.json` – fulltext search (name, email, registration_no, vat_no, etc.).
- `GET /accounts/{slug}/subjects/{id}.json` – subject detail.
- `POST /accounts/{slug}/subjects.json` – create subject.
- `PATCH /accounts/{slug}/subjects/{id}.json` – update subject.
- `DELETE /accounts/{slug}/subjects/{id}.json` – delete subject.

## Create/Update Notes

- Required attribute: `name`.
- If `country` is omitted, it inherits from account settings.
- Create success: `201 Created` with `Location` header.
- Validation errors: `422 Unprocessable Content`.
- Delete fails with `403 Forbidden` if subject has documents.
