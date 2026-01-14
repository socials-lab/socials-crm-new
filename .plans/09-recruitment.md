# Sub-Plan 09: Recruitment

## Status: Not Started

## Scope
Implement applicant pipeline for hiring with Supabase.

## Goals
- [ ] Update useApplicantsData.tsx to use Supabase
- [ ] Implement applicants CRUD
- [ ] Implement stage workflow
- [ ] Implement notes (JSONB)
- [ ] Implement communication tracking
- [ ] Implement conversion to colleague

## Current State Analysis

### Applicant Pipeline
- Kanban-style recruitment tracking
- Stages: new_applicant → invited_interview → interview_done → offer_sent → hired/rejected/withdrawn
- Has notes similar to leads
- Tracks communication (invite sent, rejection sent)
- Can convert to colleague on hire

### Freelancer Onboarding
- After hiring, captures business info
- ICO, company name, hourly rate, billing address
- Used when creating colleague record

## Database Tables Used
- applicants

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useApplicantsData.tsx` | Replace with Supabase |
| `src/pages/Recruitment.tsx` | Use new data layer |
| `src/components/recruitment/ApplicantCard.tsx` | Data display |
| `src/components/recruitment/ApplicantDetailSheet.tsx` | Full view |
| `src/components/recruitment/AddApplicantDialog.tsx` | Create applicant |
| `src/components/recruitment/ApplicantNotesSection.tsx` | Notes CRUD |
| `src/components/recruitment/SendInterviewInviteDialog.tsx` | Track invite |
| `src/components/recruitment/SendRejectionDialog.tsx` | Track rejection |
| `src/pages/ApplicantOnboardingForm.tsx` | Freelancer info form |

## Implementation Steps

### Applicants CRUD
- [ ] Create useQuery for applicants list
- [ ] Create useQuery for applicants by stage
- [ ] Create useQuery for single applicant
- [ ] Create useMutation for adding applicant
- [ ] Create useMutation for updating applicant
- [ ] Create useMutation for deleting applicant

### Stage Workflow
- [ ] Implement stage transitions
- [ ] Handle terminal stages (hired, rejected, withdrawn)
- [ ] Track dates for key transitions

### Notes
- [ ] Store notes as JSONB array
- [ ] Add note mutation (append to array)
- [ ] Display notes with author and timestamp

### Communication Tracking
- [ ] Set interview_invite_sent_at on sending invite
- [ ] Set rejection_sent_at on sending rejection
- [ ] Track onboarding_sent_at for hired applicants

### Freelancer Onboarding
- [ ] Public onboarding form page
- [ ] Capture: ico, company_name, dic, hourly_rate, billing address, bank_account
- [ ] Set onboarding_completed_at on submission

### Conversion to Colleague
- [ ] Create colleague from applicant data
- [ ] Set is_freelancer = true
- [ ] Copy relevant fields
- [ ] Set converted_to_colleague_id reference
- [ ] Move to hired stage

## Data Relationships

```
applicants
  ├── owner_id → colleagues.id
  ├── converted_to_colleague_id → colleagues.id
  └── notes (JSONB array)
```

## Stage Configuration
| Stage | Title | Terminal |
|-------|-------|----------|
| new_applicant | Nový uchazeč | No |
| invited_interview | Pozván na pohovor | No |
| interview_done | Pohovor proběhl | No |
| offer_sent | Nabídka odeslána | No |
| hired | Přijat | Yes |
| rejected | Zamítnut | Yes |
| withdrawn | Stáhnul přihlášku | Yes |

## Testing Checklist
- [ ] Recruitment page loads from Supabase
- [ ] Kanban shows correct stages
- [ ] Can add new applicant
- [ ] Can edit applicant details
- [ ] Stage transitions work
- [ ] Can add notes
- [ ] Interview invite tracking works
- [ ] Rejection tracking works
- [ ] Onboarding form captures data
- [ ] Conversion to colleague works
- [ ] Converted colleague has correct data
- [ ] Filters work (by stage, search)

## Notes
- Similar pattern to leads pipeline
- Notes stored as JSONB for simplicity
- Email sending in Sub-Plan 11 (Edge Functions)
- Onboarding form is public page (no auth required)
