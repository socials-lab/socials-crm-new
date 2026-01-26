

# Plán: Upsell Summary Card s workflow schvalování provizí (Frontend-only)

## Přehled
Vytvoření karty pro měsíční přehled všech upsellů (vícepráce + nové služby) s provizemi a workflow schvalování. Schválené provize se zobrazí v "Můj přehled" u daného kolegy. Vše pouze ve frontendu bez databázových změn.

## Současný stav
- `ExtraWork` a `EngagementService` mají pole `upsold_by_id` a `upsell_commission_percent`
- Upselly zobrazují badge "💰 Upsell", ale chybí workflow schvalování
- Není rozlišení mezi čekajícími a schválenými provizemi

## Řešení

### 1. LocalStorage pro stav schválení

Ukládání schválených provizí do localStorage:

```text
Key: "upsell_commission_approvals"
Value: {
  "extra_work_123": {
    approved: true,
    approvedAt: "2026-01-26T14:30:00Z",
    approvedBy: "admin-user-id"
  },
  "service_456": {
    approved: true,
    approvedAt: "2026-01-25T10:15:00Z", 
    approvedBy: "admin-user-id"
  }
}
```

### 2. Nový Hook: useUpsellApprovals

Soubor: `src/hooks/useUpsellApprovals.tsx`

Funkce:
- `getApprovalStatus(type, id)` - vrátí stav schválení
- `approveCommission(type, id, userId)` - schválí provizi
- `revokeApproval(type, id)` - zruší schválení
- `getUpsellsForMonth(year, month)` - všechny upselly za měsíc
- `getApprovedCommissionsForColleague(colleagueId, year, month)` - schválené provize kolegy

### 3. Nová Komponenta: UpsellSummaryCard

Soubor: `src/components/upsells/UpsellSummaryCard.tsx`

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 💰 Přehled upsellů - Leden 2026                    [<] [>] měsíc   │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🏢 ACME Corp • Performance Marketing                           │ │
│ │ ────────────────────────────────────────────────────────────── │ │
│ │ 📋 Extra Work: Bannery pro kampaň                              │ │
│ │ 💵 Částka: 15 000 CZK                                          │ │
│ │ 👤 Prodal: Jan Novák                                           │ │
│ │ 💰 Provize: 1 500 CZK (10%)                                    │ │
│ │ ⏳ Čeká na schválení              [✓ Schválit] (admin only)   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🏢 Beta s.r.o. • Creative Boost                                │ │
│ │ ────────────────────────────────────────────────────────────── │ │
│ │ 🆕 Nová služba: Creative Boost                                 │ │
│ │ 💵 Částka: 50 × 400 = 20 000 CZK                               │ │
│ │ 👤 Prodal: Petr Svoboda                                        │ │
│ │ 💰 Provize: 2 000 CZK (10%)                                    │ │
│ │ ✅ Schváleno 15.1.2026                                         │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ 📊 SOUHRN                                                          │
│ Celkem provize: 3 500 CZK   │   Schváleno: 2 000 CZK              │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Integrace do stránek

**A) Stránka Zakázky (`src/pages/Engagements.tsx`)**
- Přidání UpsellSummaryCard jako nové sekce (viditelné pro adminy/uživatele s `can_see_financials`)
- Navigace mezi měsíci

**B) Stránka Můj přehled (`src/pages/MyWork.tsx`)**
- Nová sekce "💰 Schválené provize"
- Zobrazí pouze schválené provize pro přihlášeného kolegu
- Seskupeno podle měsíce

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 💰 Schválené provize                                               │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Leden 2026                                                      │ │
│ │ ──────────────────────────────────────────────────────────────  │ │
│ │ • Beta s.r.o. - Creative Boost           2 000 CZK ✅          │ │
│ │ • Gamma a.s. - Extra bannery             1 200 CZK ✅          │ │
│ │                                                                 │ │
│ │ Celkem: 3 200 CZK                                              │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technické detaily

### Soubory k vytvoření/úpravě

| Soubor | Akce | Popis |
|--------|------|-------|
| `src/hooks/useUpsellApprovals.tsx` | VYTVOŘIT | Hook pro správu schválení (localStorage) |
| `src/components/upsells/UpsellSummaryCard.tsx` | VYTVOŘIT | Hlavní komponenta přehledu |
| `src/pages/Engagements.tsx` | UPRAVIT | Přidat sekci s UpsellSummaryCard |
| `src/pages/MyWork.tsx` | UPRAVIT | Přidat sekci schválených provizí |

### Interface pro UpsellItem

```typescript
interface UpsellItem {
  id: string;
  type: 'extra_work' | 'service';
  clientId: string;
  clientName: string;
  brandName: string;
  engagementId: string;
  engagementName: string;
  itemName: string;
  amount: number;
  currency: string;
  upsoldById: string;
  upsoldByName: string;
  commissionPercent: number;
  commissionAmount: number;
  // Frontend-only approval state
  isApproved: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
}
```

### Logika výpočtu provize

**Extra Work:**
```typescript
commission = amount * (upsell_commission_percent / 100)
```

**Engagement Service (běžná):**
```typescript
commission = price * (upsell_commission_percent / 100)
```

**Creative Boost Service:**
```typescript
firstBilling = creative_boost_max_credits * creative_boost_price_per_credit
commission = firstBilling * (upsell_commission_percent / 100)
```

### Oprávnění

| Akce | Oprávnění |
|------|-----------|
| Zobrazit UpsellSummaryCard | `can_see_financials` |
| Schválit provizi | `is_super_admin` nebo role = 'admin' |
| Zobrazit vlastní schválené provize | Všichni uživatelé (filtrováno na vlastní) |

### Stavy provize (Badge)

| Stav | Badge | Barva |
|------|-------|-------|
| Čeká na schválení | ⏳ "Čeká na schválení" | Žlutá/amber |
| Schváleno | ✅ "Schváleno [datum]" | Zelená |

### Empty State

Pokud nejsou žádné upselly v daném měsíci:
> "Žádné upselly v tomto měsíci"

