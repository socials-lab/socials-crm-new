

## Plan: Jazykové mutace (země) u služeb v nabídce

### Kontext
V modulu Návrhy změn (Modifications) již existuje logika pro "expand_country" — přidání nové země ke stávající službě s multiplikátorem 0.5 (50% cena). Tuto logiku je třeba přenést do dialogu pro vytváření/editaci nabídek v Leads.

### Co se změní

**1. Rozšíření typu `PublicOfferService` o pole pro země**
- Soubor: `src/types/publicOffer.ts`
- Přidat pole `managed_countries?: string[]` — seznam kódů zemí, pro které služba platí
- Přidat pole `country_variants?: CountryVariant[]` — seznam jazykových mutací s vlastní cenou

```
interface CountryVariant {
  country_code: string;   // 'SK', 'DE' atd.
  multiplier: number;     // default 0.5
  price: number;          // vypočtená cena
}
```

**2. Úprava `EditableOfferServiceCard` — přidání sekce pro země**
- Soubor: `src/components/leads/EditableOfferServiceCard.tsx`
- Pod sekci ceny přidat novou sekci "Jazykové mutace / Země"
- Zobrazit výběr "hlavní země" (default CZ) s vlajkou
- Tlačítko "Přidat další trh" → otevře dropdown s `MANAGED_COUNTRIES`
- Každý přidaný trh zobrazí: vlajka + název země, multiplikátor (default 0.5, editovatelný), vypočtená cena
- Vlajky zemí se zobrazí i v collapsed stavu karty vedle názvu služby

**3. Úprava `CreateOfferDialog` — zpracování variant**
- Soubor: `src/components/leads/CreateOfferDialog.tsx`
- V kalkulaci `totals` započítat ceny country variantů ke službě
- Při ukládání nabídky uložit country varianty jako součást `services[]`
- V reward overrides zohlednit, že country varianta má proporcionální náklady

**4. Zobrazení na veřejné nabídce**
- Soubor: `src/pages/PublicOfferPage.tsx`
- U každé služby zobrazit vlajky zemí, pro které platí
- Pokud jsou country varianty, zobrazit je jako pod-položky s cenou (např. "🇸🇰 Slovensko — 50 % z CZ ceny")

### Technické detaily

- Využijí se existující konstanty z `src/constants/countries.ts` (`MANAGED_COUNTRIES`, `getCountryFlag`, `getCountryName`)
- Multiplikátor default 0.5 z `src/utils/pricingEngine.ts` (`DEFAULT_MULTIPLIERS.expand_country`)
- Cena varianty = `basePrice × multiplier`
- Žádné DB migrace — country varianty se ukládají jako součást JSON pole `services` v tabulce `public_offers`
- Typ `PublicOfferService` se rozšíří, ale zpětná kompatibilita je zachována (nová pole optional)

### Rozsah změn
1. `src/types/publicOffer.ts` — nové typy
2. `src/components/leads/EditableOfferServiceCard.tsx` — UI pro přidání zemí
3. `src/components/leads/CreateOfferDialog.tsx` — kalkulace s variantami
4. `src/pages/PublicOfferPage.tsx` — zobrazení vlajek a variant na veřejné nabídce

