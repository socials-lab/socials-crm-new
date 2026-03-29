

## Plán: Zobrazení škálovaných nákladů/odměn u jazykových mutací

### Problém
V sekci "Náklady na doručení & odměny" se u jednotlivých rolí zobrazuje **základní (base) odměna** z `rewardOverrides`, ale celkový součet (`sc.cost`) už je správně násobený multiplikátorem country variant. To je matoucí — řádky nesedí s celkem.

### Řešení
V UI sekci nákladů (řádky 802–849 v `CreateOfferDialog.tsx`) zobrazit u každé role **efektivní částku** (base × variantCostMultiplier), pokud má služba country varianty:

1. **Zobrazit škálovanou odměnu vedle base hodnoty**
   - Editační input zůstane s base hodnotou (to je to, co uživatel nastavuje)
   - Pokud existují country varianty, za inputem se zobrazí label typu `→ 15 000 Kč` (efektivní částka po násobení)
   - Formát: `10 000 Kč/měs → 15 000 Kč (1.5×)`

2. **Přidat info o multiplikátoru u názvu služby**
   - Už existuje `variantLabel` v totals kalkulaci, zobrazí se jako `(1.5×)` u názvu
   - Přidat i malý text pod názvem služby: "Včetně 1 dalšího trhu" nebo "Včetně 2 dalších trhů"

### Soubor ke změně
- `src/components/leads/CreateOfferDialog.tsx` — sekce zobrazení reward overrides (cca řádky 802–880)

### Detail implementace
- Pro každý `sc` v `serviceCosts` najít příslušnou `editableService` a její `country_variants`
- Spočítat `multiplier = 1 + sum(variants.multiplier)`
- U každého řádku role: pokud `multiplier > 1`, zobrazit `Math.round(r.reward * multiplier)` jako efektivní hodnotu
- Input pro editaci zůstane na base hodnotě — škálování je automatické

