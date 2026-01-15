# Envelopes

Source: https://help.digisign.org/cs/articles/9766040-zakladni-pouziti-rest-api

## Core Flow

1. Create envelope
2. Upload and attach documents
3. Add recipients
4. Add signature/approval tags
5. Send envelope
6. Download completed documents

## Key Endpoints

- `POST /api/envelopes` – create envelope
- `POST /api/files` – upload files
- `POST /api/envelopes/{envelope}/documents` – attach files to envelope
- `POST /api/envelopes/{envelope}/recipients` – add recipients
- `POST /api/envelopes/{envelope}/tags` – add tags by coordinates
- `POST /api/envelopes/{envelope}/tags/by-placeholder` – add tags by placeholder
- `POST /api/envelopes/{envelope}/send` – send envelope
- `GET /api/envelopes/{envelope}/download` – download documents
- `GET /api/envelopes/{envelope}/download-url` – short-lived download URL

## Send Preconditions

Envelope must:

- be in `draft` status
- include at least one signable document
- have at least one signing/approval recipient
- have subject and email body defined
- include signature tags for all signers
