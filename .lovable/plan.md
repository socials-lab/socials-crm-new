
# Plán: Přehledné rozdělení klientské a interní práce

## Shrnutí změn
Přepracujeme stránku "Můj přehled" tak, aby jasně oddělovala:
- **Klientská práce** = Moje zakázky + Odměny tento měsíc (s poměrnou částkou)
- **Interní práce** = nová sekce pro marketing/režii (propojená s fakturací)
- **Odstranění meetingů** = sekce "Dnešní meetingy" bude zcela odstraněna

## Nový layout stránky

```text
+------------------------------------------+
| 👋 Ahoj, [jméno]                         |
| [Quick stats cards bez meetingů]         |
+------------------------------------------+

+------------------------------------------+
| 📋 Moje zakázky                          |
|   [Klient]     | 20 000 Kč / měsíc       |
|                | Spolupráce od: 1.1.2025  |
|   [Klient 2]   | 15 000 Kč / měsíc       |
|                | Spolupráce od: 15.1.2026 |
+------------------------------------------+

+------------------------------------------+
| 💰 Odměny tento měsíc (klientská práce)  |
|   Klient X                     20 000 Kč |
|   Klient Y (poměr. od 15.1.)    8 710 Kč |
|   Creative Boost                3 000 Kč |
|   Schválené provize             2 000 Kč |
|   --------------------------------       |
|   Celkem za klientskou práci   33 710 Kč |
+------------------------------------------+

+------------------------------------------+
| 🏢 Interní práce                [Přidat] |
|   (práce mimo klienty - marketing/režie) |
|                                          |
|   Marketing – tvorba videa     4 000 Kč  |
|   Režijní služby – CRM         8 000 Kč  |
|   --------------------------------       |
|   Celkem                       12 000 Kč |
+------------------------------------------+

+------------------------------------------+
| 📄 Fakturace                             |
|   (historie a přehled pro fakturaci)     |
+------------------------------------------+
```

## Detailní změny

### 1. Moje zakázky - přidat datum začátku spolupráce
**Soubor:** `src/pages/MyWork.tsx`

- U každé zakázky zobrazit datum začátku spolupráce (`assignment.start_date`)
- Celková cena zůstává plná měsíční odměna (bez poměru)

### 2. Odměny tento měsíc - pouze klientská práce s poměrem
**Soubor:** `src/pages/MyWork.tsx`

- **ODSTRANIT** řádek "Ostatní činnosti" (interní práce sem nepatří!)
- Přidat logiku poměrné odměny:
  - Pokud `assignment.start_date` je v aktuálním měsíci = poměrná částka
  - Zobrazit u každého klienta zvlášť s poznámkou o poměru
- Aktualizovat celkový součet (bez interní práce)

### 3. ODSTRANIT sekci "Dnešní meetingy"
**Soubor:** `src/pages/MyWork.tsx`

- Celá karta "Dnešní meetingy" bude odstraněna
- Odstranit také import `useMeetingsData` pokud už není potřeba jinde
- Odstranit quick stat kartu pro meetingy

### 4. NOVÁ sekce "Interní práce"
**Soubor:** `src/pages/MyWork.tsx`

Nová karta místo meetingů:
- Nadpis "Interní práce" s tlačítkem "Přidat"
- Info text: "Práce mimo klienty (marketing, režijní služby)"
- Seznam činností z aktuálního měsíce (z `activityRewards`)
- Mezisoučet
- Kliknutím na "Přidat" otevře `AddActivityRewardDialog`

### 5. Fakturace - upřesnění účelu
**Soubor:** `src/components/my-work/ActivityRewardsHistory.tsx`

- Přejmenovat na "Fakturace – interní práce"
- Přidat jasnější vysvětlení:
  - "Zde je přehled interní práce pro fakturaci"
  - "Klientská práce se fakturuje automaticky přes zakázky"

## Technické detaily

### Výpočet poměrné odměny
```typescript
function calculateProratedReward(
  monthlyAmount: number,
  startDate: string | null,
  targetYear: number,
  targetMonth: number
): { amount: number; isProrated: boolean; startDay: number | null } {
  if (!startDate) {
    return { amount: monthlyAmount, isProrated: false, startDay: null };
  }
  
  const start = parseISO(startDate);
  const monthStart = startOfMonth(new Date(targetYear, targetMonth - 1));
  const daysInMonth = getDaysInMonth(monthStart);
  
  // Pokud začátek je před tímto měsícem = plná odměna
  if (isBefore(start, monthStart)) {
    return { amount: monthlyAmount, isProrated: false, startDay: null };
  }
  
  // Pokud začátek je v tomto měsíci
  if (isSameMonth(start, monthStart)) {
    const startDay = getDate(start);
    if (startDay === 1) {
      return { amount: monthlyAmount, isProrated: false, startDay: 1 };
    }
    const daysWorked = daysInMonth - startDay + 1;
    const proratedAmount = Math.round((monthlyAmount / daysInMonth) * daysWorked);
    return { amount: proratedAmount, isProrated: true, startDay };
  }
  
  // Začátek je v budoucnosti
  return { amount: 0, isProrated: true, startDay: null };
}
```

### Struktura dat pro klientské odměny
```typescript
interface ClientRewardItem {
  clientName: string;
  fullMonthlyAmount: number;
  proratedAmount: number;
  isProrated: boolean;
  startDate: string | null;
}
```

## Změny v souborech

| Soubor | Změna |
|--------|-------|
| `src/pages/MyWork.tsx` | Hlavní přepracování - odstranění meetingů, přidání interní práce, poměrné odměny |
| `src/components/my-work/ActivityRewardsHistory.tsx` | Úprava nadpisu a vysvětlení |

## Vizuální změny

### Quick stats (horní karty)
- **Zachovat:** zakázky, měsíční příjem
- **ODSTRANIT:** meetingy dnes
- **Přidat:** případně "Interní práce" jako novou kartu

### Grid layout
Změna z `lg:grid-cols-2` na:
- Moje zakázky (vlevo)
- Odměny tento měsíc (vpravo)  
- Interní práce (celá šířka nebo vlevo)
- Kontakty kolegů (vpravo)
- Fakturace (celá šířka)
