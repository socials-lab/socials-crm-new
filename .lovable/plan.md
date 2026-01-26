
# Plán: Workflow pro úpravy zakázek s schválením a provizemi

## Přehled požadavků

1. **Schvalovací workflow** - Úpravy na zakázkách musí být schváleny
2. **Provize 10%** - Člověk, který upsell dohodl, dostane 10% z první fakturace
3. **Poměrná fakturace** - Fakturace odpovídá datu zahájení změny v daném měsíci
4. **Aplikace pouze na stávající klienty** - Nové služby nebo úpravy existujících

## Současný stav

### Co už funguje:
- `EngagementService` má pole `upsold_by_id` a `upsell_commission_percent` pro sledování provizí
- Stránka Provize (`/upsells`) zobrazuje a schvaluje provize
- Extra work má kompletní schvalovací workflow
- Fakturační systém podporuje poměrnou fakturaci (`prorated_days`)

### Co chybí:
- Datum účinnosti změny na službě (pro poměrnou fakturaci)
- Schvalovací status pro nové služby
- Systém požadavků na úpravy existujících služeb/zakázek

## Navrhované řešení

### 1. Rozšíření EngagementService o datum účinnosti

Přidání polí do `engagement_services` tabulky:

```
- effective_from: DATE - od kdy změna platí
- modification_status: ENUM ('draft', 'pending_approval', 'approved', 'rejected')
- approved_by: UUID - kdo schválil
- approved_at: TIMESTAMP - kdy schváleno
```

### 2. Nový typ: Engagement Modification Request

Pro komplexnější úpravy (změna ceny existující služby, přidání nové služby):

```
engagement_modification_requests:
- id
- engagement_id
- modification_type: 'add_service' | 'update_service' | 'remove_service' | 'update_price'
- service_id (pokud se týká služby)
- proposed_changes: JSONB (nové hodnoty)
- effective_from: DATE
- requested_by: UUID
- requested_at: TIMESTAMP
- status: 'pending' | 'approved' | 'rejected'
- approved_by: UUID
- approved_at: TIMESTAMP
- rejection_reason: TEXT
- upsold_by_id: UUID (kdo dohodl upsell)
- upsell_commission_percent: DECIMAL (default 10)
```

### 3. Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ÚPRAVA ZAKÁZKY                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Kolega vytvoří požadavek na úpravu                               │
│    - Vybere typ změny (nová služba / úprava ceny / změna balíčku)  │
│    - Zadá datum účinnosti (effective_from)                          │
│    - Zadá kdo to dohodl (upsold_by) - default on sám               │
│    - Status: PENDING                                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. Notifikace admina/managementu                                    │
│    - Zobrazí se v dashboardu jako "K schválení"                     │
│    - Admin může schválit nebo odmítnout                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│ 3a. SCHVÁLENO             │   │ 3b. ODMÍTNUTO             │
│ - Změna se aplikuje       │   │ - Status: REJECTED        │
│ - Vytvoří se záznam       │   │ - Notifikace žadateli     │
│   v engagement_history    │   └───────────────────────────┘
│ - Provize se přidá        │
│   do přehledu upsellů     │
└───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. Fakturace                                                        │
│    - Pokud effective_from je v průběhu měsíce                       │
│    - Vypočítá se poměrná část: (dny_do_konce_měsíce / celkem_dní)  │
│    - Příklad: služba za 10 000 Kč, start 15.1.                      │
│      → fakturace = 10 000 × (17/31) = 5 484 Kč                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. UI Komponenty

**A) Dialog pro přidání/úpravu služby (rozšíření)**

Přidat do `AddEngagementServiceDialog`:
- Pole "Od kdy platí" (datepicker, default: dnes)
- Pokud datum není 1. den měsíce, zobrazit upozornění o poměrné fakturaci
- Pole "Kdo dohodl upsell" (select s kolegy)
- Automaticky 10% provize

**B) Nová stránka/sekce: Úpravy k schválení**

Možnosti:
1. Nová stránka `/modification-requests`
2. Sekce na dashboardu pro adminy
3. Notifikační badge v navigaci

**C) Kalkulačka poměrné fakturace**

V dialogu při přidání služby:
```
┌─────────────────────────────────────────────┐
│ 💰 Kalkulace fakturace                      │
│                                             │
│ Služba: Meta Ads Management                 │
│ Měsíční cena: 15 000 CZK                    │
│ Od: 15. ledna 2026                          │
│                                             │
│ Dní do konce měsíce: 17                     │
│ Celkem dní v měsíci: 31                     │
│                                             │
│ ► Fakturace za leden: 8 226 CZK             │
│ ► Provize (10%): 823 CZK                    │
└─────────────────────────────────────────────┘
```

### 5. Implementační kroky

**Fáze 1: Databáze**
1. Přidat `effective_from` do `engagement_services`
2. Vytvořit tabulku `engagement_modification_requests`
3. Přidat RLS politiky

**Fáze 2: Backend/Hooks**
1. Hook `useModificationRequests` pro CRUD operace
2. Rozšířit `useCRMData` o práci s effective_from
3. Upravit kalkulaci fakturace pro poměrnou část

**Fáze 3: UI**
1. Rozšířit `AddEngagementServiceDialog` o effective_from a upsell_by
2. Komponenta `ModificationRequestCard` pro zobrazení požadavků
3. Sekce "K schválení" na dashboardu
4. Přehled v detailu zakázky

**Fáze 4: Fakturace**
1. Upravit generování invoice line items pro poměrnou fakturaci
2. Zobrazit v přehledu fakturace odkud pochází poměrná část

## Alternativní jednodušší řešení (MVP)

Pokud nechcete plnohodnotný schvalovací systém, lze implementovat:

1. **Pouze rozšířit AddEngagementServiceDialog**:
   - Přidat pole `effective_from`
   - Přidat `upsold_by_id`
   - Automaticky počítat poměrnou fakturaci
   
2. **Využít existující Provize stránku**:
   - Schválení provize = schválení změny
   - Admin schvaluje až při fakturaci

3. **Notifikace místo schvalování**:
   - Při přidání služby se vytvoří notifikace pro admina
   - Admin vidí změny, ale nemusí je explicitně schvalovat

## Doporučení

Doporučuji začít s **jednodušším MVP řešením**:
1. Přidat `effective_from` do služeb
2. Rozšířit dialog o datum a upsell
3. Využít stávající Provize stránku pro schvalování

Plnohodnotný schvalovací workflow lze přidat později, pokud bude potřeba.

## Shrnutí změn

### Databáze
- `engagement_services.effective_from` (DATE)
- Volitelně: nová tabulka `engagement_modification_requests`

### Soubory k úpravě
- `src/components/forms/AddEngagementServiceDialog.tsx` - přidat effective_from, kalkulaci
- `src/hooks/useCRMData.tsx` - upravit kalkulace
- `src/pages/Engagements.tsx` - zobrazit effective_from v detailu
- `src/components/invoicing/FutureInvoicing.tsx` - poměrná fakturace
- `src/types/crm.ts` - rozšířit typy

### Nové soubory
- `src/hooks/useModificationRequests.tsx` (volitelné pro plný workflow)
- `src/components/engagements/ModificationRequestCard.tsx` (volitelné)
