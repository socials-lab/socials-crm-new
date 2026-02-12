

## Automatické doplnění sídla firmy podle IČO

### Problem
V detailu leadu (`LeadDetailDialog`) se po uložení IČO pouze uloží samotné IČO. Adresa (ulice, město, PSČ) se musí vyplňovat ručně, přestože ARES API už v aplikaci funguje (v `AddLeadDialog`).

### Řešení
Když se v detailu leadu uloží nebo změní IČO, automaticky se z ARES API stáhne sídlo firmy a uloží do `billing_street`, `billing_city`, `billing_zip`. Pokud adresa ještě není vyplněná, doplní se automaticky. Pokud už je vyplněná, uživatel dostane potvrzení, zda ji chce přepsat.

### Kroky implementace

1. **Extrahovat `fetchAresData` do sdíleného utility**
   - Přesunout funkci `fetchAresData` z `AddLeadDialog.tsx` do nového souboru `src/utils/aresUtils.ts`
   - Zachovat stávající logiku (název firmy, DIČ, adresa, jednatelé, NACE)
   - V `AddLeadDialog` importovat z nového umístění

2. **Upravit `LeadDetailDialog` - handler uložení IČO**
   - Při uložení IČO (callback `onSave` u `InlineEditField` pro IČO) přidat volání `fetchAresData`
   - Pokud ARES vrátí adresu a lead nemá vyplněnou adresu: automaticky uložit `billing_street`, `billing_city`, `billing_zip` přes `updateLead`
   - Pokud lead už adresu má: zobrazit toast s dotazem nebo přímo přepsat (protože nové IČO = nová firma)
   - Zobrazit loading indikátor během načítání z ARES
   - Kromě adresy aktualizovat i `company_name` a `dic`, pokud jsou prázdné

3. **Upravit `CompanyFinancials` komponentu**
   - Pokud Hlídač státu vrátí jméno firmy, zobrazit ho jako potvrzení
   - Přidat tlačítko "Doplnit adresu" pokud z Hlídače státu existují data a adresa v leadu chybí

### Technické detaily

**Nový soubor:**
- `src/utils/aresUtils.ts` - extrahovaná funkce `fetchAresData` + typy `AresData`, `DirectorInfo`

**Upravené soubory:**
- `src/components/leads/AddLeadDialog.tsx` - import z `aresUtils.ts` místo lokální definice
- `src/components/leads/LeadDetailDialog.tsx` - rozšířit `onSave` pro IČO o ARES lookup a automatické uložení adresy

**Logika auto-fill při změně IČO v detailu leadu:**
```text
1. Uživatel uloží nové IČO
2. Uloží se IČO do DB
3. Zavolá se fetchAresData(ico)
4. Pokud ARES vrátí data:
   a. Pokud billing_street je prázdný -> automaticky uložit adresu + toast "Adresa doplněna z ARES"
   b. Pokud billing_street není prázdný -> přepsat + toast "Adresa aktualizována z ARES"
   c. Pokud company_name je prázdný -> doplnit název firmy
   d. Pokud dic je prázdný -> doplnit DIČ
5. Pokud ARES nevrátí data -> toast "Nepodařilo se načíst data z ARES"
```
