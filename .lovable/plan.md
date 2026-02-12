

## Poměrná fakturace prvního měsíce v souhrnu objednávky

### Co se změní

V kroku 6 (Souhrn a potvrzení) se u měsíčních služeb automaticky vypočítá a zobrazí poměrná částka za první měsíc, pokud klient zvolí datum zahájení jiné než 1. den v měsíci. Jednorázové služby zůstanou beze změny -- platí se vždy celá částka.

### Logika výpočtu

- Vzít `startDate` z formuláře
- Pokud den zahájení > 1:
  - Spočítat počet dnů v daném měsíci (`getDaysInMonth`)
  - Spočítat zbývající dny = dny v měsíci - den zahájení + 1
  - Poměrná cena = `(cena / dny v měsíci) * zbývající dny`, zaokrouhleno na celá čísla
- Pokud den zahájení = 1: zobrazit plnou cenu bez poznámky

### Změny v UI (soubor `src/pages/OnboardingForm.tsx`)

**1. Rozšířit funkci `getOrderSummary()`**
- Přidat vstup `startDate` z formuláře
- Pro měsíční služby vypočítat `proratedPrice` vedle standardní `price`
- Vrátit i `proratedMonthlyTotal`, `remainingDays`, `daysInMonth`, `isProrated` (boolean)

**2. U každé měsíční služby zobrazit dvě hodnoty (pokud isProrated)**
- Původní cena přeškrtnutá nebo šedá: "25 000 Kč/měs"
- Pod ní poměrná částka: "17 742 Kč za únor (22 z 28 dnů)"

**3. V celkovém součtu měsíčních služeb**
- Místo "Měsíční platba celkem: 50 000 Kč" zobrazit:
  - "První faktura (poměrná část): 35 484 Kč"
  - Pod tím menším písmem: "Od dalšího měsíce: 50 000 Kč/měs"

**4. Jednorázové služby**
- Žádná změna -- zobrazí se vždy plná cena

### Technické detaily

- Využít `getDaysInMonth` z `date-fns` (již nainstalován)
- Výpočet: `Math.round((price / daysInMonth) * remainingDays)`
- `remainingDays = daysInMonth - startDate.getDate() + 1`
- `isProrated = startDate.getDate() > 1`
- Pokud `startDate` není vyplněno, zobrazit plné ceny bez poměru

Žádné nové závislosti.
