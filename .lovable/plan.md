

## Plan: Synchronizace seznamu stránek v permissions

### Problém
`ALL_PAGES` v `src/constants/permissions.ts` neobsahuje všechny aktuální stránky — chybí **Provize (upsells)** a **Notifikace (notifications)**. Stejně tak `RouteGuard` nemá mapování pro tyto cesty.

### Změny

**1. `src/constants/permissions.ts`**
- Přidat `{ id: 'upsells', label: 'Provize', emoji: '💰' }` do sekce "Práce & dodávka"
- Přidat `{ id: 'notifications', label: 'Notifikace', emoji: '🔔' }` do sekce "Nastavení" (nebo samostatně)
- Přesunout `services` ze sekce "Finance & služby" do "Práce & dodávka" (aby odpovídal sidebaru)
- Aktualizovat `PAGE_GROUPS` odpovídajícím způsobem

**2. `src/components/layout/RouteGuard.tsx`**
- Přidat `/upsells: 'upsells'` do `ROUTE_TO_PAGE` mapování
- Přidat mapování pro SOP sub-routes (`/sop/:articleId`)
- Potvrdit, že `/broadcasts` a `/modifications` jsou přítomny

### Rozsah
Čistě synchronizační úprava — žádné nové komponenty, jen aktualizace dvou souborů aby seznam stránek odpovídal reálným routám v aplikaci.

