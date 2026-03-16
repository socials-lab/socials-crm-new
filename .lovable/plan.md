
# Add Colleague Compensation Recommendations to Pricing Engine

## What the user wants

When proposing a contract amendment, after selecting the service, the system should recommend **colleague compensation** (internal cost) based on a hardcoded reward table — broken down by **role** (Meta Ads specialist, PPC specialist, Graphic Designer). The user should be able to select which colleague(s) will work on this service and see the recommended reward.

## Reward Table (from user input)

**Core services (monthly fixed rewards by role):**

| Service + Tier | Meta Ads hours | Meta Ads reward | PPC hours | PPC reward |
|---|---|---|---|---|
| Socials Boost GROWTH | 13 | 9,100 | 0 | 0 |
| Socials Boost PRO | 17 | 11,900 | 0 | 0 |
| Socials Boost ELITE | 22 | 15,400 | 0 | 0 |
| PPC Boost GROWTH | 0 | 0 | 10 | 7,000 |
| PPC Boost PRO | 0 | 0 | 15 | 10,500 |
| PPC Boost ELITE | 0 | 0 | 20 | 14,000 |
| Performance Boost GROWTH | 13 | 9,100 | 8 | 5,600 |
| Performance Boost PRO | 17 | 11,900 | 12 | 8,400 |
| Performance Boost ELITE | 22 | 15,400 | 16 | 11,200 |

**Addon services (fixed rewards):**

| Service | Hours | Reward |
|---|---|---|
| Creative Boost | — | 150 Kč/kredit |
| TikTok Ads | 7 | 4,900 |
| Heureka & Zboží.cz | 4 | 2,800 |
| Glami | 2 | 1,400 |
| Favi | 2 | 1,400 |

## Implementation Plan

### 1. New constants file: `src/constants/serviceRewards.ts`

Hardcoded reward lookup table mapping `service_code + tier` → array of role-based compensations. Each entry has: `role` (Meta Ads Specialist / PPC Specialist / Graphic Designer), `hours`, `reward`, `rewardType` (fixed_monthly / per_credit / hourly).

For expansion scenarios (new country/shop), rewards are multiplied by the same multiplier as the price.

### 2. Extend `PricingImpactSection.tsx`

Add a new sub-section within "Navrhovaná změna" block:

**"Odměny kolegů za tuto službu"** — Shows a table of recommended colleague roles and their compensation based on the selected service + tier. Each row:
- Role (e.g. "Meta Ads Specialist")
- Colleague picker (select from active colleagues)
- Recommended hours
- Recommended reward (auto-calculated, editable)
- For expansion scenarios: reward × multiplier shown

The total of all colleague rewards feeds into `deltaInternalCost` (replacing the simple manual input for core/expansion scenarios).

### 3. Extend `PricingSnapshot` in `pricingEngine.ts`

Add a `colleague_rewards` array to the snapshot:
```typescript
colleague_rewards?: {
  role: string;
  colleague_id?: string;
  colleague_name?: string;
  hours: number;
  reward: number;
}[];
```

### 4. Update internal cost calculation

Instead of calculating `deltaInternalCost` from `referenceService.internalCost * multiplier` alone, sum up the individual colleague reward entries. For addon/custom, sum the reward rows instead of using a single manual input.

### Files to create
- `src/constants/serviceRewards.ts` — reward lookup table

### Files to modify
- `src/components/engagements/PricingImpactSection.tsx` — add colleague reward picker/table within the proposed change block, wire total rewards into deltaInternalCost
- `src/utils/pricingEngine.ts` — extend PricingSnapshot with colleague_rewards
- `src/components/engagements/ModificationRequestCard.tsx` — display colleague rewards from snapshot in review

### What stays unchanged
- The approval → offer → email flow
- Commission tracking ("Kdo dohodl")
- ProposeModificationDialog structure (PricingImpactSection handles this internally)
