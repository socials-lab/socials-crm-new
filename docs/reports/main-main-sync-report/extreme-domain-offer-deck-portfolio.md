# EXTREME-DETAIL Product Change Report (`f1421c4 -> f06ce73`)

## Scope

This report focuses only on:
- Public Offer experience (`PublicOfferPage`)
- Sales Deck experience (`SalesDeck` + slide components)
- Portfolio + Offer Content admin workflows and runtime data sourcing

Primary source files in this range:
- `src/pages/PublicOfferPage.tsx`
- `src/pages/SalesDeck.tsx`
- `src/components/sales-deck/slides/*`
- `src/pages/Portfolio.tsx`
- `src/pages/OfferContentEditor.tsx`
- `src/pages/OfferManagement.tsx`
- `src/hooks/useOfferContent.tsx`
- `src/hooks/usePortfolioData.tsx`
- `src/data/publicOffersData.ts`
- `src/data/publicOffersMockData.ts`
- `src/types/publicOffer.ts`
- `src/App.tsx`
- `src/index.css`
- `docs/supabase-migration-offer-content.sql`
- `docs/supabase-migration-portfolio.sql`
- `docs/supabase-migration-offer-assets-bucket.sql`
- `docs/supabase-migration-public-offers-table.sql`

---

## 1) PublicOfferPage: full user-visible section/component mapping

## Before (`f1421c4`) vs After (`f06ce73`) at page architecture level

- Before: compact, quote-like flow with lighter storytelling and smaller number of major blocks.
- After: long-form sales narrative with modular section system, animation wrappers, richer media, and CMS/snapshot-driven content.

New top-level sequencing in `f06ce73`:
1. Sticky header with theme toggle/share/desktop CTA
2. Hero
3. Credibility badges
4. Loom/video intro block (conditional)
5. Audit findings (HTML or parsed bullets)
6. Why Us
7. Creative Portfolio (image/video gallery + lightbox)
8. Reporting
9. Services + pricing cards
10. Pricing summary with stacked discounts
11. Benefits
12. Onboarding process timeline
13. Contact + strong CTA block
14. Client logos block
15. Certifications block
16. Footer links
17. Mobile sticky CTA

### 1.1 Header + top controls

### Before
- Sticky header existed, but simpler.
- No explicit public dark/light switching.
- CTA copy was onboarding-form oriented.

### After
- Header uses `offer-dark`/`offer-light` variable scopes from `src/index.css`.
- New theme toggle (`Sun`/`Moon`) toggles local `isDark` state.
- Share button behavior:
  - `navigator.clipboard.writeText(window.location.href)`
  - "Sdilet" -> "Zkopirovano" transient 2s state.
- Desktop CTA renamed and reframed to "Zacit spolupraci".
- Header logo now switches by theme (`socialsLogo` vs `socialsLogoDark`).

User-visible impact:
- Offer now feels like a dedicated microsite, not an embedded CRM export page.

### 1.2 Hero block

### Before
- More transactional tone ("Navrh spoluprace pro ...", validity metadata).
- Simpler title hierarchy.

### After
- Positioning shifted to strategic messaging ("Strategicka nabidka pro ...").
- Contact personalization string changed ("Pripraveno pro ...", with explicit special-case grammar for "Jan Novak" -> "Jana Novaka").
- Typographic scale increased (desktop headline to `md:text-5xl`).

### 1.3 Credibility badges strip

### Before
- Credibility mostly represented in footer and limited static text.

### After
- Dedicated early-page badge strip from content blocks:
  - Reads `getOfferContent(offer, 'credibility_badges').content.items`
  - Dot separators between badges
  - Hidden entirely if no items

### 1.4 Validity warning

### Before
- Existence check present in old flow.

### After
- Styling changed to stricter red-warning treatment (`red-500` palette in dark context).

### 1.5 Loom + audit introduction

### Before
- Loom could appear in separate lower section.
- Audit text was largely plain text summary.

### After
- Intro section conditionally appears when any of `audit_summary | loom_url | custom_note` exists.
- Loom video appears before audit findings in a framed card (`AspectRatio 16:9`).
- Immediate visual section divider inserted after intro.

### 1.6 Audit findings block

### Before
- "Co jsme zjistili" delivered mostly as one compact text region.

### After
- Two render modes:
  - HTML mode (`offer.audit_html`) via `dangerouslySetInnerHTML`, with explicit prose styling including image rendering
  - Fallback bullet parsing from `audit_summary` line splits
- Adds explicit sub-panels:
  - Recommendation panel (`offer.recommendation_intro`)
  - Custom note panel (`offer.custom_note`)
- Stronger card-style readability and visual scanning.

Risk note:
- HTML mode trusts stored HTML and can introduce style/markup inconsistency if content quality varies.

### 1.7 Why Us section

### Before
- Why-us argumentation was lighter and less compositional.

### After
- Fully data-driven via `content_blocks_snapshot` or defaults.
- Grid of stat cards + separate external-link cards.
- Hover behaviors reinforce clickability for evidence links.

### 1.8 Creative Portfolio section

### Before
- Portfolio proof was primarily link-card oriented (`PortfolioLink` style cards).
- No immersive in-page media browsing.

### After
- Replaced link cards with visual gallery architecture:
  - Banner grid
  - Video grid
  - Lightbox modal via `createPortal`
- Data source: `usePublicPortfolio()` (Supabase `portfolio_items`), with large fallback local asset set if empty.
- Adds keyboard navigation in lightbox (`ArrowLeft`, `ArrowRight`, `Escape`).

Huge UX shift:
- From "proof by outbound links" to "proof by embedded media browsing".

### 1.9 Reporting section

### Before
- Reporting value existed, but not as emphasized standalone showcase.

### After
- Dedicated section with:
  - Configurable heading/subtitle from content blocks
  - Embedded iframe demo report
  - Explicit "Open demo report" CTA
  - Optional note text from content block

### 1.10 Services + package structure

### Before
- Service grouping existed but with smaller visual hierarchy.
- No explicit one-off section grouping.
- No country-variant visual treatment.

### After
- Service cards redesigned:
  - stronger border/glow states
  - mobile/desktop differentiated pricing layout
  - country flags and country-variant pricing rows
  - nested "detailed sections" reveal with refined styling
- Grouping expanded:
  - core services
  - add-ons
  - one-off services
  - legacy untyped fallback
- "How we structure services" explainer redesigned and reframed.

### 1.11 Pricing summary logic

### Before
- Monthly discount support existed but simpler (single discount model).

### After
- Multi-layer discount narrative:
  - bundle discount (`monthly_discount_percent`)
  - intro discount (`intro_discount_percent`, `intro_discount_months`)
  - explicit waterfall explanation
- Visual hierarchy significantly stronger (large numerics, discount badges, combined-summary note).

### 1.12 Benefits section

### Before
- Benefits were less prominent.

### After
- Dedicated standalone benefits section:
  - title/subtitle from content blocks
  - icon+text card grid
  - reveal animations

### 1.13 Onboarding section

### Before
- Compact "how it works" mini timeline with 3 simple steps.

### After
- Expanded onboarding timeline:
  - 5 detailed steps
  - icon mapping by semantic step token
  - per-step timeline chips
  - section-driven editable content
  - hover and reveal micro-interactions

### 1.14 Contact + CTA section

### Before
- CTA simpler and less branded in tone.

### After
- CTA pulled from content blocks:
  - dynamic title/subtitle/extended_subtitle/button_text/footer_note
- Contact card redesigned in premium style.
- CTA button larger and high-contrast with neon shadow emphasis.

### 1.15 Clients and certifications proof blocks

### Before
- Proof mostly textual in footer (partners/badges text).

### After
- Two dedicated media sections:
  - client logos grid (`clients_logos`)
  - certifications grid (`certifications`)
- Sources:
  - content block `images` if provided
  - imported default assets fallback

### 1.16 Footer + mobile sticky CTA

### Before
- Mobile sticky CTA included price snippet + form-oriented action.

### After
- Mobile sticky CTA simplified to single action focus (no live price display).
- Footer link copy normalized and styled for theme mode.

Potential regression:
- Removing mobile price preview may reduce immediate pricing context for late-stage mobile users.

---

## 2) Interaction deep dive (required behaviors)

### 2.1 Theme toggle mechanics

- Local state only (`isDark`), no persistence to storage or URL.
- Applies `offer-dark` vs `offer-light` class at page root.
- Header, footer logo, and sticky mobile CTA backgrounds react instantly.

Behavioral implications:
- Reload resets to dark mode default.
- Theme choice is per-session and per-page render only.

### 2.2 Scroll reveal mechanics

- New local components `ScrollReveal` and `StaggerReveal` in page.
- Uses `IntersectionObserver` with one-time unobserve behavior.
- Animates opacity + translateY with optional delay.

Perf-sensitive note:
- Many observers/animated nodes increase work on long pages, especially on low-end mobile.
- Good mitigation exists: observers unobserve once intersected.

### 2.3 Lightbox mechanics

- Triggered from `PortfolioGrid` item click.
- Rendered in portal to `document.body`.
- Supports:
  - click outside to close
  - prev/next controls
  - keyboard arrows and escape
  - image and video branches

Potential edge cases:
- No scroll lock on `<body>` while modal open (possible background scroll on some devices).
- Repeated open/close under heavy media may expose decode delays.

### 2.4 Media loading behavior

Images:
- Many grid images use `loading="lazy"`.

Video thumbnails:
- `preload="metadata"` to avoid full payload upfront.
- Desktop hover plays/rewinds preview.
- Mobile suppresses hover playback logic and shows static video frame.

Lightbox video:
- `controls` + `autoPlay`.

Risk:
- Fallback portfolio set includes many local videos; if DB is empty, first meaningful gallery interaction can still be heavy.

### 2.5 Mobile behavior

- Service cards have dedicated mobile row for price/details hint.
- Sticky bottom CTA for mobile remains always present.
- Gallery uses `2-column` on mobile and single interaction target per tile.
- In `VideoThumbnail`, mobile branch avoids hover play complexity.

Risk:
- Long page + sticky CTA can hide or crowd final content on small viewport heights if safe-area handling is inconsistent on some Android devices.

### 2.6 CTA behavior

Primary CTA entrypoints:
- Header desktop CTA
- Main CTA section button
- Mobile sticky CTA

All route to:
- `/onboarding/${offer.lead_id}`

Potential regression:
- If `lead_id` is malformed/null in some imported offers, all primary conversion actions degrade simultaneously.

---

## 3) SalesDeck behavior and navigation mechanics

## Surface and route

- New public route: `/sales-deck` in `src/App.tsx`.
- New full-screen page `src/pages/SalesDeck.tsx`.

## Rendering model

- Fixed canonical slide size: `1920x1080`.
- Runtime `scale = min(window.innerWidth/1920, window.innerHeight/1080)`.
- Slide centered with absolute positioning and CSS transform scale.

UX impact:
- Preserves composition fidelity across displays.
- On narrow screens, readability depends on scaled text; no adaptive reflow per slide.

## Slide composition stack (11 slides)

1. `TitleSlide`
2. `CredibilitySlide`
3. `WhyUsSlide`
4. `BenefitsSlide`
5. `CertificationsSlide`
6. `ClientsSlide`
7. `ReportingSlide`
8. `CreativeSlide`
9. `CreativeExamplesSlide`
10. `OnboardingSlide`
11. `CtaSlide`

## Navigation controls

Keyboard:
- `ArrowRight` or `Space` -> next
- `ArrowLeft` -> previous
- `Escape`:
  - exits fullscreen if active
  - otherwise `navigate(-1)`

Pointer:
- Invisible click zones:
  - left third = previous
  - right third = next
- Bottom dot indicators direct-jump to any slide.
- Prev/next icon buttons with disabled state at bounds.

Fullscreen:
- Toggle button calls `requestFullscreen()` / `exitFullscreen()`.
- `fullscreenchange` event keeps icon state synced.

UI visibility behavior:
- Top bar and bottom nav are opacity-hidden by default and reveal on hover.

Potential usability concern:
- Touch-first environments may not naturally discover hover-revealed controls (though click-zones partly compensate).

## Content data behavior

- Most slides consume `DEFAULT_OFFER_CONTENT`.
- `CreativeExamplesSlide` bypasses defaults and fetches Supabase `portfolio_items` live (`is_active=true` + sorted).

Regression risk:
- Deck has mixed data origin (static defaults + live DB query) which can create content inconsistency in offline/demo contexts.

---

## 4) Portfolio/Admin workflows and data sourcing hierarchy

## 4.1 New management surfaces

Added routes and pages:
- `/portfolio` -> `Portfolio`
- `/offer-editor` -> `OfferContentEditor`
- `/offer-management` -> tabbed container combining both

`OfferManagement` tabs:
- `portfolio`
- `editor`

## 4.2 Portfolio workflow (admin side)

Capabilities in `Portfolio` + `usePortfolioData`:
- List `portfolio_items`
- Filter by media type
- Upload image/video files to `portfolio` bucket
- Auto-append sort order
- Edit title + sort order
- Toggle `is_active`
- Delete storage object + DB row
- Show demo dataset if DB empty

Notable behavior:
- Drop-zone supports drag/drop of image/video.
- Video tiles display muted frame with play overlay.

## 4.3 Offer content workflow (admin side)

`OfferContentEditor` + `useOfferContent` provide per-section editing for:
- credibility badges
- why us
- reporting
- creative portfolio
- benefits
- onboarding
- CTA
- clients logos
- certifications

Section-type editors include:
- generic header/content editors
- list editors (items/steps/links)
- image grid uploader for logos/certs to `offer-assets` bucket

## 4.4 Runtime data sourcing hierarchy (critical)

For `PublicOfferPage` content blocks:
1. `offer.content_blocks_snapshot[sectionKey]` (highest priority)
2. `DEFAULT_OFFER_CONTENT[sectionKey]`
3. empty block fallback (`title:null`, `subtitle:null`, `content:{}`)

For offer object retrieval:
1. test/mock token path (`publicOffersMockData`)
2. Supabase `public_offers` by token

For portfolio visuals on public offer page:
1. `usePublicPortfolio()` from Supabase `portfolio_items` where `is_active=true`
2. hardcoded fallback asset list (`/public/images/portfolio/*`)

For logos/certifications:
1. content block `images` arrays
2. imported local assets

Practical consequence:
- The page is intentionally resilient: it almost always renders something, but freshness and provenance can differ section-by-section.

---

## 5) Performance-sensitive changes and likely UX regressions

## Performance-sensitive changes introduced

- `PublicOfferPage` expanded from ~952 to ~1532 lines with many new components and animated nodes.
- Multiple IntersectionObservers for reveal effects.
- Embedded iframe(s) and numerous media thumbnails.
- Large fallback media corpus (images + mp4 assets) in public path.
- Lightbox with potentially high-resolution image/video decode.
- SalesDeck includes full viewport rendering with heavy typography and gradients.

## Likely UX regressions / fragility points

1. Theme preference does not persist; user selection resets on reload.
2. Share button uses Clipboard API without explicit error fallback for denied permissions.
3. Portfolio lightbox lacks explicit body scroll lock.
4. `CreativeExamplesSlide` has no error-state UI; silent empty deck panel possible.
5. Public offer page still carries token debug output in not-found state (acceptable for internal staging, risky for production polish).
6. Mixed content provenance (snapshot/default/live portfolio) can produce semantic mismatch across sections.
7. Mobile sticky CTA dropped price context, potentially reducing confidence at conversion moment.
8. Many hover-dependent cues reduce discoverability on touch devices.
9. High media payload fallback path can degrade first interaction on weaker devices.
10. If `lead_id` missing, all CTA links break to invalid onboarding route.

---

## 6) Regression checklist (40 checks)

### PublicOfferPage rendering and sections

1. Valid token loads full page without console errors.
2. Invalid token shows not-available state and test-link.
3. Hero displays website-derived company label correctly.
4. Credibility badges hide when content array empty.
5. Loom iframe renders only when `loom_url` exists.
6. Audit HTML mode renders images and lists correctly.
7. Audit summary fallback parses multiline bullets correctly.
8. Recommendation panel appears only when value exists.
9. Custom note panel appears only when value exists.
10. Why-us links open in new tab and keep rel safety attrs.
11. Reporting iframe URL is read from content block override when present.
12. Reporting button opens same URL as iframe source.
13. Service groups appear in correct order: core/addon/one-off/other.
14. Service card expand/collapse works on both desktop and mobile.
15. Country flags show when managed countries or country variants exist.
16. Country variant prices and multipliers render correct math labels.
17. Pricing summary shows bundle discount strike-through correctly.
18. Intro discount badge text pluralization is correct for 1/2-4/5+ months.
19. Combined discount note appears only when both discount types active.
20. Benefits cards render from content block item count accurately.
21. Onboarding step icon mapping works for known icon keys.
22. Contact card hides entirely when no owner name/email.
23. Main CTA button text respects content override.
24. Clients logos use fallback assets when content images empty.
25. Certifications logos use fallback assets when content images empty.
26. Footer links all open correct destination URLs.
27. Mobile sticky CTA appears only under `sm` breakpoint.

### PublicOffer interactions and behavior

28. Theme toggle switches page-level palette consistently.
29. Theme toggle also swaps header/footer logo variant.
30. Share button transitions to copied state for ~2 seconds.
31. Scroll reveal animations trigger once and do not flicker on reverse scroll.
32. Image tile click opens lightbox at correct index.
33. Video tile click opens video with controls in lightbox.
34. Lightbox prev/next buttons wrap correctly from ends.
35. Lightbox keyboard arrows navigate and Escape closes.
36. Clicking overlay (outside media) closes lightbox.
37. Desktop video thumbnail hover plays then resets on leave.
38. Mobile video thumbnail does not attempt hover playback.

### SalesDeck

39. `/sales-deck` route loads without auth and shows slide 1.
40. Arrow keys/space/escape behavior matches deck spec.
41. Dot indicators jump to exact slide index.
42. Left/right click zones navigate within bounds only.
43. Fullscreen toggle state tracks `fullscreenchange` accurately.
44. Resize recalculates scale and keeps slide centered.
45. Deck controls are still operable on touch devices despite hover styling.
46. `CreativeExamplesSlide` displays loading state then media when DB reachable.

### Portfolio + admin workflows

47. `/offer-management?tab=portfolio` opens embedded portfolio management tab.
48. `/offer-management?tab=editor` opens embedded offer editor tab.
49. Portfolio upload accepts supported image/video and persists to DB.
50. Portfolio item `is_active` toggle affects public offer gallery visibility.
51. Portfolio delete removes both DB record and storage object.
52. Offer editor save persists title/subtitle/content updates by section key.
53. Clients/certs image uploads to `offer-assets` resolve to public URLs.
54. Public offer shows snapshot content over current global content blocks.
55. When snapshot missing, default content is used without runtime crash.

---

## 7) Net product shift (domain-level conclusion)

This range transforms the offer domain from a functional quote page into a CMS-backed, media-rich, narrative sales experience; introduces a dedicated presentation product (`SalesDeck`) with keyboard/fullscreen mechanics; and formalizes admin control planes for both reusable offer copy and portfolio assets, backed by Supabase tables/buckets and public-safe RLS policies.
