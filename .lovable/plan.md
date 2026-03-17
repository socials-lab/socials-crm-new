

## Plan: Auto-populate services and suggested colleague rewards during lead-to-engagement conversion

### Problem
When converting a lead to an engagement, the user must manually enter pricing and team members. But the lead already has `potential_services` with service IDs, tiers, and prices from the offer. The service catalog also has `reward_config` (or demo data) that maps tiers to colleague roles and rewards.

### Approach
Enhance `ConvertLeadDialog` to:

1. **Auto-generate engagement services from lead's `potential_services`**
   - Show a read-only list of services from the offer (name, tier, price) in the "Zakázka" section
   - Auto-calculate `monthly_fee` as the sum of monthly services
   - Each service will be created as an `engagement_service` record upon conversion

2. **Auto-suggest team members based on service reward configs**
   - For each service in `potential_services`, look up the service's `reward_config` (from DB or demo data via `enrichServiceWithRewardConfig`)
   - Match the selected tier to get roles + suggested rewards
   - Pre-populate the `teamMembers` array with these suggestions (role, cost_model, monthly_cost)
   - User can still edit, add, or remove team members before confirming

3. **Create `engagement_services` during conversion**
   - The `executeConversion` function currently only creates the engagement. Extend it to also insert `engagement_service` records for each service from the offer
   - Link team member assignments to their respective `engagement_service_id` where possible

### Changes

**`src/components/leads/ConvertLeadDialog.tsx`**:
- In the `useEffect` that resets the form when lead changes:
  - Read `lead.potential_services` and match each to `services` from CRM data
  - For each service, look up reward config (using `enrichServiceWithRewardConfig` from `serviceRewardDemoData.ts`)
  - Pre-populate `teamMembers` with suggested roles/rewards based on the tier
  - Set `monthly_fee` to the sum of monthly service prices
- Add a new "Služby z nabídky" section in the form UI showing the services that will be created, with editable prices
- Extend `executeConversion` to:
  - Call `addEngagementService` for each service (need to check if this function exists in `useCRMData`)
  - Link assignments to the correct `engagement_service_id`

**`src/hooks/useCRMData.tsx`** (if needed):
- Verify `addEngagementService` exists; if not, add it

### UI Layout (in the Zakázka section)

```text
┌─────────────────────────────────────────────────┐
│ Služby z nabídky                                │
│ ┌─────────────────────────────────────────────┐ │
│ │ Socials Boost PRO     25 000 CZK /měs  [✏️] │ │
│ │ Creative Boost         4 000 CZK /měs  [✏️] │ │
│ └─────────────────────────────────────────────┘ │
│ Celkem: 29 000 CZK /měs                        │
├─────────────────────────────────────────────────┤
│ Tým na zakázce (navrženo automaticky)           │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Kolega ▼] Meta Ads Spec. Fixed 11 900 [🗑] │ │
│ │ [Kolega ▼] Graphic Des. Per credit 150 [🗑] │ │
│ └─────────────────────────────────────────────┘ │
│ + Přidat člena                                  │
└─────────────────────────────────────────────────┘
```

The key improvement: roles and rewards are pre-filled from the service catalog's reward config for the correct tier. The user just needs to assign the right colleague to each suggested role.

### Technical Details

- Import `enrichServiceWithRewardConfig` from `src/utils/serviceRewardDemoData.ts`
- For each `LeadService` in `potential_services`, find matching `Service` by `service_id`, enrich with reward config, then extract roles for the `selected_tier`
- Pre-fill `teamMembers` with `{ colleague_id: '', role, cost_model: reward_type, monthly_cost: reward, ... }`
- Track a local `engagementServices` state array alongside the form to hold editable service prices
- On submit, create engagement services first, then link assignments

