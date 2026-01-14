# Sub-Plan 05: Engagements

## Status: Not Started

## Scope
Implement engagements, engagement services, and colleague assignments with Supabase.

## Goals
- [ ] Update useCRMData.tsx for engagement operations
- [ ] Implement engagements CRUD
- [ ] Implement engagement services CRUD
- [ ] Implement colleague assignments CRUD
- [ ] Implement engagement history tracking
- [ ] Implement engagement monthly metrics tracking
- [ ] Link to clients and contacts

## Current State Analysis

### Engagement Structure
- Engagement belongs to a client
- Has optional contact person
- Contains multiple services (engagement_services)
- Has colleague assignments
- Tracks status workflow (planned → active → completed)

### Engagement Services
- Links engagement to service catalog
- Has own pricing (may differ from catalog)
- Creative Boost services have credit fields
- One-off services track invoicing status

### Assignments
- Links colleagues to engagement or specific service
- Defines role, cost model, rates
- Has date range

## Database Tables Used
- engagements
- engagement_services
- engagement_assignments
- engagement_history
- engagement_monthly_metrics

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCRMData.tsx` | Add engagement Supabase operations |
| `src/pages/Engagements.tsx` | Verify data loading |
| `src/components/forms/EngagementForm.tsx` | Form submission |
| `src/components/forms/AddEngagementServiceDialog.tsx` | Service addition |
| `src/components/forms/EngagementServiceCard.tsx` | Service display/edit |
| `src/components/forms/AssignmentForm.tsx` | Assignment CRUD |
| `src/components/engagements/EngagementHistoryDialog.tsx` | History display |
| `src/components/engagements/EndEngagementDialog.tsx` | Status change |

## Implementation Steps

### Engagements CRUD
- [ ] Create useQuery for engagements list with client relation
- [ ] Create useQuery for single engagement with all relations
- [ ] Create useMutation for adding engagement
- [ ] Create useMutation for updating engagement
- [ ] Create useMutation for changing engagement status
- [ ] Handle platforms array field

### Engagement Services
- [ ] Create useQuery for services by engagement
- [ ] Create useMutation for adding service to engagement
- [ ] Create useMutation for updating engagement service
- [ ] Create useMutation for removing service
- [ ] Handle Creative Boost fields (min/max credits, price per credit)
- [ ] Handle one-off invoicing status
- [ ] Handle upsell tracking (upsold_by_id, upsell_commission_percent)

### Colleague Assignments
- [ ] Create useQuery for assignments by engagement
- [ ] Create useMutation for adding assignment
- [ ] Create useMutation for updating assignment
- [ ] Create useMutation for removing assignment
- [ ] Support assignment to specific service or whole engagement

### Engagement History
- [ ] Create history insert function
- [ ] Log engagement creation
- [ ] Log status changes
- [ ] Log service additions/removals
- [ ] Log assignment changes
- [ ] Log key field updates

### Engagement Monthly Metrics
- [ ] Create useQuery for metrics by engagement
- [ ] Create useMutation for adding/updating monthly metrics
- [ ] Track revenue, cost_total, margin_amount, margin_percent
- [ ] Display in engagement detail view (finance role only)
- [ ] Support year/month filtering

### Status Workflow
- [ ] Implement status transition logic
- [ ] Handle end_date setting on completion
- [ ] Generate history on status change

### Document URLs
- [ ] Store and display offer_url
- [ ] Store and display contract_url  
- [ ] Store and display freelo_url
- [ ] Inline editing for URLs

## Data Relationships

```
engagements
  ├── client_id → clients.id
  ├── contact_person_id → client_contacts.id
  └── platforms (TEXT array)

engagement_services
  ├── engagement_id → engagements.id
  ├── service_id → services.id
  ├── invoice_id → issued_invoices.id
  ├── upsold_by_id → colleagues.id
  └── upsell_commission_percent (DECIMAL)

engagement_assignments
  ├── engagement_id → engagements.id
  ├── engagement_service_id → engagement_services.id
  └── colleague_id → colleagues.id

engagement_history
  ├── engagement_id → engagements.id
  └── changed_by → profiles.id

engagement_monthly_metrics
  └── engagement_id → engagements.id
```

## Testing Checklist
- [ ] Engagements page loads from Supabase
- [ ] Can filter by status
- [ ] Can add new engagement
- [ ] Can edit engagement details
- [ ] Can add services to engagement
- [ ] Can edit service pricing
- [ ] Can remove services
- [ ] Can add colleague assignments
- [ ] Can edit assignment cost model
- [ ] Can remove assignments
- [ ] Status changes work correctly
- [ ] History shows all changes
- [ ] Document URLs can be edited inline
- [ ] Creative Boost fields work on CB services
- [ ] Monthly metrics can be viewed (finance/admin only)
- [ ] Monthly metrics can be edited

## Notes
- Engagement monthly_fee is sum of active monthly services
- one_off_fee is sum of one-off services
- Keep calculated totals in sync or compute on the fly
- Assignments can be to engagement or specific service
