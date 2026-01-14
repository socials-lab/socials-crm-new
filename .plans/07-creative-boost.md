# Sub-Plan 07: Creative Boost

## Status: Not Started

## Scope
Implement Creative Boost credit system with Supabase - the spreadsheet-style creative output tracking.

## Goals
- [ ] Update useCreativeBoostData.tsx to use Supabase
- [ ] Implement output types management
- [ ] Implement client month settings
- [ ] Implement output entries CRUD
- [ ] Implement credit calculations
- [ ] Implement settings history tracking
- [ ] Sync with engagement services

## Current State Analysis

### Creative Boost System
- Credit-based creative services
- Each client has monthly settings (min/max credits, price per credit)
- Output types have base credit values
- Express outputs cost 1.5x credits
- Tracks who worked on each output
- Settings linked to engagement service

### Output Categories
- banner, banner_translation, banner_revision
- ai_photo
- video, video_translation, video_revision

## Database Tables Used
- output_types (note: `base_credits` must be DECIMAL(5,2) to support 0.5 credits for translations)
- creative_boost_client_months
- creative_boost_outputs
- creative_boost_settings_history

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCreativeBoostData.tsx` | Replace with Supabase |
| `src/pages/CreativeBoost.tsx` | Use new data layer |
| `src/components/creative-boost/ClientsOverview.tsx` | Client list |
| `src/components/creative-boost/OutputTypesConfig.tsx` | Output type CRUD |
| `src/components/creative-boost/AddClientToMonthDialog.tsx` | Add client month |
| `src/components/creative-boost/SettingsHistoryDialog.tsx` | History view |
| `src/data/creativeBoostMockData.ts` | Remove mock data |

## Implementation Steps

### Output Types
- [ ] Create useQuery for output types
- [ ] Create useMutation for adding output type
- [ ] Create useMutation for updating output type
- [ ] Create useMutation for deactivating output type
- [ ] Seed initial output types

### Client Month Settings
- [ ] Create useQuery for client months by year/month
- [ ] Create useQuery for client month with outputs
- [ ] Create useMutation for adding client to month
- [ ] Create useMutation for updating client month settings
- [ ] Sync settings from engagement service on creation
- [ ] Auto-create months for clients with CB service

### Output Entries
- [ ] Create useQuery for outputs by client month
- [ ] Create useMutation for adding/updating output
- [ ] Support normal_count and express_count
- [ ] Track colleague_id for who worked on it
- [ ] Batch updates for spreadsheet editing

### Credit Calculations
- [ ] Calculate credits per output: (normal * base) + (express * base * 1.5)
- [ ] Sum credits for client month
- [ ] Calculate remaining credits (max - used)
- [ ] Calculate estimated invoice (used_credits * price_per_credit)

### Settings History
- [ ] Log max_credits changes
- [ ] Log price_per_credit changes
- [ ] Log status changes
- [ ] Log colleague assignment changes
- [ ] Display history in dialog

### Sync with Engagements
- [ ] When engagement service added with CB, auto-create client month
- [ ] Pull min/max credits and price from engagement service
- [ ] Update if engagement service settings change

## Data Relationships

```
output_types
  └── category (enum)

creative_boost_client_months
  ├── client_id → clients.id
  ├── colleague_id → colleagues.id
  ├── engagement_service_id → engagement_services.id
  └── engagement_id → engagements.id

creative_boost_outputs
  ├── client_id → clients.id
  ├── client_month_id → creative_boost_client_months.id
  ├── output_type_id → output_types.id
  └── colleague_id → colleagues.id

creative_boost_settings_history
  ├── client_month_id → creative_boost_client_months.id
  ├── client_id → clients.id
  └── changed_by → profiles.id
```

## Credit Calculation Logic

```typescript
// Per output row
normalCredits = normalCount * outputType.baseCredits
expressCredits = expressCount * outputType.baseCredits * 1.5
rowCredits = normalCredits + expressCredits

// Per client month
usedCredits = sum of all output row credits
remainingCredits = maxCredits - usedCredits
estimatedInvoice = usedCredits * pricePerCredit
```

## Testing Checklist
- [ ] Creative Boost page loads from Supabase
- [ ] Output types can be managed
- [ ] Client months display correctly
- [ ] Can add client to month
- [ ] Can edit client month settings
- [ ] Settings changes logged to history
- [ ] Can add/edit outputs in spreadsheet
- [ ] Credit calculations are correct
- [ ] Express multiplier (1.5x) works
- [ ] Remaining credits update in real-time
- [ ] Estimated invoice calculates correctly
- [ ] Sync works with engagement services

## Notes
- Spreadsheet-style editing requires batch mutations
- Consider optimistic updates for responsiveness
- Month/year navigation for different periods
- Only show clients with active CB service
- **CamelCase ↔ snake_case transformation required:**
  - TypeScript uses camelCase: `baseCredits`, `createdAt`, `clientId`
  - Database uses snake_case: `base_credits`, `created_at`, `client_id`
  - Create transformer functions in hook (similar to `transformClient` in useCRMData)
