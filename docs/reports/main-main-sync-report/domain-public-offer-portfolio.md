# PUBLIC OFFER / SALES DECK / PORTFOLIO — product-level change analysis

Compared range: `f1421c4..f06ce73`

## Scope reviewed
- `src/pages/PublicOfferPage.tsx`
- `src/pages/SalesDeck.tsx` (new)
- `src/pages/Portfolio.tsx` (new)
- `src/components/sales-deck/slides/*` (new slide set)
- `src/hooks/useOfferContent.tsx` (new)
- `src/hooks/usePortfolioData.tsx` (new)
- `src/hooks/useScrollReveal.tsx` (new)
- `src/data/publicOffersData.ts` (now maps/persists `content_blocks_snapshot`)
- `src/data/publicOffersMockData.ts` (expanded fixtures)
- `src/types/publicOffer.ts` (expanded offer schema)
- related assets under `public/images/portfolio/*`, `src/assets/clients/*`, `src/assets/certs/*`

## Executive UX delta (before vs after)

### 1) New sections/components (user-visible)
**Before**
- Public offer page was a mostly linear proposal page: hero, audit summary, services list, pricing summary, compact process strip, optional Loom section, contact, CTA, simple credibility/footer links.
- Portfolio presentation on offer page was link-card based (external URLs), not rich in-page media browsing.
- No dedicated full-screen sales deck experience.
- No dedicated admin portfolio management page.

**After**
- Public offer becomes a modular storytelling page with distinct sections and section dividers:
  - hero + credibility badges
  - separate audit/video block
  - dedicated “Proč my” block
  - in-page creative portfolio block (banners + videos)
  - dedicated reporting block with embedded demo and CTA
  - enhanced services + pricing block
  - expanded benefits block
  - onboarding process block
  - CTA/contact block
  - separate client logos + certifications sections (image grids)
- New full-page `SalesDeck` route (`/sales-deck`) with 11 slides and presentation navigation.
- New `OfferManagement` page combining Portfolio + Offer content editor tabs.

### 2) New toggles/modes and interaction patterns
**Before**
- No page-level visual mode control.
- Limited progressive reveal/animation behavior.
- Offer content primarily rendered from offer fields, with less block-level configurability.

**After**
- Public offer adds **dark/light theme toggle** in sticky header.
- Sections progressively animate into view via `ScrollReveal`/IntersectionObserver.
- Portfolio media now supports in-page lightbox modal, keyboard nav (`←/→/Esc`), and hover interactions.
- Sales deck introduces presentation mode patterns:
  - slide index navigation
  - click zones left/right
  - keyboard nav (`ArrowLeft/ArrowRight/Space`)
  - fullscreen toggle
  - responsive viewport scaling to 1920x1080 canvas.

### 3) Media and performance behavior changes
**Before**
- Portfolio was primarily links (less in-page heavy media rendering).
- Less explicit loading placeholders and reveal control around content-heavy blocks.

**After**
- Large first-party media library added (many JPG/PNG/MP4 creative assets) and surfaced directly in UX.
- Portfolio rendering split into image/video grids with:
  - lazy loading for images
  - `preload="metadata"` for videos
  - mobile-safe inline playback handling
  - modal playback for selected assets.
- Loading states improved:
  - skeletons for offer loading and portfolio admin grid
  - explicit empty/loading handling in deck creative examples and portfolio sections.
- Brand proof media upgraded from plain text badges to visual logo/certification grids with asset fallback.

### 4) Admin/content-editing capabilities (content management)
**Before**
- No centralized editor for fixed offer-section copy and structured section content.
- No built-in admin UI for uploading and governing portfolio assets shown in offers.
- Offer type had no `content_blocks_snapshot` shape for frozen per-offer section content.

**After**
- New `useOfferContent` model introduces managed section blocks (`offer_content_blocks`) for:
  - section titles/subtitles
  - rich structured arrays (arguments, links, benefits, onboarding steps, badges, CTA fields, report URL/note).
- New `OfferContentEditor` provides tabbed editors for each section plus image-grid upload for client logos/certifications via `offer-assets` bucket.
- New `Portfolio` admin supports:
  - upload (single/multi)
  - title and order editing
  - active/inactive switch
  - delete from storage + DB
  - filtering by type (all/image/video)
  - drag-and-drop intake UX.
- `PublicOffer` schema and persistence now include `content_blocks_snapshot` to lock rendered content at offer creation time.

### 5) Mobile behavior changes
**Before**
- Sticky bottom CTA included visible live price summary and secondary text.
- Portfolio experience in public offer was not a full media-first mobile gallery.

**After**
- Sticky mobile CTA simplified to single prominent “Začít spolupráci” action (price removed from sticky bar).
- Video thumbnails in portfolio adapt for mobile (`playsInline`, muted, metadata preload, mobile-specific overlay handling).
- Responsive section layout and typography upgrades across hero/cards/pricing; CTA and section spacing are optimized for narrow screens.

## SALES DECK specifics (new capability)
- Entirely new presentation product surface:
  - 11 branded slides (`Title`, `Credibility`, `WhyUs`, `Benefits`, `Certifications`, `Clients`, `Reporting`, `Creative`, `CreativeExamples`, `Onboarding`, `CTA`).
  - Mix of static branded slides and data-driven slides pulling from offer content defaults / public portfolio.
  - Supports meeting-room usage through fullscreen, keyboard control, and discrete nav indicators.

## Notable data-model implications on UX
- `PublicOfferService` now supports market expansion metadata (`managed_countries`, `country_variants`) enabling richer service cards/pricing narratives.
- `PublicOffer` now includes edit history typing and content snapshot typing, strengthening auditability and deterministic offer rendering.

## Net product impact
- This range turns public offer delivery from a single-page quote into a **content-managed, media-rich, presentation-grade client journey**, with explicit operational tooling for marketing/admin teams to maintain portfolio and messaging without code changes.
