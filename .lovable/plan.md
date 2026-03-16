

# Pricing Engine for Contract Amendment Proposals

## Summary

Add a "Dopad na spolupráci" (Impact on Collaboration) section inside the existing `ProposeModificationDialog`. When a user selects an engagement and proposes a change, the system calculates current client economics, proposed delta, and new total economics with margin validation (green/orange/red). No changes to the existing approval → offer → email workflow.

## Current State

- **ProposeModificationDialog** (~860 lines) handles all amendment types (add_service, update_price, deactivate, assignments)
- **EngagementFinancialOverview** already computes margin from `assignments.monthly_cost` — but only for a single engagement
- **Data sources**: `engagementServices` (client revenue per service), `assignments` with `monthly_cost` (internal costs), all from Supabase via `useCRMData`
- **Modification requests** stored in localStorage (`modificationRequestsMockData.ts`)
- Internal cost model: assignments have `cost_model` (hourly/fixed_monthly/percentage) with `monthly_cost`, `hourly_cost`, `percentage_of_revenue`

## Key Design Decisions

1. **Client-level economics** = sum ALL active engagements for that client (not just selected engagement)
2. **Internal cost** = sum of `monthly_cost` from all assignments across all client engagements. For `percentage` model, compute as `percentage * service_price / 100`. For `hourly`, use `hourly_cost * estimated_hours` (we'll show monthly_cost if set, else flag as estimate)
3. **Expansion scenarios** handled via a new `pricing_scenario` field: `add_addon`, `expand_country`, `expand_shop`, `custom_manual`
4. **Pricing calculation snapshot** stored alongside the modification request in localStorage (extends `StoredModificationRequest`)
5. **No DB schema changes needed** for V1 — all pricing metadata stored in `proposed_changes` JSONB and a new `pricing_snapshot` field on the localStorage request

## Implementation Plan

### 1. New utility: `src/utils/pricingEngine.ts`

Pure calculation functions:

```typescript
interface ClientEconomics {
  totalRevenue: number;
  totalInternalCost: number;
  margin: number;
  marginPercent: number;
  services: { name: string; price: number; internalCost: number }[];
}

interface PricingScenarioResult {
  deltaRevenue: number;
  deltaInternalCost: number;
  newTotalRevenue: number;
  newTotalInternalCost: number;
  newMargin: number;
  newMarginPercent: number;
  validationStatus: 'green' | 'orange' | 'red';
  requiresAdminApproval: boolean;
}
```

Functions:
- `calculateClientEconomics(clientId, engagements, engagementServices, assignments)` — aggregates current state
- `calculateExpansionPrice(referencePrice, multiplier)` — for country/shop scenarios
- `calculateExpansionInternalCost(referenceInternalCost, multiplier)`
- `calculateAmendmentImpact(currentEconomics, deltaRevenue, deltaInternalCost)` — returns `PricingScenarioResult`
- `getMarginValidationStatus(marginPercent)` — green ≥66%, orange 63-65.99%, red <63%
- `getDefaultMultiplier(scenario)` — 0.5 for country, 0.7 for shop

### 2. New component: `src/components/engagements/PricingImpactSection.tsx`

Displayed inside ProposeModificationDialog after engagement + service selection. Three visual blocks:

**Block 1 — Aktuální stav**: Current revenue, internal cost, margin, list of active services (compact table)

**Block 2 — Navrhovaná změna**: Scenario type selector (new country / new shop / addon / custom), reference service picker (for expansions), editable multiplier with recommended default shown, calculated new price and internal cost

**Block 3 — Nový stav po změně**: New totals, margin with color-coded badge (green/orange/red), warning messages for orange/red, justification textarea (required for orange/red)

### 3. Extend `ProposeModificationDialog.tsx`

- Add new state: `pricingScenario`, `referenceServiceId`, `multiplier`, `manualInternalCost`, `marginJustification`, `requiresAdminApproval`
- After engagement + request type selection (for `add_service` and `update_service_price`), render `<PricingImpactSection />`
- For `add_service` with expansion scenarios, auto-calculate price from reference service × multiplier
- The calculated `servicePrice` feeds into the existing price field (editable, but pre-filled)
- On submit, include `pricing_snapshot` in the `proposed_changes` object

### 4. Extend `StoredModificationRequest` with pricing snapshot

Add optional field to the stored request:

```typescript
pricing_snapshot?: {
  scenario: 'expand_country' | 'expand_shop' | 'add_addon' | 'custom_manual';
  reference_service_id?: string;
  reference_service_name?: string;
  reference_price?: number;
  reference_internal_cost?: number;
  multiplier?: number;
  delta_revenue: number;
  delta_internal_cost: number;
  current_total_revenue: number;
  current_total_internal_cost: number;
  new_total_revenue: number;
  new_total_internal_cost: number;
  new_margin_percent: number;
  validation_status: 'green' | 'orange' | 'red';
  requires_admin_approval: boolean;
  justification?: string;
}
```

### 5. Show pricing snapshot in review/approval UI

In `ModificationRequestCard.tsx` (or wherever requests are reviewed), show the stored pricing snapshot so admins can see the economics before approving.

### Files to Create
- `src/utils/pricingEngine.ts` — pure calculation logic
- `src/components/engagements/PricingImpactSection.tsx` — UI component for the 3-block display

### Files to Modify
- `src/components/engagements/ProposeModificationDialog.tsx` — integrate PricingImpactSection, add scenario/multiplier state, include snapshot on submit
- `src/data/modificationRequestsMockData.ts` — extend `StoredModificationRequest` interface with `pricing_snapshot`
- `src/components/engagements/ModificationRequestCard.tsx` — display pricing snapshot in review view
- `src/types/crm.ts` — add `PricingScenario` type and extend `AddServiceProposedChanges` with pricing fields

### What stays unchanged
- The entire approval → token → client offer → email flow
- Commission tracking ("Kdo dohodl")
- The `handleSubmit` flow and `createRequest` call structure
- All existing request types and their handling

