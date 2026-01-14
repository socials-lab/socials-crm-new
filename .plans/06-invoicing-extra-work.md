# Sub-Plan 06: Invoicing and Extra Work

## Status: Not Started

## Scope
Implement extra work tracking (vícepráce) and invoice management with Supabase.

## Goals
- [ ] Implement extra work CRUD
- [ ] Implement extra work status workflow
- [ ] Implement invoice creation and tracking
- [ ] Implement invoice line items
- [ ] Connect extra work to invoices
- [ ] Future invoicing preview

## Current State Analysis

### Extra Work (Vícepráce)
- Additional billable work outside regular retainer
- Has status workflow: pending_approval → in_progress → ready_to_invoice → invoiced
- Linked to engagement and colleague
- Has billing period (YYYY-MM format)

### Invoicing
- Monthly invoices per engagement
- Line items from: regular services, extra work, Creative Boost, one-off
- Invoice number format: FV-YYYY-NNN
- Tracks Fakturoid integration fields

## Database Tables Used
- extra_works
- issued_invoices
- invoice_line_items

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ExtraWork.tsx` | Use Supabase data |
| `src/components/extra-work/ExtraWorkTable.tsx` | Data display |
| `src/components/extra-work/ExtraWorkKanban.tsx` | Kanban view |
| `src/components/extra-work/AddExtraWorkDialog.tsx` | Create extra work |
| `src/pages/Invoicing.tsx` | Invoice management |
| `src/components/invoicing/FutureInvoicing.tsx` | Preview upcoming |
| `src/components/invoicing/InvoiceHistory.tsx` | Past invoices |
| `src/components/invoicing/IssueInvoicesDialog.tsx` | Issue invoice |
| `src/components/engagements/CreateInvoiceFromEngagementDialog.tsx` | Quick invoice |

## Implementation Steps

### Extra Work CRUD
- [ ] Create useQuery for extra works list with relations
- [ ] Create useQuery for extra works by engagement
- [ ] Create useQuery for extra works by billing period
- [ ] Create useMutation for adding extra work
- [ ] Create useMutation for updating extra work
- [ ] Create useMutation for deleting extra work

### Extra Work Status Workflow
- [ ] Implement status transitions
- [ ] pending_approval: needs manager approval
- [ ] in_progress: approved, being worked on
- [ ] ready_to_invoice: work complete, ready to bill
- [ ] invoiced: linked to issued invoice
- [ ] Set approval_date and approved_by on approval
- [ ] Set invoice fields on invoicing

### Invoice Management
- [ ] Create useQuery for issued invoices
- [ ] Create useQuery for invoices by client/engagement
- [ ] Create useMutation for creating invoice
- [ ] Generate invoice number (FV-YYYY-NNN sequence)
- [ ] Create invoice line items
- [ ] Link extra works to invoice
- [ ] Update extra work status to invoiced

### Invoice Line Items
- [ ] Calculate line items from engagement services
- [ ] Add extra work as line items
- [ ] Add Creative Boost as line item (calculated from credits)
- [ ] Handle prorating for partial months
- [ ] Support manual adjustments

### Future Invoicing Preview
- [ ] Calculate upcoming invoices from active engagements
- [ ] Show unbilled extra work
- [ ] Show unbilled one-off services
- [ ] Preview before issuing

### Upsell Tracking
- [ ] Track upsold_by_id on extra work
- [ ] Track commission percentage
- [ ] Display in analytics (future)

## Data Relationships

```
extra_works
  ├── client_id → clients.id
  ├── engagement_id → engagements.id
  ├── colleague_id → colleagues.id
  ├── approved_by → profiles.id
  ├── invoice_id → issued_invoices.id
  ├── upsold_by_id → colleagues.id
  └── upsell_commission_percent (DECIMAL)

issued_invoices
  ├── engagement_id → engagements.id
  ├── client_id → clients.id
  ├── issued_by → profiles.id
  └── line_items (JSONB snapshot)

invoice_line_items
  ├── invoice_id → issued_invoices.id
  ├── engagement_id → engagements.id
  └── extra_work_id → extra_works.id
```

## Testing Checklist
- [ ] Extra Work page loads from Supabase
- [ ] Kanban view shows correct columns
- [ ] Table view works with filters
- [ ] Can add new extra work
- [ ] Can edit extra work
- [ ] Status transitions work correctly
- [ ] Approval sets correct fields
- [ ] Invoicing page shows future invoices
- [ ] Invoice preview shows correct line items
- [ ] Can issue invoice
- [ ] Invoice number generated correctly
- [ ] Extra work marked as invoiced
- [ ] Invoice history shows past invoices
- [ ] Line items calculated correctly

## Notes
- billing_period format: "YYYY-MM" (e.g., "2026-01")
- Invoice number sequence per year
- Line items stored as JSONB snapshot for historical record
- Fakturoid integration in Sub-Plan 12
