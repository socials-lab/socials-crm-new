

## Plan: Redesign aplikace podle Socials styleguide (light mode only)

Aplikace bude přepracována do light-mode verze inspirované Socials styleguide — lime zelená jako primary, Work Sans font, čisté zaoblení, bez dark mode.

### 1. Odstranit dark mode

**`src/index.css`** — smazat celý `.dark { ... }` blok a přemapovat CSS proměnné na light-mode paletu odvozenou ze styleguide:

```text
Paleta (light mode adaptace styleguide):
--background:        0 0% 100%        (#ffffff)
--foreground:        0 0% 10%         (#1a1a1a)
--card:              80 20% 97%       (#f8faf3 — lehce zelenkavý nádech)
--primary:           82 100% 45%      (#94e700 — lime)
--primary-foreground: 0 0% 7%        (#121212 — tmavý text na lime)
--secondary:         0 0% 96%        (#f2f2f2)
--muted:             0 0% 95%        (#f2f2f2)
--muted-foreground:  0 0% 35%       (#808080 → tmavší)
--border:            0 0% 85%        (#d8d8d8)
--ring:              82 100% 45%     (lime)
--destructive:       0 84% 60%      (beze změny)
```

**`src/App.tsx`** — odstranit `next-themes` ThemeProvider pokud existuje

### 2. Typografie — Work Sans

**`src/index.css`**:
- Nahradit import Satoshi → Google Fonts Work Sans (300-800)
- `body { font-family: 'Work Sans', system-ui, sans-serif; }`

**`tailwind.config.ts`**:
- `fontFamily.sans` → `['Work Sans', 'system-ui', 'sans-serif']`

### 3. Border radius tokeny

**`tailwind.config.ts`** a **`src/index.css`**:
- `--radius: 1rem` (16px = large)
- Přidat `--radius-md: 0.75rem` (12px)
- `--radius-sm: 0.5rem` (8px)

### 4. Komponenty

**`src/components/ui/button.tsx`**:
- `default`: lime bg (`bg-primary`), tmavý text, hover ztmavení
- `secondary`: bílé pozadí, border `#d8d8d8`, hover light gray
- `outline`: průhledné, border neutrální
- Font weight 600 (semibold)

**`src/components/ui/card.tsx`**:
- Jemnější shadow, border `border-border`, radius 16px
- Odebrat hover efekt `hover:border-primary/20` (příliš agresivní)

**`src/components/ui/input.tsx`**:
- Border `#d8d8d8`, radius 8px, focus ring lime

### 5. Sidebar

**`src/components/layout/AppSidebar.tsx`** + **`src/index.css`** sidebar proměnné:
- `--sidebar-background`: bílá nebo `#f8f8f8`
- `--sidebar-primary`: lime
- Aktivní item: lime pozadí s tmavým textem
- Čistý minimalistický look

### 6. Header bar

**`src/components/layout/AppLayout.tsx`**:
- Bílé pozadí, jemný spodní border
- Bez vizuálních změn v logice

### 7. Build errors fix

Opravit existující build chyby v edge functions (`.catch` → try/catch, `error as Error`).

### Rozsah
- `src/index.css` — kompletní přepis CSS proměnných + font import
- `tailwind.config.ts` — font, radius
- `src/components/ui/button.tsx` — styling tweaks
- `src/components/ui/card.tsx` — jemnější hover
- `src/components/ui/input.tsx` — border/radius
- Edge functions — fix 9 build errors (type casting)

