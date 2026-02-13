
## Fakturační údaje - progressive disclosure po zadání IČO

### Co se změní

V kroku 3 (Fakturační údaje) se nejprve zobrazí **pouze pole IČO s tlačítkem ARES**. Ostatní pole (název firmy, DIČ) se zobrazí až po úspěšném ověření IČO v ARES. Navíc se do tohoto kroku přesunou i fakturační adresa pole (ulice, město, PSČ), protože ta se rovněž vyplňují z ARES a logicky patří k fakturačním údajům.

**Postup:**
1. Po zadání IČO a kliknutí na ARES se údaje automaticky načtou
2. Teprve po úspěšném načtení se odkryjí pole: název firmy, DIČ, ulice, město, PSČ
3. Uživatel může údaje z ARES případně ručně upravit
4. Krok 4 (Adresa a platba) se zredukuje jen na hodinovou sazbu a bankovní účet a přejmenuje se na "Sazba a platba"

### Technické detaily

**Soubor:** `src/pages/ApplicantOnboardingForm.tsx`

**Změny:**
- **stepLabels**: krok 4 přejmenovat z "Adresa a platba" na "Sazba a platba"
- **stepFieldMap**: přesunout `billing_street`, `billing_city`, `billing_zip` z kroku 4 do kroku 3
- **Krok 3 (case 3)**: pole `company_name`, `dic`, `billing_street`, `billing_city`, `billing_zip` obalit podmínkou `{aresValidated && (...)}` -- zobrazí se až po ověření ARES
- **Krok 4 (case 4)**: odebrat fakturační adresu, ponechat jen sekci "Sazba a platební údaje" (hodinová sazba + bankovní účet), upravit nadpis a ikonu
- **stepFieldMap krok 3**: validace `company_name`, `billing_street` atd. zůstane -- uživatel neprojde dál bez vyplnění (a ty se vyplní z ARES)
