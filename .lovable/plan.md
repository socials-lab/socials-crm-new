

## Portfolio management — centrální správa bannerů a videí

### Problém
Portfolio ukázky (bannery, videa) jsou nyní hardcoded v `PublicOfferPage.tsx`. Při každé nabídce se duplikují a nelze je snadno spravovat.

### Řešení

#### 1. Supabase Storage bucket `portfolio`
- Veřejný bucket pro nahrávání obrázků a MP4 videí
- Soubory budou dostupné přes public URL bez autentizace

#### 2. Nová tabulka `portfolio_items`
```text
id              UUID PK
title           TEXT          — popisek (alt text)
file_url        TEXT          — URL ze Storage
type            TEXT          — 'image' | 'video'
sort_order      INTEGER       — pořadí zobrazení
is_active       BOOLEAN       — možnost skrýt bez mazání
created_at      TIMESTAMPTZ
```
- RLS: CRM users full access, anon SELECT pro aktivní položky (veřejná nabídka)

#### 3. Nová stránka `Portfolio` v CRM
- Route: `/portfolio`
- Přidání do sidebar navigace
- Funkce:
  - Grid náhledů aktuálních položek (obrázky + videa)
  - Upload nových souborů (drag & drop nebo file picker)
  - Editace popisku, změna pořadí, aktivace/deaktivace
  - Mazání položek (smaže i ze Storage)
  - Filtr: všechny / obrázky / videa

#### 4. Úprava `PublicOfferPage.tsx`
- Odstranit hardcoded `PORTFOLIO_IMAGES`
- Fetch `portfolio_items` z databáze (WHERE `is_active = true`, ORDER BY `sort_order`)
- V `CreativePortfolioSection`:
  - Obrázky: zobrazit jako dosud (grid + lightbox)
  - Videa: zobrazit jako `<video>` s poster frame, autoplay on hover, lightbox s přehráváním
  - Rozlišit vizuálně karty obrázků a videí (play ikona overlay na videu)

#### 5. Migrace existujících bannerů
- Existující obrázky z `public/images/portfolio/` nahrát do Storage bucketu
- Vložit záznamy do `portfolio_items` tabulky
- Po migraci odstranit statické soubory

### Soubory k vytvoření/úpravě
- **Migrace SQL** — bucket `portfolio` + tabulka `portfolio_items` + RLS
- `src/pages/Portfolio.tsx` — nová stránka pro správu
- `src/hooks/usePortfolioData.tsx` — hook pro CRUD
- `src/components/layout/AppSidebar.tsx` — nový odkaz
- `src/App.tsx` — nová route
- `src/pages/PublicOfferPage.tsx` — dynamické načítání místo hardcoded dat

### Postup nahrání videí
Po implementaci nahraješ MP4 soubory přímo přes novou Portfolio stránku v CRM (drag & drop).

