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

