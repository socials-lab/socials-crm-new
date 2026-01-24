# Sub-Plan 04: Leads Pipeline

## Status: Not Started

## Scope
Implement full leads pipeline with Supabase, including stages, notes, history tracking, and conversion.

## Goals
- [ ] Update useLeadsData.tsx to use Supabase
- [ ] Implement leads CRUD with Supabase
- [ ] Implement lead notes (JSONB or separate queries)
- [ ] Implement lead history/audit log
- [ ] Implement stage transitions with history
- [ ] Implement lead conversion to client/engagement
- [ ] Remove mock data

## Current State Analysis

### useLeadsData.tsx
- Uses local state with mock data
- Tracks leads, notes, history
- Has conversion logic
- Stage transitions generate history entries

### Lead Stages Flow
```
new_lead → meeting_done → waiting_access → access_received 
→ preparing_offer → offer_sent → won/lost/postponed
```

## Database Tables Used
- leads
- lead_history

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useLeadsData.tsx` | Replace with Supabase queries |
| `src/pages/Leads.tsx` | Ensure Kanban/table work |
| `src/components/leads/LeadCard.tsx` | Verify data binding |
| `src/components/leads/LeadDetailSheet.tsx` | Verify all fields |
| `src/components/leads/AddLeadDialog.tsx` | Form submission |
| `src/components/leads/EditLeadDialog.tsx` | Form submission |
| `src/components/leads/LeadNotesSection.tsx` | Notes CRUD |
| `src/components/leads/LeadHistorySection.tsx` | History display |
| `src/components/leads/RequestAccessDialog.tsx` | Access tracking |
| `src/components/leads/ConvertLeadDialog.tsx` | Conversion logic |
| `src/pages/OnboardingForm.tsx` | Lead data for form |

## Implementation Steps

### Lead CRUD
- [ ] Create useQuery for fetching leads list
- [ ] Create useQuery for fetching single lead with details
- [ ] Create useMutation for adding lead
- [ ] Create useMutation for updating lead
- [ ] Create useMutation for deleting lead

### Lead Notes
- [ ] Decide: JSONB array vs separate table (JSONB simpler)
- [ ] Implement add note mutation (append to JSONB)
- [ ] Notes include author_id, author_name, text, created_at

### Lead History
- [ ] Create insert function for history entries
- [ ] Log stage changes automatically
- [ ] Log field updates for key fields
- [ ] Log owner changes
- [ ] Log note additions
- [ ] Log conversion

### Stage Transitions
- [ ] Create updateLeadStage mutation
- [ ] Generate history entry on stage change
- [ ] Handle special transitions (won → conversion)

### Access Request Tracking
- [ ] Update access_request_sent_at
- [ ] Update access_request_platforms
- [ ] Update access_received_at

### Onboarding Form Tracking
- [ ] Generate onboarding form URL
- [ ] Track onboarding_form_sent_at
- [ ] Track onboarding_form_completed_at

### Contract Tracking
- [ ] Track contract_url
- [ ] Track contract_created_at
- [ ] Track contract_signed_at

### Lead Conversion
- [ ] Create convertLead mutation
- [ ] Create client from lead data
- [ ] Create engagement from services
- [ ] Copy contact to client_contacts
- [ ] Update lead with conversion references
- [ ] Add conversion history entry

## Data Relationships

```
leads
  ├── owner_id → colleagues.id
  ├── offer_sent_by_id → colleagues.id
  ├── converted_to_client_id → clients.id
  ├── converted_to_engagement_id → engagements.id
  ├── notes (JSONB array)
  └── potential_services (JSONB array)

lead_history
  └── lead_id → leads.id
  └── changed_by → profiles.id
```

## Testing Checklist
- [ ] Leads page loads from Supabase
- [ ] Kanban view works with drag-and-drop
- [ ] Table view works with filtering
- [ ] Can add new lead
- [ ] Can edit lead details
- [ ] Stage changes create history entries
- [ ] Can add notes to leads
- [ ] Notes display with author and timestamp
- [ ] History shows all changes
- [ ] Access request tracking works
- [ ] Onboarding form tracking works
- [ ] Lead conversion creates client + engagement
- [ ] Conversion updates lead references
- [ ] OnboardingForm page loads lead data

## Notes
- Lead notes stored as JSONB array for simplicity
- potential_services also JSONB array of LeadService objects
- History entries created via database function for consistency
- Consider database trigger for automatic history on updates
