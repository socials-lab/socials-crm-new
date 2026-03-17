

## Plan: Multi-item modification requests (bundled offers)

### Problem
Currently each modification request supports only one change (one service, one country expansion, one price change). Clients often need multiple changes at once (e.g., expand to 3 countries + add a new service), and these should arrive as a single offer document.

### Approach
Add an `items` array to the modification request model. Each modification request becomes a "bundle" that can contain multiple line items, each with its own `request_type` and `proposed_changes`. The client-facing offer page renders all items together with a combined total.

### Changes

**1. Data model (`src/types/crm.ts`)**
- Add `ModificationRequestItem` interface with `request_type`, `proposed_changes`, `engagement_service_id`, and item-level metadata
- Add optional `items: ModificationRequestItem[]` to `ModificationRequest`
- Keep backward compatibility: if `items` is empty/undefined, fall back to the existing single `request_type` + `proposed_changes`

**2. ProposeModificationDialog (`src/components/engagements/ProposeModificationDialog.tsx`)**
- After configuring the first item (Step 3), add a "Přidat další položku" (Add another item) button
- This loops back to Step 2 (type selection) for the next item while preserving already-added items
- Show a summary list of all added items with ability to remove individual ones
- Each item goes through the same configuration flow (service selection, pricing, colleague assignment)

**3. ModificationRequestCard (`src/components/engagements/ModificationRequestCard.tsx`)**
- Render each item as a sub-card within the request card
- Show combined total price across all items

**4. UpgradeOfferPage (`src/pages/UpgradeOfferPage.tsx`)**
- Loop through `items` array, rendering each change detail card
- Add a "Celkem" (Total) summary section at the bottom showing combined monthly price
- Single confirmation form covers all items at once

**5. Mock data layer (`src/data/modificationRequestsMockData.ts`)**
- Update `createModificationRequest` to accept `items` array
- Update storage/retrieval to handle the new structure

**6. Hook (`src/hooks/useModificationRequests.tsx`)**
- Update `createRequest` params to accept items array
- Update `updateRequest` to support editing individual items within a bundle

### UI Flow
```text
Step 1: Select engagement
Step 2: Select change type (for current item)
Step 3: Configure item (service, price, colleagues)
       ┌─────────────────────────────┐
       │ ✅ Item 1: Socials Boost UK │ [×]
       │ ✅ Item 2: PPC Boost DE     │ [×]
       └─────────────────────────────┘
       [ + Přidat další položku ]
Step 4: Summary + effective date + commission
```

The client sees one offer page with all items listed and a single "Potvrdit" button.

