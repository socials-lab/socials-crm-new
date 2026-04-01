# Domain Change Analysis: LEADS + ENGAGEMENTS (`f1421c4..f06ce73`)

Scope: Product-level behavior changes only for Leads and Engagements flows.

## 1) New capabilities added

### LEADS

- **Lead enrichment capture and display expanded significantly**
  - **Before:** Lead records mostly held core CRM sales fields (company/contact/stage/basic commercial data).
  - **After:** Leads can carry marketing/technical enrichment (platform, ad spend range, service needs, maturity, tracking stack, qualification scores, social links, booking metadata, AI research), and this is visible in detail UI.
  - **Examples:** `src/components/leads/AddLeadDialog.tsx`, `src/components/leads/LeadEnrichmentSection.tsx`, `src/types/crm.ts`, `docs/supabase-migration-lead-enrichment.sql`, `supabase/functions/lead-enrichment-webhook/index.ts`

- **DigiSign-oriented contract preparation workflow was introduced in lead detail**
  - **Before:** Contract progress was mostly status toggles/URL tracking from lead detail.
  - **After:** Users can run a 3-step flow (prepare in Google Docs -> paste doc URL -> create DigiSign draft metadata) directly from lead detail stepper.
  - **Examples:** `src/components/leads/SendContractDialog.tsx`, `src/components/leads/LeadFlowStepper.tsx`, `src/components/leads/LeadDetailDialog.tsx`, `src/types/crm.ts`

- **Lead conversion became orchestration-heavy**
  - **Before:** Conversion focused on creating client/contact/engagement with simpler input and fewer downstream automations.
  - **After:** Conversion now supports richer pricing editing, additional contacts, stronger validation, and post-conversion automations (Freelo project + Slack channel attempts) with conversion summary and redirect to the new engagement.
  - **Examples:** `src/components/leads/ConvertLeadDialog.tsx`

- **Offer creation/editing became bi-directional with lead data**
  - **Before:** Offer creation acted more as one-way generation.
  - **After:** Create-offer supports edit mode/history, richer discount logic, country variants, and syncs resulting services/discount metadata back into lead potential services.
  - **Examples:** `src/components/leads/CreateOfferDialog.tsx`, `src/components/leads/EditableOfferServiceCard.tsx`, `src/components/leads/LeadDetailDialog.tsx`

- **Engagement-level “bulk edit” modification requests added**
  - **Before:** Modification requests were granular (single add/update/deactivate style changes).
  - **After:** A single “bulk_edit” request can package multi-service price updates, deactivations, assignment reward changes, and new services in one proposal.
  - **Examples:** `src/components/engagements/BulkEditStep.tsx`, `src/components/engagements/ProposeModificationDialog.tsx`, `src/components/engagements/ModificationRequestCard.tsx`, `src/types/crm.ts`

- **Engagement contract file upload added**
  - **Before:** Engagement detail card emphasized editable Freelo URL entry in that slot.
  - **After:** Users can upload/remove contract files to `engagement-contracts` storage and open signed/public URLs from the engagement card.
  - **Examples:** `src/pages/Engagements.tsx`, `docs/supabase-migration-contract-storage.sql`

## 2) UX/UI workflow changes (dialogs, layouts, interactions)

- **Lead detail dialog redesigned from split-pane to data dashboard + process area**
  - **Before:** Classic two-column structure with collapsible detail blocks and process list.
  - **After:** Wide single-scroll layout with summary table, three enrichment cards (Firma / Web & Tracking / Marketing), booking strip, research block, and bottom 2-column area for process + notes/timeline.
  - **Examples:** `src/components/leads/LeadDetailDialog.tsx`, `src/components/leads/LeadEnrichmentSection.tsx`

- **Lead process stepper interaction became multi-action per step**
  - **Before:** Typically one action per step, less explicit resend/quick-confirm paths.
  - **After:** Steps can show multiple actions (send, resend, quick manual confirm, detail/edit), especially for meeting/access/offer/onboarding/contract.
  - **Examples:** `src/components/leads/LeadFlowStepper.tsx`

- **Lost/postponed/bad-fit transitions now ask for reason in transition dialog**
  - **Before:** Transition analytics confirmation without structured reason capture.
  - **After:** Transition dialog requires/free-captures reason text and can write that as lead notes in Kanban/detail flows.
  - **Examples:** `src/components/leads/ConfirmStageTransitionDialog.tsx`, `src/components/leads/LeadsKanban.tsx`, `src/components/leads/LeadDetailDialog.tsx`, `src/pages/Leads.tsx`

- **Lead list card identity shifted toward website/domain-first display**
  - **Before:** Company name was primary visual identity on cards/table/mobile card.
  - **After:** Domain/website-derived label is preferred in several list views; owner + qualification badges became more prominent.
  - **Examples:** `src/components/leads/LeadCard.tsx`, `src/components/leads/LeadMobileCard.tsx`, `src/components/leads/LeadsTable.tsx`

- **Lead deletion is now explicit from lead detail**
  - **Before:** No in-dialog destructive action in lead detail flow.
  - **After:** “Smazat lead” action and destructive confirmation exist in detail dialog, wired to data hook deletion.
  - **Examples:** `src/components/leads/LeadDetailDialog.tsx`, `src/pages/Leads.tsx`, `src/hooks/useLeadsData.tsx`

## 3) Data/model changes exposed to users

- **Lead stage model extended**
  - **Before:** Closed outcomes focused on won/lost/postponed.
  - **After:** `bad_fit` is a first-class stage, including labels/colors across Kanban/table/mobile/detail.
  - **Examples:** `src/types/crm.ts`, `src/components/leads/LeadsKanban.tsx`, `src/components/leads/LeadsTable.tsx`, `src/components/leads/LeadMobileCard.tsx`, `src/components/leads/LeadDetailDialog.tsx`

- **Lead schema includes DigiSign IDs and broad enrichment fields**
  - **Before:** No DigiSign envelope/document IDs and limited enrichment-specific attributes.
  - **After:** Lead now includes `digisign_envelope_id`, `digisign_document_url`, scoring/qualification/tracking/social/booking/research fields and enrichment lifecycle metadata.
  - **Examples:** `src/types/crm.ts`, `src/components/leads/AddLeadDialog.tsx`, `supabase/functions/lead-enrichment-webhook/index.ts`, `docs/supabase-migration-lead-enrichment.sql`

- **Modification request model now supports bulk engagement edits**
  - **Before:** No unified object for multi-service engagement reconfiguration.
  - **After:** New `bulk_edit` request type with dedicated `BulkEditProposedChanges` data contract and UI renderers.
  - **Examples:** `src/types/crm.ts`, `src/components/engagements/BulkEditStep.tsx`, `src/components/engagements/ModificationRequestCard.tsx`

## 4) Risky behavior changes / regressions to watch

- **Lead creation validation is stricter around website**
  - **Before:** Website could be optional/empty while mandatory company/contact were explicit.
  - **After:** Website URL is required and used to derive fallback company/contact identity.
  - **Risk:** Intake friction for low-info leads; potential low-quality auto-derived names.
  - **Example:** `src/components/leads/AddLeadDialog.tsx`

- **DigiSign contract step appears production-like but draft creation is currently simulated client-side**
  - **Before:** Simpler explicit status toggles had fewer hidden assumptions.
  - **After:** “Create draft” uses local simulated async + synthetic envelope ID and sets contract sent timestamp.
  - **Risk:** Users may interpret draft/send state as backend-confirmed when it is UI-simulated.
  - **Example:** `src/components/leads/SendContractDialog.tsx`

- **Engagement contract file links can expire**
  - **Before:** Engagement card focused on manually maintained Freelo URL.
  - **After:** Contract URLs rely on signed URL generation (1-year TTL fallback to public URL).
  - **Risk:** Stale contract links after expiration; support burden around “missing contract” access.
  - **Example:** `src/pages/Engagements.tsx`

- **Conversion now has more required fields and team assignment gate**
  - **Before:** Conversion was lighter-weight and easier to complete quickly.
  - **After:** Many fields are mandatory + at least one team member must be assigned; orchestration includes external automations that may fail partially.
  - **Risk:** Higher conversion drop-offs or longer handling time for incomplete leads.
  - **Example:** `src/components/leads/ConvertLeadDialog.tsx`

- **Offer discount logic complexity increased**
  - **Before:** More straightforward totals.
  - **After:** Per-service + bundle + intro discounts plus Creative Boost and country variants interact in totals/margins.
  - **Risk:** Pricing misunderstanding if users cannot easily reconcile stacked discount effects.
  - **Examples:** `src/components/leads/CreateOfferDialog.tsx`, `src/components/leads/EditableOfferServiceCard.tsx`, `src/components/leads/ConvertLeadDialog.tsx`

## 5) Removed / deprecated flows

- **Engagement Freelo inline-edit slot was replaced in the card by contract upload workflow**
  - **Before:** Users directly edited/saved Freelo URL in that “project tool” section.
  - **After:** The same area is now contract upload/open/remove UI; Freelo is still populated during conversion automation, but not managed there as the primary inline action.
  - **Example:** `src/pages/Engagements.tsx`

- **Lead detail “estimated price in header” and older split collapsible detail flow were removed/reduced**
  - **Before:** Header exposed editable estimated price and the dialog relied more on legacy collapsible blocks.
  - **After:** Header prioritizes website/stage/score with richer enrichment cards and process-led layout.
  - **Example:** `src/components/leads/LeadDetailDialog.tsx`
