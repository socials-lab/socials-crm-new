
## Procentuální sleva na měsíční platbu

Přidání možnosti zadat % slevu na celkový měsíční souhrn (ne na jednotlivé služby, ale na celkovou měsíční částku). Sleva se nastaví v CreateOfferDialog a zobrazí se v cenové rekapitulaci na veřejné nabídce.

### Co se změní

**1. Typ `PublicOffer`** (`src/types/publicOffer.ts`)
- Nové volitelné pole `monthly_discount_percent?: number` (0-100)

**2. CreateOfferDialog** (`src/components/leads/CreateOfferDialog.tsx`)
- Nový state `monthlyDiscountPercent` (výchozí 0)
- V sekci "Price Summary" přidat input pro zadání % slevy na měsíční částku
- Zobrazit přepočítanou cenu po slevě (původní cena, sleva v CZK, finální cena)
- Hodnota se uloží do vytvořeného `PublicOffer` objektu

**3. Veřejná nabídka** (`src/pages/PublicOfferPage.tsx`)
- V sekci "Pricing Summary" (řádek ~730):
  - Pokud `monthly_discount_percent > 0`, zobrazit původní měsíční cenu přeškrtnutou
  - Pod ní řádek se slevou (např. "Sleva 10%: -X CZK")
  - Finální měsíční cena po slevě zvýrazněná

### Technické detaily

- Sleva se aplikuje pouze na součet měsíčních služeb, jednorázové položky zůstávají beze změny
- Výpočet: `discountedMonthly = totalMonthly * (1 - monthlyDiscountPercent / 100)`
- V CreateOfferDialog se pole zobrazí jako `<Input type="number" min={0} max={100} />` vedle měsíčního souhrnu
- `total_price` v uložené nabídce bude obsahovat cenu PO slevě
