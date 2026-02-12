

## Vzory viceprace, tahak hodinovek, odstraneni nepotrebnych poli

### Co se zmeni

1. **Vzory (prednastavene sablony) viceprace** -- nad formularem budou klikatelne chipy s nejcastejsimi vicepracemi. Po kliknuti se predvyplni nazev a hodinova sazba:
   - "Nastaveni analytiky" (1 900 Kc/h)
   - "Tvorba videi" (1 600 Kc/h)

2. **Tahak hodinovek** -- pod polem "Sazba" se zobrazi rozbalovaci sekce (Collapsible) s tabulkou hodinovek pro kolegy:

| Pozice | Hodinovka |
|--------|-----------|
| Meta Ads | 1 700 Kc |
| PPC | 1 700 Kc |
| Analytika | 1 900 Kc |
| Grafika / video | 1 500 Kc |
| SEO | 1 500 Kc |
| Tvorba landing pages pomoci AI | 2 500 Kc |
| AI SEO | 1 800 Kc |

3. **Odstraneni poli**:
   - "Datum prace" -- odstranime uplne
   - "Fakturacni obdobi" -- odstranime uplne
   - Z `handleSubmit` se tyto hodnoty nebudou odesilat (nebo se nastavi na defaulty)

### Technicke detaily

**Upravovany soubor:** `src/components/extra-work/AddExtraWorkDialog.tsx`

- Pridame konstantu `EXTRA_WORK_TEMPLATES` s prednastavenymi sablonam (nazev + sazba)
- Pridame konstantu `HOURLY_RATE_CHEATSHEET` s tabulkou hodinovek
- Nad pole "Nazev" pridame radek s klikatelnymi chipy (Button variant outline), po kliknuti se vyplni `name` a `hourlyRate`
- Pod pole "Sazba" pridame Collapsible komponentu s tahkem hodinovek
- Odstranime cely blok s "Datum prace" (Calendar/Popover)
- Odstranime cely blok s "Fakturacni obdobi" (Select)
- Odstranime stav `workDate` a `billingPeriod`
- V `handleSubmit` nastavime `work_date` na dnesni datum (automaticky) a `billing_period` na aktualni mesic

