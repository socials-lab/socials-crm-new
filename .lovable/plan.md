

# Billing Double-Check v detailu viceprace

## Co chybi

Karta viceprace (`ExtraWorkCard`) aktualne zobrazuje pouze klientskou castku (hodiny x sazba). Chybi:
- Kolik si fakturuje kolega (interni sazba x hodiny)
- Marze (rozdil klient vs. kolega)
- Vizualni upozorneni pokud je marze nizka nebo zaporna

Dialog pro upravu (`EditExtraWorkDialog`) uz obe castky ukazuje, ale v prehledu karet tato informace chybi.

## Reseni

Pridat do `ExtraWorkCard` billing summary sekci, ktera zobrazi:

```text
+--------------------------------------------------+
| Fakturace klientovi:  5h x 1 800 = 9 000 Kc     |
| Odmena kolegy:        5h x   700 = 3 500 Kc     |
| Marze:                             5 500 Kc (61%)|
+--------------------------------------------------+
```

- Zelena barva marze pri 40%+
- Zluta/oranzova pri 20-40%
- Cervena pri pod 20% nebo zaporne

## Technicke detaily

### Zmeny v `src/components/extra-work/ExtraWorkCard.tsx`

1. Rozsirime stavajici `bg-muted/50` sekci (radky 156-178) o dalsi radky:
   - **Odmena kolegy**: `colleague.internal_hourly_cost * work.hours_worked`
   - **Marze**: `work.amount - (colleague.internal_hourly_cost * work.hours_worked)` s procentualnim vyjadrenim
2. Barevne kodovani marze pomoci podminenych trid
3. Data jsou jiz dostupna -- `colleague` objekt s `internal_hourly_cost` a `work.hours_worked` / `work.amount` jsou uz v komponente

### Zadne dalsi zmeny

- Zadne nove soubory
- Zadne zmeny v databazi
- Zadne nove zavislosti
- Pouze uprava jednoho souboru `ExtraWorkCard.tsx`

