
# Implementace fakturace Creative Boost podle balíčku kreditů

## Přehled
Úprava fakturace Creative Boost tak, aby se fakturovalo podle dohodnutého balíčku kreditů (maxCredits × pricePerCredit), nikoli podle skutečného čerpání. Zároveň přidáme možnost editace fakturované částky.

---

## Klíčové změny

### 1. Rozšíření datového modelu

**Soubor: `src/types/creativeBoost.ts`**

Přidat nová pole do `CreativeBoostClientMonth`:
- `invoiceAmount: number | null` - vlastní fakturovaná částka (pokud null, použije se balíček)
- `invoiceNote: string | null` - poznámka k faktuře

```typescript
export interface CreativeBoostClientMonth {
  // ... existující pole
  invoiceAmount: number | null;  // Vlastní částka k fakturaci (přepíše balíček)
  invoiceNote: string | null;    // Poznámka k faktuře CB
}
```

Přidat do `ClientMonthSummary`:
- `packageInvoice: number` - částka podle balíčku (maxCredits × pricePerCredit)
- `customInvoiceAmount: number | null` - vlastní částka
- `finalInvoiceAmount: number` - finální částka k fakturaci

---

### 2. Aktualizace mock dat

**Soubor: `src/data/creativeBoostMockData.ts`**

Přidat nová pole do všech záznamů `creativeBoostClientMonths`:
```typescript
{
  // ... existující data
  invoiceAmount: null,  // null = použij balíček
  invoiceNote: null,
}
```

---

### 3. Změna výpočtu v useCreativeBoostData

**Soubor: `src/hooks/useCreativeBoostData.tsx`**

#### a) Upravit `getClientMonthSummaries` funkci:

```typescript
// PŘED (řádek ~372):
estimatedInvoice: usedCredits * monthData.pricePerCredit,

// PO:
packageInvoice: monthData.maxCredits * monthData.pricePerCredit,
customInvoiceAmount: monthData.invoiceAmount,
finalInvoiceAmount: monthData.invoiceAmount ?? (monthData.maxCredits * monthData.pricePerCredit),
// Zachovat i původní pro info:
estimatedInvoice: usedCredits * monthData.pricePerCredit, // jen pro info
```

#### b) Přidat funkci pro aktualizaci fakturované částky:

```typescript
const updateInvoiceAmount = useCallback((
  clientId: string, 
  year: number, 
  month: number, 
  amount: number | null,
  note?: string
) => {
  const monthData = clientMonths.find(
    cm => cm.clientId === clientId && cm.year === year && cm.month === month
  );
  if (monthData) {
    updateClientMonth(monthData.id, { 
      invoiceAmount: amount,
      invoiceNote: note ?? monthData.invoiceNote,
    });
  }
}, [clientMonths, updateClientMonth]);
```

#### c) Přidat tracking změn do historie:

Při změně `invoiceAmount` logovat do `settingsHistory`.

---

### 4. Aktualizace UI v ClientsOverview

**Soubor: `src/components/creative-boost/ClientsOverview.tsx`**

#### a) Změnit zobrazení "Odhad faktury":

```typescript
// PŘED:
<span>{formatCurrency(summary.estimatedInvoice)}</span>

// PO:
<div className="flex flex-col items-end">
  <span className="font-semibold">{formatCurrency(summary.finalInvoiceAmount)}</span>
  {summary.customInvoiceAmount && (
    <span className="text-xs text-muted-foreground line-through">
      {formatCurrency(summary.packageInvoice)}
    </span>
  )}
</div>
```

#### b) Přidat do Settings dialogu pole pro editaci částky:

```tsx
{/* V Settings dialogu */}
<div className="space-y-2">
  <Label>Fakturovaná částka</Label>
  <div className="flex items-center gap-2">
    <Input
      type="number"
      value={customAmount ?? ''}
      placeholder={packageAmount.toString()}
      onChange={(e) => setCustomAmount(e.target.value ? Number(e.target.value) : null)}
    />
    <span className="text-sm text-muted-foreground">Kč</span>
  </div>
  <p className="text-xs text-muted-foreground">
    Balíček: {formatCurrency(packageAmount)} • Ponechte prázdné pro fakturaci balíčku
  </p>
</div>
```

---

### 5. Aktualizace fakturace

**Soubor: `src/pages/Invoicing.tsx`**

Změnit výpočet Creative Boost částky:
```typescript
// PŘED (řádek ~86):
creativeBoostAmount += totalCredits * cm.pricePerCredit;

// PO:
const packageAmount = cm.maxCredits * cm.pricePerCredit;
const invoiceAmount = cm.invoiceAmount ?? packageAmount;
creativeBoostAmount += invoiceAmount;
```

**Soubor: `src/components/invoicing/FutureInvoicing.tsx`**

Upravit generování Creative Boost položky:
```typescript
// PŘED (řádky ~75-96):
let totalCredits = 0;
// ... počítání kreditů
creativeBoostData.set(cm.clientId, {
  usedCredits: totalCredits,
  pricePerCredit: cm.pricePerCredit,
  totalAmount: totalCredits * cm.pricePerCredit,
});

// PO:
const packageAmount = cm.maxCredits * cm.pricePerCredit;
const invoiceAmount = cm.invoiceAmount ?? packageAmount;
creativeBoostData.set(cm.clientId, {
  usedCredits: totalCredits,  // pro info
  maxCredits: cm.maxCredits,
  pricePerCredit: cm.pricePerCredit,
  packageAmount,
  invoiceAmount,  // finální částka k fakturaci
});
```

Upravit popis položky na faktuře:
```typescript
// PŘED:
source_description: `Creative Boost - ${cbData.usedCredits} kreditů × ${cbData.pricePerCredit.toLocaleString()} Kč`,

// PO:
source_description: `Creative Boost - balíček ${cbData.maxCredits} kr. (čerpáno ${cbData.usedCredits} kr.)`,
```

---

### 6. Přidat inline editaci v EngagementInvoiceCard

**Soubor: `src/components/invoicing/EngagementInvoiceCard.tsx`**

Pro Creative Boost položky přidat možnost rychlé editace částky přímo ve fakturační kartě:
- Kliknutí na částku otevře inline input
- Uložení aktualizuje `invoiceAmount` v mock datech

---

## Vizuální schéma

```text
┌────────────────────────────────────────────────────────────┐
│  CREATIVE BOOST - Karta klienta                           │
├────────────────────────────────────────────────────────────┤
│  Čerpání:    35 / 50 kreditů   [====----] 70%             │
│  Balíček:    50 kr. × 1 500 Kč = 75 000 Kč                │
│  K fakturaci: [  75 000  ] Kč  ← editovatelné pole        │
│               └─ ponechte prázdné = fakturovat balíček    │
└────────────────────────────────────────────────────────────┘
```

---

## Logika fakturace

| Scénář | Čerpání | Balíček | Custom částka | Fakturovaná částka |
|--------|---------|---------|---------------|--------------------|
| Normální | 35 kr. | 50 kr. | - | 75 000 Kč (balíček) |
| Přečerpání | 60 kr. | 50 kr. | - | 75 000 Kč (balíček) |
| Sleva | 35 kr. | 50 kr. | 60 000 Kč | 60 000 Kč (custom) |
| Příplatek | 60 kr. | 50 kr. | 90 000 Kč | 90 000 Kč (custom) |

---

## Technická poznámka

Všechna data zůstávají v mock datech (localStorage by se dalo přidat pro persistenci mezi reloady, ale pro teď ponecháme in-memory state pro jednoduchost).

---

## Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `src/types/creativeBoost.ts` | Přidat `invoiceAmount`, `invoiceNote`, rozšířit `ClientMonthSummary` |
| `src/data/creativeBoostMockData.ts` | Přidat nová pole do mock dat |
| `src/hooks/useCreativeBoostData.tsx` | Upravit výpočty, přidat `updateInvoiceAmount` |
| `src/components/creative-boost/ClientsOverview.tsx` | Zobrazit balíček vs. custom, přidat editaci |
| `src/pages/Invoicing.tsx` | Změnit výpočet KPI na balíček |
| `src/components/invoicing/FutureInvoicing.tsx` | Změnit generování položky na balíček |
