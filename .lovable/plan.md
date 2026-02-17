

# SOP Databaze -- Znalostni baze Socials

## Co to bude

Nová sekce "SOP" v CRM, kde kolegové najdou veškeré postupy a návody. Každý SOP článek bude obsahovat bohatý formátovaný text (nadpisy, odrážky, tabulky, zvýrazněný kód) a embedovaná Loom videa. Fulltextové vyhledávání umožní rychle najít odpověď na jakoukoliv otázku.

## Uživatelský pohled

1. **Hlavní stránka SOP** -- seznam kategorií (např. "Onboarding klienta", "Fakturace", "Performance marketing") s kartami SOP článků
2. **Fulltextové vyhledávání** -- search bar nahoře, který prohledává titulky i obsah článků a okamžitě filtruje výsledky; zvýrazněné nalezené fráze
3. **Detail SOP článku** -- celá stránka s formátovaným textem a embedovanými Loom videi přímo v obsahu
4. **Editace** (admini / uživatelé s oprávněním) -- rich text editor (Tiptap) s toolbarem pro formátování a tlačítkem pro vložení Loom URL, které se automaticky embedne jako iframe
5. **Navigace** -- nová položka "📖 SOP" v sidebaru v sekci "Tým & interní"

## Architektura

### Databáze (Supabase)

Dvě nové tabulky:

**sop_categories**
- `id` (UUID, PK)
- `title` (TEXT) -- např. "Onboarding klienta"
- `description` (TEXT)
- `icon` (TEXT) -- název Lucide ikony
- `sort_order` (INTEGER)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at`

**sop_articles**
- `id` (UUID, PK)
- `category_id` (UUID, FK -> sop_categories)
- `title` (TEXT) -- pro vyhledávání
- `content` (TEXT) -- HTML z Tiptap editoru (obsahuje i Loom embedy)
- `search_text` (TEXT) -- plaintext verze pro fulltext search (stripnutý HTML)
- `tags` (TEXT[]) -- štítky pro filtrování
- `sort_order` (INTEGER)
- `is_published` (BOOLEAN)
- `created_by`, `updated_by` (UUID)
- `created_at`, `updated_at`

RLS: všichni CRM uživatelé mohou číst, admini (nebo uživatelé s novým oprávněním `can_edit_sop`) mohou vytvářet/editovat/mazat.

Fulltextový index na `search_text` a `title` pomocí PostgreSQL `tsvector` pro rychlé vyhledávání.

### Rich Text Editor

Knihovna **Tiptap** (open-source, postavená na ProseMirror):
- Rozšíření: StarterKit (nadpisy, bold, italic, odrážky, čísla), Link, Image, Placeholder
- Vlastní rozšíření **LoomEmbed** -- uživatel vloží Loom URL, editor ji převede na responzivní iframe
- Toolbar s tlačítky: H1, H2, Bold, Italic, Bullet list, Numbered list, Link, Loom video

### Nové soubory

```text
src/pages/SOP.tsx                          -- hlavní stránka s vyhledáváním a kategoriemi
src/pages/SOPArticle.tsx                   -- detail článku
src/components/sop/SOPSearch.tsx           -- search bar s live výsledky
src/components/sop/SOPCategoryCard.tsx     -- karta kategorie
src/components/sop/SOPArticleCard.tsx      -- karta článku v seznamu
src/components/sop/SOPEditor.tsx           -- Tiptap editor wrapper
src/components/sop/SOPArticleView.tsx      -- read-only zobrazení článku
src/components/sop/AddSOPArticleDialog.tsx -- dialog pro vytvoření/editaci
src/components/sop/LoomEmbed.tsx           -- Tiptap node extension pro Loom
src/hooks/useSOPData.tsx                   -- hook pro CRUD + vyhledávání
```

### Úpravy existujících souborů

- `src/App.tsx` -- přidání route `/sop` a `/sop/:articleId`
- `src/components/layout/AppSidebar.tsx` -- přidání "📖 SOP" do sekce "Tým & interní"
- `src/constants/permissions.ts` -- přidání `sop` do ALL_PAGES a PAGE_GROUPS

### Nové NPM balíčky

- `@tiptap/react` -- React integrace
- `@tiptap/starter-kit` -- základní rozšíření (headings, bold, italic, lists)
- `@tiptap/extension-link` -- klikatelné odkazy
- `@tiptap/extension-placeholder` -- placeholder text
- `@tiptap/pm` -- ProseMirror dependencies

## Technické detaily

### Fulltextové vyhledávání

```sql
-- Databázová funkce pro fulltext search
CREATE FUNCTION search_sop_articles(search_query TEXT)
RETURNS SETOF sop_articles AS $$
  SELECT * FROM sop_articles
  WHERE is_published = true
    AND (
      to_tsvector('czech', title || ' ' || search_text)
      @@ plainto_tsquery('czech', search_query)
      OR title ILIKE '%' || search_query || '%'
      OR search_text ILIKE '%' || search_query || '%'
    )
  ORDER BY
    ts_rank(to_tsvector('czech', title || ' ' || search_text),
            plainto_tsquery('czech', search_query)) DESC;
$$ LANGUAGE sql STABLE;
```

### Loom Embed

Tiptap custom node, který přijme URL ve formátu `https://www.loom.com/share/XXXXX` a vykreslí:

```html
<div class="aspect-video rounded-lg overflow-hidden my-4">
  <iframe src="https://www.loom.com/embed/XXXXX"
          frameborder="0" allowfullscreen
          class="w-full h-full">
  </iframe>
</div>
```

### Uložení obsahu

Při uložení článku se z HTML obsahu stripnou tagy a výsledný plaintext se uloží do `search_text` pro fulltext. Tím se zajistí, že vyhledávání funguje i pro text uvnitř formátování.

