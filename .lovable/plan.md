

# Zahrnout upsell provizi do kalkulace marze viceprace

## Problem

Aktualne se marze pocita jako `castka klient - (hodiny x interni sazba kolegy)`. Pokud ale nekdo vicepraci prodal (upsell), naklady zahrnuji i provizi (typicky 10% z castky klientovi). Ta se dnes v kalkulaci marze nezohlednuje.

## Priklad

- Klient plati: 9 000 Kc (5h x 1 800 Kc)
- Odmena kolegy: 3 500 Kc (5h x 700 Kc)
- Upsell provize: 900 Kc (10% z 9 000 Kc)
- **Aktualni marze**: 5 500 Kc (61%) -- nezapocitava provizi
- **Spravna marze**: 4 600 Kc (51%) -- se zapocitanim provize

## Reseni

Ve vsech mistech kde se pocita marze viceprace, pridat radek s upsell provizi (pokud existuje `upsold_by_id`) a odecist ji od marze.

## Zmeny

### 1. ExtraWorkCard -- billing double-check (radky 170-195)

Aktualni kalkulace:
```
margin = work.amount - colleagueCost
```

Nova kalkulace:
```
upsellCommission = work.upsold_by_id ? work.amount * (work.upsell_commission_percent || 10) / 100 : 0
margin = work.amount - colleagueCost - upsellCommission
```

Pridat novy radek mezi "Odmena kolegy" a "Marze":
```
Upsell provize (10%):  900 Kc  [jmeno kolegy kdo prodal]
```

Radek se zobrazi pouze pokud `work.upsold_by_id` neni null. Jmeno kolegy se dohledat z existujiciho pole `colleagues`.

### 2. AddExtraWorkDialog -- summary sekce

Aktualizovat vypocet "Odmena kolega" summary, aby pod nim zobrazil i upsell provizi pokud je nastavena, a celkovou marzi.

### 3. EditExtraWorkDialog -- summary sekce

Stejna zmena jako v AddExtraWorkDialog -- pridat radek upsell provize do summary.

## Technicke detaily

### Zmeny v souborech

| Soubor | Zmena |
|---|---|
| `src/components/extra-work/ExtraWorkCard.tsx` | Pridat upsell provizi do billing double-check, upravit marzi |
| `src/components/extra-work/AddExtraWorkDialog.tsx` | Pridat upsell provizi do summary sekce |
| `src/components/extra-work/EditExtraWorkDialog.tsx` | Pridat upsell provizi do summary sekce |

### Logika v ExtraWorkCard

```typescript
const internalRate = work.internal_hourly_rate ?? colleague.internal_hourly_cost!;
const colleagueCost = work.hours_worked! * internalRate;
const upsellCommission = work.upsold_by_id
  ? Math.round(work.amount * (work.upsell_commission_percent || 10) / 100)
  : 0;
const totalCost = colleagueCost + upsellCommission;
const margin = work.amount - totalCost;
const marginPercent = work.amount > 0 ? Math.round((margin / work.amount) * 100) : 0;
```

### Zobrazeni v karte

```text
Odmena kolegy:       5h x 700 = 3 500 Kc
Upsell provize (10%):          900 Kc  (Jan Novak)
Marze:                       4 600 Kc (51%)
```

Radek "Upsell provize" se zobrazi pouze pokud `work.upsold_by_id` neni null. Jmeno kolegy ktery prodal se najde v poli `colleagues` podle `work.upsold_by_id`.

### Zadne dalsi zmeny

- Zadne nove soubory
- Zadne zmeny v databazi
- Zadne nove zavislosti
- Barevne kodovani marze zustava stejne (40%+ zelena, 20-40% oranzova, pod 20% cervena)

