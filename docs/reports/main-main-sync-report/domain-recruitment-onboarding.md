# Recruitment / Applicants / Onboarding Domain Analysis

Compared range: `f1421c4..f06ce73`

This analysis focuses on user-visible and operator-visible behavior changes in:
- `src/pages/Recruitment.tsx`
- `src/components/recruitment/*`
- `src/hooks/useApplicantsData.tsx`
- `src/hooks/useEmailTemplates.tsx`
- `src/pages/ApplicantOnboardingForm.tsx`
- `supabase/functions/applicant-onboarding/*`
- onboarding-related edge functions (`create-workspace-account`, `invite-slack-user`, `invite-freelo-user`, `create-freelo-project`)
- migration docs under `docs/supabase-migration-*.sql`

## 1) Stage Model Changes

### Before
- Applicant stages were: `new_applicant`, `invited_interview`, `interview_done`, `offer_sent`, `hired`, `rejected`, `withdrawn`.
- Recruitment Kanban was a single flow with end columns (`rejected`, `withdrawn`) and no onboarding sub-pipeline.
- Rejection flow moved candidate to `rejected`.
- Recruitment page filtered by search/owner/stage only.

### After
- Stage model changed to: `new_applicant`, `invited_interview`, `interview_done`, `offer_sent`, `hired`, `bad_fit`, `withdrawn`, `postponed`.
- `rejected` was replaced by `bad_fit` (including rejection email wording and state transition).
- Recruitment board split into:
  - Hiring pipeline (`new_applicant` -> `hired`)
  - Onboarding pipeline for hired candidates (`buddy meeting` -> `academy` -> `clients assigned` -> `fully ready` -> `terminated`)
  - Collapsible closed bucket (`bad_fit`, `withdrawn`, `postponed`)
- Recruitment list view gained sortable columns and extra dimensions (`phone`, `source`, sortable headers).
- Recruitment filters expanded with `position` and `source`, plus active-filter summary and one-click reset.
- In applicant detail, once candidate is in `hired`, primary stage switching is replaced by onboarding step switching (operator manipulates onboarding progress instead of recruitment stage directly).

### User perspective
- Candidate sees clearer outcomes: not only accepted/rejected, but also “postponed” and “bad fit” semantics.
- Hired candidate has a visible multi-step onboarding progression.

### Operator perspective
- Better triage and control of pipeline states and post-hire operational state.
- Better segmentation for active pipeline vs closed states and stronger board-level visibility.

## 2) Conversion and Onboarding Changes

### Before
- Conversion dialog primarily collected billing/onboarding data and converted applicant to colleague.
- Applicant onboarding form was effectively mock-driven first (local mock lookup and local submit simulation), with no end-to-end persistence contract.
- No explicit sequential account-provisioning workflow in conversion.

### After
- Conversion dialog now supports sequential provisioning logic:
  1. Optional Google Workspace account creation (`create-workspace-account`)
  2. Optional Slack invite (`invite-slack-user`)
  3. Optional Freelo invite (`invite-freelo-user`)
  4. CRM invite (`invite-user`, role `specialist`, default “Můj přehled” access)
  5. “Conversion summary” email preparation (currently UX-level success signal)
- Conversion form pre-fills from applicant onboarding data if available.
- Applicant onboarding became service-backed:
  - GET applicant prefill from `applicant-onboarding` edge function
  - POST onboarding payload to same function
  - server-side `onboarding_completed_at` marking
  - server-side admin/management notification creation (`applicant_onboarding_completed`)
- Detail sheet now includes contract lifecycle checkpoints:
  - contract request preparation
  - contract sent marker
  - contract signed marker
  - then conversion / offboarding path
- Offboarding of converted colleague is integrated in recruitment detail via `OffboardColleagueDialog`.

### User perspective
- Hired applicant receives a stricter onboarding flow where submitted data feeds contract prep and downstream provisioning.
- Candidate experience is less “manual handoff”, more “guided process”.

### Operator perspective
- Conversion is now an operational workflow (identity + tooling + CRM access), not only a data transfer.
- Operator gets stronger visibility into onboarding completion and contract readiness.

## 3) Email / Template / Sending Changes

### Before
- Email dialogs were simpler (single recipient fields).
- Onboarding send flow used `mailto:` open for applicant onboarding email.
- Rejection had a single template and mapped to “Zamítnut”.
- No dedicated contract-request template and no conversion-summary template.

### After
- Interview invite dialog:
  - multi-recipient chips
  - CC/BCC controls
  - default BCC list
  - meeting scheduling URL variable support
  - “mark as sent” action
- Rejection dialog:
  - 2 variants: friendly and constructive
  - updated tone/copy
  - maps to `bad_fit`
  - “mark as sent” action
- Applicant onboarding send dialog:
  - keeps copy-link and template preview
  - replaced `mailto` opening with internal “send/mark sent” UX flow
- New internal contract request email dialog (`SendContractRequestDialog`) with prefilled candidate+billing+finance payload and default recipients.
- `useEmailTemplates` gained/updated keys:
  - upgraded `send_offer`, `send_onboarding_form`, `request_access`
  - updated `rejection_email`
  - new `rejection_email_constructive`
  - new `contract_request`
  - new `conversion_summary`

### User perspective
- Candidate messaging is more structured and personalized, especially for rejection and onboarding communication.

### Operator perspective
- Operators can choose rejection style, manage recipient lists, and trigger contract-prep internal communication from within applicant detail.

## 4) New Dialogs / Fields / Actions

### New dialogs/components
- `SendContractRequestDialog`
- expanded `ConvertApplicantDialog` (provisioning toggles and statuses)
- integration of `OffboardColleagueDialog` into applicant detail flow

### New/expanded applicant fields
- Application profile: `portfolio_url`, `ai_usage`, `personal_brand`, `social_links`
- Personal onboarding: `birthday`, `personal_email`, `avatar_url`
- Contract/onboarding ops: `contract_sent_at`, `contract_signed_at`, `buddy_id`, `buddy_meeting_done`, `academy_completed`, `first_clients_assigned`, `fully_onboarded`, `onboarding_terminated`, `terminated_at`, `termination_reason`
- Source editability was expanded in detail view.

### New actions in applicant detail
- resend interview invite / rejection / onboarding
- generate internal contract request email
- mark contract sent/signed
- convert to colleague (with provisioning options)
- terminate onboarding / offboard converted colleague

## 5) Potential Breakpoints or Migration Dependencies

1. **Applicant schema drift risk**
   - `docs/supabase-migration-applicants.sql` creates a base applicants schema, but UI/logic now uses additional columns (`contract_sent_at`, `contract_signed_at`, onboarding checklist/termination fields, `portfolio_url`) that are not present in this migration doc.
   - If DB is only migrated with this file, parts of new UI behavior become non-persistent or fail on write.

2. **Public onboarding endpoint deployment dependency**
   - `applicant-onboarding` is designed as public (no user auth in function code), but `supabase/config.toml` does not explicitly define this function’s JWT policy.
   - If deployed with JWT verification enabled, applicant onboarding links can fail with auth errors.

3. **Provisioning integration dependency**
   - Conversion workflow depends on env-backed external integrations (`GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_ADMIN_EMAIL`, `SLACK_ADMIN_TOKEN`, `SLACK_BOT_TOKEN`, `FREELO_*`).
   - Missing envs degrade conversion from automated provisioning to partial/manual handling.

4. **Summary email is UX-only at conversion step**
   - Conversion summary currently shows success toast but is not sent through a dedicated backend email sender in this flow.
   - Operator may assume delivery that did not occur.

5. **State source split (mock vs backend)**
   - Applicant context remains local-state-first (mock data), while onboarding completion can come from backend refresh.
   - Mixed state origin can create operator confusion in environments where DB-backed records and mock records coexist.

## Bottom Line

The range introduces a major product shift from a simple recruitment tracker into an operational hiring-to-onboarding pipeline with richer applicant profile data, internal contract preparation, provisioning hooks, and post-hire onboarding state control. The main rollout risk is not UX complexity, but deployment/schema completeness (DB columns + edge function runtime config + external integration envs).

