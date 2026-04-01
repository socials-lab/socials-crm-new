# EXTREME-DETAIL Product Change Report: Leads + Engagements (`f1421c4` -> `f06ce73`)

## 1. Surface map (screens/dialogs/hooks/services)

### 1.1 Leads page and list surfaces
**File references:**  
- `src/pages/Leads.tsx`  
- `src/components/leads/LeadsKanban.tsx`  
- `src/components/leads/LeadsTable.tsx`  
- `src/components/leads/LeadCard.tsx`  
- `src/components/leads/LeadMobileCard.tsx`

**Changed surfaces**
- Leads page now wires deletion support from detail (`deleteLead`) and reason logging callback for stage-end outcomes via kanban (`onAddLostReason`).
- Kanban closed stages expanded from 3 -> 4 (`won`, `lost`, `postponed`, `bad_fit`) with visual counters and column rendering.
- Desktop/mobile list identity shifted to domain-first where `website` exists (rendered as cleaned domain) instead of always `company_name`.
- Card-level qualification signal added (`qualified`/`bad_fit` shield icons + mobile qualification badges).

---

### 1.2 Lead create/edit surfaces
**File references:**  
- `src/components/leads/AddLeadDialog.tsx`  
- `src/components/leads/AddLeadServiceDialog.tsx`

**Changed surfaces**
- Lead creation schema was re-centered around `website` as the required anchor field; prior required fields (`company_name`, `ico`, `contact_name`) became optional at form level.
- Add lead form expanded into an enrichment-heavy capture surface (scoring, tracking, booking, company research, social, qualification tier).
- ARES-assisted company autofill remains but now supports partially optional corporate identity input.
- Service-add dialog now supports Creative Boost-specific package economics (credits, per-credit price, role rewards, margin indicator), not just generic tiered service pricing.

---

### 1.3 Lead detail / process surfaces
**File references:**  
- `src/components/leads/LeadDetailDialog.tsx`  
- `src/components/leads/LeadDetailSheet.tsx`  
- `src/components/leads/LeadEnrichmentSection.tsx`  
- `src/components/leads/LeadFlowStepper.tsx`  
- `src/components/leads/ConfirmStageTransitionDialog.tsx`  
- `src/hooks/useLeadTransitions.tsx`

**Changed surfaces**
- Lead detail became an operational cockpit with summary bar + enrichment cards + booking strip + research block + process stepper.
- Stage transition confirmation now conditionally requires reason input for terminal/exception outcomes (`lost`, `postponed`, `bad_fit`).
- Stepper introduced quick-manual confirmations for meeting and access request milestones and a dedicated DigiSign contract step model.
- Lead detail now exposes explicit lead delete action with destructive confirmation path.

---

### 1.4 Offer and contract preparation surfaces
**File references:**  
- `src/components/leads/CreateOfferDialog.tsx`  
- `src/components/leads/EditableOfferServiceCard.tsx`  
- `src/components/leads/SendOfferDialog.tsx`  
- `src/components/leads/SendContractDialog.tsx`

**Changed surfaces**
- Offer dialog evolved from create-only into create/edit with revision history, additional content fields (`audit_html`, `recommendation_intro`), intro discount controls, and content snapshotting.
- Offer generation now snapshots section blocks from DB (`offer_content_blocks`) into offer payload to preserve deterministic rendering.
- Contract handling got a dedicated DigiSign-oriented prep flow (Google Doc link + draft envelope staging) instead of only generic URL/status handling.

---

### 1.5 Engagement modification and contract execution surfaces
**File references:**  
- `src/pages/Engagements.tsx`  
- `src/components/engagements/ProposeModificationDialog.tsx`  
- `src/components/engagements/BulkEditStep.tsx`  
- `src/components/engagements/ModificationRequestCard.tsx`  
- `src/hooks/useModificationRequests.tsx`

**Changed surfaces**
- Engagement page now includes direct contract file upload/open/remove lifecycle backed by Supabase Storage.
- Modification proposal flow gained first-class `bulk_edit` request type with service-level and assignment-level batch changes.
- Review card rendering now supports bundled + bulk-edit summaries with total delta and assignment-level display.

---

### 1.6 Supporting data model and backend contract
**File references:**  
- `src/types/crm.ts`  
- `src/hooks/useLeadsData.tsx`  
- `src/hooks/useCRMData.tsx`  
- `docs/supabase-migration-lead-enrichment.sql`  
- `docs/supabase-migration-contract-storage.sql`

**Changed surfaces**
- `LeadStage` and qualification semantics expanded (`bad_fit`).
- `Lead` entity gained DigiSign identifiers and broad enrichment payload surface.
- `ModificationRequestType` gained `bulk_edit` and new proposed-change structures.
- DB schema now explicitly supports enrichment fields + private contract storage bucket/policies.

---

## 2. Before vs after by workflow

### 2.1 Lead create workflow
**File references:**  
- `src/components/leads/AddLeadDialog.tsx`  
- `src/components/leads/AddLeadServiceDialog.tsx`  
- `src/components/leads/LeadCard.tsx`  
- `src/components/leads/LeadMobileCard.tsx`

**Before**
- Operator had to provide traditional CRM identity fields (`company_name`, `ico`, `contact_name`) as required inputs.
- `website` was optional and could be blank.
- Lead creation was mostly sales-core metadata with a lighter context payload.

**After**
- Required entry anchor is now valid `website` URL; company/contact can be omitted in input and inferred.
- Submit logic derives `company_name` from domain when missing (example: `https://www.nutworld.cz` -> `Nutworld.cz`), falls back to URL string, then `Bez názvu` if still empty.
- `contact_name` defaults to derived company name when blank.
- New enrichment capture block added at create-time:
  - scores (`lead_score`, `credibility_score`, `enrichment_qualification_tier`)
  - web/tracking booleans (`has_gtm`, `has_ga4`, `has_meta_pixel`, `has_google_ads`)
  - business profile (`is_vat_payer`, `is_ecommerce`, `business_type`, `company_address`)
  - social (`facebook_url`, `instagram_url`)
  - booking (`booking_status`, `booking_datetime`, `booking_meet_link`)
  - research (`company_research`)
- `tracking_detected` is now side-derived from tracking flags (any true -> true; all null/false -> null).
- Service-add now supports Creative Boost economics (credits × price-per-credit), role reward cost capture (graphic/editor), and instant margin visualization.

**Concrete behavior example**
- Before: creating a lead without `company_name` failed validation.
- After: user can enter only `website=https://example.com` + owner; company/contact are auto-resolved and record saves.

**Edge cases / failure modes**
- Invalid URL in `website` blocks submit (hard validation fail).
- If website is syntactically valid but non-resolvable domain, lead still saves (no DNS check).
- ARES lookup still only triggers on exact 8-digit IČO; near-valid values are ignored silently.
- Tri-state booleans in enrichment checkboxes use `true` vs `null`; explicit `false` is not always captured from form toggles.

---

### 2.2 Lead detail workflow
**File references:**  
- `src/components/leads/LeadDetailDialog.tsx`  
- `src/components/leads/LeadEnrichmentSection.tsx`  
- `src/components/leads/LeadFlowStepper.tsx`  
- `src/pages/Leads.tsx`

**Before**
- Detail UI was narrower and process-centric with fewer contextual enrichment blocks.
- No dedicated summary grid for key lead identity + qualification + booking.
- No explicit inline destructive delete flow through detail.

**After**
- Detail viewport widened and reorganized into operational dashboard pattern:
  - summary bar table (`LeadSummaryBar`)
  - score badges and qualification indicators
  - enrichment cards (`Firma`, `Web & Tracking`, `Marketing`)
  - booking strip + research section
  - richer flow stepper action rail
- Explicit delete action now available with confirmation; parent page removes entity and clears selected lead.
- Domain-first identity appears in list cards, then detail opens with full CRM + enrichment context.

**Concrete behavior example**
- Before: operator opening a lead needed multiple sub-actions to gather qualification context.
- After: score/tier/booking/tracking/research are visible in one scan before taking stage action.

**Edge cases / failure modes**
- `LeadEnrichmentSection` renders only when enrichment signals exist; partially empty leads can appear with sparse cards.
- External social links are auto-normalized to Facebook/Instagram domain patterns; malformed handles may still produce broken URLs.
- Deleting selected lead while dialog is open relies on parent state reset; stale references may appear briefly during cache refresh.

---

### 2.3 Stage transition workflow
**File references:**  
- `src/components/leads/LeadsKanban.tsx`  
- `src/components/leads/ConfirmStageTransitionDialog.tsx`  
- `src/hooks/useLeadTransitions.tsx`  
- `src/types/crm.ts`

**Before**
- Transition analytics confirmation was generic and optional for all transitions.
- No mandatory reason capture for loss/postpone outcomes.
- `bad_fit` was not part of normal lead stage lattice.

**After**
- New terminal stage `bad_fit` is fully integrated (labels, colors, closed-stage bucket, analytics labels).
- Transition dialog now branches:
  - for `lost`, `postponed`, `bad_fit`: reason textarea required for "confirm analytics"
  - for other stages: generic confirm/skip prompt unchanged
- Skip flow can still pass reason to note logging callback (`onAddLostReason`), preserving context even when analytics event is skipped.

**Concrete behavior example**
- Before: dragging to `lost` only prompted analytics confirmation.
- After: dragging to `lost` requires entering a concrete reason before confirmation button enables.

**Edge cases / failure modes**
- Stage is updated optimistically before analytics confirmation; user can skip analytics after stage already changed.
- `useLeadTransitions` persists to localStorage; cross-device analytics consistency is not guaranteed.
- Reason labels in dialog copy have lost/postponed specialization; `bad_fit` shares generic reason label path.

---

### 2.4 Offer workflow
**File references:**  
- `src/components/leads/CreateOfferDialog.tsx`  
- `src/components/leads/EditableOfferServiceCard.tsx`  
- `src/components/leads/SendOfferDialog.tsx`  
- `src/data/publicOffersData.ts`

**Before**
- Offer dialog was creation-only and simpler:
  - no edit mode with history
  - no intro discount orchestration fields
  - no content block snapshot persistence
  - lighter content fields (`auditSummary`, `customNote`, `loomUrl`)

**After**
- Offer dialog supports create + edit (`existingOffer`):
  - tracks changed parts and appends history snapshots
  - allows updating `services`, discounts, content, validity without regenerating token
- New pricing controls:
  - bundle monthly discount scope (`core_only` vs `all_services`)
  - introductory discount (`intro_discount_percent`, `intro_discount_months`)
  - Creative Boost pricing inputs (`cbCredits`, `cbPricePerCredit`)
- New content controls:
  - `audit_html`, `recommendation_intro`
  - DB-backed `offer_content_blocks` snapshot captured into `content_blocks_snapshot` at creation
- Existing URL continuity in edit mode reduces outbound communication churn.

**Concrete behavior example**
- Before: fixing one typo in offer note required creating a new offer state flow.
- After: operator edits existing offer, preserves token URL, and records revision in history.

**Edge cases / failure modes**
- If `offer_content_blocks` read fails, fallback defaults are snapshotted; downstream rendering may diverge from intended CMS state.
- Zero-service guard blocks save, but partial invalid per-service pricing depends on card-level controls.
- Discount layering can create operator confusion (bundle + intro waterfall).

---

### 2.5 Contract workflow (lead + engagement)
**File references:**  
- `src/components/leads/SendContractDialog.tsx`  
- `src/components/leads/LeadFlowStepper.tsx`  
- `src/pages/Engagements.tsx`  
- `docs/supabase-migration-contract-storage.sql`

**Before**
- Lead-side contract mostly behaved as URL/status metadata in funnel progression.
- Engagement-side slot was more oriented around `freelo_url` editing in that area; no full upload/remove lifecycle.

**After**
- New lead-side contract prep dialog (`SendContractDialog`) guides:
  1) copy prefilled contract text
  2) paste Google Docs URL
  3) create DigiSign draft envelope marker
- Creation of draft updates lead contract metadata (`contract_url`, `digisign_envelope_id`, `contract_sent_at`).
- Stepper contract step now displays DigiSign-aware details and actions (`Připravit smlouvu`, `Označit jako odeslanou`, `Potvrdit podpis`, `Detail smlouvy`).
- Engagement page now supports:
  - upload contract file to private storage bucket `engagement-contracts`
  - signed/public URL resolution
  - open and delete contract file

**Concrete behavior example**
- Before: engagement contract artifact typically existed as external URL manually managed.
- After: operator uploads signed PDF directly in Engagements UI, opens it from stored URL, can remove and replace.

**Edge cases / failure modes**
- SendContractDialog currently stages "draft" with locally synthesized envelope IDs (`draft_<timestamp>`), so external state reconciliation depends on later manual DigiSign completion.
- Storage upload/remove failures surface as toast errors; contract pointer may remain stale if update/write partially fails.
- Signed URL expiry strategy (long-lived signed URL) can create delayed-access failure if file lifecycle outlives token validity assumptions.

---

### 2.6 Conversion workflow (lead -> client + engagement)
**File references:**  
- `src/components/leads/ConvertLeadDialog.tsx`  
- `src/hooks/useLeadsData.tsx`  
- `src/hooks/useCRMData.tsx`

**Before**
- Conversion form allowed more optionality in legal/billing/contact fields (`dic`, `website`, `industry`, billing block, contact email/phone/position were optional).
- Conversion executed core entities (client, contact, engagement, services, assignments) with less orchestration feedback.
- No structured conversion result panel for external automation outcomes.

**After**
- Conversion validation became strict:
  - required legal/commercial identity: `dic`, `website`, `industry`, `country`
  - required billing bundle: street/city/zip/country/billing_email
  - required contact bundle: position/email/phone
- Conversion now supports additional contacts and richer service discount semantics.
- Pre-fill behavior uses lead and offer context (latest public offer discounts, onboarding-derived data where available).
- Team assignment guard: conversion blocked when no team member is assigned.
- Post-core conversion orchestration now attempts:
  - Freelo project creation (`create-freelo-project`)
  - Slack channel creation (`create-slack-channel`)
- Conversion result includes service/team/contact counts and automation status, with navigation to created engagement.

**Concrete behavior example**
- Before: lead with only contact name + no billing address could still be converted.
- After: same lead is blocked until billing/contact/legal required fields are completed.

**Edge cases / failure modes**
- External automations (Freelo/Slack) are best-effort: conversion can still succeed while one integration fails.
- If pricing/discount mapping from offer is inconsistent, monthly/one-off totals may need manual correction before submit.
- Long-running conversion may create user uncertainty; step text mitigates but no hard transactional rollback across all created entities.

---

### 2.7 Engagement modification workflow
**File references:**  
- `src/components/engagements/ProposeModificationDialog.tsx`  
- `src/components/engagements/BulkEditStep.tsx`  
- `src/components/engagements/ModificationRequestCard.tsx`  
- `src/types/crm.ts`  
- `src/hooks/useModificationRequests.tsx`

**Before**
- Modification model covered discrete request types; no explicit whole-engagement batch edit type.
- Multi-change proposals required composing bundles from smaller itemized requests.

**After**
- New first-class `bulk_edit` request type introduced in type system and UI labels.
- `BulkEditStep` provides one-screen editing of:
  - existing service action (`keep`/`update`/`deactivate`)
  - per-service price changes
  - assignment reward changes
  - add entirely new services with assignments
  - automatic total/margin recalculation and warnings
- `ProposeModificationDialog` includes `bulk_edit` option and serialization into `BulkEditProposedChanges`.
- `ModificationRequestCard` displays bulk-edit deltas with changed services/new services/assignment deltas.

**Concrete behavior example**
- Before: price update + one deactivation + one new service could require 3 separate request flows.
- After: all three are assembled in one bulk proposal, sent as one client-facing change set.

**Edge cases / failure modes**
- Bulk proposal complexity raises risk of hidden unintended assignment changes if reviewer does not inspect expanded rows.
- Margin warnings are advisory; operator can still submit low-margin proposals depending on approval policy.
- Inline editing on card can drift from original intent unless versioning/review discipline is strong.

---

## 3. Data model changes and UI consequences

### 3.1 Lead stage and qualification semantics
**File references:**  
- `src/types/crm.ts`  
- `src/components/leads/LeadsKanban.tsx`  
- `src/components/leads/LeadsTable.tsx`  
- `src/components/leads/LeadMobileCard.tsx`  
- `src/components/leads/ConfirmStageTransitionDialog.tsx`

**Model delta**
- `LeadStage` gained `bad_fit`.
- Qualification semantics now exposed as visible status cues and stage reasons.

**UI/workflow consequence**
- Operators can explicitly classify non-viable leads without overloading `lost`/`postponed`.
- Closed-pipeline reporting now distinguishes "commercially lost" vs "structurally bad fit".

---

### 3.2 Lead enrichment schema expansion
**File references:**  
- `docs/supabase-migration-lead-enrichment.sql`  
- `src/types/crm.ts`  
- `src/components/leads/AddLeadDialog.tsx`  
- `src/components/leads/LeadEnrichmentSection.tsx`

**Model delta**
- Added enrichment columns for platform/spend/services/marketing maturity/tracking flags/scores/company profile/social/booking/research/completion metadata.

**UI/workflow consequence**
- Qualification now starts earlier (at lead creation/edit) instead of post-hoc note interpretation.
- Sales + delivery scoping decisions can happen before conversion, reducing handoff ambiguity.

---

### 3.3 Contract model and storage handling
**File references:**  
- `src/types/crm.ts`  
- `src/components/leads/SendContractDialog.tsx`  
- `src/pages/Engagements.tsx`  
- `docs/supabase-migration-contract-storage.sql`

**Model delta**
- Lead contract fields expanded with DigiSign metadata (`digisign_envelope_id`, `digisign_document_url`).
- Storage bucket + policies introduced for engagement contract files.

**UI/workflow consequence**
- Contract flow is now document-lifecycle aware, not only stage timestamp aware.
- Engagement operators can directly control artifact lifecycle (upload/replace/remove) inside CRM.

---

### 3.4 Modification request model expansion (`bulk_edit`)
**File references:**  
- `src/types/crm.ts`  
- `src/components/engagements/BulkEditStep.tsx`  
- `src/components/engagements/ProposeModificationDialog.tsx`  
- `src/components/engagements/ModificationRequestCard.tsx`

**Model delta**
- `ModificationRequestType` includes `bulk_edit`.
- New `BulkEditServiceItem` + `BulkEditProposedChanges` capture service action, assignment deltas, total revenue/cost deltas.

**UI/workflow consequence**
- One approval thread can now carry complete commercial redesign of an engagement.
- Reviewer cognitive load increases; richer summaries become mandatory for safe decisioning.

---

### 3.5 Optionality and shape changes in engagement/service interfaces
**File references:**  
- `src/types/crm.ts`  
- `src/hooks/useCRMData.tsx`

**Model delta**
- Several `Engagement`/`EngagementService` fields moved to optional in TypeScript (`managed_countries`, `pinned_notes`, multiple service flags).

**UI/workflow consequence**
- Forms and updates tolerate partial payloads more safely.
- Risk shifts to runtime defaults in rendering/calculations when optional fields are omitted.

---

## 4. Risk matrix (severity/likelihood/detectability)

| Area | Risk | Severity | Likelihood | Detectability | Why it matters |
|---|---|---:|---:|---:|---|
| Lead create | URL-required gate rejects valid-but-informal entries | Medium | Medium | High | Sales friction for operators used to company-name-first intake |
| Lead create | Auto-derived `company_name` creates low-quality canonical names | Medium | Medium | Medium | Pollutes downstream client naming and reporting |
| Enrichment capture | Tri-state boolean handling (`true`/`null`) hides explicit `false` intent | Medium | High | Low | Qualification/tracking reports become optimistic/incomplete |
| Kanban transitions | Stage change commits before analytics confirmation | Low | High | High | Analytics mismatch if user skips confirmation |
| Stage reasons | Mandatory reasons for lost/postponed/bad_fit lead to placeholder text quality | Low | Medium | Medium | Data quality degrades even if field is "filled" |
| Offer editing | Existing token reused with changed economics may surprise recipients | Medium | Medium | Medium | Client sees changed scope on same link without clear version framing |
| Offer snapshotting | Fallback default snapshot if DB read fails | Medium | Low | Low | Public offer content may diverge from intended CMS state |
| Contract draft | Local synthetic envelope IDs not reconciled with external source | High | Medium | Low | Contract status can appear "sent" before real external dispatch |
| Engagement contract storage | Signed URL expiry / path parsing failures on delete | Medium | Medium | Medium | Broken contract links or undeleted sensitive files |
| Conversion strictness | New required fields block time-sensitive conversions | Medium | High | High | Ops throughput drop if lead hygiene not improved |
| Conversion orchestration | Freelo/Slack failures are best-effort and can silently partial-complete | High | Medium | Medium | Team assumes setup complete when only CRM entities exist |
| Bulk edit requests | Single request can carry many hidden assignment changes | High | Medium | Medium | Financial leakage or margin drop if review is shallow |
| Bulk edit margin policy | Warning-only states may still pass to approval queues | Medium | Medium | High | Low-margin engagements can be promoted without hard guardrails |

---

## 5. Detailed regression checklist (at least 30 checks)

### 5.1 Lead create/edit and list checks
**File references:**  
- `src/components/leads/AddLeadDialog.tsx`  
- `src/components/leads/AddLeadServiceDialog.tsx`  
- `src/components/leads/LeadCard.tsx`  
- `src/components/leads/LeadMobileCard.tsx`  
- `src/components/leads/LeadsTable.tsx`

1. Creating lead without `website` fails with URL-required validation.
2. Creating lead with invalid URL format fails validation (`https://` missing scheme).
3. Creating lead with only website + owner succeeds and auto-fills `company_name`.
4. Blank `contact_name` auto-falls back to derived company name on submit.
5. ARES lookup triggers only at exactly 8-digit IČO and not earlier.
6. ARES response correctly fills company + billing address fields.
7. Enrichment numeric fields enforce bounds (`0..100` for scores).
8. Tracking checkboxes persist and `tracking_detected` is true when any is checked.
9. Booking datetime stores and reloads correctly in edit mode.
10. `company_research` text persists and displays in detail view.
11. AddLeadServiceDialog core tier selection updates default price by tier.
12. AddLeadServiceDialog intro discount computes discounted preview correctly.
13. AddLeadServiceDialog Creative Boost price = credits * price-per-credit.
14. Creative Boost margin badge changes color by threshold.
15. List card title shows cleaned domain when website exists.
16. Mobile card renders `bad_fit` stage label and color correctly.

### 5.2 Lead detail and stage transition checks
**File references:**  
- `src/components/leads/LeadDetailDialog.tsx`  
- `src/components/leads/LeadEnrichmentSection.tsx`  
- `src/components/leads/LeadFlowStepper.tsx`  
- `src/components/leads/ConfirmStageTransitionDialog.tsx`  
- `src/components/leads/LeadsKanban.tsx`

17. Lead detail opens with summary bar and enrichment cards when data exists.
18. Lead detail hides enrichment section cleanly when no enrichment data exists.
19. Quick-confirm meeting action sets `meeting_request_sent_at`.
20. Quick-confirm access-sent action sets `access_request_sent_at` and stage `waiting_access`.
21. Access received action sets `access_received_at` and stage `access_received`.
22. Dragging lead to `lost` opens reason-required dialog; confirm disabled until reason typed.
23. Dragging lead to `postponed` enforces reason-required path.
24. Dragging lead to `bad_fit` enforces reason-required path and logs through callback.
25. Skipping analytics still keeps stage move but avoids transition confirmation record.
26. Lead delete from detail removes lead and closes dialog safely.

### 5.3 Offer and contract checks
**File references:**  
- `src/components/leads/CreateOfferDialog.tsx`  
- `src/components/leads/EditableOfferServiceCard.tsx`  
- `src/components/leads/SendOfferDialog.tsx`  
- `src/components/leads/SendContractDialog.tsx`  
- `src/pages/Engagements.tsx`

27. Creating offer with zero services is blocked with error toast.
28. Offer creation stores bundle discount fields when non-zero.
29. Offer creation stores intro discount fields when non-zero.
30. Offer creation snapshots content blocks (DB success path).
31. Offer creation snapshots fallback defaults when DB block fetch fails.
32. Offer edit mode updates existing token instead of creating new one.
33. Offer edit mode appends history entry and displays in history panel.
34. SendOfferDialog blocks send when lead contact email is missing.
35. SendContractDialog blocks draft creation without Google Docs URL.
36. SendContractDialog draft creation updates lead with `digisign_envelope_id`.
37. LeadFlowStepper contract step action progression matches lead contract timestamps.
38. Engagements contract upload writes file and sets `contract_url`.
39. Engagements contract remove clears `contract_url` and attempts storage delete.

### 5.4 Conversion and engagement modification checks
**File references:**  
- `src/components/leads/ConvertLeadDialog.tsx`  
- `src/components/engagements/ProposeModificationDialog.tsx`  
- `src/components/engagements/BulkEditStep.tsx`  
- `src/components/engagements/ModificationRequestCard.tsx`  
- `src/types/crm.ts`

40. Conversion blocks when required legal/billing/contact fields are incomplete.
41. Conversion blocks when no team member assignment is present.
42. Conversion creates additional contacts when filled.
43. Conversion creates engagement services with discount fields correctly mapped.
44. Conversion continues (success) even if Freelo automation fails, but surfaces status.
45. Conversion continues (success) even if Slack automation fails, but surfaces status.
46. ProposeModificationDialog exposes `bulk_edit` request type in selector.
47. BulkEditStep supports service deactivation and reflects total delta immediately.
48. BulkEditStep supports adding new service and assignment payload generation.
49. BulkEditStep margin warning appears under threshold.
50. ModificationRequestCard renders `bulk_edit` summary with changed services and assignment deltas.
51. `isClientFacingRequestType('bulk_edit')` returns true and follows client-approval flow.

