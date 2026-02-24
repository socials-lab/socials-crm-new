

## Uprava stavu "K fakturaci" na kartach viceprace

### Co se zmeni

1. **Zobrazeni fakturaciho obdobi na karte ve stavu "ready_to_invoice"**
   - Na karte ve stavu "K fakturaci" se pod badge zobrazi informace o fakturacnim obdobi (napr. "Obdobi: unor 2026")
   - Billing period je ulozen ve formatu `YYYY-MM`, preformatuje se na lidsky citelny cesky nazev mesice

2. **Tlacitko "Vystavit fakturu" na karte ve stavu "ready_to_invoice"**
   - Prida se tlacitko "Vystavit fakturu" do footer sekce karty pro stav `ready_to_invoice`
   - Kliknuti otevre `CreateInvoiceFromEngagementDialog` (existujici komponenta) predvyplneny daty z dane viceprace
   - Pokud toto neni vhodne (viceprace nemaji vazbu na engagement services stejnym zpusobem), vytvorime jednodussi dialog specificky pro viceprace

3. **BillingPeriodDialog integrace do ExtraWorkCard**
   - Tlacitko "K fakturaci" na karte (stav `in_progress` / `client_approved`) uz pouziva `BillingPeriodDialog` stejne jako v tabulkovem pohledu
   - Uzivatel vybere fakturacni obdobi pred presmerem do stavu "K fakturaci"

### Technicke detaily

**Soubor: `src/components/extra-work/ExtraWorkCard.tsx`**

- Import `BillingPeriodDialog` a `format` z date-fns
- Pridat state `billingPeriodDialogOpen` 
- Upravit `handleMoveToInvoice` aby otevrel `BillingPeriodDialog` misto primeho update
- V `onConfirm` BillingPeriodDialogu zavolat `onUpdate(work.id, { status: 'ready_to_invoice', billing_period: selectedPeriod })`
- U stavu `ready_to_invoice` zobrazit naformatovane fakturacni obdobi (prevod `YYYY-MM` na cesky nazev mesice)
- Pridat tlacitko "Vystavit fakturu" (ikona Receipt) pro stav `ready_to_invoice`, ktere zavola novy callback `onCreateInvoice`

**Soubor: `src/pages/ExtraWork.tsx`**

- Pridat handler pro vytvoreni faktury z viceprace a propojit s kartou

