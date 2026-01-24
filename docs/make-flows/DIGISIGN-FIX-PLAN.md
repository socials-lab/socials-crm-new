# DigiSign Integration Fix Plan (Updated)

Based on analysis of 3 working Make.com flows, here's the corrected implementation plan.

> **STATUS: MOSTLY IMPLEMENTED** (as of January 2026)
>
> The issues identified below have been fixed in the current implementation.
> This document is kept for historical reference.

---

## Problem Summary (RESOLVED)

~~The current CRM DigiSign integration is **completely broken** because it assumes a simple single-POST API that doesn't exist.~~

**All major issues have been fixed:**

### Original CRM Issues (ALL FIXED):
1. ~~Wrong API URL (`api.digisign.cz` → should be `api.digisign.org`)~~ ✅ Fixed
2. ~~Wrong API structure (single POST → need 6-step workflow)~~ ✅ Fixed - implements 7-step workflow
3. ~~Missing token exchange (assumes bearer token, needs `accessKey`/`secretKey` exchange)~~ ✅ Fixed
4. ~~Single signer only (Make flows use 2 signers)~~ ✅ Fixed - supports 2 signers
5. ~~No signature tag placement (Make uses placeholder-based tags)~~ ✅ Fixed - uses PODPIS1/PODPIS2 placeholders
6. ~~Wrong webhook header (`X-DigiSign-Signature` → `Signature`)~~ ✅ Fixed
7. ~~Wrong event names (`envelope.signed` → `envelopeCompleted`)~~ ✅ Fixed

### Remaining Issues:
- Hardcoded Socials signer info (Daniel Bauer) - should be environment variables
- Only supports 2 signers (PDF template limitation)

---

## Implementation Plan

### Phase 1: Fix Authentication

**File:** `supabase/functions/digisign-create-contract/index.ts`

```typescript
// Step 1: Exchange API keys for bearer token
async function getAuthToken(): Promise<string> {
  const response = await fetch('https://api.digisign.org/api/auth-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessKey: Deno.env.get('DIGISIGN_ACCESS_KEY'),
      secretKey: Deno.env.get('DIGISIGN_SECRET_KEY')
    })
  });

  const data = await response.json();
  return data.access_token;
}
```

**Environment Variables:**
```env
DIGISIGN_ACCESS_KEY=<from DigiSign dashboard>
DIGISIGN_SECRET_KEY=<from DigiSign dashboard>
```

---

### Phase 2: Implement Multi-Step Envelope Creation

**Full workflow:**

```typescript
async function createDigiSignContract(lead: Lead, pdfBuffer: Buffer, pdfName: string) {
  const token = await getAuthToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Step 1: Create empty envelope
  const envelope = await fetch('https://api.digisign.org/api/envelopes', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: `Smlouva - ${lead.company_name}`,
      emailBody: '...',
      emailBodyCompleted: '...'
    })
  }).then(r => r.json());

  // Step 2: Upload PDF file
  const formData = new FormData();
  formData.append('file', new Blob([pdfBuffer]), pdfName);

  const file = await fetch('https://api.digisign.org/api/files', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  }).then(r => r.json());

  // Step 3: Attach document to envelope
  const document = await fetch(`https://api.digisign.org${envelope._actions.add_document.uri}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      file: file._links.self,
      name: file.originalName,
      position: 1,
      convert: true
    })
  }).then(r => r.json());

  // Step 4: Add recipients
  const recipients = await fetch(`https://api.digisign.org${envelope._actions.add_recipient.uri}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify([
      {
        role: 'signer',
        signatureType: 'simple',
        name: 'Daniel Bauer',
        email: 'danny@socials.cz',
        mobile: '+420774536699',
        company: 'Socials Advertising s.r.o.',
        identificationNumber: '08186464'
      },
      {
        role: 'signer',
        signatureType: 'simple',
        name: lead.contact_name,
        email: lead.contact_email,
        mobile: lead.contact_phone,
        company: lead.company_name,
        identificationNumber: lead.ico
      }
    ])
  }).then(r => r.json());

  // Step 5: Add signature tags for each recipient
  for (const recipient of recipients) {
    const placeholder = recipient.email === 'danny@socials.cz' ? 'PODPIS1' : 'PODPIS2';
    await fetch(`https://api.digisign.org/api/envelopes/${envelope.id}/tags/by-placeholder`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'signature',
        recipient: recipient.id,
        placeholder,
        required: true,
        applyToDocuments: [document.id]
      })
    });
  }

  return {
    envelopeId: envelope.id,
    envelopeUrl: `https://api.digisign.org${envelope._links.self}`
  };
}
```

---

### Phase 3: Fix Webhook Handler

**File:** `supabase/functions/digisign-webhook/index.ts`

```typescript
// Correct header name
const signatureHeader = req.headers.get('Signature');

// Parse: "t=1234567890,s=abc123..."
function parseSignature(header: string) {
  const parts = Object.fromEntries(
    header.split(',').map(p => p.split('='))
  );
  return { timestamp: parts.t, signature: parts.s };
}

// HMAC-SHA256 verification
async function verifyWebhook(body: string, header: string, secret: string): Promise<boolean> {
  const { timestamp, signature } = parseSignature(header);

  // Check timestamp (5 min window)
  const age = Date.now() / 1000 - parseInt(timestamp);
  if (age > 300) return false;

  // Compute HMAC
  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === expected;
}

// Handle events
switch (event) {
  case 'envelopeCompleted':
    // All signatures collected
    await updateLeadContractSigned(envelopeId);
    break;
  case 'recipientSigned':
    // Individual signer completed
    break;
  case 'envelopeDeclined':
    // Someone declined
    break;
}
```

---

### Phase 4: PDF Generation with Placeholders

The contract PDF needs placeholders where signatures go:
- `PODPIS1` - Socials representative signature
- `PODPIS2` - Client signature

**Options:**
1. Use existing Google Docs template workflow (as Make does)
2. Generate PDF with placeholders in Supabase function
3. Use DigiSign template system

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/digisign-create-contract/index.ts` | Complete rewrite |
| `supabase/functions/digisign-webhook/index.ts` | Fix header, events, HMAC |
| `.env` / Supabase secrets | Add ACCESS_KEY, SECRET_KEY |

---

## Environment Variables (Updated)

```env
DIGISIGN_API_URL=https://api.digisign.org
DIGISIGN_ACCESS_KEY=<accessKey from DigiSign>
DIGISIGN_SECRET_KEY=<secretKey from DigiSign>
DIGISIGN_WEBHOOK_SECRET=<for HMAC verification>

# Socials signer info (hardcoded in Make, should be env vars)
DIGISIGN_SOCIALS_SIGNER_NAME=Daniel Bauer
DIGISIGN_SOCIALS_SIGNER_EMAIL=danny@socials.cz
DIGISIGN_SOCIALS_SIGNER_PHONE=+420774536699
DIGISIGN_SOCIALS_COMPANY_NAME=Socials Advertising s.r.o.
DIGISIGN_SOCIALS_ICO=08186464
```

---

## Implementation Order (COMPLETED)

All steps have been implemented:

1. ✅ **Get credentials** - Uses `DIGISIGN_ACCESS_KEY` and `DIGISIGN_SECRET_KEY`
2. ✅ **Fix webhook** - HMAC-SHA256 verification with replay protection (now required)
3. ✅ **Rewrite create-contract** - Implements full 7-step workflow
4. ✅ **PDF template** - Uses `socials-pdf-generator` with PODPIS1/PODPIS2 placeholders
5. ✅ **Deploy and register webhook**

---

## Previously Open Questions (RESOLVED)

1. **PDF Generation:** ✅ Uses `socials-pdf-generator` service that generates PDFs from HTML template with client data

2. **Single vs Dual Signer:** ✅ CRM uses 2 signers (Socials representative + client signatory)

3. **Existing Make Flows:** Decision pending - CRM integration is now functional

---

## Current Implementation

The implementation is in:
- `supabase/functions/digisign-create-contract/index.ts` - 7-step envelope creation
- `supabase/functions/digisign-webhook/index.ts` - Webhook with signature verification
- `src/hooks/useDigiSign.tsx` - Frontend hook
- `socials-pdf-generator/src/contract-template.ts` - PDF template with placeholders

---

## Reference Files

- `docs/make-flows/DIGISIGN-INTEGRATION-ANALYSIS.md` - Detailed API analysis
- `docs/make-flows/digisign-envelope-completed.blueprint.json` - Webhook handling
- `docs/make-flows/raynet-create-contract.blueprint.json` - Full creation workflow
- `docs/make-flows/typeform-contract-flow.blueprint.json` - Alternative flow
