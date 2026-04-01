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
