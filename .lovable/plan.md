

# Oprava propisu viceprace do vykazu kolegy

## Nalezene problemy

Po kontrole kodu jsem nasel **2 problemy** v tom, jak se viceprace propisuje do osobniho vykazu kolegy na strance "Muj prehled" (MyWork):

### Problem 1: Odmena kolegy za vicepraci pouziva spatnou sazbu

V `src/pages/MyWork.tsx` (radky 183-188) funkce `getColleagueExtraWorkAmount` pouziva `currentColleague.internal_hourly_cost` — tedy globalni sazbu z profilu kolegy. Ale nedavno jsme pridali `internal_hourly_rate` primo na kazdy zaznam viceprace, aby se dala nastavit jina sazba pro ruzne typy praci.

```
// Aktualne (spatne):
currentColleague.internal_hourly_cost * ew.hours_worked

// Spravne:
(ew.internal_hourly_rate ?? currentColleague.internal_hourly_cost) * ew.hours_worked
```

Stejna chyba je na radku 227, kde se predava `hourlyRate` do fakturacniho prehledu — opet se pouziva globalni sazba misto te z viceprace.

### Problem 2: Upsell provize — tok je funkcni, ale neni videt bez schvaleni

Upsell provize pro kolegu ktery prodal (upsold_by_id) se do vykazu propisuje spravne pres `getApprovedCommissionsForColleague` z `useUpsellApprovals`. Tento tok funguje:

1. Viceprace ma `upsold_by_id` a `upsell_commission_percent`
2. Admin schvali provizi na strance Upselly
3. Provize se objevi v osobnim vykazu kolegy ktery prodal

Toto je **OK** — zadna zmena neni potreba.

## Zmeny

### 1. MyWork.tsx — `getColleagueExtraWorkAmount` (radky 183-188)

Pouzit `ew.internal_hourly_rate` s fallbackem na `currentColleague.internal_hourly_cost`:

```typescript
const getColleagueExtraWorkAmount = (ew: typeof extraWorks[0]) => {
  const rate = ew.internal_hourly_rate ?? currentColleague?.internal_hourly_cost;
  if (rate && ew.hours_worked) {
    return rate * ew.hours_worked;
  }
  return ew.amount;
};
```

### 2. MyWork.tsx — `extraWorksForInvoice` (radky 219-229)

Predat spravnou hodinovou sazbu do fakturacniho prehledu:

```typescript
const extraWorksForInvoice = myExtraWorks.map((ew) => {
  const client = clients.find(c => c.id === ew.client_id);
  const colleagueAmount = getColleagueExtraWorkAmount(ew);
  const rate = ew.internal_hourly_rate ?? currentColleague?.internal_hourly_cost;
  return {
    clientName: client?.brand_name || client?.name || 'Neznamy klient',
    name: ew.name,
    amount: colleagueAmount,
    hours: ew.hours_worked,
    hourlyRate: rate,
  };
});
```

### 3. MyWork.tsx — zobrazeni sazby v sekci "Vice prace" (radky 382-384)

Stejna oprava v Badge, ktery ukazuje "Xh x Y Kc":

```typescript
{ew.hours_worked && (ew.internal_hourly_rate || currentColleague?.internal_hourly_cost) && (
  <Badge variant="secondary" className="text-xs shrink-0">
    {ew.hours_worked}h x {ew.internal_hourly_rate ?? currentColleague?.internal_hourly_cost} Kc
  </Badge>
)}
```

## Soubory ke zmene

| Soubor | Zmena |
|---|---|
| `src/pages/MyWork.tsx` | 3 mista — pouzit `ew.internal_hourly_rate` misto globalni sazby |

## Co neni potreba menit

- **Upsell provize** — tok funguje spravne (schvalene provize se propisuji do vykazu kolegy ktery prodal)
- **InvoicingOverview.tsx** — bere data z props, takze staci opravit zdroj v MyWork.tsx
- **Zadne zmeny v databazi ani typech**

