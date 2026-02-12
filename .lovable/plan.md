

## Aktualizace typů výstupů podle ceníku

Nahradíme stávající typy výstupů v `src/data/creativeBoostMockData.ts` přesnými položkami z ceníku.

### Bannery (8 položek)

| Název | Kredity | Kategorie |
|-------|---------|-----------|
| Brand kit (jen na začátku spolupráce) | 4 | banner |
| Rámeček pro katalogové kampaně | 1 | banner |
| Meta Ads bannery ve 2 rozměrech | 4 | banner |
| Překlad Meta Ads bannerů | 1 | banner_translation |
| Set PPC bannerů (1 rozměr) | 1 | banner |
| Překlad PPC banneru (1 rozměr) | 0.5 | banner_translation |
| Úprava již vytvořených Meta Ads | 1 | banner_revision |
| Příprava bannerů na Homepage | 2 | banner |

### Videa (6 položek)

| Název | Kredity | Kategorie |
|-------|---------|-----------|
| S video (základní editace, do 30s) | 6 | video |
| M video (větší editace, do 30s) | 10 | video |
| L video (komplexní editace, do 45s) | 12 | video |
| Alternativní hook na začátku videa | 2 | video |
| Menší úprava videa (úprava textů) | 2 | video |
| Překlad videa | 2 | video_translation |

### Technické detaily

**Soubor: `src/data/creativeBoostMockData.ts`**
- Kompletně nahradíme pole `outputTypes` za 14 nových položek odpovídajících ceníku
- Odstraníme položky, které v ceníku nejsou (AI produktová fotka, video Standard/AI b-roll balíčky, revize videí/bannerů jako samostatné kategorie)
- Zachováme stávající strukturu (`id`, `name`, `category`, `baseCredits`, `description`, `isActive`, `createdAt`, `updatedAt`)
- Případné reference na smazaná ID v mock datech klientských měsíců (`creativeBoostMockData.ts`) aktualizujeme na nová ID

