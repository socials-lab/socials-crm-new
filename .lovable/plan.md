

## Problem

When a colleague forgets to add a manual activity item for a previous month, or needs to correct one, there's no easy way to do it. The "Add" button and activity list on the MyWork page are tied to the current month context. While the date picker in the AddActivityRewardDialog technically allows picking a past date, the UX doesn't guide users to do this — and the InvoicingOverview section for past months shows items read-only without an "Add" button.

## Solution: Billing Period Awareness for Manual Items

### 1. Add "Přidat položku" button to InvoicingOverview for ALL months (not just current)
In `src/components/my-work/InvoicingOverview.tsx`:
- Add a "+ Přidat položku" button at the bottom of the internal work section, visible for every month (not just current)
- Pass `selectedYear` and `selectedMonth` to the `onAddInternalWork` callback so the dialog opens pre-filled with the correct month

### 2. Pre-fill activity date from selected billing period
In `src/components/my-work/AddActivityRewardDialog.tsx`:
- Accept optional `defaultDate` prop (e.g. `2026-01-15` — middle of the target month)
- When provided, initialize `activityDate` to that value instead of today
- Show an info alert when adding to a past month: "Položka bude zařazena do fakturace za [měsíc rok]"

### 3. Allow editing items in past months
In `src/components/my-work/InvoicingOverview.tsx`:
- The edit pencil icon is already rendered for `isEditable` items in all months — just verify it works for past months too (it should, since `getRewardsByCategory` already returns past data)

### 4. Update MyWork page to pass selected period context
In `src/pages/MyWork.tsx`:
- Track which billing period the InvoicingOverview currently has selected
- When `onAddInternalWork` fires with a specific period, pass the corresponding default date to AddActivityRewardDialog

### Files to modify
- `src/components/my-work/InvoicingOverview.tsx` — add button for all months, pass period info
- `src/components/my-work/AddActivityRewardDialog.tsx` — accept `defaultDate` prop
- `src/pages/MyWork.tsx` — wire period context between components

