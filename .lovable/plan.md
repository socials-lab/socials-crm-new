

## Aktualizace hodinovek viceprace

### Co se zmeni

Aktualizace sazeb v tahaku hodinovek a v helper funkci `getRateForPosition()` podle novych hodnot:

| Pozice | Stara sazba | Nova sazba |
|--------|------------|------------|
| Meta Ads | 1 700 Kc | **1 800 Kc** |
| PPC | 1 700 Kc | **1 800 Kc** |
| Analytika | 1 900 Kc | 1 900 Kc (beze zmeny) |
| Grafika / video | 1 500 Kc | 1 500 Kc (beze zmeny) |
| SEO | 1 500 Kc | 1 500 Kc (beze zmeny) |
| Tvorba landing pages pomoci AI | 2 500 Kc | 2 500 Kc (beze zmeny) |
| AI SEO | 1 800 Kc | **1 900 Kc** |

### Zmeny v souborech

**`src/components/extra-work/AddExtraWorkDialog.tsx`**:
- `HOURLY_RATE_CHEATSHEET`: Meta Ads 1700->1800, PPC 1700->1800, AI SEO 1800->1900
- `getRateForPosition()`: aktualizovat return hodnoty pro meta/ppc (1800) a ai seo (1900)

**`src/components/extra-work/EditExtraWorkDialog.tsx`**:
- `getRateForPosition()`: stejna aktualizace sazeb (meta/ppc -> 1800, ai seo -> 1900)

