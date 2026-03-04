

## Plan: Finanční přehled zakázky (Revenue, Náklady, Marže)

### Co se změní

**`src/pages/Engagements.tsx`**
- V rozbalené kartě zakázky přidat novou sekci **"Finanční přehled"** (viditelnou pouze při `canSeeFinancials`)
- Sekce zobrazí:
  - **Fakturace**: součet cen aktivních služeb (již kalkulováno jako `totalServicesAmount`)
  - **Náklady**: součet `monthly_cost` všech aktivních přiřazení (assignments) na zakázce
  - **Marže**: fakturace - náklady, s procentuálním vyjádřením
  - Barevné kódování marže: zelená (40%+), oranžová (20-40%), červená (<20%)
- Sekce se zobrazí v horní části rozbalené karty (pod připnutou poznámkou, nad grid s detaily)

### Přístupová oprávnění
- Stávající `canSeeFinancials` flag (z `useUserRole`) je již implementován a kontrolován
- Administrátor (`isSuperAdmin`) vidí vždy
- Ostatní uživatelé vidí pouze pokud mají `can_see_financials = true` v `user_roles`
- V nastavení přístupů (`Settings > Správa přístupů`) již existuje toggle pro `can_see_financials` — žádná změna není potřeba

### Technické detaily
- Náklady se spočítají z `getAssignmentsByEngagementId(engagement.id)` — filtrují se jen aktivní (bez `end_date`)
- Součet `assignment.monthly_cost || 0` pro každé přiřazení
- Marže % = `((revenue - cost) / revenue) * 100`
- Žádné DB změny nejsou potřeba — všechna data jsou již dostupná

