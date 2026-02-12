

## Nastaveni defaultni hodinovky 700 Kc pro vsechny kolegy

### Co se zmeni

Aktualizace sloupce `internal_hourly_cost` na hodnotu **700** u vsech kolegu, kteri maji aktualne sazbu 0 nebo NULL.

### Dotceni kolegove

| Kolega | Aktualni sazba | Nova sazba |
|--------|---------------|------------|
| Danny | 0 Kc | **700 Kc** |
| Danny New | 0 Kc | **700 Kc** |
| Danny Test 2 (3x) | 0 Kc | **700 Kc** |

### Technicke detaily

Spusteni SQL prikazu pres Supabase:

```sql
UPDATE colleagues
SET internal_hourly_cost = 700
WHERE internal_hourly_cost = 0 OR internal_hourly_cost IS NULL;
```

Zadna zmena kodu -- pouze datova aktualizace v databazi.

