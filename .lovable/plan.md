

## Pridani Creative Boost sluzby do zakazky Test Client

### Problem

Creative Boost sluzba se v zakazce Test Client nezobrazuje, protoze:

1. **Nesouhlasi ID sluzby**: Kod pouziva `CREATIVE_BOOST_SERVICE_ID = 'srv-3'`, ale mock sluzba v `useCRMData.tsx` ma `id: 'service-creative-boost-mock'`. Tyto hodnoty se nikde neprotnout.
2. **V DB neexistuje zaznam engagement_service** pro Creative Boost na zakazce Test Client -- existuje tam jen Socials Boost.

### Reseni

**1. Sjednotit ID Creative Boost sluzby** (`src/hooks/useCRMData.tsx`)
- Zmenit `id` mock sluzby z `'service-creative-boost-mock'` na `'srv-3'`, aby odpovidal konstante `CREATIVE_BOOST_SERVICE_ID` pouzivane v `Engagements.tsx` i `useCreativeBoostData.tsx`.

**2. Pridat demo engagement_service pro Creative Boost** (`src/hooks/useCRMData.tsx`)
- Do query pro `engagement_services` pridat mock zaznam Creative Boost pro Test Client engagement (`e0000000-0000-0000-0000-000000000001`):
  - `id: 'f0000000-0000-0000-0000-000000000002'` (odpovida existujicim mock datum v `creativeBoostRewardsMockData.ts`)
  - `service_id: 'srv-3'`
  - `name: 'Creative Boost'`
  - `price: 75000` (50 kreditu x 1500 Kc)
  - `billing_type: 'monthly'`
  - `creative_boost_max_credits: 50`
  - `creative_boost_price_per_credit: 1500`
  - `is_active: true`

Tenhle mock zaznam se prida do pole `engagementServices`, pokud jeste v DB neexistuje -- stejny vzor jako u mock sluzby.

**3. Zajistit Creative Boost client month pro demo** (`src/data/creativeBoostMockData.ts`)
- Overit, ze existuji mock data `clientMonths` pro Test Client (`client-1`) s `engagementServiceId: 'f0000000-0000-0000-0000-000000000002'`. Pokud ne, pridat je.

### Vysledek

Po implementaci se v zakazce Test Client objevi:
- Karta Socials Boost (stavajici, z DB)
- Karta Creative Boost s nastavenim kreditu, cenou za kredit a odmenami pro grafika (banner 80 Kc / video 100 Kc)

