
# Plán: Změna konceptu kapacity z hodin na zakázky

## Cíl
Změnit evidenci kapacity kolegů z hodinové na počet zakázek. Kolega bude mít nastaven maximální počet zakázek, které může vést, a systém bude zobrazovat jeho aktuální vytížení.

## Co se změní

### 1. Databázové pole
- Přejmenovat/nahradit `capacity_hours_per_month` na `max_engagements` (INT)
- Alternativně: přidat nové pole a staré ponechat pro případné vícepráce

### 2. Rozbalená karta kolegy

Stávající "Finanční údaje" sekce se změní:

```text
Před (nyní):                        Po (nově):
┌─────────────────────────┐        ┌─────────────────────────┐
│ Hodinová sazba          │        │ Vytížení                │
│ 0 CZK/hod               │        │ 2 z 5 zakázek           │
├─────────────────────────┤        │ ████░░░░░░ 40%          │
│ Kapacita                │        ├─────────────────────────┤
│ — hod/měs     Historie  │        │ Celková odměna          │
└─────────────────────────┘        │ 45 000 CZK/měs          │
                                   └─────────────────────────┘
```

### 3. Seznam přiřazených zakázek
- Zobrazit VŽDY (ne jen když má kolega zakázky)
- Když nemá žádné: "Žádné přiřazené zakázky"
- Pro každou zakázku: název, klient, role, měsíční odměna

### 4. Editace kolegy
- Pole "Maximální počet zakázek" místo "Kapacita hodin"
- Hodinová sazba zůstane (používá se pro vícepráce)

---

## Technické detaily

### SQL Migrace (volitelné)
```sql
ALTER TABLE colleagues 
ADD COLUMN max_engagements integer DEFAULT 5;

-- Případně odstranit staré pole
-- ALTER TABLE colleagues DROP COLUMN capacity_hours_per_month;
```

### Změny v souborech

**1. `src/types/crm.ts`**
- Přidat `max_engagements: number | null` do interface `Colleague`

**2. `src/pages/Colleagues.tsx`**
- Změnit sekci "Finanční údaje":
  - Odstranit kapacitu v hodinách
  - Přidat "Vytížení" jako progress bar (aktuální zakázky / max zakázek)
  - Zobrazit celkovou měsíční odměnu
- Sekci "Přiřazené zakázky" zobrazit vždy (i když je prázdná)
- Přesunout sekci "Přiřazené zakázky" výše pro lepší přehled

**3. `src/components/forms/ColleagueForm.tsx`**
- Změnit pole "Kapacita hodin/měsíc" na "Max. počet zakázek"

**4. `src/hooks/useCRMData.tsx`** (pokud potřeba)
- Upravit typy pro nové pole

### Návrh UI rozbalené karty

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Danny Test 2       [CRM přístup] [Mid] [Měs. odměna: 45 000 CZK]   │
│  Meta                                                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📧 Kontaktní údaje          📊 Vytížení a odměna                    │
│  Email: danny@...            ┌─────────────────────────────────┐    │
│  Pozice: Meta                │ Vytížení: 2 z 5 zakázek         │    │
│                              │ ████████░░░░░░░░░░░░ 40%        │    │
│                              ├─────────────────────────────────┤    │
│                              │ Celková měsíční odměna          │    │
│                              │ 45 000 CZK                      │    │
│                              └─────────────────────────────────┘    │
│                                                                      │
│  💼 Přiřazené zakázky (2)                                           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ [T] TestBrand Retainer                           25 000 CZK/měs ││
│  │     TestBrand • Meta Specialist                                 ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ [A] Acme Campaign                                20 000 CZK/měs ││
│  │     Acme Corp • Lead                                            ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ✨ Creative Boost kredity (pokud má)                               │
│  ...                                                                │
└──────────────────────────────────────────────────────────────────────┘
```

## Sekvence implementace

1. Přidat pole `max_engagements` do TypeScript typů (využijeme stávající infrastrukturu)
2. Upravit formulář kolegy - změnit pole kapacity
3. Přepracovat rozšířenou kartu kolegy:
   - Nová sekce "Vytížení a odměna" s progress barem
   - Zobrazit zakázky vždy
   - Odstranit hodinovou kapacitu
4. Volitelně: SQL migrace pro databázi

## Poznámky
- Hodinová sazba zůstane v systému pro kalkulaci víceprací
- Historie kapacity může být odstraněna (nebo zachována pro hodinovou sazbu u víceprací)
- Pokud databáze ještě nemá `max_engagements`, použijeme dočasně konstantu nebo hodnotu z `capacity_hours_per_month` přepočítanou
