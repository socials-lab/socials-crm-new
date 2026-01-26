
# Plán: Schvalovací workflow pro úpravy zakázek

## Problém k řešení

Aktuálně může kdokoliv přímo upravovat zakázky bez jakékoliv kontroly. Chybí:
- Přehled o změnách v průběhu měsíce
- Schválení od administrátora před aplikováním změn
- Prevence chyb při úpravách

## Navrhované řešení: "Požadavky na úpravy"

Vytvoříme jednoduchý systém kde:
1. **Běžní uživatelé** mohou pouze NAVRHOVAT změny (ne přímo měnit)
2. **Administrátoři** vidí seznam požadavků a mohou je schválit/zamítnout
3. Po schválení se změna automaticky aplikuje

### Typy úprav k schválení

| Typ změny | Popis |
|-----------|-------|
| Přidání služby | Nová služba na zakázce (s effective_from pro poměrnou fakturaci) |
| Změna ceny služby | Úprava ceny existující služby |
| Přiřazení kolegy | Přidání nového člověka na zakázku |
| Změna odměny kolegy | Úprava měsíční/hodinové odměny |
| Ukončení služby | Deaktivace služby na zakázce |

### Workflow

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 1. KOLEGA navrhne úpravu                                            │
│    → Vyplní formulář s detaily změny                                │
│    → Požadavek se uloží se statusem "čeká na schválení"             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. ADMIN vidí požadavek                                             │
│    → Na dashboardu v sekci "K schválení"                            │
│    → Nebo na samostatné stránce "Požadavky na úpravy"               │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│ 3a. SCHVÁLENO             │   │ 3b. ZAMÍTNUTO             │
│ → Změna se aplikuje       │   │ → Status: zamítnuto       │
│ → Záznam v historii       │   │ → Důvod zamítnutí         │
│ → Toast notifikace        │   │ → Notifikace žadateli     │
└───────────────────────────┘   └───────────────────────────┘
```

## UI návrh

### A) Nová sekce na Dashboardu (pro adminy)

```text
┌─────────────────────────────────────────────────────────────────────┐
│ ⏳ Úpravy zakázek k schválení (3)                                   │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ 📦 Přidání služby                              Od: 15.1.2026    ││
│ │ TestBrand – Retainer 2026                                       ││
│ │ Služba: Meta Ads Management • 15 000 CZK/měs                    ││
│ │ Navrhl: Jan Novák • před 2 hodinami                             ││
│ │                                                                 ││
│ │ [✓ Schválit]  [✕ Zamítnout]                                     ││
│ └─────────────────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ 💰 Změna ceny služby                                            ││
│ │ ACME Corp – Performance Marketing                               ││
│ │ Služba: Google Ads • 20 000 → 25 000 CZK/měs                    ││
│ │ Navrhl: Petra Svobodová • před 1 dnem                           ││
│ │                                                                 ││
│ │ [✓ Schválit]  [✕ Zamítnout]                                     ││
│ └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### B) Tlačítko "Navrhnout úpravu" v detailu zakázky

Pro běžné uživatele se změní tlačítka:
- Místo "Přidat službu" → "Navrhnout přidání služby"
- Místo přímé editace ceny → "Navrhnout změnu ceny"

Administrátoři mohou stále provádět přímé změny NEBO schvalovat požadavky.

### C) Dialog pro navržení úpravy

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 📝 Navrhnout úpravu zakázky                                    [×] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Typ úpravy:   [Přidání služby ▼]                                   │
│                                                                     │
│ Služba:       [Meta Ads Management ▼]                              │
│ Cena:         [15000] CZK/měs                                       │
│ Od kdy platí: [📅 15.1.2026]                                        │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ 💡 Poměrná fakturace                                            ││
│ │ Služba začíná 15.1. → Fakturace za leden: 8 226 CZK             ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ Kdo dohodl:   [Danny ▼]  (pro provizi)                             │
│                                                                     │
│ Poznámka:     [Klient požádal o rozšíření služeb po meetingu...]   │
│                                                                     │
│                                    [Zrušit]  [Odeslat ke schválení]│
└─────────────────────────────────────────────────────────────────────┘
```

## Technické detaily

### 1. Nová databázová tabulka

```sql
CREATE TYPE modification_request_type AS ENUM (
  'add_service',
  'update_service_price',
  'deactivate_service',
  'add_assignment',
  'update_assignment',
  'remove_assignment'
);

CREATE TYPE modification_request_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TABLE engagement_modification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id),
  
  -- Typ a status
  request_type modification_request_type NOT NULL,
  status modification_request_status DEFAULT 'pending',
  
  -- Navrhované změny (JSON)
  proposed_changes JSONB NOT NULL,
  
  -- Metadata pro upsell
  effective_from DATE,
  upsold_by_id UUID REFERENCES colleagues(id),
  upsell_commission_percent DECIMAL DEFAULT 10,
  
  -- Workflow
  requested_by UUID REFERENCES profiles(id),
  requested_at TIMESTAMPTZ DEFAULT now(),
  note TEXT,
  
  -- Schválení/zamítnutí
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Struktura proposed_changes (JSONB)

```javascript
// Pro add_service
{
  "service_id": "uuid",
  "name": "Meta Ads Management",
  "price": 15000,
  "currency": "CZK",
  "billing_type": "monthly"
}

// Pro update_service_price
{
  "service_id": "uuid",
  "old_price": 20000,
  "new_price": 25000
}

// Pro add_assignment
{
  "colleague_id": "uuid",
  "role_on_engagement": "Specialist",
  "cost_model": "fixed_monthly",
  "monthly_cost": 8000
}
```

### 3. Soubory k vytvoření/úpravě

**Nové soubory:**
- `src/hooks/useModificationRequests.tsx` - CRUD operace pro požadavky
- `src/components/engagements/ModificationRequestCard.tsx` - karta požadavku
- `src/components/engagements/ProposeModificationDialog.tsx` - dialog pro návrh
- `src/components/dashboard/PendingModificationsSection.tsx` - sekce na dashboardu

**Úpravy:**
- `src/pages/Engagements.tsx` - podmíněné zobrazení tlačítek (admin vs. běžný user)
- `src/pages/Dashboard.tsx` - přidat sekci "K schválení" pro adminy
- `src/types/crm.ts` - přidat typy pro modification requests

### 4. Logika schvalování

Po schválení požadavku:
1. Podle `request_type` se zavolá příslušná funkce (addEngagementService, updateEngagementService, atd.)
2. Použijí se hodnoty z `proposed_changes`
3. Nastaví se `effective_from` pro poměrnou fakturaci
4. Vytvoří se záznam v `engagement_history`
5. Pokud má upsell, přidá se do přehledu provizí

## Fáze implementace

### Fáze 1: Databáze a typy
- Vytvořit tabulku `engagement_modification_requests`
- Přidat typy do `src/types/crm.ts`
- RLS politiky

### Fáze 2: Hook a základní CRUD
- `useModificationRequests` hook
- Funkce: createRequest, approveRequest, rejectRequest, getPendingRequests

### Fáze 3: UI komponenty
- `ProposeModificationDialog` - formulář pro návrh
- `ModificationRequestCard` - zobrazení požadavku
- Integrace do detailu zakázky

### Fáze 4: Dashboard integrace
- Sekce "K schválení" na dashboardu pro adminy
- Badge s počtem čekajících požadavků

### Fáze 5: Podmíněné zobrazení
- Běžní uživatelé vidí "Navrhnout úpravu"
- Admini vidí přímé akce + mohou schvalovat

## Výhody řešení

1. **Jednoduchý workflow** - bez zbytečné komplexity
2. **Využívá existující komponenty** - dialogy, formuláře
3. **Přehled změn** - admin vidí všechny navrhované změny na jednom místě
4. **Flexibilita** - admin může stále provádět přímé změny v urgentních případech
5. **Audit trail** - vše se zaznamenává do historie

## Alternativa: MVP verze (bez databáze)

Pokud chcete začít jednodušeji, lze implementovat frontend-only verzi:
- Požadavky se ukládají do localStorage
- Funguje jako "proof of concept"
- Později lze přidat databázové ukládání

Doporučuji ale rovnou implementovat s databází pro persistenci dat a spolehlivost.
