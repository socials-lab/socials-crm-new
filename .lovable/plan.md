
## Plan: Admin přehled výkazů kolegů

### Problém
Administrátor potřebí vidět kompletní výkazy všech kolegů — jaké položky mají na faktuře (zakázky, Creative Boost, provize, vícepráce, manuální položky) a jakou celkovou částku.

### Řešení
Přidat nový tab **"Výkazy"** na stránku Správa týmu (Colleagues), dostupný pro super adminy. Tab zobrazí:

1. **Přehledová tabulka** — seznam všech aktivních kolegů s celkovou fakturovatelnou částkou za vybraný měsíc
2. **Rozbalitelný detail** — po kliknutí na kolegu se zobrazí kompletní výpis položek (stejná struktura jako InvoicingOverview na MyWork)

### Nový komponent: `TeamInvoicingOverview.tsx`

Stránka s:
- Filtrem měsíc/rok (stejný pattern jako TeamEarningsOverview)
- KPI karty: celkem k fakturaci za tým, počet kolegů s výkazy
- Tabulka kolegů: jméno, počet položek, klientská práce (Kč), režijní položky (Kč), celkem (Kč)
- Po kliknutí na řádek se otevře sheet s kompletním výpisem položek kolegy (re-use logiky z InvoicingOverview)

### Nový komponent: `ColleagueInvoiceSheet.tsx`

Sheet zobrazující:
- Jméno kolegy, pozice
- Kompletní seznam položek seskupených podle kategorií (zakázky, CB, provize, vícepráce, marketing, interní práce)
- Celková částka

### Úprava `src/pages/Colleagues.tsx`

- Přidat tab "Výkazy" (vedle "Odměny týmu")
- Viditelný pouze pro super adminy

### Datové zdroje

Využijeme stávající hooky:
- `useCRMData` — assignments, engagements, clients, extraWorks
- `useCreativeBoostData` — Creative Boost kredity
- `useUpsellApprovals` — provize
- `useActivityRewards` (localStorage) — manuální položky
- `useTeamEarnings` — základní earnings data

Pro každého kolegu se vypočítají stejné položky jako na MyWork/InvoicingOverview:
- Fixní ze zakázek (assignment.monthly_cost s prorated logikou)
- Creative Boost odměny
- Schválené provize za upsell
- Vícepráce (hours × internal_hourly_rate)
- Manuální položky (marketing, overhead, client_work)
