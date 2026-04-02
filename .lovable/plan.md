

## Výsledek kontroly slevové logiky v nabídce

Po důkladné analýze kódu v `PublicOfferPage.tsx` a `CreateOfferDialog.tsx` je slevová logika **správná**. Žádné chyby nebyly nalezeny.

### Co bylo zkontrolováno

**1. Jazykové mutace (country variants) v součtech**
- `getServiceTotal()` korektně sčítá `service.price + sum(variant.price)` 
- `coreMonthly`, `addonMonthly` a `totalMonthly` všechny používají `getServiceTotal()` — varianty jsou zahrnuty

**2. Bundle sleva (sleva za balíček)**
- Scope `core_only`: sleva se aplikuje pouze na `coreMonthly`, poté se přičte `addonMonthly`
- Scope `all_services`: sleva se aplikuje na celý `totalMonthly`
- Obojí zahrnuje ceny variant

**3. Úvodní sleva (waterfall logika)**
- Intro sleva se počítá z `afterBundle` (po aplikaci bundle slevy) — správný waterfall
- Zobrazuje se jako samostatný badge s dočasnou cenou

**4. Zobrazení v kartách služeb**
- `serviceTotalPrice = service.price + variantTotal` — na kartě se zobrazuje celková cena včetně mutací
- Platí pro desktop i mobilní layout

**5. Celkový souhrn**
- Přeškrtnutá cena (bez slevy) ukazuje `totalMonthly` (vč. variant)
- Hlavní cena ukazuje `finalPrice = afterBundle` (po bundle slevě)
- Intro sleva se zobrazuje jako dočasná zvýhodněná cena pod tím

### Závěr

Slevová logika je implementována správně ve všech kombinacích:
- Pouze bundle sleva ✓
- Pouze intro sleva ✓  
- Obě slevy najednou (waterfall) ✓
- Se službami s jazykovými mutacemi ✓
- Core vs. addon scope ✓

Žádné úpravy nejsou potřeba.

