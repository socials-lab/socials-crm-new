# Recipients and Signers

Source: https://help.digisign.org/cs/articles/9766040-zakladni-pouziti-rest-api

## Recipients

Add signers/approvers to an envelope:

`POST /api/envelopes/{envelope}/recipients`

## Signature Tags

Add tags to documents:

- `POST /api/envelopes/{envelope}/tags`
- `POST /api/envelopes/{envelope}/tags/by-placeholder`

Tag types include:

- `signature` – signature tag
- `approval` – approval tag
- `text` – text input
- `document` – document upload
- `attachment` – attachment
- `checkbox`
- `radio_button`
- `date_of_signature`
