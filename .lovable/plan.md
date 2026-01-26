
# Plan: Fakturace dle SOP na stránce Můj přehled

## Shrnutí
Upravíme sekci "Činnosti k fakturaci" na "Fakturace" s důrazem na správné pojmenování položek podle SOP. Přidáme výběr kategorie (Marketing, Režijní služby) a automatické generování názvů položek pro fakturu.

## Změny

### 1. Aktualizace datového modelu činností
**Soubor:** `src/hooks/useActivityRewards.tsx`

Rozšíříme interface `ActivityReward` o nová pole:
- `category`: typ kategorie ('marketing' | 'overhead') - pouze pro interní činnosti (ne přímé služby na klientech)
- `invoice_item_name`: automaticky vygenerovaný název položky pro fakturu

### 2. Aktualizace dialogu pro přidání činnosti
**Soubor:** `src/components/my-work/AddActivityRewardDialog.tsx`

- Přidáme výběr **kategorie** jako první krok:
  - **Marketing** - činnosti pro Socials související s marketingem
  - **Režijní služby** - interní projekty, sales, administrativa

- Přidáme **informační box** vysvětlující SOP formát:
  - Marketing: `Marketing – popis činnosti`
  - Režijní služby: `Režijní služby – popis činnosti`

- Automatické generování názvu položky pro fakturu na základě kategorie a popisu

### 3. Přejmenování a redesign hlavní komponenty
**Soubor:** `src/components/my-work/ActivityRewardsHistory.tsx`

Přejmenujeme na **"Fakturace"** a upravíme:

- **Hlavní sekce "Co fakturovat tento měsíc":**
  - Zobrazíme seznam položek s přesným názvem pro fakturu
  - Možnost kopírovat název položky do schránky
  - Seskupení podle kategorie (Marketing, Režijní služby)

- **Sekce historie:**
  - Filtrování podle měsíce/roku
  - Zobrazení položek s generovaným názvem pro fakturu

### 4. Přidání SOP nápovědy
Vytvoříme informační panel vysvětlující pravidla fakturace:

```text
Pravidla pro položky na faktuře:
- Marketing – popis činnosti (např. Marketing – tvorba video obsahu)
- Režijní služby – popis činnosti (např. Režijní služby – interní reportingová šablona)
```

## Technické detaily

### Aktualizovaný interface ActivityReward
```typescript
export type ActivityCategory = 'marketing' | 'overhead';

export interface ActivityReward {
  id: string;
  colleague_id: string;
  category: ActivityCategory;
  description: string;
  invoice_item_name: string; // Auto-generated
  billing_type: 'fixed' | 'hourly';
  amount: number;
  hours: number | null;
  hourly_rate: number | null;
  activity_date: string;
  created_at: string;
}
```

### Generování názvu položky
```typescript
function generateInvoiceItemName(category: ActivityCategory, description: string): string {
  const categoryLabels = {
    marketing: 'Marketing',
    overhead: 'Režijní služby',
  };
  return `${categoryLabels[category]} – ${description}`;
}
```

### UI layout sekce Fakturace
```text
+------------------------------------------+
| 📄 Fakturace                    [Přidat] |
+------------------------------------------+
| ℹ️ Položky na faktuře musí začínat:      |
|    Marketing – nebo Režijní služby –     |
+------------------------------------------+
| Co fakturovat za [Leden ▼] [2026 ▼]      |
+------------------------------------------+
| Celkem: 15 000 Kč                        |
+------------------------------------------+
| Marketing                                |
| ┌────────────────────────────────────┐   |
| │ Marketing – tvorba video obsahu    │📋 |
| │ 5. 1. 2026 • 8h × 500 Kč           │   |
| │                         4 000 Kč 🗑│   |
| └────────────────────────────────────┘   |
+------------------------------------------+
| Režijní služby                           |
| ┌────────────────────────────────────┐   |
| │ Režijní služby – interní CRM       │📋 |
| │ 10. 1. 2026 • Fixní                │   |
| │                        11 000 Kč 🗑│   |
| └────────────────────────────────────┘   |
+------------------------------------------+
| Historie po měsících                     |
| Led 2026: 15 000 Kč | Pro 2025: 8 000 Kč |
+------------------------------------------+
```

## Migrace existujících dat
Pro zpětnou kompatibilitu - existující záznamy bez kategorie budou automaticky označeny jako "Režijní služby" a invoice_item_name bude vygenerován z popisu.

## Poznámka k přímým službám
Přímé služby (práce na klientech) jsou již sledovány v sekci "Moje zakázky" a v systému engagements. Tato sekce "Fakturace" je určena pouze pro činnosti MIMO přímou práci na klientech (marketing a režie).
