

## Dark Mode -- celá aplikace podle Socials styleguide

Aplikace bude natrvalo v tmavém režimu. Barvy jsou mapovány přesně podle styleguide.

### Mapování barev ze styleguide

| Styleguide token | Hex | Použití v aplikaci |
|---|---|---|
| Neutral Darkest | `#040404` | `--background` |
| Neutral Darker | `#1a1a1a` | `--card`, `--popover`, `--sidebar-background` |
| Neutral Dark | `#4d4d4d` | `--border`, `--input` |
| Neutral | `#808080` | `--muted-foreground` |
| Neutral Light | `#b2b2b2` | -- |
| Neutral Lighter | `#d8d8d8` | `--foreground`, `--card-foreground` |
| White | `#ffffff` | `--primary-foreground` |
| Primary | `#94e700` | `--primary` (tlačítka, CTA) |
| Primary Light | `#b4ee4c` | `--ring`, text-primary override |
| Primary Dark | `#76b800` | text-primary pro malé texty |

### Co se změní

**1. `src/index.css` -- nové dark-first CSS proměnné**
- Celý `:root` blok přepsat na tmavé barvy podle tabulky výše
- `--background`: near-black `#040404`
- `--foreground`: světlá `#d8d8d8`
- `--card` / `--popover`: `#1a1a1a`
- `--muted`: `#1a1a1a`, `--muted-foreground`: `#808080`
- `--accent` / `--secondary`: tmavé odstíny (`#1a1a1a` / `#2a2a2a`)
- `--border` / `--input`: `#4d4d4d`
- `--sidebar-*`: tmavé varianty (background `#0a0a0a`, border `#2a2a2a`, accent `#1a1a1a`)
- `.text-primary` override: `hsl(82 100% 37%)` (~`#76b800`) pro čitelnost na tmavém pozadí
- `--primary-foreground`: `#040404` (tmavý text na zelených tlačítkách)
- Scrollbar thumb barvy aktualizovat pro dark

**2. `src/assets/socials-logo.svg` -- bílá verze loga**
- Přepsat text paths z `#1a1a1a` na `#ffffff` (bílý text)
- Zelený dot zůstane `#94e700`
- Filtr glow stroke změnit na bílý

**3. `src/components/layout/MobileBottomNav.tsx` -- ověřit kompatibilitu**
- Zkontrolovat a případně upravit hardcoded barvy

**4. `src/pages/Auth.tsx` a další public stránky**
- Zkontrolovat hardcoded barvy (gradient backgrounds apod.) a nahradit tmavými variantami

Celkem se změní cca 3-5 souborů. Hlavní změna je v `index.css` (proměnné) a `socials-logo.svg` (bílá verze). Zbytek aplikace by měl automaticky přejít na dark díky CSS custom properties.

