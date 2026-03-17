

## Plan: Show existing colleague assignments when expanding to a new country

### Problem
When adding a new country for an existing service, the specialist is likely already assigned. The dialog should automatically show who is currently assigned, their current reward, and the proposed reward increase based on the multiplier.

### Approach
In the `expand_country` section of `ProposeModificationDialog.tsx` (after the price calculation block, ~line 1075), add a new "Stávající kolegové" section that:

1. **Finds existing assignments** for the selected reference service (`expandRefServiceId`) by filtering `currentAssignments` where `engagement_service_id === expandRefServiceId`
2. **Shows each assigned colleague** with their name, role, and current reward
3. **Calculates the proposed reward increase** using the same `expandMultiplier` — e.g. if current reward is 9,100 CZK and multiplier is 0.5, the increase is +4,550 CZK
4. **Displays a clear summary**: current reward → proposed increase → new total

### Changes

**Single file: `src/components/engagements/ProposeModificationDialog.tsx`**

After the price calculation block (~line 1075, before the SRO checkbox), insert a new section:

```tsx
{/* Existing colleagues on this service */}
{(() => {
  const serviceAssignments = currentAssignments.filter(
    a => a.engagement_service_id === expandRefServiceId
  );
  if (serviceAssignments.length === 0) return null;
  
  return (
    <div className="space-y-3 p-3 rounded-md border bg-background">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Users className="h-3.5 w-3.5" />
        Stávající kolegové na této službě
        <InfoTip text="Kolegové aktuálně přiřazení k referenční službě. Při rozšíření o novou zemi se jejich odměna obvykle navyšuje o podíl odpovídající multiplikátoru." />
      </p>
      {serviceAssignments.map(a => {
        const colleague = colleagues.find(c => c.id === a.colleague_id);
        const currentReward = a.cost_model === 'fixed_monthly' ? a.monthly_cost 
          : a.cost_model === 'hourly' ? a.hourly_cost : 0;
        const rewardIncrease = Math.round((currentReward || 0) * expandMultiplier);
        const newTotal = (currentReward || 0) + rewardIncrease;
        return (
          // Card per colleague showing:
          // - Name + role
          // - Current reward (e.g. 9,100 CZK/měs)
          // - Proposed increase (+4,550 CZK) 
          // - New total (13,650 CZK/měs)
        );
      })}
    </div>
  );
})()}
```

Also need to import `Users` icon from lucide-react (check if already imported).

No other files need changes. The data for proposed increases will also be stored in `proposed_changes` for the submission step.

