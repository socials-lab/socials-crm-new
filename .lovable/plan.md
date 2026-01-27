
# Plan: Send Modification Proposal Email to Client

## Overview
Add the ability to send an email draft of a service modification proposal to a client, with:
- Manual email input field (editable recipient)
- Pre-filled email template with modification details
- Email subject line customization
- Text content customization
- Default recipient from client contacts when available

## Current State Analysis

### Existing Infrastructure
1. **Modification Requests System** (`src/data/modificationRequestsMockData.ts`)
   - Stores `upgrade_offer_token` for client-facing changes
   - Already generates public upgrade links (`/upgrade/{token}`)
   - Has `client_email` field (currently only filled when client confirms)

2. **Similar Pattern: SendOfferDialog** (`src/components/leads/SendOfferDialog.tsx`)
   - Existing dialog for sending offers to leads
   - Uses colleague selection for sender info
   - Has email subject and content fields
   - Good reference pattern to follow

3. **Client Data Access**
   - `useCRMData()` provides `clients`, `clientContacts`, and `engagements`
   - Client contacts have `is_primary` and `is_decision_maker` flags
   - Billing email available on client level

4. **Edge Functions**
   - Currently no email sending edge function exists
   - No RESEND_API_KEY configured (secrets empty)

## Implementation Plan

### Phase 1: Create SendModificationEmailDialog Component

**New file: `src/components/engagements/SendModificationEmailDialog.tsx`**

Features:
- Dialog triggered from "Čeká na klienta" tab cards
- Input fields:
  - **Recipient email** (manually editable, pre-filled from client contacts if available)
  - **Email subject** (pre-filled with default template)
  - **Email body** (pre-filled with modification details + upgrade link)
  - **Sender selection** (dropdown of active colleagues)
- Show sender's contact info (name, email, phone)
- Display client/engagement info for context
- Include the upgrade link prominently in email template

**Email Template Structure:**
```
Dobrý den [contact_name],

rádi bychom Vás informovali o navrhované změně ve spolupráci:

[Change Type Label]
- [Service/Price details based on modification type]

Platnost od: [effective_from date]

Pro potvrzení této změny prosím klikněte na následující odkaz:
[upgrade link]

Odkaz je platný do: [valid_until date]

V případě dotazů nás neváhejte kontaktovat.

S pozdravem,
[sender_name]
[sender_position]
[sender_email]
[sender_phone]
```

### Phase 2: Add Email Button to ModificationRequestCard

**Modify: `src/components/engagements/ModificationRequestCard.tsx`**

- Add new `onSendEmail` callback prop
- Add email icon button (Mail icon from lucide) next to "Zkopírovat odkaz" for requests with status 'approved' and `upgrade_offer_token`
- Button label: "📧 Odeslat email"

### Phase 3: Integrate in Modifications Page

**Modify: `src/pages/Modifications.tsx`**

- Import and use `SendModificationEmailDialog`
- Add state for dialog open/close and selected request
- Pass handlers to ModificationRequestCard components
- Add dialog to the page

### Phase 4: (Optional Future) Edge Function for Actual Email Sending

**Note:** The current system uses mock sending (similar to SendOfferDialog). For actual email sending:
1. User needs to configure RESEND_API_KEY secret
2. Create edge function `supabase/functions/send-modification-email/index.ts`
3. Update dialog to call the edge function

For now, implement mock sending that:
- Shows success toast
- Logs the email action
- Potentially stores sent email in localStorage for history

## Technical Details

### Component Props Interface
```typescript
interface SendModificationEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: StoredModificationRequest;
  upgradeLink: string;
}
```

### Default Email Logic
1. Check `clientContacts` for matching `client_id`
2. Prefer `is_decision_maker` contact first
3. Fall back to `is_primary` contact
4. Fall back to client's `billing_email`
5. Fall back to client's `main_contact_email` (legacy field)
6. Allow manual entry if none found

### Email Subject Templates
- **add_service**: "Návrh nové služby – [Client Name] / Socials"
- **update_service_price**: "Návrh změny ceny – [Client Name] / Socials"
- **deactivate_service**: "Ukončení služby – [Client Name] / Socials"

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/engagements/SendModificationEmailDialog.tsx` | Create | New dialog component |
| `src/components/engagements/ModificationRequestCard.tsx` | Modify | Add email button and callback |
| `src/pages/Modifications.tsx` | Modify | Integrate dialog, add state management |

## UX Flow

1. User views "Čeká na klienta" tab
2. Clicks "📧 Odeslat email" button on a modification card
3. Dialog opens with:
   - Pre-filled recipient from client data
   - Pre-filled subject and body
   - Sender selection dropdown
4. User can edit any field as needed
5. User clicks "Odeslat"
6. Toast notification confirms sending
7. Dialog closes

## Edge Cases Handled

- No email found for client → Empty field, user must enter manually
- No active colleagues → Error message shown
- Missing upgrade token → Button not shown (shouldn't happen for approved requests)
- Expired offers → Still allow sending (expiry date shown in email)
