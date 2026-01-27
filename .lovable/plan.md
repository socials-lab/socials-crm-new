

# Plán: Indikátor poslední aktivity a redesign pipeline leadů

## Přehled změn

1. **Indikátor poslední aktivity** - U každého leadu zobrazit datum poslední aktivity s varováním při neaktivitě 3+ dny
2. **Redesign Kanban pipeline** - Kompaktnější zobrazení s menšími kartami a oddělením uzavřených stavů

---

## 1. Indikátor poslední aktivity

### Logika výpočtu poslední aktivity

Poslední aktivita bude vypočítána jako **nejnovější datum** z následujících polí v databázi:

| Pole | Typ aktivity |
|------|--------------|
| `offer_sent_at` | Nabídka odeslána |
| `offer_created_at` | Nabídka vytvořena |
| `access_request_sent_at` | Žádost o přístupy odeslána |
| `access_received_at` | Přístupy obdrženy |
| `onboarding_form_sent_at` | Onboarding odeslán |
| `onboarding_form_completed_at` | Onboarding vyplněn |
| `contract_created_at` | Smlouva vytvořena |
| `contract_sent_at` | Smlouva odeslána |
| `contract_signed_at` | Smlouva podepsána |
| `updated_at` | Jakákoliv změna |

### Vizuální zobrazení

- **Bez varování**: Datum ve formátu "před X dny" nebo "dnes"
- **S varováním (3+ dny)**: Oranžová ikona `AlertTriangle` + text "před X dny" v oranžové barvě

### Komponenty k úpravě

1. **LeadCard.tsx** - Přidat indikátor do spodní části karty
2. **LeadsTable.tsx** - Sloupec "Poslední aktivita" již existuje, přidat varování
3. **LeadMobileCard.tsx** - Přidat indikátor do footeru

---

## 2. Redesign Kanban Pipeline

### Aktuální problémy

- 9 sloupců po 300px = 2700px šířky (příliš dlouhé scrollování)
- Uzavřené stavy (won/lost/postponed) zabírají stejný prostor jako aktivní
- Karty jsou příliš vysoké

### Nový design

```text
+------------------------------------------------------------------------+
| Aktivní pipeline (horizontální scroll)                                  |
| +----------+ +----------+ +----------+ +----------+ +----------+ +------|
| | 🆕 Nový  | | 📅 Schůz.| | ⏳ Čeká  | | 🔑 Příst.| | ✏️ Přípra| | 📤   |
| | (2)      | | (1)      | | (0)      | | (1)      | | (2)      | |      |
| | [card]   | | [card]   | |          | | [card]   | | [card]   | |      |
| | [card]   | |          | |          | |          | | [card]   | |      |
| +----------+ +----------+ +----------+ +----------+ +----------+ +------|
+------------------------------------------------------------------------+

+------------------------------------------------------------------------+
| Uzavřené (kompaktní řádek)                                              |
| ✅ Vyhráno (5) | ❌ Prohráno (2) | ⏸️ Odloženo (1)                       |
+------------------------------------------------------------------------+
```

### Změny v LeadsKanban.tsx

1. **Zmenšení šířky sloupců**: 300px → 240px pro aktivní, 180px pro uzavřené
2. **Oddělení aktivních a uzavřených stavů**: 
   - Aktivní stavy: horizontální scroll nahoře
   - Uzavřené stavy: kompaktní řádek dole s rozbalovacími kartami
3. **Kompaktnější karty**: Menší padding, kratší obsah

### Změny v LeadCard.tsx (kompaktnější verze)

1. Odstranit IČO z výchozího zobrazení (zobrazit jen v detailu)
2. Zkrátit summary na 1 řádek místo 2
3. Menší padding (p-2 místo p-3)
4. Přidat indikátor poslední aktivity

---

## Technické detaily

### Nová utility funkce pro výpočet poslední aktivity

```typescript
// src/utils/leadActivityUtils.ts

export interface LeadActivityInfo {
  lastActivityDate: Date | null;
  daysSinceActivity: number;
  isStale: boolean; // true if > 3 days
  activityLabel: string; // "před 2 dny", "dnes", etc.
}

export function getLeadLastActivity(lead: Lead): LeadActivityInfo {
  const activityDates = [
    lead.offer_sent_at,
    lead.offer_created_at,
    lead.access_request_sent_at,
    lead.access_received_at,
    lead.onboarding_form_sent_at,
    lead.onboarding_form_completed_at,
    lead.contract_created_at,
    lead.contract_sent_at,
    lead.contract_signed_at,
    lead.updated_at,
  ]
    .filter(Boolean)
    .map(d => new Date(d!))
    .sort((a, b) => b.getTime() - a.getTime());

  const lastActivityDate = activityDates[0] || null;
  const now = new Date();
  const daysSinceActivity = lastActivityDate
    ? Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;

  return {
    lastActivityDate,
    daysSinceActivity,
    isStale: daysSinceActivity > 3,
    activityLabel: formatActivityLabel(daysSinceActivity),
  };
}

function formatActivityLabel(days: number): string {
  if (days === 0) return 'dnes';
  if (days === 1) return 'včera';
  if (days < 7) return `před ${days} dny`;
  if (days < 30) return `před ${Math.floor(days / 7)} týdny`;
  return `před ${Math.floor(days / 30)} měsíci`;
}
```

### Změny v souborech

#### 1. Nový soubor: `src/utils/leadActivityUtils.ts`
- Utility funkce pro výpočet poslední aktivity

#### 2. `src/components/leads/LeadCard.tsx`
- Import utility a AlertTriangle ikony
- Přidat indikátor aktivity do footeru karty
- Zmenšit padding a zkrátit obsah

#### 3. `src/components/leads/LeadsKanban.tsx`
- Rozdělit na aktivní a uzavřené stavy
- Aktivní stavy: horizontální scroll se zmenšenými sloupci (240px)
- Uzavřené stavy: kompaktní rozbalovací sekce dole
- Přidat collapsible pro uzavřené stavy

#### 4. `src/components/leads/LeadsTable.tsx`
- Upravit sloupec "Poslední aktivita" - přidat varování pro stale leady

#### 5. `src/components/leads/LeadMobileCard.tsx`
- Přidat indikátor poslední aktivity

---

## Vizuální návrh indikátoru aktivity

### Na kartě (LeadCard)
```
┌─────────────────────────────────┐
│ 🏢 Firma XYZ          [ikony]  │
│ Jan Novák                       │
│ ~50k CZK / měsíc                │
│─────────────────────────────────│
│ ⚠️ před 5 dny    [Meta Ads]    │  ← oranžové varování
└─────────────────────────────────┘

nebo

┌─────────────────────────────────┐
│ 🏢 Firma ABC          [ikony]  │
│ Marie Nová                      │
│ ~30k CZK / měsíc                │
│─────────────────────────────────│
│ včera              [Google Ads] │  ← normální šedé
└─────────────────────────────────┘
```

### V tabulce (LeadsTable)
- Sloupec "Poslední aktivita" bude obsahovat:
  - Datum + relativní čas
  - Oranžovou barvu a ikonu AlertTriangle pokud > 3 dny

---

## Kompaktní uzavřené stavy

Uzavřené stavy (won/lost/postponed) budou zobrazeny jako:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Uzavřené leady                                                   [▼]  │
├────────────────────────────────────────────────────────────────────────┤
│ ✅ Vyhráno     ❌ Prohráno     ⏸️ Odloženo                            │
│ (5) ~250k      (2) ~80k        (1) ~30k                               │
│ ┌──────┐      ┌──────┐        ┌──────┐                                │
│ │card 1│      │card 1│        │card 1│                                │
│ │card 2│      │card 2│        │      │                                │
│ └──────┘      └──────┘        └──────┘                                │
└────────────────────────────────────────────────────────────────────────┘
```

Defaultně rozbalené, ale menší karty a horizontální layout.

---

## Shrnutí změn

| Soubor | Změna |
|--------|-------|
| `src/utils/leadActivityUtils.ts` | **NOVÝ** - Utility pro výpočet poslední aktivity |
| `src/components/leads/LeadCard.tsx` | Kompaktnější design + indikátor aktivity |
| `src/components/leads/LeadsKanban.tsx` | Oddělení aktivních/uzavřených + menší sloupce |
| `src/components/leads/LeadsTable.tsx` | Varování v sloupci "Poslední aktivita" |
| `src/components/leads/LeadMobileCard.tsx` | Indikátor aktivity |

