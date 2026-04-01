# Specific Product Change Report (`f1421c4 -> f06ce73`)

This report is intentionally feature-first (not commit-first).  
It describes what changed in app behavior, UI, and workflows compared to the state before this commit range.

## 1) Leads: qualification and detail experience changed fundamentally

### Before
- Lead records were mostly sales-core fields (company/contact/stage/basic commercial data).
- Lead detail was a simpler structure with fewer operational sub-sections.
- Pipeline transitions had less structured reason capture.

### After
- Lead records include a full enrichment layer (tracking stack, ad spend range, marketing maturity, qualification scoring, social links, booking metadata, company research).
- Lead detail became an operational dashboard:
  - dedicated enrichment cards
  - booking strip
  - research block
  - process/timeline area
- Stage transitions to terminal states now capture reason text more explicitly in flow.
- Lead list identity shifted toward website/domain-first display in several views.
- Lead delete action is directly available from detail flow with explicit confirmation.

### Where visible
- `src/components/leads/LeadDetailDialog.tsx`
- `src/components/leads/LeadEnrichmentSection.tsx`
- `src/components/leads/AddLeadDialog.tsx`
- `src/components/leads/ConfirmStageTransitionDialog.tsx`
- `src/components/leads/LeadCard.tsx`
- `src/components/leads/LeadMobileCard.tsx`
- `src/components/leads/LeadsTable.tsx`

## 2) Lead conversion: from simple conversion to orchestrated operations

### Before
- Conversion was mainly CRM data transfer with lighter validation and fewer downstream actions.

### After
- Conversion flow is stricter and broader:
  - richer required data
  - team-assignment gating
  - additional contacts handling
  - deeper pricing/service handling in conversion
- Conversion now orchestrates downstream setup (Freelo project and Slack channel pathways), then returns a conversion summary/next-step behavior.

### User-facing impact
- More complete setup in one flow.
- Higher operator friction when lead data is incomplete.

### Where visible
- `src/components/leads/ConvertLeadDialog.tsx`

## 3) Contracts in leads/engagements: new document-first UX

### Before
- Contract progress was more status/URL driven; engagement area favored Freelo URL editing in that slot.

### After
- New DigiSign-oriented lead contract preparation flow:
  - prepare document
  - add Google Doc URL
  - create draft metadata path
- Engagements gained contract file lifecycle:
  - upload
  - remove
  - open stored URL
- Storage-backed contract handling became part of normal engagement operations.

### Where visible
- `src/components/leads/SendContractDialog.tsx`
- `src/components/leads/LeadFlowStepper.tsx`
- `src/pages/Engagements.tsx`
- `docs/supabase-migration-contract-storage.sql`

## 4) Engagement modifications: bulk-edit proposal capability added

### Before
- Modification requests were more granular/single-intent.

### After
- New `bulk_edit` request behavior supports one proposal containing:
  - multi-service pricing updates
  - deactivations
  - assignment/reward updates
  - added services
- This changes engagement-change handling from multiple micro-requests into one structured change set.

### Where visible
- `src/components/engagements/BulkEditStep.tsx`
- `src/components/engagements/ProposeModificationDialog.tsx`
- `src/components/engagements/ModificationRequestCard.tsx`
- `src/types/crm.ts`

## 5) Recruitment pipeline model changed (including stage semantics)

### Before
- Recruitment used simpler stage semantics including `rejected`.
- Post-hire progress handling was less explicit as a dedicated pipeline.

### After
- Stage semantics changed:
  - `rejected` replaced by `bad_fit`
  - `postponed` introduced
- Recruitment board behavior split more clearly into:
  - hiring progression
  - onboarding progression for hired candidates
  - closed outcomes
- Applicant detail actions became much more operational (contract sent/signed checkpoints, resend actions, conversion/offboarding actions).

### Where visible
- `src/pages/Recruitment.tsx`
- `src/components/recruitment/ApplicantsKanban.tsx`
- `src/components/recruitment/ApplicantDetailSheet.tsx`
- `src/types/applicant.ts`

## 6) Applicant onboarding: moved from lightweight/mixed behavior to backend-backed flow

### Before
- Onboarding flow was less consistently backend-driven end-to-end.

### After
- Public onboarding form behavior is tied to `applicant-onboarding` backend flow:
  - prefill retrieval by applicant
  - submit onboarding data
  - onboarding completion timestamps/notifications
- Conversion flow can use completed onboarding data as source for downstream setup.

### Where visible
- `src/pages/ApplicantOnboardingForm.tsx`
- `supabase/functions/applicant-onboarding/index.ts`

## 7) Email operations in recruitment became more structured and internalized

### Before
- Simpler email interactions (fewer variants, simpler recipients).
- Some flows relied more on external `mailto` behavior.

### After
- Interview/rejection/onboarding email flows gained richer in-app handling:
  - recipient chips and CC/BCC controls in key dialogs
  - rejection variants (`friendly` vs `constructive`) mapped to updated stage semantics
  - onboarding flow handled more directly in app UX
- New internal contract request template/dialog added for recruitment operations.
- New conversion-summary template path added.

### Where visible
- `src/components/recruitment/SendInterviewInviteDialog.tsx`
- `src/components/recruitment/SendRejectionEmailDialog.tsx`
- `src/components/recruitment/SendApplicantOnboardingDialog.tsx`
- `src/components/recruitment/SendContractRequestDialog.tsx`
- `src/hooks/useEmailTemplates.tsx`

## 8) Public offer page: changed from quote-like page to full storytelling experience

### Before
- Public offer was more linear and compact.
- Portfolio proof was more link-based than immersive in-page media.
- No dedicated full-screen sales presentation surface.

### After
- Public offer became modular and narrative-driven with stronger sectioning:
  - hero + badges
  - audit/reporting blocks
  - why-us + benefits
  - media-rich portfolio
  - onboarding section
  - stronger CTA/footer proof sections (clients/certs)
- Added dark/light mode toggle.
- Added scroll-reveal behavior for section presentation.
- Portfolio area became in-page gallery/lightbox behavior with richer media handling.

### Where visible
- `src/pages/PublicOfferPage.tsx`
- `src/hooks/useScrollReveal.tsx`
- `src/data/publicOffersData.ts`
- `src/types/publicOffer.ts`

## 9) New Sales Deck product surface

### Before
- No dedicated slide-driven presentation route in app.

### After
- New `SalesDeck` route with slide components and presentation controls:
  - keyboard navigation
  - fullscreen mode
  - responsive scaling
  - branded deck sections (title, credibility, why-us, benefits, certs, clients, reporting, creative, onboarding, CTA)

### Where visible
- `src/pages/SalesDeck.tsx`
- `src/components/sales-deck/slides/*`

## 10) Content management for offers/portfolio became first-class

### Before
- Limited admin tooling for managing reusable offer section content and public portfolio assets.

### After
- New Offer Content editor and data model for managed section blocks.
- New portfolio admin surface with upload/edit/order/activate/delete behaviors.
- Offer rendering can use content snapshots to keep page output deterministic after generation.

### Where visible
- `src/pages/OfferContentEditor.tsx`
- `src/pages/OfferManagement.tsx`
- `src/pages/Portfolio.tsx`
- `src/hooks/useOfferContent.tsx`
- `src/hooks/usePortfolioData.tsx`
- `docs/supabase-migration-offer-content.sql`
- `docs/supabase-migration-portfolio.sql`
- `docs/supabase-migration-public-offers-table.sql`

## 11) Backend capabilities added that directly change product behavior

### New/expanded backend product primitives
- Applicants domain in Supabase (pipeline + onboarding fields).
- Public offer persistence and view tracking.
- Offer content blocks for CMS-like section editing.
- Portfolio items for managed creative gallery.
- Lead enrichment columns + webhook ingestion.
- Notification infrastructure updates for realtime behavior.
- New operational functions for:
  - workspace account creation
  - Slack invite/channel provisioning
  - Freelo invite/project provisioning
  - offboarding orchestration

### Where visible
- `docs/supabase-migration-applicants.sql`
- `docs/supabase-migration-lead-enrichment.sql`
- `docs/supabase-migration-notifications.sql`
- `supabase/functions/create-workspace-account/index.ts`
- `supabase/functions/invite-slack-user/index.ts`
- `supabase/functions/create-slack-channel/index.ts`
- `supabase/functions/invite-freelo-user/index.ts`
- `supabase/functions/create-freelo-project/index.ts`
- `supabase/functions/offboard-colleague/index.ts`
- `supabase/functions/lead-enrichment-webhook/index.ts`

## 12) Highest-impact UX changes you can verify quickly in the app

1. Open a lead detail and verify enrichment cards + booking/research blocks + process stepper actions.
2. Run lead conversion and verify stricter required fields + orchestration-style flow.
3. Open engagement detail and verify contract file upload/open/remove path.
4. Open Recruitment and verify `bad_fit` / `postponed` handling + onboarding progression actions for hired candidates.
5. Open Public Offer and verify dark/light toggle, richer section structure, and media gallery behavior.
6. Open `/sales-deck` and verify keyboard/fullscreen slide navigation.
7. Open Offer Management and verify content/portfolio admin tooling.
