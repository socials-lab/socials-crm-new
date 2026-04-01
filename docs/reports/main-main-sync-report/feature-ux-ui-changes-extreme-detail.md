# Extreme Detail Product Change Report

- Compared range: `f1421c4 -> f06ce73`
- Purpose: feature/UX/UI and workflow behavior delta, not commit chronology
- Coverage: Leads, Engagements, Recruitment, Onboarding, Public Offer, Sales Deck, Portfolio, Supabase backend impact

## Report Map

- **Leads + Engagements**: `extreme-domain-leads-engagements.md`
- **Recruitment + Onboarding**: `extreme-domain-recruitment-onboarding.md`
- **Public Offer + Sales Deck + Portfolio**: `extreme-domain-offer-deck-portfolio.md`
- **Supabase Backend Product Impact**: `extreme-domain-backend-impact.md`

## Top Product Deltas (Cross-domain)

- CRM moved from basic record flow to operations-heavy workflows (conversion/provisioning/offboarding/contract lifecycle).
- Leads gained deep enrichment intelligence and a redesigned operational detail surface.
- Recruitment shifted to explicit hiring + onboarding lifecycle with richer communication and status semantics.
- Public offer experience became content-managed, media-rich, and presentation-grade (including new Sales Deck).
- Backend added key primitives (tables/functions/storage/policies) that now directly control core user workflows.

---

## Part 1: Leads + Engagements

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

---

## Part 2: Recruitment + Onboarding

# EXTREME-DETAIL Product Change Report: Recruitment + Applicants + Onboarding

Compared range: `f1421c4..f06ce73`

Primary scope references:
- `src/types/applicant.ts`
- `src/pages/Recruitment.tsx`
- `src/components/recruitment/ApplicantsKanban.tsx`
- `src/components/recruitment/ApplicantsTable.tsx`
- `src/components/recruitment/ApplicantDetailSheet.tsx`
- `src/components/recruitment/SendInterviewInviteDialog.tsx`
- `src/components/recruitment/SendRejectionEmailDialog.tsx`
- `src/components/recruitment/SendApplicantOnboardingDialog.tsx`
- `src/components/recruitment/SendContractRequestDialog.tsx`
- `src/components/recruitment/ConvertApplicantDialog.tsx`
- `src/hooks/useApplicantsData.tsx`
- `src/hooks/useEmailTemplates.tsx`
- `src/pages/ApplicantOnboardingForm.tsx`
- `supabase/functions/applicant-onboarding/index.ts`
- `supabase/functions/create-workspace-account/index.ts`
- `supabase/functions/invite-slack-user/index.ts`
- `supabase/functions/invite-freelo-user/index.ts`
- `supabase/functions/offboard-colleague/index.ts`
- `src/components/colleagues/OffboardColleagueDialog.tsx`
- `docs/supabase-migration-applicants.sql`
- `docs/supabase-migration-contract-storage.sql`
- `docs/supabase-migration-bad-fit-stage.sql`
- `supabase/config.toml`

---

## 1) Stage Model Evolution (Precise)

### 1.1 Canonical stage enum changes
**Before**
- Applicant terminal stage for rejection was `rejected`.
- No explicit `postponed` stage.
- Pipeline semantics were mostly hiring-only.
- Ref: `src/types/applicant.ts` (pre-change in `f1421c4`).

**After**
- `rejected` replaced by `bad_fit`.
- New terminal/parking stage `postponed`.
- New stage order:
  - `new_applicant`
  - `invited_interview`
  - `interview_done`
  - `offer_sent`
  - `hired`
  - `bad_fit`
  - `withdrawn`
  - `postponed`
- Stage visual config updated accordingly (`APPLICANT_STAGE_CONFIG`).
- Ref: `src/types/applicant.ts`.

### 1.2 Semantic transition change
**Before**
- Reject action set stage to `rejected`.
- Ref: `src/hooks/useApplicantsData.tsx` (old behavior).

**After**
- Reject action sets stage to `bad_fit`.
- Explicitly used by rejection dialog flow and detail actions.
- Ref: `src/hooks/useApplicantsData.tsx`, `src/components/recruitment/SendRejectionEmailDialog.tsx`, `src/components/recruitment/ApplicantDetailSheet.tsx`.

### 1.3 New post-hire state model (orthogonal to `stage`)
**Before**
- `hired` was effectively final for recruitment board.
- No in-system onboarding progression model.

**After**
- `hired` now opens a secondary onboarding progression driven by booleans:
  - `buddy_meeting_done`
  - `academy_completed`
  - `first_clients_assigned`
  - `fully_onboarded`
  - `onboarding_terminated`
  - `terminated_at`
- This creates a two-layer model:
  1) Recruitment stage enum
  2) Onboarding operational progression
- Ref: `src/types/applicant.ts`, `src/components/recruitment/ApplicantsKanban.tsx`, `src/components/recruitment/ApplicantDetailSheet.tsx`.

---

## 2) Board / Filter / Detail Behavior Changes

## 2.1 Recruitment board architecture
### Before interaction model
- Single Kanban layout with end columns embedded in same stream.
- No separate visual/operational onboarding pipeline.
- Ref: `src/components/recruitment/ApplicantsKanban.tsx` (old).

### After interaction model
- Board split into 3 zones:
  1) Hiring pipeline columns (`new_applicant` -> `hired`)
  2) Dedicated onboarding pipeline for hired candidates:
     - `buddy_meeting`, `academy`, `first_clients`, `fully_ready`, `terminated`
  3) Collapsible closed section (`bad_fit`, `withdrawn`, `postponed`)
- Hired candidates are displayed operationally in onboarding columns (not treated as flat terminal cards).
- Ref: `src/components/recruitment/ApplicantsKanban.tsx`.

### After expected state changes
- Dragging to hiring columns updates `stage`.
- Dragging to onboarding columns updates onboarding flags and possibly `stage='hired'`.
- Drop to `terminated` sets:
  - `onboarding_terminated=true`
  - `terminated_at=now`
- Drop to non-terminated onboarding step resets termination and sets progression booleans by step index.
- Ref: `src/components/recruitment/ApplicantsKanban.tsx`, `src/hooks/useApplicantsData.tsx`.

## 2.2 Recruitment filters and slicing
### Before
- Filters: search + owner + stage.
- Search fields narrower (name/email/position).
- Ref: `src/pages/Recruitment.tsx` (old).

### After
- New filters: `position`, `source`.
- Search expanded to include `phone`.
- Active filter summary introduced with quick reset.
- Working set intentionally scoped to `pipelineApplicants`:
  - excludes `bad_fit`, `withdrawn`, `postponed`
  - excludes converted hireds (`hired` with `converted_to_colleague_id`)
- Ref: `src/pages/Recruitment.tsx`.

### User-visible implication
- Recruitment view is no longer “all applicants”, but “active + in-progress operational set”.
- Closed outcomes still accessible via Kanban “Uzavřené”.
- Converted colleagues are intentionally hidden from active pipeline.

## 2.3 Detail sheet operating model
### Before
- Primarily linear action cards and stage selector.
- No explicit contract sent/signed operational controls.
- No embedded offboarding for converted hired candidates.

### After
- Header now drives stage/edit controls contextually:
  - Non-hired: stage selector over recruitment stages (including `bad_fit`, `postponed`)
  - Hired: onboarding-step selector instead of direct stage progression
- Pipeline stepper added (`interview` -> `hired` -> `onboarding` -> `contract` -> `colleague`).
- Action stack now includes:
  - interview invite send/resend
  - rejection send/resend
  - onboarding form send/resend
  - internal contract-request email generation
  - contract sent marker toggle
  - contract signed marker toggle
  - convert to colleague
  - offboard converted colleague
- Ref: `src/components/recruitment/ApplicantDetailSheet.tsx`.

### Expected state mutations from detail actions
- Stage selector: `updateApplicantStage(id,newStage)`.
- Onboarding step selector: deterministic boolean reset/set model, optionally termination timestamp.
- Contract sent toggle: sets/clears `contract_sent_at`.
- Contract signed toggle: sets/clears `contract_signed_at`.
- Offboarding completion callback sets:
  - `onboarding_terminated=true`
  - `terminated_at=now`
- Ref: `src/components/recruitment/ApplicantDetailSheet.tsx`.

---

## 3) Email Dialogs: Before/After Interaction Model + State Effects

## 3.1 Interview Invite dialog
Ref: `src/components/recruitment/SendInterviewInviteDialog.tsx`

### Before
- Single recipient input.
- Simpler compose/send form.
- No explicit “mark as sent” path.
- No scheduling URL integration from profile-level setting.

### After
- Recipient chip model (`toEmails[]`) with add/remove validation.
- Default BCC seeded (`danny@socials.cz`, `dana.bauerova@socials.cz`).
- CC/BCC expanded controls.
- Template merge now supports `meeting_url` via `useMeetingScheduleUrl`.
- Adds explicit “Označit jako odeslané” (mark-as-sent) action.
- Adds warning signature when meeting URL is missing.

### Expected state change
- Both send and mark-as-sent call parent `onSend(...)`.
- Parent updates:
  - `interview_invite_sent_at=now`
  - timeline note (if email payload supplied)
- Ref chain: `SendInterviewInviteDialog.tsx` -> `ApplicantDetailSheet.tsx` -> `useApplicantsData.tsx`.

## 3.2 Rejection Email dialog
Ref: `src/components/recruitment/SendRejectionEmailDialog.tsx`

### Before
- One template variant.
- Semantic stage target communicated as “Zamítnut”.

### After
- Two explicit variants:
  - `friendly`
  - `constructive`
- Variant switch rehydrates subject/body from separate templates:
  - `rejection_email`
  - `rejection_email_constructive`
- Adds “mark as sent”.
- Copy now states move to “Bad fit”.

### Expected state change
- On send or mark-as-sent:
  - `rejection_sent_at=now`
  - `stage='bad_fit'`
- Ref chain: `SendRejectionEmailDialog.tsx` -> `ApplicantDetailSheet.tsx` -> `useApplicantsData.tsx`.

## 3.3 Applicant Onboarding Email dialog
Ref: `src/components/recruitment/SendApplicantOnboardingDialog.tsx`

### Before
- “Send” action launched `mailto:` externally.
- In-app state change happened around that UX pattern.

### After
- In-app async send simulation; no `mailto:` popup.
- Explicit dual actions:
  - send
  - mark as sent
- Copy/CTA normalized (“Odeslat email”, “Označit jako odeslané”).

### Expected state change
- `sendOnboarding(...)` updates:
  - `onboarding_sent_at=now`
- Optional timeline note for email payload.
- Ref chain: `SendApplicantOnboardingDialog.tsx` -> `useApplicantsData.tsx`.

## 3.4 Contract Request dialog (new)
Ref: `src/components/recruitment/SendContractRequestDialog.tsx`

### Before
- No dedicated contract-preparation email interaction in recruitment flow.

### After
- New internal dialog with:
  - default TO (`dana.bauerova@socials.cz`)
  - default BCC (`danny@socials.cz`)
  - editable multi-recipient chips
  - template `contract_request` prefilled from applicant contract + personal data
  - send + mark-as-sent actions

### Expected state change
- Current implementation calls `onSend()` only.
- In `ApplicantDetailSheet`, `onSend={() => {}}` (no mutation).
- Therefore behavior is UI-confirmation only; does not persist “request sent” state.
- Ref: `src/components/recruitment/SendContractRequestDialog.tsx`, `src/components/recruitment/ApplicantDetailSheet.tsx`.

---

## 4) Conversion + Onboarding Actions (Before/After + Operational Sequence)

## 4.1 Applicant onboarding form (public flow)
Refs: `src/pages/ApplicantOnboardingForm.tsx`, `supabase/functions/applicant-onboarding/index.ts`

### Before
- Mostly local/mock prefill and local submit behavior.
- No guaranteed backend persistence contract.

### After
- GET prefill from Edge Function `applicant-onboarding` using `applicantId`.
- POST onboarding payload to same function.
- Server validates applicant exists and is in `hired`.
- Server writes onboarding fields and sets `onboarding_completed_at`.
- Server generates admin/management notifications with contract summary metadata.

### Expected persisted changes (POST success)
- Personal fields: `birthday`, `personal_email`, `avatar_url`, `phone`.
- Billing fields: `ico`, `company_name`, `dic`, `billing_street`, `billing_city`, `billing_zip`.
- Financial fields: `hourly_rate`, `bank_account`.
- Lifecycle timestamp: `onboarding_completed_at=now`.

## 4.2 Conversion dialog (applicant -> colleague)
Ref: `src/components/recruitment/ConvertApplicantDialog.tsx`

### Before
- Primarily conversion data capture and colleague creation.
- No strongly integrated provisioning sequence.

### After (sequential operational model)
1. Optional Google Workspace creation (`create-workspace-account`)
2. Optional Slack invitation (`invite-slack-user`) using workspace email if created
3. Optional Freelo invitation (`invite-freelo-user`) using workspace email if created
4. CRM invite via `invite-user` with `specialist` role and limited default access
5. Conversion summary template composed (`conversion_summary`) and success toast shown
6. Final colleague creation through `completeOnboarding(...)`

### Gate behavior
- If Workspace creation selected and fails, flow aborts early with toast; downstream services are skipped.
- Slack/Freelo failures are non-blocking to final conversion.
- CRM invite handles “already exists” as acceptable.

### Expected persisted changes after successful conversion
- Applicant:
  - `converted_to_colleague_id` set
  - stage typically still `hired` but now linked to colleague
- Colleague:
  - new record with onboarding data, billing fields, etc.
  - additional contract URL placeholders set to null in provider conversion path
- Ref: `src/hooks/useApplicantsData.tsx`.

## 4.3 Offboarding path from recruitment detail
Refs: `src/components/recruitment/ApplicantDetailSheet.tsx`, `src/components/colleagues/OffboardColleagueDialog.tsx`, `supabase/functions/offboard-colleague/index.ts`

### Before
- No direct offboarding action embedded in applicant detail lifecycle.

### After
- For hired+converted candidates, detail shows termination action.
- Dialog supports system-level offboarding toggles:
  - Google Workspace suspend (+ forwarding attempt)
  - Slack deactivate
  - Freelo removal
- Requires typed confirmation text “ukončit”.

### Expected state changes
- Service operations return per-system success/failure.
- UI callback marks applicant onboarding terminated (`onboarding_terminated=true`, `terminated_at=now`).
- Partial failures are visible but do not block status mutation in UI callback path.

---

## 5) Onboarding + Contract Lifecycle States and Sequence (Operational)

Canonical sequence (ideal path):
1. Candidate progresses through recruitment stages to `hired`.
2. Operator sends onboarding form (`onboarding_sent_at`).
3. Candidate submits onboarding form -> backend writes data + `onboarding_completed_at`.
4. Operator opens detail and reviews “Údaje pro smlouvu”.
5. Operator opens contract request dialog and sends internal request (currently non-persistent marker).
6. Operator marks `contract_sent_at`.
7. Operator marks `contract_signed_at`.
8. Operator runs conversion dialog:
   - account provisioning options
   - CRM invite
   - colleague creation
9. Candidate is linked as colleague (`converted_to_colleague_id`).
10. Optional post-conversion onboarding progression continues using onboarding-step booleans.
11. Optional termination/offboarding path executes external deactivation + sets termination flags.

Alternative terminal branches:
- Branch A: rejection -> `bad_fit` (+ `rejection_sent_at`)
- Branch B: withdrawal -> `withdrawn`
- Branch C: delayed action -> `postponed`

Operational caveat:
- Contract request send has no persisted timestamp in this flow, unlike contract sent/signed toggles.

---

## 6) Migration / Config / Env Dependencies + User-Visible Failure Signatures

## 6.1 Schema dependencies
Refs: `docs/supabase-migration-applicants.sql`, `src/types/applicant.ts`, `src/components/recruitment/*`

Dependency:
- Runtime UI expects fields beyond baseline applicants migration doc:
  - `portfolio_url`
  - `contract_sent_at`, `contract_signed_at`
  - onboarding progression booleans and termination fields

Failure signatures:
- Data appears editable in UI but fails to persist or silently drops in backend-backed contexts.
- Contract status toggles reset on reload.
- Onboarding pipeline drag outcomes not durable.

## 6.2 Edge function deployment + JWT policy
Refs: `supabase/functions/applicant-onboarding/index.ts`, `supabase/config.toml`

Dependency:
- Applicant onboarding endpoint is designed as public form endpoint.
- `supabase/config.toml` does not explicitly define `[functions.applicant-onboarding] verify_jwt = false`.

Failure signatures:
- Public onboarding links fail with unauthorized/auth headers issues depending on project defaults.
- Candidate sees inability to load prefill or submit onboarding.

## 6.3 External integration env dependencies (conversion/offboarding)
Refs: `supabase/functions/create-workspace-account/index.ts`, `supabase/functions/invite-slack-user/index.ts`, `supabase/functions/invite-freelo-user/index.ts`, `supabase/functions/offboard-colleague/index.ts`

Required envs (by function):
- Workspace:
  - `GOOGLE_SERVICE_ACCOUNT_KEY`
  - `GOOGLE_ADMIN_EMAIL`
- Slack:
  - `SLACK_ADMIN_TOKEN`
  - optional `SLACK_BOT_TOKEN` for channel additions/lookup behaviors
- Freelo:
  - `FREELO_API_KEY`
  - `FREELO_USER_EMAIL`
- Core Supabase function env:
  - `SUPABASE_URL`
  - service/anon keys per function strategy

Failure signatures:
- Conversion toasts: “nepodařilo se vytvořit Google Workspace účet”, Slack/Freelo invite errors.
- Partial provisioning (some systems enabled, others missing) while conversion still completes.
- Offboarding result panel shows per-system red error badges while applicant already marked terminated.

## 6.4 Template key dependencies
Refs: `src/hooks/useEmailTemplates.tsx`, recruitment dialogs

Dependency:
- Dialogs rely on keys: `interview_invite`, `rejection_email`, `rejection_email_constructive`, `applicant_onboarding`, `contract_request`, `conversion_summary`.

Failure signatures:
- Empty/wrong default content in dialog composer if key mismatch or migration of templates incomplete.
- Operators forced into manual rewriting under time pressure.

## 6.5 Function inventory dependency in config
Refs: `supabase/config.toml`

Observed change:
- Added explicit `verify_jwt = false` for `create-slack-channel` and `offboard-colleague`.

Failure signature if mismatch with expected auth model:
- Either unauthorized errors (if JWT required but not supplied), or security exposure (if accidentally public where it should be protected).

---

## 7) Deep Regression Checklist (45 checks)

1. Creating applicant with new fields (`ai_usage`, `personal_brand`, `social_links`, `portfolio_url`) persists and reloads correctly.
2. Applicant stage defaults to `new_applicant`.
3. Rejection action now sets `bad_fit`, never `rejected`.
4. `postponed` can be selected and rendered with correct badge style.
5. Recruitment search includes phone numbers.
6. Recruitment source filter returns exact subset for each source enum value.
7. Recruitment position filter handles dynamic list from current dataset.
8. “Clear filters” fully resets all five filter controls.
9. Active filter summary counts shown as filtered vs pipeline total are correct.
10. Converted hired applicants are excluded from `pipelineApplicants`.
11. Kanban hiring columns render without closed stages mixed in.
12. Closed section collapses/expands and shows counts for `bad_fit`/`withdrawn`/`postponed`.
13. Drag from non-hired stage to hired stage updates stage and card relocates to onboarding segment.
14. Drag hired applicant to onboarding `academy` sets `buddy_meeting_done` and `academy_completed`.
15. Drag hired applicant to `first_clients` sets prior flags and not `fully_onboarded`.
16. Drag to `fully_ready` sets all onboarding progression booleans.
17. Drag to `terminated` sets `onboarding_terminated=true` and `terminated_at`.
18. Drag from `terminated` back to non-terminated onboarding step clears termination fields.
19. Table sort toggles asc/desc for `full_name`.
20. Table sort toggles asc/desc for `position`.
21. Table sort toggles asc/desc for `stage`.
22. Table sort toggles asc/desc for `source`.
23. Table sort toggles asc/desc for `created_at`.
24. Detail sheet for non-hired shows recruitment stage selector (not onboarding selector).
25. Detail sheet for hired shows onboarding-step selector.
26. Interview invite dialog initializes recipient chips with applicant email.
27. Interview invite dialog warns when meeting URL unavailable.
28. Interview invite “mark as sent” updates `interview_invite_sent_at`.
29. Rejection dialog variant switch rewrites subject/body between friendly and constructive templates.
30. Rejection “send” and “mark as sent” both move applicant to `bad_fit`.
31. Onboarding send dialog no longer opens external `mailto` and still updates `onboarding_sent_at`.
32. Onboarding form GET prefill fails gracefully for invalid/non-hired applicant ID.
33. Onboarding form POST stores personal, billing, and financial fields.
34. Onboarding form POST sets `onboarding_completed_at`.
35. Onboarding completion triggers admin/management notification insert.
36. Contract request dialog prefilled values match current applicant data.
37. Contract request dialog send path currently does not mutate applicant state (known behavior).
38. Contract “marked as sent” toggle sets and clears `contract_sent_at`.
39. Contract “marked as signed” toggle sets and clears `contract_signed_at`.
40. Conversion dialog pre-fills from applicant onboarding data when present.
41. If Workspace creation fails and toggle enabled, conversion aborts before Slack/Freelo/CRM dependent path.
42. Slack invite handles `already_in_team` as non-fatal.
43. Freelo invite handles “already existing” branch as non-fatal success message.
44. Offboarding dialog requires exact confirmation text to enable destructive action.
45. Offboarding partial failure shows per-system results while still closing lifecycle in recruitment view callback.

---

## 8) Biggest Product-Level Behavior Changes (Consolidated)

1. Recruitment evolved from a single hiring board into a dual lifecycle system: hiring pipeline + post-hire onboarding operations with drag-driven onboarding state transitions.
2. Rejection semantics changed from generic `rejected` to explicit `bad_fit`, including dialog copy, stage mapping, and closed-pipeline reporting.
3. Applicant detail became an operational command center (email actions, onboarding progress, contract sent/signed controls, conversion, and offboarding hooks) instead of a passive detail pane.
4. Conversion transformed into a sequential provisioning workflow (Workspace -> Slack -> Freelo -> CRM), with dependency-sensitive behavior and partial-failure handling.
5. Onboarding moved from mostly local/mock behavior to Edge Function-backed persistence and notification triggering, making form submission part of contract-preparation operations.

---

## Part 3: Public Offer + Sales Deck + Portfolio

# EXTREME-DETAIL Product Change Report (`f1421c4 -> f06ce73`)

## Scope

This report focuses only on:
- Public Offer experience (`PublicOfferPage`)
- Sales Deck experience (`SalesDeck` + slide components)
- Portfolio + Offer Content admin workflows and runtime data sourcing

Primary source files in this range:
- `src/pages/PublicOfferPage.tsx`
- `src/pages/SalesDeck.tsx`
- `src/components/sales-deck/slides/*`
- `src/pages/Portfolio.tsx`
- `src/pages/OfferContentEditor.tsx`
- `src/pages/OfferManagement.tsx`
- `src/hooks/useOfferContent.tsx`
- `src/hooks/usePortfolioData.tsx`
- `src/data/publicOffersData.ts`
- `src/data/publicOffersMockData.ts`
- `src/types/publicOffer.ts`
- `src/App.tsx`
- `src/index.css`
- `docs/supabase-migration-offer-content.sql`
- `docs/supabase-migration-portfolio.sql`
- `docs/supabase-migration-offer-assets-bucket.sql`
- `docs/supabase-migration-public-offers-table.sql`

---

## 1) PublicOfferPage: full user-visible section/component mapping

## Before (`f1421c4`) vs After (`f06ce73`) at page architecture level

- Before: compact, quote-like flow with lighter storytelling and smaller number of major blocks.
- After: long-form sales narrative with modular section system, animation wrappers, richer media, and CMS/snapshot-driven content.

New top-level sequencing in `f06ce73`:
1. Sticky header with theme toggle/share/desktop CTA
2. Hero
3. Credibility badges
4. Loom/video intro block (conditional)
5. Audit findings (HTML or parsed bullets)
6. Why Us
7. Creative Portfolio (image/video gallery + lightbox)
8. Reporting
9. Services + pricing cards
10. Pricing summary with stacked discounts
11. Benefits
12. Onboarding process timeline
13. Contact + strong CTA block
14. Client logos block
15. Certifications block
16. Footer links
17. Mobile sticky CTA

### 1.1 Header + top controls

### Before
- Sticky header existed, but simpler.
- No explicit public dark/light switching.
- CTA copy was onboarding-form oriented.

### After
- Header uses `offer-dark`/`offer-light` variable scopes from `src/index.css`.
- New theme toggle (`Sun`/`Moon`) toggles local `isDark` state.
- Share button behavior:
  - `navigator.clipboard.writeText(window.location.href)`
  - "Sdilet" -> "Zkopirovano" transient 2s state.
- Desktop CTA renamed and reframed to "Zacit spolupraci".
- Header logo now switches by theme (`socialsLogo` vs `socialsLogoDark`).

User-visible impact:
- Offer now feels like a dedicated microsite, not an embedded CRM export page.

### 1.2 Hero block

### Before
- More transactional tone ("Navrh spoluprace pro ...", validity metadata).
- Simpler title hierarchy.

### After
- Positioning shifted to strategic messaging ("Strategicka nabidka pro ...").
- Contact personalization string changed ("Pripraveno pro ...", with explicit special-case grammar for "Jan Novak" -> "Jana Novaka").
- Typographic scale increased (desktop headline to `md:text-5xl`).

### 1.3 Credibility badges strip

### Before
- Credibility mostly represented in footer and limited static text.

### After
- Dedicated early-page badge strip from content blocks:
  - Reads `getOfferContent(offer, 'credibility_badges').content.items`
  - Dot separators between badges
  - Hidden entirely if no items

### 1.4 Validity warning

### Before
- Existence check present in old flow.

### After
- Styling changed to stricter red-warning treatment (`red-500` palette in dark context).

### 1.5 Loom + audit introduction

### Before
- Loom could appear in separate lower section.
- Audit text was largely plain text summary.

### After
- Intro section conditionally appears when any of `audit_summary | loom_url | custom_note` exists.
- Loom video appears before audit findings in a framed card (`AspectRatio 16:9`).
- Immediate visual section divider inserted after intro.

### 1.6 Audit findings block

### Before
- "Co jsme zjistili" delivered mostly as one compact text region.

### After
- Two render modes:
  - HTML mode (`offer.audit_html`) via `dangerouslySetInnerHTML`, with explicit prose styling including image rendering
  - Fallback bullet parsing from `audit_summary` line splits
- Adds explicit sub-panels:
  - Recommendation panel (`offer.recommendation_intro`)
  - Custom note panel (`offer.custom_note`)
- Stronger card-style readability and visual scanning.

Risk note:
- HTML mode trusts stored HTML and can introduce style/markup inconsistency if content quality varies.

### 1.7 Why Us section

### Before
- Why-us argumentation was lighter and less compositional.

### After
- Fully data-driven via `content_blocks_snapshot` or defaults.
- Grid of stat cards + separate external-link cards.
- Hover behaviors reinforce clickability for evidence links.

### 1.8 Creative Portfolio section

### Before
- Portfolio proof was primarily link-card oriented (`PortfolioLink` style cards).
- No immersive in-page media browsing.

### After
- Replaced link cards with visual gallery architecture:
  - Banner grid
  - Video grid
  - Lightbox modal via `createPortal`
- Data source: `usePublicPortfolio()` (Supabase `portfolio_items`), with large fallback local asset set if empty.
- Adds keyboard navigation in lightbox (`ArrowLeft`, `ArrowRight`, `Escape`).

Huge UX shift:
- From "proof by outbound links" to "proof by embedded media browsing".

### 1.9 Reporting section

### Before
- Reporting value existed, but not as emphasized standalone showcase.

### After
- Dedicated section with:
  - Configurable heading/subtitle from content blocks
  - Embedded iframe demo report
  - Explicit "Open demo report" CTA
  - Optional note text from content block

### 1.10 Services + package structure

### Before
- Service grouping existed but with smaller visual hierarchy.
- No explicit one-off section grouping.
- No country-variant visual treatment.

### After
- Service cards redesigned:
  - stronger border/glow states
  - mobile/desktop differentiated pricing layout
  - country flags and country-variant pricing rows
  - nested "detailed sections" reveal with refined styling
- Grouping expanded:
  - core services
  - add-ons
  - one-off services
  - legacy untyped fallback
- "How we structure services" explainer redesigned and reframed.

### 1.11 Pricing summary logic

### Before
- Monthly discount support existed but simpler (single discount model).

### After
- Multi-layer discount narrative:
  - bundle discount (`monthly_discount_percent`)
  - intro discount (`intro_discount_percent`, `intro_discount_months`)
  - explicit waterfall explanation
- Visual hierarchy significantly stronger (large numerics, discount badges, combined-summary note).

### 1.12 Benefits section

### Before
- Benefits were less prominent.

### After
- Dedicated standalone benefits section:
  - title/subtitle from content blocks
  - icon+text card grid
  - reveal animations

### 1.13 Onboarding section

### Before
- Compact "how it works" mini timeline with 3 simple steps.

### After
- Expanded onboarding timeline:
  - 5 detailed steps
  - icon mapping by semantic step token
  - per-step timeline chips
  - section-driven editable content
  - hover and reveal micro-interactions

### 1.14 Contact + CTA section

### Before
- CTA simpler and less branded in tone.

### After
- CTA pulled from content blocks:
  - dynamic title/subtitle/extended_subtitle/button_text/footer_note
- Contact card redesigned in premium style.
- CTA button larger and high-contrast with neon shadow emphasis.

### 1.15 Clients and certifications proof blocks

### Before
- Proof mostly textual in footer (partners/badges text).

### After
- Two dedicated media sections:
  - client logos grid (`clients_logos`)
  - certifications grid (`certifications`)
- Sources:
  - content block `images` if provided
  - imported default assets fallback

### 1.16 Footer + mobile sticky CTA

### Before
- Mobile sticky CTA included price snippet + form-oriented action.

### After
- Mobile sticky CTA simplified to single action focus (no live price display).
- Footer link copy normalized and styled for theme mode.

Potential regression:
- Removing mobile price preview may reduce immediate pricing context for late-stage mobile users.

---

## 2) Interaction deep dive (required behaviors)

### 2.1 Theme toggle mechanics

- Local state only (`isDark`), no persistence to storage or URL.
- Applies `offer-dark` vs `offer-light` class at page root.
- Header, footer logo, and sticky mobile CTA backgrounds react instantly.

Behavioral implications:
- Reload resets to dark mode default.
- Theme choice is per-session and per-page render only.

### 2.2 Scroll reveal mechanics

- New local components `ScrollReveal` and `StaggerReveal` in page.
- Uses `IntersectionObserver` with one-time unobserve behavior.
- Animates opacity + translateY with optional delay.

Perf-sensitive note:
- Many observers/animated nodes increase work on long pages, especially on low-end mobile.
- Good mitigation exists: observers unobserve once intersected.

### 2.3 Lightbox mechanics

- Triggered from `PortfolioGrid` item click.
- Rendered in portal to `document.body`.
- Supports:
  - click outside to close
  - prev/next controls
  - keyboard arrows and escape
  - image and video branches

Potential edge cases:
- No scroll lock on `<body>` while modal open (possible background scroll on some devices).
- Repeated open/close under heavy media may expose decode delays.

### 2.4 Media loading behavior

Images:
- Many grid images use `loading="lazy"`.

Video thumbnails:
- `preload="metadata"` to avoid full payload upfront.
- Desktop hover plays/rewinds preview.
- Mobile suppresses hover playback logic and shows static video frame.

Lightbox video:
- `controls` + `autoPlay`.

Risk:
- Fallback portfolio set includes many local videos; if DB is empty, first meaningful gallery interaction can still be heavy.

### 2.5 Mobile behavior

- Service cards have dedicated mobile row for price/details hint.
- Sticky bottom CTA for mobile remains always present.
- Gallery uses `2-column` on mobile and single interaction target per tile.
- In `VideoThumbnail`, mobile branch avoids hover play complexity.

Risk:
- Long page + sticky CTA can hide or crowd final content on small viewport heights if safe-area handling is inconsistent on some Android devices.

### 2.6 CTA behavior

Primary CTA entrypoints:
- Header desktop CTA
- Main CTA section button
- Mobile sticky CTA

All route to:
- `/onboarding/${offer.lead_id}`

Potential regression:
- If `lead_id` is malformed/null in some imported offers, all primary conversion actions degrade simultaneously.

---

## 3) SalesDeck behavior and navigation mechanics

## Surface and route

- New public route: `/sales-deck` in `src/App.tsx`.
- New full-screen page `src/pages/SalesDeck.tsx`.

## Rendering model

- Fixed canonical slide size: `1920x1080`.
- Runtime `scale = min(window.innerWidth/1920, window.innerHeight/1080)`.
- Slide centered with absolute positioning and CSS transform scale.

UX impact:
- Preserves composition fidelity across displays.
- On narrow screens, readability depends on scaled text; no adaptive reflow per slide.

## Slide composition stack (11 slides)

1. `TitleSlide`
2. `CredibilitySlide`
3. `WhyUsSlide`
4. `BenefitsSlide`
5. `CertificationsSlide`
6. `ClientsSlide`
7. `ReportingSlide`
8. `CreativeSlide`
9. `CreativeExamplesSlide`
10. `OnboardingSlide`
11. `CtaSlide`

## Navigation controls

Keyboard:
- `ArrowRight` or `Space` -> next
- `ArrowLeft` -> previous
- `Escape`:
  - exits fullscreen if active
  - otherwise `navigate(-1)`

Pointer:
- Invisible click zones:
  - left third = previous
  - right third = next
- Bottom dot indicators direct-jump to any slide.
- Prev/next icon buttons with disabled state at bounds.

Fullscreen:
- Toggle button calls `requestFullscreen()` / `exitFullscreen()`.
- `fullscreenchange` event keeps icon state synced.

UI visibility behavior:
- Top bar and bottom nav are opacity-hidden by default and reveal on hover.

Potential usability concern:
- Touch-first environments may not naturally discover hover-revealed controls (though click-zones partly compensate).

## Content data behavior

- Most slides consume `DEFAULT_OFFER_CONTENT`.
- `CreativeExamplesSlide` bypasses defaults and fetches Supabase `portfolio_items` live (`is_active=true` + sorted).

Regression risk:
- Deck has mixed data origin (static defaults + live DB query) which can create content inconsistency in offline/demo contexts.

---

## 4) Portfolio/Admin workflows and data sourcing hierarchy

## 4.1 New management surfaces

Added routes and pages:
- `/portfolio` -> `Portfolio`
- `/offer-editor` -> `OfferContentEditor`
- `/offer-management` -> tabbed container combining both

`OfferManagement` tabs:
- `portfolio`
- `editor`

## 4.2 Portfolio workflow (admin side)

Capabilities in `Portfolio` + `usePortfolioData`:
- List `portfolio_items`
- Filter by media type
- Upload image/video files to `portfolio` bucket
- Auto-append sort order
- Edit title + sort order
- Toggle `is_active`
- Delete storage object + DB row
- Show demo dataset if DB empty

Notable behavior:
- Drop-zone supports drag/drop of image/video.
- Video tiles display muted frame with play overlay.

## 4.3 Offer content workflow (admin side)

`OfferContentEditor` + `useOfferContent` provide per-section editing for:
- credibility badges
- why us
- reporting
- creative portfolio
- benefits
- onboarding
- CTA
- clients logos
- certifications

Section-type editors include:
- generic header/content editors
- list editors (items/steps/links)
- image grid uploader for logos/certs to `offer-assets` bucket

## 4.4 Runtime data sourcing hierarchy (critical)

For `PublicOfferPage` content blocks:
1. `offer.content_blocks_snapshot[sectionKey]` (highest priority)
2. `DEFAULT_OFFER_CONTENT[sectionKey]`
3. empty block fallback (`title:null`, `subtitle:null`, `content:{}`)

For offer object retrieval:
1. test/mock token path (`publicOffersMockData`)
2. Supabase `public_offers` by token

For portfolio visuals on public offer page:
1. `usePublicPortfolio()` from Supabase `portfolio_items` where `is_active=true`
2. hardcoded fallback asset list (`/public/images/portfolio/*`)

For logos/certifications:
1. content block `images` arrays
2. imported local assets

Practical consequence:
- The page is intentionally resilient: it almost always renders something, but freshness and provenance can differ section-by-section.

---

## 5) Performance-sensitive changes and likely UX regressions

## Performance-sensitive changes introduced

- `PublicOfferPage` expanded from ~952 to ~1532 lines with many new components and animated nodes.
- Multiple IntersectionObservers for reveal effects.
- Embedded iframe(s) and numerous media thumbnails.
- Large fallback media corpus (images + mp4 assets) in public path.
- Lightbox with potentially high-resolution image/video decode.
- SalesDeck includes full viewport rendering with heavy typography and gradients.

## Likely UX regressions / fragility points

1. Theme preference does not persist; user selection resets on reload.
2. Share button uses Clipboard API without explicit error fallback for denied permissions.
3. Portfolio lightbox lacks explicit body scroll lock.
4. `CreativeExamplesSlide` has no error-state UI; silent empty deck panel possible.
5. Public offer page still carries token debug output in not-found state (acceptable for internal staging, risky for production polish).
6. Mixed content provenance (snapshot/default/live portfolio) can produce semantic mismatch across sections.
7. Mobile sticky CTA dropped price context, potentially reducing confidence at conversion moment.
8. Many hover-dependent cues reduce discoverability on touch devices.
9. High media payload fallback path can degrade first interaction on weaker devices.
10. If `lead_id` missing, all CTA links break to invalid onboarding route.

---

## 6) Regression checklist (40 checks)

### PublicOfferPage rendering and sections

1. Valid token loads full page without console errors.
2. Invalid token shows not-available state and test-link.
3. Hero displays website-derived company label correctly.
4. Credibility badges hide when content array empty.
5. Loom iframe renders only when `loom_url` exists.
6. Audit HTML mode renders images and lists correctly.
7. Audit summary fallback parses multiline bullets correctly.
8. Recommendation panel appears only when value exists.
9. Custom note panel appears only when value exists.
10. Why-us links open in new tab and keep rel safety attrs.
11. Reporting iframe URL is read from content block override when present.
12. Reporting button opens same URL as iframe source.
13. Service groups appear in correct order: core/addon/one-off/other.
14. Service card expand/collapse works on both desktop and mobile.
15. Country flags show when managed countries or country variants exist.
16. Country variant prices and multipliers render correct math labels.
17. Pricing summary shows bundle discount strike-through correctly.
18. Intro discount badge text pluralization is correct for 1/2-4/5+ months.
19. Combined discount note appears only when both discount types active.
20. Benefits cards render from content block item count accurately.
21. Onboarding step icon mapping works for known icon keys.
22. Contact card hides entirely when no owner name/email.
23. Main CTA button text respects content override.
24. Clients logos use fallback assets when content images empty.
25. Certifications logos use fallback assets when content images empty.
26. Footer links all open correct destination URLs.
27. Mobile sticky CTA appears only under `sm` breakpoint.

### PublicOffer interactions and behavior

28. Theme toggle switches page-level palette consistently.
29. Theme toggle also swaps header/footer logo variant.
30. Share button transitions to copied state for ~2 seconds.
31. Scroll reveal animations trigger once and do not flicker on reverse scroll.
32. Image tile click opens lightbox at correct index.
33. Video tile click opens video with controls in lightbox.
34. Lightbox prev/next buttons wrap correctly from ends.
35. Lightbox keyboard arrows navigate and Escape closes.
36. Clicking overlay (outside media) closes lightbox.
37. Desktop video thumbnail hover plays then resets on leave.
38. Mobile video thumbnail does not attempt hover playback.

### SalesDeck

39. `/sales-deck` route loads without auth and shows slide 1.
40. Arrow keys/space/escape behavior matches deck spec.
41. Dot indicators jump to exact slide index.
42. Left/right click zones navigate within bounds only.
43. Fullscreen toggle state tracks `fullscreenchange` accurately.
44. Resize recalculates scale and keeps slide centered.
45. Deck controls are still operable on touch devices despite hover styling.
46. `CreativeExamplesSlide` displays loading state then media when DB reachable.

### Portfolio + admin workflows

47. `/offer-management?tab=portfolio` opens embedded portfolio management tab.
48. `/offer-management?tab=editor` opens embedded offer editor tab.
49. Portfolio upload accepts supported image/video and persists to DB.
50. Portfolio item `is_active` toggle affects public offer gallery visibility.
51. Portfolio delete removes both DB record and storage object.
52. Offer editor save persists title/subtitle/content updates by section key.
53. Clients/certs image uploads to `offer-assets` resolve to public URLs.
54. Public offer shows snapshot content over current global content blocks.
55. When snapshot missing, default content is used without runtime crash.

---

## 7) Net product shift (domain-level conclusion)

This range transforms the offer domain from a functional quote page into a CMS-backed, media-rich, narrative sales experience; introduces a dedicated presentation product (`SalesDeck`) with keyboard/fullscreen mechanics; and formalizes admin control planes for both reusable offer copy and portfolio assets, backed by Supabase tables/buckets and public-safe RLS policies.

---

## Part 4: Supabase Backend Product Impact

# Extreme Backend-to-Product Impact Report

## Scope and Baseline

- **Compared commits:** `f1421c4` -> `f06ce73`
- **Focus:** Backend-facing deltas only (Supabase SQL/migrations, Edge Functions, storage, RLS/JWT config, and backend contract changes consumed by frontend).
- **Important operational note:** Most SQL changes in this range are present as `docs/supabase-migration-*.sql` files (not `supabase/migrations/*`). Product impact is therefore **potential**, and becomes **effective only after execution in Supabase**.

## Backend Delta Inventory (Complete)

### 1) Database / SQL / Policy / Storage deltas

#### A. `docs/supabase-migration-applicants.sql` (new)

**Change set**
- Creates enum `public.applicant_stage` with values:
  - `new_applicant`, `invited_interview`, `interview_done`, `offer_sent`, `hired`, `bad_fit`, `withdrawn`, `postponed`
- Creates enum `public.applicant_source` with values:
  - `website`, `linkedin`, `referral`, `job_portal`, `other`
- Creates table `public.applicants` with:
  - identity/contact fields (`full_name`, `email`, `phone`, `position`)
  - submission context (`cover_letter`, `ai_usage`, `personal_brand`, `social_links`, `cv_url`, `video_url`)
  - pipeline (`stage`, `owner_id`)
  - notes (`jsonb`)
  - source tracking (`source`, `source_custom`)
  - onboarding/freelancer fields (`ico`, `company_name`, `dic`, `hourly_rate`, billing fields, `bank_account`)
  - personal fields (`birthday`, `personal_email`, `avatar_url`)
  - communication events (`interview_invite_sent_at`, `rejection_sent_at`)
  - onboarding events (`onboarding_sent_at`, `onboarding_completed_at`, `converted_to_colleague_id`)
  - audit fields (`created_at`, `updated_at`)
- Enables RLS on `public.applicants`
- Adds policy `"CRM users can manage applicants"` for `FOR ALL TO authenticated USING is_crm_user(auth.uid())`
- Adds policy `"CRM users can read applicants"` for `SELECT` (redundant with ALL policy but harmless)
- Adds `update_applicants_updated_at` trigger invoking `update_updated_at_column()`

**Product capability unlocked**
- Full recruitment pipeline persistence in Supabase instead of pure in-memory/mock lifecycle.
- Enables public onboarding form writes via edge function + service role while keeping direct table access restricted.
- Adds canonical structure needed for:
  - onboarding prefill by applicant ID
  - onboarding completion timestamps
  - conversion readiness to colleague

**Operational consequences**
- Requires helper function existence: `is_crm_user(uuid)` and `update_updated_at_column()`.
- If not applied, any feature querying/updating `applicants` in Supabase path fails and falls back to local/mock behavior in several frontend hooks/components.

---

#### B. `docs/supabase-migration-bad-fit-stage.sql` (new)

**Change set**
- `ALTER TYPE public.lead_stage ADD VALUE IF NOT EXISTS 'bad_fit';`

**Product capability unlocked**
- Sales pipeline can classify leads as explicit `bad_fit` instead of overloading `lost`.
- Enables nuanced funnel analytics and stage-specific UX labels/filters.

**Operational consequences**
- If not applied, writing `lead_stage='bad_fit'` can fail at DB layer with enum constraint errors.

---

#### C. `docs/supabase-migration-contract-storage.sql` (new)

**Change set**
- Creates private storage bucket `engagement-contracts` (`public=false`)
- Adds storage RLS policies for authenticated CRM users:
  - insert/select/delete/update with predicate:
  - `bucket_id='engagement-contracts' AND public.is_crm_user(auth.uid())`

**Product capability unlocked**
- Contract document lifecycle for engagements:
  - upload contract docs
  - read/download via generated URLs
  - replace/delete contract files

**Operational consequences**
- Bucket is private, so direct public URLs are not durable for anonymous access.
- Frontend mitigates by attempting signed URL generation (`createSignedUrl`) and storing that URL on engagement.
- Signed URL expiry creates long-tail failures if persisted URL is stale.

---

#### D. `docs/supabase-migration-lead-enrichment.sql` (new)

**Change set**
- Adds 27+ enrichment columns on `leads`:
  - marketing context (`enrichment_platform`, `enrichment_ad_spend_range`, `enrichment_services_needed`, `marketing_experience`, `marketing_maturity`, `has_creative_team`, `pain_point`)
  - tracking/signals (`has_ga4`, `has_gtm`, `has_meta_pixel`, `has_google_ads`, `tracking_detected`, `lead_score`, `credibility_score`, `enrichment_qualification_tier`)
  - company info (`is_vat_payer`, `is_ecommerce`, `business_type`, `company_address`)
  - social URLs (`facebook_url`, `instagram_url`)
  - booking (`booking_status`, `booking_datetime`, `booking_meet_link`)
  - enrichment metadata (`company_research`, `enrichment_completed`, `enrichment_id`)

**Product capability unlocked**
- External enrichment ingestion can enrich lead records without custom schema extensions.
- Supports qualification workflows, meeting automation metadata, and improved lead scoring.

**Operational consequences**
- Edge webhook depends on these fields for update path; missing columns produce update failures.

---

#### E. `docs/supabase-migration-notifications.sql` (modified)

**Change set**
- Creates/ensures `notifications` table:
  - `user_id`, `type`, `title`, `message`, `entity_type`, `entity_id`, `link`, `is_read`, `read_at`, `metadata`, `created_at`
- Adds indexes:
  - `(user_id, is_read, created_at DESC)`
  - `(entity_type, entity_id)`
  - `(created_at DESC)`
- Enables RLS
- Policies:
  - users read/update/delete own notifications (`auth.uid()=user_id`)
  - CRM users can insert notifications for anyone (`is_crm_user(auth.uid())`)
- Enables realtime publication:
  - `ALTER PUBLICATION supabase_realtime ADD TABLE notifications`

**Product capability unlocked**
- Real-time in-app notifications with per-user visibility and mark/read lifecycle.
- System and admin triggered notifications become first-class persisted events.

**Operational consequences**
- Realtime subscription from frontend requires publication registration; if missing, UI only sees polling/fetch snapshot behavior.
- Insert policy allows CRM user to notify others; non-CRM authenticated users cannot create arbitrary notifications for others.

---

#### F. `docs/supabase-migration-offer-assets-bucket.sql` (new)

**Change set**
- Creates public bucket `offer-assets` (`public=true`)
- Policies on `storage.objects`:
  - public read for anon+authenticated
  - write/update/delete only for authenticated CRM users (`is_crm_user(auth.uid())`)

**Product capability unlocked**
- Visual CMS for public offer page assets (client logos, certifications) without requiring signed URLs.

**Operational consequences**
- Public readability intentionally exposes media by URL; treat uploads as public marketing assets only.

---

#### G. `docs/supabase-migration-offer-content.sql` (new)

**Change set**
- Creates table `public.offer_content_blocks`
  - `section_key` unique
  - editable `title`, `subtitle`, `content jsonb`
  - `updated_at`, `updated_by`
- RLS:
  - anon/authenticated read allowed
  - authenticated CRM users can `FOR ALL` manage rows
- Seeds default content for sections:
  - `why_us`, `benefits`, `onboarding`, `reporting`, `creative_portfolio`, `cta`, `clients_logos`, `certifications`, `credibility_badges`

**Product capability unlocked**
- Offer page moves from static frontend text to DB-managed content blocks.
- Enables internal editor workflow with immediate public page impact.

**Operational consequences**
- If migration not applied, frontend hook logs warning and uses code defaults; editors cannot persist changes.

---

#### H. `docs/supabase-migration-portfolio.sql` (new)

**Change set**
- Creates public bucket `portfolio` (`public=true`)
- Storage policies:
  - public read for all (`TO public`)
  - CRM-only write/update/delete
- Creates table `public.portfolio_items`
  - `title`, `file_url`, `type image|video`, `sort_order`, `is_active`, `created_at`
- RLS:
  - public can select active items (`is_active=true`)
  - authenticated CRM users can view all + `FOR ALL` manage

**Product capability unlocked**
- Centralized portfolio feed (images/videos) for sales deck/public showcase with reorder + activation controls.

**Operational consequences**
- Missing table/policies breaks content management and public rendering path.
- Public bucket means file URL leakage is expected behavior.

---

#### I. `docs/supabase-migration-public-offers-table.sql` (new)

**Change set**
- Creates `public.public_offers` with tokenized public sharing model.
- Core fields:
  - `token` unique
  - lead and contact context
  - offer body (`services`, `portfolio_links`, `audit_summary`, `recommendation_intro`, `custom_note`, etc.)
  - pricing and discount fields
  - tracking fields (`viewed_at`, `view_count`)
  - history and content snapshot fields
- RLS:
  - CRM users `FOR ALL`
  - anon `SELECT` on active offers
  - anon `UPDATE` limited to active rows (for view tracking)
- Indexes:
  - `idx_public_offers_token`
  - `idx_public_offers_lead_id`

**Product capability unlocked**
- Public offer pages can be generated/stored server-side and shared by token.
- Supports conversion analytics (`view_count`) and immutable-at-time snapshots.

**Operational consequences**
- `anon UPDATE` policy is broad to all columns unless constrained by app logic; frontend currently writes only tracking fields but policy could permit wider updates if request crafted.

---

### 2) Edge Function deltas (code + behavior)

#### A. `supabase/functions/agency-assistant/index.ts` (modified)

**Behavioral delta**
- Prompt now injects live CRM context from DB (`clients`, `engagements`, `leads`, `extra_works`, `colleagues`, `services`) in addition to SOP content.
- Adds strict confidentiality instructions:
  - no individual compensation disclosure
  - no total revenue/profitability disclosure
  - permit client/service-level info
- Removes internal reward detail tables from prompt template.
- Adds forced brevity behavior and stronger “you have CRM access” system instruction.

**Request/response behavior**
- Input: JSON `{ messages }`
- CORS preflight supported (`OPTIONS`)
- Uses service role client for data reads
- Streams AI output (`text/event-stream`) from Lovable AI gateway
- Status handling:
  - `429` -> JSON friendly rate limit message
  - `402` -> JSON “insufficient credits”
  - other gateway errors -> `500`

**Product capability impact**
- Assistant answers become grounded in current CRM state.
- Reduces accidental internal compensation leakage in assistant replies.

---

#### B. `supabase/functions/applicant-onboarding/index.ts` (new)

**Endpoint contract**
- Public endpoint by design (uses service role internally).
- Methods:
  - `GET ?applicantId=...`
  - `POST` body includes `{ applicantId, ...onboarding fields }`

**GET behavior**
- 400 if missing `applicantId`
- fetch applicant by id
- 404 if not found
- 400 if applicant `stage !== 'hired'`
- 200 `{ success, applicant, already_completed }`

**POST behavior**
- 400 if missing `applicantId`
- verifies applicant exists and is `hired`
- updates onboarding + billing + personal data
- sets `onboarding_completed_at=now()`
- loads full applicant and inserts notifications for `admin`/`management` users via `user_roles`
- returns 200 success or 500 on write error

**Product capability impact**
- Enables external onboarding form completion for hired applicants.
- Triggers internal operational notification to prepare contract.

---

#### C. `supabase/functions/create-freelo-project/index.ts` (new)

**Endpoint contract**
- Input: `{ project_name, currency?, team_emails? }`
- Validates required env:
  - `FREELO_API_KEY`, `FREELO_USER_EMAIL`, `FREELO_TEMPLATE_PROJECT_ID`

**Behavior**
- Creates project from Freelo template via `create-from-template`
- Invites merged deduplicated team email list (includes default email)
- Returns project metadata + invited count
- Freelo API errors are proxied with status and details

**Product capability impact**
- Lead-to-engagement conversion can auto-provision project workspace in Freelo.

---

#### D. `supabase/functions/create-slack-channel/index.ts` (new)

**Endpoint contract**
- Input: `{ channel_name, team_emails? }`
- Requires `SLACK_BOT_TOKEN`

**Behavior**
- Sanitizes channel name (length and character constraints)
- Creates channel via Slack API
- if `name_taken`, returns success with `already_existed=true`
- resolves user IDs by email and invites users to channel
- returns `channel_id`, `channel_name`, `invited_count`

**Product capability impact**
- Auto-provisions client channel during engagement conversion workflow.

---

#### E. `supabase/functions/create-workspace-account/index.ts` (new)

**Endpoint contract**
- Input: `{ first_name, last_name, personal_email?, password? }`
- Requires Bearer token + claim validation
- Requires env:
  - `GOOGLE_SERVICE_ACCOUNT_KEY`
  - `GOOGLE_ADMIN_EMAIL`

**Behavior**
- Creates signed JWT for Google domain-wide delegation
- exchanges JWT for access token
- generates workspace email `<first>.<last>@socials.cz`
- creates Google Workspace user with forced password change
- handles conflict 409 for existing user
- returns success payload including generated temporary password

**Product capability impact**
- Recruitment conversion workflow can provision first-party workspace identity.

---

#### F. `supabase/functions/invite-freelo-user/index.ts` (new)

**Endpoint contract**
- Input: `{ email, project_id? }`
- Uses default onboarding project id if not provided.

**Behavior**
- Calls Freelo `users/manage-workers`
- Returns invited count and already-existing count with contextual message.

**Product capability impact**
- Applicant conversion can invite new colleague to onboarding project.

---

#### G. `supabase/functions/invite-slack-user/index.ts` (new)

**Endpoint contract**
- Input: `{ email, channels? }`
- Requires auth token and claim verification.
- Requires `SLACK_ADMIN_TOKEN`; optional `SLACK_BOT_TOKEN`.

**Behavior**
- Invites user via admin invite API (`users.admin.invite`)
- tolerates `already_in_team` and `already_invited`
- if already in team and channels provided, resolves user and invites to named channels
- returns semantic result: success, already-in-team, channels added

**Product capability impact**
- Applicant conversion can provision Slack access with channel assignment.

---

#### H. `supabase/functions/lead-enrichment-webhook/index.ts` (new)

**Endpoint contract**
- Method: POST only
- Auth: expects `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`

**Behavior**
- Maps enrichment payload fields to `leads` columns
- lead matching sequence:
  1. `enrichment_id`
  2. `contact_email`
  3. fuzzy `company_name` (`ilike`)
- if no match: inserts new lead with source `website`, stage `new_lead`
- else updates existing lead
- returns `{success, action: created|updated, lead_id}`

**Product capability impact**
- Supports external enrichment systems posting directly into CRM lead records.

---

#### I. `supabase/functions/offboard-colleague/index.ts` (new)

**Endpoint contract**
- Input: `{ email, deactivate_google, deactivate_slack, remove_freelo }`
- Requires auth token and claim verification

**Behavior**
- Performs selected operations in parallel:
  - Google account forwarding setup + suspension
  - Slack account deactivation
  - Freelo removal across projects
- Returns aggregate `{ success, results }` where each subsystem reports its own status/error.

**Product capability impact**
- Adds controlled offboarding operation from one UI action, reducing manual deprovisioning risk.

---

### 3) Supabase config JWT verification deltas

#### `supabase/config.toml` (modified)

**Added config blocks**
- `[functions.create-slack-channel] verify_jwt = false`
- `[functions.offboard-colleague] verify_jwt = false`

**Security implication**
- These functions now accept requests without platform-level JWT enforcement.
- They still implement custom token checks in code for some paths, but disabling gateway verify increases exposure surface (e.g., malformed/forged headers reaching runtime).
- `create-slack-channel` currently has **no in-function JWT claim verification**; with `verify_jwt=false`, this endpoint becomes effectively callable by any bearer of project URL/key path access that can reach function endpoint.

## Security Model Deep Dive (JWT + RLS + Service Role)

### JWT enforcement matrix

- **Public by design (no JWT required):**
  - `applicant-onboarding` (intended for external hire onboarding form)
  - `agency-assistant` (already configured no JWT)
- **Explicitly no JWT in config but should be protected:**
  - `create-slack-channel` (high-risk provisioning endpoint)
  - `offboard-colleague` (has in-code auth check, but gateway disabled)
- **JWT checked in function code (anon key + claims):**
  - `create-workspace-account`, `invite-slack-user`, `offboard-colleague`
- **Service-role secret based auth:**
  - `lead-enrichment-webhook`

### RLS model consequences by asset

- `applicants`: CRM users only via `is_crm_user`; service-role function bypasses RLS for public onboarding writes.
- `notifications`: user self-access enforced; inserts for arbitrary users restricted to CRM users.
- `public_offers`: anon read active offers and anon update active offers (for tracking) with broad update potential.
- `offer_content_blocks`: public read, CRM write.
- `portfolio_items`: public active-read, CRM full-manage.
- storage `offer-assets` / `portfolio`: public read, CRM write.
- storage `engagement-contracts`: CRM-authenticated access only.

### High-risk spots introduced in this range

1. `create-slack-channel` with `verify_jwt=false` and no claim checks.
2. `public_offers` anon `UPDATE` policy not column-scoped (depends on client-side discipline).
3. Public onboarding endpoint uses service role and applicant ID only; relies on stage checks and obscurity of IDs.

## Frontend Workflow Dependency Graph (Backend Requirements)

## 1) Lead -> Engagement conversion workflow
- **Frontend nodes**
  - `src/components/leads/ConvertLeadDialog.tsx`
- **Backend dependencies**
  - Edge function `create-freelo-project`
  - Edge function `create-slack-channel`
  - Table `public_offers` (reads via `getOffersByLeadId`)
  - Optional table `offer_content_blocks` (through offer creation/snapshot flow elsewhere)
- **Expected behavior**
  - Creates CRM entities then provisions Freelo + Slack, storing URLs/channel outcomes.

## 2) Applicant public onboarding workflow
- **Frontend nodes**
  - `src/pages/ApplicantOnboardingForm.tsx`
- **Backend dependencies**
  - Edge function `applicant-onboarding` GET/POST
  - Table `applicants`
  - Table `notifications`
  - Table `user_roles` (for admin/management notification fan-out)
- **Expected behavior**
  - Hired applicant opens tokenized link, submits billing/personal data, admins get notified.

## 3) Applicant -> Colleague conversion workflow
- **Frontend nodes**
  - `src/components/recruitment/ConvertApplicantDialog.tsx`
- **Backend dependencies**
  - Edge function `create-workspace-account`
  - Edge function `invite-slack-user`
  - Edge function `invite-freelo-user`
  - Existing function `invite-user`
- **Expected behavior**
  - Optional workspace account first; Slack/Freelo/CRM invites chained from resulting email.

## 4) Colleague offboarding workflow
- **Frontend nodes**
  - `src/components/colleagues/OffboardColleagueDialog.tsx`
- **Backend dependencies**
  - Edge function `offboard-colleague`
  - Google Admin APIs
  - Slack Admin APIs
  - Freelo APIs
- **Expected behavior**
  - One operation dispatches selected deprovisioning steps and returns subsystem status matrix.

## 5) Engagement contract document workflow
- **Frontend nodes**
  - `src/pages/Engagements.tsx`
- **Backend dependencies**
  - Storage bucket `engagement-contracts`
  - storage RLS policies for CRM users
- **Expected behavior**
  - Upload/replace/remove contracts; signed URL used for access in private bucket.

## 6) Offer content CMS workflow
- **Frontend nodes**
  - `src/pages/OfferContentEditor.tsx`
  - `src/hooks/useOfferContent.tsx`
- **Backend dependencies**
  - Table `offer_content_blocks`
  - Storage bucket `offer-assets`
- **Expected behavior**
  - CRM edits copy and uploads logos/certs used in public offer pages.

## 7) Public offers workflow
- **Frontend nodes**
  - `src/data/publicOffersData.ts`
- **Backend dependencies**
  - Table `public_offers`
  - RLS anon read/update + CRM manage
- **Expected behavior**
  - Save offers, fetch by token, increment view counters, maintain change history snapshots.

## 8) Portfolio workflow
- **Frontend nodes**
  - `src/hooks/usePortfolioData.tsx`
  - `src/components/sales-deck/slides/CreativeExamplesSlide.tsx`
- **Backend dependencies**
  - Table `portfolio_items`
  - Bucket `portfolio`
- **Expected behavior**
  - Upload/order/activate portfolio media and render to public/sales contexts.

## 9) Notifications workflow
- **Frontend nodes**
  - `src/hooks/useNotifications.tsx`
- **Backend dependencies**
  - Table `notifications`
  - Realtime publication `supabase_realtime`
  - RLS policies
- **Expected behavior**
  - User-scoped realtime feed with read/delete actions and system inserts.

## Failure Signatures by Missing Dependency

### SQL/migration not applied failures

- **Missing `applicants` table**
  - `applicant-onboarding` returns DB errors (500) on select/update.
  - Applicant onboarding page falls back to mock/not-found path; production flow breaks.
- **Missing `applicant_stage` enum values**
  - insert/update failures with enum errors on `stage`.
- **Missing `bad_fit` in `lead_stage`**
  - stage update attempts fail with enum cast/value errors.
- **Missing `notifications` table/policies**
  - UI hook logs fetch errors; realtime channel receives nothing; inserts fail.
- **Missing realtime publication for notifications**
  - initial fetch works; live updates never appear (stale notification badge behavior).
- **Missing `public_offers`**
  - offer save/fetch/update calls fail; public offer pages and view tracking fail.
- **Missing `offer_content_blocks`**
  - editor save attempts fail; frontend logs warning and shows defaults only.
- **Missing `portfolio_items`**
  - portfolio management and rendering queries fail.

### Storage/policy failures

- **Missing `engagement-contracts` bucket or policy**
  - upload/remove calls fail with storage not found / permission denied.
- **Missing `offer-assets` bucket/policies**
  - editor upload for logos/certs fails.
- **Missing `portfolio` bucket/policies**
  - portfolio media upload/remove fails; stale DB records may persist.

### Function/config/env failures

- **Missing function deployment (`create-freelo-project`, `create-slack-channel`, etc.)**
  - `supabase.functions.invoke` returns not found/function error in conversion dialogs.
- **Missing env vars**
  - Freelo/Slack/Google functions return 500 with “... not configured”.
- **Invalid Google delegation/service account**
  - workspace creation/offboarding Google steps fail with token or directory API errors.
- **Slack token scope issues**
  - channel creation or invite/deactivate paths fail with Slack API `not_authed`, `missing_scope`, or API error payloads.
- **Lead enrichment webhook auth mismatch**
  - returns `401 Unauthorized` if Authorization bearer != current service role key.

## Operational Rollout Verification Checklist (37 checks)

### A) Migration execution checks

1. `applicant_stage` enum exists and includes all 8 expected values.
2. `applicant_source` enum exists and includes 5 expected values.
3. `applicants` table exists.
4. `applicants` has trigger `update_applicants_updated_at`.
5. RLS is enabled on `applicants`.
6. `notifications` table exists.
7. RLS enabled on `notifications`.
8. `notifications` indexes exist (user_unread/entity/created_at).
9. `notifications` is in `supabase_realtime` publication.
10. `public_offers` table exists.
11. `public_offers` indexes (`token`, `lead_id`) exist.
12. `offer_content_blocks` table exists with seed rows for all expected section keys.
13. `portfolio_items` table exists.
14. `lead_stage` enum contains `bad_fit`.
15. `leads` table includes all enrichment columns from migration.

### B) Storage/RLS checks

16. Bucket `engagement-contracts` exists and is private.
17. Bucket `offer-assets` exists and is public.
18. Bucket `portfolio` exists and is public.
19. `engagement-contracts` policies permit CRM auth users and deny anon.
20. `offer-assets` policies allow anon/auth select and CRM-only writes.
21. `portfolio` policies allow public read and CRM-only writes.

### C) Edge function deployment/config checks

22. Functions deployed: `applicant-onboarding`, `create-freelo-project`, `create-slack-channel`, `create-workspace-account`, `invite-freelo-user`, `invite-slack-user`, `lead-enrichment-webhook`, `offboard-colleague`.
23. `agency-assistant` deployed with updated prompt logic.
24. Confirm `verify_jwt` settings match intended security posture per function.
25. `create-slack-channel` endpoint is protected (recommended: enable JWT verify and claims check).
26. `offboard-colleague` endpoint requires valid JWT end-to-end.

### D) Secret/env checks (presence + runtime)

27. `FREELO_API_KEY` present and valid.
28. `FREELO_USER_EMAIL` present.
29. `FREELO_TEMPLATE_PROJECT_ID` present.
30. `SLACK_BOT_TOKEN` present with conversations/user scopes.
31. `SLACK_ADMIN_TOKEN` present with admin invite/deactivate scopes.
32. `GOOGLE_SERVICE_ACCOUNT_KEY` valid JSON with private key + client email.
33. `GOOGLE_ADMIN_EMAIL` present and has delegated admin rights.
34. `LOVABLE_API_KEY` present for `agency-assistant`.

### E) End-to-end workflow checks

35. Lead conversion creates Freelo project and writes `freelo_url` to engagement.
36. Lead conversion creates Slack channel and returns channel metadata.
37. Applicant onboarding GET rejects non-hired applicants and accepts hired applicants.
38. Applicant onboarding POST writes onboarding fields and sets `onboarding_completed_at`.
39. Applicant onboarding POST inserts notifications for admin/management users.
40. Convert applicant flow creates workspace account and can continue with new email.
41. Convert applicant flow invites user to Slack and Freelo.
42. Offboarding executes selected subsystem operations and returns structured result object.
43. Contract upload in engagements page succeeds and opens via generated URL.
44. Offer content editor saves block updates to DB and re-renders public offer.
45. Offer asset upload returns public URL and displays in page.
46. Portfolio upload creates storage file + `portfolio_items` row.
47. Notifications page receives realtime inserts without manual refresh.

### F) Abuse/regression checks

48. Verify anonymous caller cannot mutate non-tracking fields in `public_offers`.
49. Verify non-CRM authenticated users cannot insert arbitrary notifications for other users.
50. Verify `create-slack-channel` cannot be called without authorized user identity (post-hardening).
51. Verify onboarding endpoint cannot update applicants outside hired stage.

## Highest-Leverage Hardening Recommendations

1. Re-enable `verify_jwt=true` for `create-slack-channel` and enforce CRM/admin claim check in code.
2. Tighten `public_offers` anon update path (RPC or trigger-based view counter) to prevent broad row mutation.
3. Move SQL files from `docs/` to versioned `supabase/migrations/` for deterministic rollout and drift control.
4. Add integration smoke tests for each critical function and storage bucket policy.
5. Add API-level audit logging table for provisioning/deprovisioning functions.

## Five Highest-Impact Backend Deltas (Business/Operational)

1. **Recruitment onboarding backend introduced** (`applicants` schema + `applicant-onboarding` function + admin notifications), enabling externally submitted onboarding data to drive internal hiring operations.
2. **Automated provisioning/offboarding orchestration added** (Google Workspace, Slack, Freelo functions), materially changing onboarding/offboarding speed and risk profile.
3. **Public offer stack moved to Supabase persistence** (`public_offers`, `offer_content_blocks`, `offer-assets`) enabling tokenized offer lifecycle, analytics, and CMS-driven content.
4. **Portfolio backend introduced** (`portfolio_items` + `portfolio` bucket + RLS), enabling centrally managed creative proof for sales/public pages.
5. **Security posture changed via function JWT config** (`create-slack-channel` and `offboard-colleague` set to `verify_jwt=false`), significantly increasing dependency on in-function auth correctness and raising exposure if not hardened.
