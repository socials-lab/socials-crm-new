# Product Impact Analysis: Supabase Backend Changes (`f1421c4..f06ce73`)

Scope reviewed:
- `docs/supabase-migration-*.sql`
- `supabase/functions/*` (changed/added functions in range)
- `supabase/config.toml`
- Relevant frontend call sites for workflow mapping

## 1) New tables/columns/storage capabilities and purpose

### New data models and schema capabilities

- `public.applicants` (+ enums `applicant_stage`, `applicant_source`)
  - Enables a full recruitment pipeline in Supabase (from applicant intake to hired/onboarding completion).
  - Supports structured onboarding data capture (billing, personal, bank, hourly rate) directly tied to candidate records.
  - Adds communication and lifecycle timestamps (`interview_invite_sent_at`, `rejection_sent_at`, `onboarding_sent_at`, `onboarding_completed_at`) so recruiting progression can be measured and automated.

- `public.public_offers`
  - Enables persistent public offer pages backed by DB instead of local-only storage.
  - Supports tokenized public offer access, view tracking (`viewed_at`, `view_count`), offer history, and snapshotting of content blocks.
  - Makes offer sharing/auditability operationally reliable across devices/users.

- `public.offer_content_blocks`
  - Enables CMS-like editable content sections for the public offer page.
  - Public read + CRM-managed writes allow marketing/sales to update offer page narrative without redeploying frontend code.

- `public.portfolio_items`
  - Enables centrally managed creative portfolio records (image/video, order, active flag) for dynamic rendering in sales/offer experiences.
  - Supports admin curation while exposing only active assets publicly.

- `public.leads` enrichment expansion (multiple new columns)
  - Adds a complete enrichment layer for commercial qualification and sales readiness:
    - Marketing context (`enrichment_platform`, `enrichment_ad_spend_range`, `enrichment_services_needed`, `marketing_experience`, `marketing_maturity`, `has_creative_team`, `pain_point`)
    - Tracking diagnostics (`has_ga4`, `has_gtm`, `has_meta_pixel`, `has_google_ads`, `tracking_detected`)
    - Scoring/qualification (`lead_score`, `credibility_score`, `enrichment_qualification_tier`)
    - Company intelligence (`is_vat_payer`, `is_ecommerce`, `business_type`, `company_address`)
    - Social/booking/research metadata (`facebook_url`, `instagram_url`, `booking_*`, `company_research`, `enrichment_completed`, `enrichment_id`)
  - Product impact: lead records can now power qualification workflows, prioritization, and richer pre-sales context.

- `lead_stage` enum gains `bad_fit`
  - Enables explicit disqualification as a first-class stage rather than overloading generic terminal states.
  - Improves pipeline reporting quality and process clarity for non-ideal leads.

- `notifications` migration updated for idempotency and realtime publishing
  - `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` reduce migration fragility across environments.
  - Adds table to `supabase_realtime` publication so in-app notifications can become live-updating.

### New storage capabilities

- Bucket: `engagement-contracts` (private)
  - CRM users can upload/read/update/delete contracts.
  - Enables contract file lifecycle in Supabase Storage with restricted access.

- Bucket: `offer-assets` (public)
  - Public read + CRM-managed writes.
  - Enables direct hosting of public-facing offer media (logos/certifications).

- Bucket: `portfolio` (public)
  - Public read + CRM-managed writes.
  - Enables portfolio asset serving for sales/offer pages with admin moderation controls via DB rows.

## 2) New edge functions and their business workflow roles

- `applicant-onboarding`
  - Public onboarding endpoint for hired candidates.
  - GET: prefill onboarding form by applicant ID.
  - POST: persist onboarding/billing/financial details and mark onboarding completed.
  - Business role: converts “hired” applicants into contract-ready records without manual data re-entry.

- `create-workspace-account`
  - Creates Google Workspace user accounts with generated or custom temporary password.
  - Business role: automates account provisioning as part of applicant-to-colleague conversion.

- `invite-slack-user`
  - Sends workspace invites via Slack admin API; if user already exists, can add them to channels.
  - Business role: reduces manual Slack onboarding and standardizes first-channel assignment.

- `invite-freelo-user`
  - Invites a user by email into a Freelo project (defaults to onboarding project if no project provided).
  - Business role: immediate project-tool access during onboarding.

- `create-freelo-project`
  - Creates a Freelo project from template and invites team members.
  - Business role: automates client delivery setup during lead-to-client conversion.

- `create-slack-channel`
  - Creates a client-specific Slack channel and invites team members by email lookup.
  - Business role: automates communication space provisioning per new engagement.

- `offboard-colleague`
  - Orchestrates offboarding across systems (Google suspension + optional forwarding, Slack deactivation, Freelo removal).
  - Business role: centralizes account deprovisioning and reduces offboarding gaps.

- `lead-enrichment-webhook`
  - Receives enrichment payloads, maps fields into `leads`, matches existing leads, updates or creates new lead records.
  - Business role: turns external enrichment into directly actionable CRM pipeline data.

### Changed function behavior

- `agency-assistant`
  - Expanded from SOP+pricing assistant to include live CRM context ingestion (clients, engagements, leads, extra work, colleagues, services).
  - Adds stricter confidentiality prompt rules around internal compensation/revenue disclosure.
  - Business role: assistant can answer operational CRM context questions with current data, not only static SOP knowledge.

## 3) Notification/integration workflow changes

- Notifications
  - Realtime enablement for `notifications` means users can receive in-app updates with lower delay and fewer manual refreshes.
  - `applicant-onboarding` now emits admin/management notifications (`applicant_onboarding_completed`) with contract-relevant metadata payload.

- Recruitment-to-colleague automation
  - Frontend conversion flow now chains backend actions:
    - Create Workspace account
    - Invite to Slack
    - Invite to Freelo
    - Invite to CRM
  - Product impact: onboarding transitions from manual multi-tool setup into a guided transactional flow.

- Lead-to-client automation
  - Lead conversion now triggers:
    - Freelo project creation from template
    - Slack channel creation + team invites
  - Product impact: delivery tooling is provisioned during CRM conversion, reducing operational lead time.

- Offboarding automation
  - UI-driven offboarding can trigger multi-system deactivation from one action, returning per-system result telemetry.

- External enrichment ingestion
  - Webhook-driven lead enrichment now updates/creates leads with qualification and tracking intelligence, changing how leads enter/prioritize in pipeline.

## 4) Security/permission implications

- Positive controls added
  - New tables use RLS (`applicants`, `public_offers`, `offer_content_blocks`, `portfolio_items`).
  - Storage policies consistently gate write operations to `is_crm_user(auth.uid())`.
  - `engagement-contracts` bucket is private and restricted to CRM-authenticated users.
  - `offboard-colleague`, `invite-slack-user`, and `create-workspace-account` include bearer-token claim checks in function code.

- Public data surface intentionally expanded
  - `offer-assets` and `portfolio` buckets are public by design.
  - `public_offers` allows anon read for active offers and anon update for view tracking.
  - `offer_content_blocks` is publicly readable.
  - Product tradeoff: supports public offer pages and marketing assets, but increases importance of validating what is stored in public buckets/tables.

- Important risk/operational notes
  - `supabase/config.toml` sets `verify_jwt = false` for `create-slack-channel` and `offboard-colleague`.
    - `offboard-colleague` still enforces auth internally.
    - `create-slack-channel` currently has no internal auth check, so security depends on deployment/invocation controls outside function code.
  - `applicant-onboarding` is designed as public endpoint using service-role writes; access is controlled by applicant stage check and required applicant ID.
  - `lead-enrichment-webhook` expects `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` and uses service-role DB access; key handling and rotation become critical.

## 5) Deployment/migration dependencies

- SQL rollout sequencing dependencies
  1. Run table/enum migrations before dependent functions:
     - `applicants` before `applicant-onboarding`
     - `offer_content_blocks` before offer content editing/reads
     - `public_offers` before public offer persistence
     - `portfolio_items` before portfolio UI dynamic loads
     - lead enrichment columns before `lead-enrichment-webhook`
  2. Apply notifications migration before workflows inserting into `notifications`.
  3. Ensure storage bucket + policies are created before upload/read features are enabled in UI.

- Function config/deployment dependencies
  - `supabase/config.toml` must include intended JWT verification behavior for newly deployed functions.
  - Environment secrets required by integrations:
    - Google: `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_ADMIN_EMAIL`
    - Slack: `SLACK_BOT_TOKEN`, `SLACK_ADMIN_TOKEN`
    - Freelo: `FREELO_API_KEY`, `FREELO_USER_EMAIL`, `FREELO_TEMPLATE_PROJECT_ID`
    - Assistant: `LOVABLE_API_KEY`
  - Missing env vars do not fail compile but will cause runtime workflow failures.

- Idempotency and rerun behavior
  - Notifications migration improved idempotency (`IF NOT EXISTS`), reducing redeploy risk.
  - Some storage/table creation scripts do not use full idempotent guards; repeated execution may require manual conflict handling.

## Net product capability delta

Between `f1421c4` and `f06ce73`, Supabase backend changes significantly expanded CRM from basic record-keeping to operational workflow orchestration:
- End-to-end recruiting lifecycle (applicant pipeline, onboarding completion, contract-ready notifications)
- Automated tool provisioning for onboarding, conversion, and offboarding (Google/Slack/Freelo)
- Public offer platform backed by persistent DB content + asset storage
- Real-time notification infrastructure
- Structured lead enrichment ingestion for qualification-driven sales process
