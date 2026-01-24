# DigiSign Integration Analysis from Make.com Flows

This document extracts the **working DigiSign API integration** from the existing Make.com automation flows.

---

## Overview

Three Make flows were analyzed:
1. **digisign-envelope-completed.blueprint.json** - Webhook handler when envelope is completed
2. **raynet-create-contract.blueprint.json** - Create contract from Raynet business case
3. **typeform-contract-flow.blueprint.json** - Create contract from Typeform submission

---

## Key Finding: Multi-Step Workflow Required

The Make flows reveal that DigiSign requires a **6-step workflow** (not a single API call as the CRM currently assumes):

```
1. POST /api/auth-token          → Get Bearer token
2. POST /api/envelopes           → Create empty envelope
3. POST /api/files               → Upload PDF file
4. POST /api/envelopes/{id}/documents  → Attach file to envelope
5. PATCH /api/envelopes/{id}/recipients → Add signers
6. POST /api/envelopes/{id}/tags/by-placeholder → Add signature tags
7. (implicit: envelope auto-sends or needs send call)
```

---

## API Base URL

**Production:** `https://api.digisign.org`

---

## Step 1: Authentication

**Endpoint:** `POST /api/auth-token`

**Request:**
```json
{
  "accessKey": "<access-key>",
  "secretKey": "<secret-key>"
}
```

**Response:**
```json
{
  "access_token": "<bearer-token>",
  ...
}
```

**Usage:** All subsequent requests use:
```
Authorization: Bearer {access_token}
```

---

## Step 2: Create Empty Envelope

**Endpoint:** `POST /api/envelopes`

**Request:**
```json
{
  "name": "Smlouva o spolupráci - {company_name} & Socials",
  "emailBody": "Dobrý den,<br><br>děkujeme, že jste si nás vybrali pro spolupráci...",
  "emailBodyCompleted": "Dobrý den,<br><br>děkujeme, že jste si nás vybrali pro spolupráci...<br>V tomto emailu posíláme podepsanou smlouvu ke stažení."
}
```

**Response contains:**
- `id` - Envelope ID
- `_links.self` - Self URL
- `_actions.add_document.uri` - URI to add documents
- `_actions.add_recipient.uri` - URI to add recipients

---

## Step 3: Upload PDF File

**Endpoint:** `POST /api/files`

**Request:** `multipart/form-data`
```
file: <binary PDF data>
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Response contains:**
- `_links.self` - File reference URL
- `originalName` - Original filename

---

## Step 4: Attach Document to Envelope

**Endpoint:** `POST https://api.digisign.org{envelope._actions.add_document.uri}`

**Request:**
```json
{
  "file": "{uploaded_file._links.self}",
  "name": "{uploaded_file.originalName}",
  "position": 1,
  "convert": true
}
```

**Response contains:**
- `id` - Document ID (needed for signature tags)

---

## Step 5: Add Recipients (Signers)

**Endpoint:** `PATCH https://api.digisign.org{envelope._actions.add_recipient.uri}`

**Request (2 signers example):**
```json
[
  {
    "role": "signer",
    "signatureType": "simple",
    "name": "Daniel Bauer",
    "email": "danny@socials.cz",
    "mobile": "+420774536699",
    "company": "Socials Advertising s.r.o.",
    "identificationNumber": "08186464"
  },
  {
    "role": "signer",
    "signatureType": "simple",
    "name": "{signer_name}",
    "email": "{signer_email}",
    "mobile": "{signer_phone}",
    "company": "{company_name}",
    "identificationNumber": "{ico}"
  }
]
```

**Response:** Array of recipient objects with `id` for each signer

---

## Step 6: Add Signature Tags

**Endpoint:** `POST /api/envelopes/{envelope_id}/tags/by-placeholder`

**Request (per signer):**
```json
{
  "type": "signature",
  "recipient": "{recipient_id}",
  "placeholder": "PODPIS1",
  "required": true,
  "positioning": "top_left",
  "width": 1,
  "height": 1,
  "layout": "front_and_back",
  "label": "string",
  "assignment": "recipient",
  "readonly": true,
  "renderInteractive": true,
  "format": "D.M.YYYY",
  "applyToDocuments": ["{document_id}"]
}
```

**Note:** The PDF must contain placeholder text (e.g., `PODPIS1`, `PODPIS2`) where signatures should appear.

---

## Webhook: Envelope Completed

**Trigger:** `digisign:watchEnvelopeEvent` (Make module)

**Webhook Payload Structure:**
```json
{
  "id": "{envelope_id}",
  "documents": [
    {
      "id": "{document_id}",
      "name": "{document_name}",
      "_links": {
        "self": "/api/envelopes/{envelope_id}/documents/{document_id}"
      }
    }
  ],
  ...
}
```

**Actions on completion:**
1. Find business case in Raynet by `Digisign_O_8d459` (envelope ID)
2. Set `Prijemce_p_ed468` = true (recipient signed)
3. Set `Podepsana__3c004` = signed document URL
4. Download signed document via `digisign:downloadADocument`
5. Upload to Raynet business case attachments

---

## Raynet CRM Custom Fields for DigiSign

| Field Code | Label | Purpose |
|------------|-------|---------|
| `Digisign_O_8d459` | Digisign Obálka ID | Envelope UUID |
| `Digisign_o_ad2e9` | Digisign obálka | Link to envelope in DigiSign |
| `Podepsana__3c004` | Podepsaná smlouva | Link to signed PDF |
| `Prijemce_p_ed468` | Příjemce podepsal | Boolean: recipient signed |
| `Odkaz_na_s_71eab` | Odeslaná smlouva | Link to unsigned contract |

---

## Contract PDF Generation

The flows show contracts are generated from Google Docs templates:

1. **Google Docs module** generates contract PDF from template
2. PDF contains placeholders: `PODPIS1`, `PODPIS2` for signature positions
3. PDF is downloaded and uploaded to DigiSign

---

## Critical Differences from Current CRM Implementation

| Aspect | Current CRM | Make Flow (Working) |
|--------|-------------|---------------------|
| API URL | `api.digisign.cz` | `api.digisign.org` |
| Auth | Assumes bearer token | Token exchange via `/api/auth-token` |
| Workflow | Single POST | Multi-step (6 calls) |
| Signers | 1 signer | 2 signers (company + client) |
| Signature tags | Not implemented | By placeholder in PDF |
| Webhook header | `X-DigiSign-Signature` | `Signature` |
| Event names | `envelope.signed` | Use Make webhook module |

---

## Required Environment Variables

Based on the Make flows:

```env
DIGISIGN_API_URL=https://api.digisign.org
DIGISIGN_ACCESS_KEY=<from Make flow: 6hyIZZA88dhjsYQGYS4FjK3q>
DIGISIGN_SECRET_KEY=<from Make flow>
```

**Note:** The Make flow contains hardcoded credentials that should be moved to environment variables.

---

## Recommendations for CRM Fix

1. **Rewrite contract creation** to follow the 6-step workflow
2. **Implement token exchange** instead of assuming bearer token
3. **Generate PDF with placeholders** or use existing templates
4. **Support 2 signers** (Socials + Client)
5. **Use placeholder-based signature tags** instead of coordinate positioning
6. **Fix webhook handler** to use correct header and event names

---

## PDF Template Requirements

The contract PDF must contain text placeholders:
- `PODPIS1` - First signer (Socials/Danny)
- `PODPIS2` - Second signer (Client)

These are replaced by DigiSign with interactive signature fields.
