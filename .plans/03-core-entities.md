# Sub-Plan 03: Core Entities

## Status: Not Started

## Scope
Implement CRUD operations for foundational entities: Colleagues, Clients, Client Contacts, Client Services, and Services.

## Goals
- [ ] Update useCRMData.tsx to use Supabase
- [ ] Implement Colleagues CRUD with Supabase
- [ ] Implement Clients CRUD with Supabase
- [ ] Implement Client Contacts CRUD with Supabase
- [ ] Implement Client Services CRUD with Supabase (direct client-service links)
- [ ] Implement Services CRUD with Supabase
- [ ] Remove all mock data from these entities
- [ ] Update UI components to use real data

## Current State Analysis

### useCRMData.tsx
- Currently uses local state with mock data
- Provides: clients, colleagues, services, engagements, assignments
- CRUD operations update local state only
- Need to replace with Supabase queries

## Database Tables Used
- colleagues
- clients
- client_contacts
- client_services
- services

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCRMData.tsx` | Replace mock data with Supabase queries |
| `src/pages/Colleagues.tsx` | Ensure works with new data layer |
| `src/pages/Clients.tsx` | Ensure works with new data layer |
| `src/pages/Contacts.tsx` | Ensure works with new data layer |
| `src/pages/Services.tsx` | Ensure works with new data layer |
| `src/components/forms/ColleagueForm.tsx` | Verify form submission |
| `src/components/forms/ClientForm.tsx` | Verify form submission |
| `src/components/clients/AddContactDialog.tsx` | Verify form submission |

## Implementation Steps

### Colleagues
- [ ] Create useQuery for fetching colleagues list
- [ ] Create useMutation for adding colleague
- [ ] Create useMutation for updating colleague
- [ ] Create useMutation for deleting colleague
- [ ] Link colleague to profile when user has account

### Clients
- [ ] Create useQuery for fetching clients list
- [ ] Create useQuery for fetching client with engagements
- [ ] Create useMutation for adding client
- [ ] Create useMutation for updating client
- [ ] Create useMutation for deleting client
- [ ] Fetch sales_representative relation

### Client Contacts
- [ ] Create useQuery for fetching contacts by client
- [ ] Create useMutation for adding contact
- [ ] Create useMutation for updating contact
- [ ] Create useMutation for deleting contact
- [ ] Handle is_primary flag (only one per client)

### Client Services (Direct Client-Service Links)
- [ ] Create useQuery for fetching services by client
- [ ] Create useMutation for adding client service
- [ ] Create useMutation for updating client service
- [ ] Create useMutation for deleting client service
- [ ] Track start_date, end_date, is_active

**Note:** This is separate from `engagement_services`. `client_services` directly links a client to services they've purchased, while `engagement_services` tracks services within a specific engagement/contract.

### Services
- [ ] Create useQuery for fetching services list
- [ ] Create useMutation for adding service
- [ ] Create useMutation for updating service
- [ ] Create useMutation for deleting/deactivating service
- [ ] Handle tier_pricing JSONB field

### Context Update
- [ ] Remove mock data generators
- [ ] Update context to use React Query
- [ ] Maintain same interface for backward compatibility
- [ ] Add loading and error states

## Data Relationships

```
colleagues
  └── profile_id → profiles.id (optional)

clients
  └── sales_representative_id → colleagues.id
  └── client_contacts (one-to-many)
  └── client_services (one-to-many)

client_services
  ├── client_id → clients.id
  └── service_id → services.id

services
  └── tier_pricing (JSONB array)
```

## Testing Checklist
- [ ] Colleagues page loads data from Supabase
- [ ] Can add new colleague
- [ ] Can edit colleague
- [ ] Can change colleague status
- [ ] Clients page loads data from Supabase
- [ ] Can add new client
- [ ] Can edit client
- [ ] Client contacts load correctly
- [ ] Can add/edit/delete client contacts
- [ ] Client services display correctly on client detail
- [ ] Can add/remove services from client
- [ ] Services page loads data from Supabase
- [ ] Can add new service
- [ ] Can edit service pricing tiers
- [ ] Can deactivate service
- [ ] All forms validate correctly
- [ ] Error handling shows user-friendly messages

## Notes
- Keep the same TypeScript interfaces from `src/types/crm.ts`
- Use React Query for caching and optimistic updates
- Invalidate related queries after mutations
- Handle offline/error states gracefully
