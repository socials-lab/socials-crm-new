
# Plan: Odměna za kredit pro grafika v Creative Boost

## Přehled
Přidání nového pole do formuláře pro nastavení Creative Boost služby, které umožní definovat odměnu (v CZK) za každý kredit pro přiřazeného grafika/kolegu.

## Změny

### 1. Databázová migrace
Přidání nového sloupce do tabulky `engagement_services`:

```sql
ALTER TABLE public.engagement_services
ADD COLUMN IF NOT EXISTS creative_boost_colleague_reward_per_credit NUMERIC DEFAULT NULL;

COMMENT ON COLUMN public.engagement_services.creative_boost_colleague_reward_per_credit 
IS 'Reward per credit for the assigned colleague (graphic designer) in Creative Boost service';
```

### 2. TypeScript typy
Aktualizace `src/types/crm.ts` - přidání pole do interface `EngagementService`:

```typescript
export interface EngagementService {
  // ... existující pole ...
  creative_boost_min_credits: number | null;
  creative_boost_max_credits: number | null;
  creative_boost_price_per_credit: number | null;
  creative_boost_colleague_reward_per_credit: number | null;  // NOVÉ
  // ...
}
```

### 3. Formulář pro přidání služby
Aktualizace `src/components/forms/AddEngagementServiceDialog.tsx`:

**Schema:**
```typescript
creative_boost_colleague_reward_per_credit: z.coerce.number().nullable(),
```

**Nové pole v Creative Boost sekci:**
```text
┌─────────────────────────────────────────────┐
│ 🎨 Nastavení Creative Boost                 │
├─────────────────────────────────────────────┤
│ Měsíční kreditový balíček: [50]             │
│ 💰 Cena za kredit pro klienta: [400] CZK    │
│ 🎨 Odměna za kredit pro grafika: [80] CZK   │  ← NOVÉ
├─────────────────────────────────────────────┤
│ Měsíční fakturace: 20 000 CZK               │
│ = 50 kreditů × 400 Kč/kredit                │
│                                             │
│ Odměna pro grafika: 4 000 CZK/měsíc         │  ← NOVÉ
│ = 50 kreditů × 80 Kč/kredit                 │
└─────────────────────────────────────────────┘
```

**Form submission:**
Přidání `creative_boost_colleague_reward_per_credit` do objektu odesílaného na server.

---

## Technické detaily

### Soubory k úpravě
| Soubor | Změna |
|--------|-------|
| `engagement_services` (DB) | Nový sloupec `creative_boost_colleague_reward_per_credit` |
| `src/types/crm.ts` | Nové pole v `EngagementService` interface |
| `src/components/forms/AddEngagementServiceDialog.tsx` | Nové form field + výpočet odměny |

### Výchozí hodnota
- Doporučená výchozí hodnota: **80 CZK** za kredit (jako příklad, lze upravit)
- Pole je nullable - pokud není vyplněno, grafik nemá nastavenou odměnu per credit

### Zobrazení v souhrnu
V Creative Boost sekci bude zobrazen:
- Měsíční fakturace klientovi (kredity × cena/kredit)
- Měsíční odměna pro grafika (kredity × odměna/kredit)
