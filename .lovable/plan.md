
# Plán: Detailní popisy služeb s balíčky

## Cíl
Zobrazit u každé služby (Socials Boost, Creative Boost, atd.) podrobný popis obsahující:
- Co klient získá
- Úvodní nastavení projektu (setup)
- Průběžnou správu
- Srovnání balíčků GROWTH/PRO/ELITE
- Platformy a cílovou skupinu
- Transparentní ceník

## Technické řešení

### 1. Nový soubor s detaily služeb
**Soubor:** `src/constants/serviceDetails.ts`

Struktura pro každou službu:
```text
┌─────────────────────────────────────────┐
│ SERVICE_DETAILS                         │
├─────────────────────────────────────────┤
│ service_code: string                    │
│ tagline: string (krátký popis)          │
│ platforms: string[]                     │
│ targetAudience: string                  │
│ benefits: string[] (co získáte)         │
│ setup: SetupItem[] (úvodní nastavení)   │
│ management: ManagementItem[] (správa)   │
│ tierComparison: TierFeature[]           │
└─────────────────────────────────────────┘
```

**Příklad pro Socials Boost:**
- Platforms: Meta Ads (Facebook, Instagram, Messenger)
- Setup: nastavení Meta Business Suite, analytické měření, Looker Studio dashboard, vylepšení nabídky
- Správa: denní kontrola, optimalizace 1-4x týdně dle balíčku, reporting
- Balíčky: GROWTH (do 400k), PRO (400-800k), ELITE (nad 800k)

**Příklad pro Creative Boost:**
- Kreditový systém
- Ceník za typ výstupu (banner, video, AI foto)
- Express dodání +50%
- Základní cena 400 Kč/kredit

### 2. Komponenta pro zobrazení detailů
**Nový soubor:** `src/components/services/ServiceDetailView.tsx`

Sekce:
- **Přehled:** tagline, platformy, pro koho
- **Co získáte:** seznam benefitů s ikonami
- **Úvodní setup:** collapsible sekce s body
- **Průběžná správa:** collapsible sekce s body
- **Srovnání balíčků:** tabulka GROWTH/PRO/ELITE s checkmarkami a hodnotami

### 3. Úprava Services.tsx
V rozbalené kartě služby zobrazit:
- Místo krátkého popisu zobrazit kompletní `ServiceDetailView`
- Pro Core služby: tabulka srovnání balíčků
- Pro Add-on služby (Creative Boost): speciální kreditový ceník

### 4. Data pro služby

**SOCIALS_BOOST:**
- Rozpočty: GROWTH (do 400k), PRO (400-800k), ELITE (nad 800k)
- Rozdíly v balíčcích: frekvence optimalizace, tvorba nových reklam

**CREATIVE_BOOST:**
- Cena za kredit: 400 Kč (základní)
- Kreditový ceník dle typu výstupu
- Express dodání: +50%

## Soubory k vytvoření/úpravě
1. **Vytvořit** `src/constants/serviceDetails.ts` - detailní popisy všech služeb
2. **Vytvořit** `src/components/services/ServiceDetailView.tsx` - komponenta pro zobrazení
3. **Upravit** `src/pages/Services.tsx` - integrace ServiceDetailView do expanded view
4. **Upravit** `src/constants/services.ts` - aktualizace tier configs pro Socials Boost (400k/800k rozpočty)

## Vizuální návrh expanded karty

```text
┌────────────────────────────────────────────────────────────┐
│ 📢 Socials Boost                          [Core] [Aktivní] │
│ META_ADS                                                    │
├────────────────────────────────────────────────────────────┤
│ Reklama na Facebooku a Instagramu pro e-shopy a služby     │
│ Platformy: Meta Ads (Facebook, Instagram, Messenger)       │
│                                                            │
│ 💡 Co získáte:                                              │
│ • Více zakázek a vyšší zisk                                │
│ • Méně starostí, více času na podnikání                    │
│ • Partnera, který řeší výkon, ne jen reklamy               │
│                                                            │
│ ▶ Úvodní nastavení projektu (klikni pro rozbalení)         │
│ ▶ Průběžná správa kampaní (klikni pro rozbalení)           │
│                                                            │
│ 📦 Balíčky dle rozpočtu:                                    │
│ ┌────────────┬────────────┬────────────┐                   │
│ │  🚀 GROWTH │  💪 PRO    │  🏆 ELITE  │                   │
│ │ do 400k Kč │ 400-800k   │ nad 800k   │                   │
│ ├────────────┼────────────┼────────────┤                   │
│ │ 15 000 Kč  │ 25 000 Kč  │ 40 000 Kč  │                   │
│ ├────────────┼────────────┼────────────┤                   │
│ │ Nové rekl. │ Nové rekl. │ Nové rekl. │                   │
│ │ 1-2x/týden │ 2-3x/týden │ 2-3x/týden │                   │
│ ├────────────┼────────────┼────────────┤                   │
│ │ Optimali.  │ Optimali.  │ Optimali.  │                   │
│ │ 1-2x/týden │ 2-3x/týden │ 3-4x/týden │                   │
│ └────────────┴────────────┴────────────┘                   │
│                                                            │
│ Aktivní klienti: [Client A] [Client B]                     │
└────────────────────────────────────────────────────────────┘
```
