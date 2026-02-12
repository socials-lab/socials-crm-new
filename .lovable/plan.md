

## Jak funguje Creative Boost

Creative Boost je kreditovy system pro kreativni vystupy (bannery, videa, AI fotky). Logika:

1. **Typy vystupu** (`outputTypes`) -- cenik s kreditovymi hodnotami (napr. Meta Ads banner = 4 kredity, Standard video = 12 kreditu)
2. **Mesicni zaznamy klientu** (`clientMonths`) -- kazdy klient ma pro kazdy mesic nastaveni: min/max kreditu, cena za kredit, prirazeny grafik, odkaz na zakazku
3. **Vystupy** (`outputs`) -- tabulka co se udelalo: typ vystupu, pocet klasickych a express kusu, kdo to delal
4. **Express prirazka** -- express vystupy stoji 1.5x zakladnich kreditu
5. **Fakturace** -- fakturuje se balik (maxCredits * pricePerCredit), ne skutecna spotreba
6. **Auto-sync** -- `ensureClientMonthsForActiveEngagements` automaticky vytvari mesicni zaznamy pro aktivni zakazky s CB sluzbou

### Problem

Stavajici demo data pouzivaji `cli-1`, `cli-2`, `cli-8` (fiktivni ID), ktere neexistuji v CRM datech. Jediny funkcni zaznam je pro Test Client (`c0000000-...`) na leden 2026. Aktualni mesic (unor 2026) nema zadna data, proto je stranka prazdna.

### Reseni -- demo data pro unor 2026

Pridame do `creativeBoostMockData.ts` zaznamy pro aktualni mesic (unor 2026) pro Test Client:

1. **Novy `CreativeBoostClientMonth`** pro `c0000000-...-000000000001`, rok 2026, mesic 2, s nastavenim 30-50 kreditu, 400 Kc/kredit, prirazeny grafik, odkaz na zakazku `e0000000-...`
2. **Nove `ClientMonthOutput` zaznamy** -- 3-4 ruzne vystupy (bannery, video, AI fotka) s ruznymi pocty, vcetne express polozek
3. **Kolega ID** pouzijeme `abeb4751-9691-42bc-8b21-fdf6c90d6524` (existujici v DB)

### Technicke detaily

Soubor: `src/data/creativeBoostMockData.ts`

Pridame:
- 1x `CreativeBoostClientMonth` zaznam (id: `cbm-test-client-2026-02`, mesic 2, rok 2026)
- 4x `ClientMonthOutput` zaznamy:
  - `banner_meta_2sizes`: 2 klasicke + 1 express
  - `video_standard`: 1 klasicky
  - `ai_product_photo`: 2 klasicke
  - `banner_revision`: 1 klasicky

To dava cca 2*4 + 1*4*1.5 + 1*12 + 2*2 + 1*1 = 8 + 6 + 12 + 4 + 1 = 31 kreditu z 50 (62% vyuziti) -- realisticka hodnota pro testovani.

