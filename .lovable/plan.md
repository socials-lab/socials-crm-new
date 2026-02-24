

# Pridani kompletni sluzby PPC Boost

## Co se zmeni

Sluzba PPC Boost uz existuje v systemu, ale s velmi strucnymi daty. Aktualizujeme ji na plny rozsah informaci, ktere jsi poskytl -- vcetne detailnich rozpisu, benefitu, tier porovnani a cen. Vsechno se bude propisovat do nabidek stejne jako u Socials Boost.

## Kroky implementace

### 1. Aktualizace `src/constants/serviceDetails.ts` -- PPC_BOOST

Prepsat stavajici strucny zaznam `PPC_BOOST` na kompletni verzi:

- **tagline**: "Sprava Google Ads a S-kliku -- vice zakazek a vyssi zisk"
- **platforms**: Google Ads, Sklik (Seznam.cz)
- **targetAudience**: E-shopy a firmy, ktere chteji vice zakazek z Google a Seznamu
- **benefits**: 4 body z "Co ziskate" (vice zakazek, silnejsi nabidka, mene starosti, partner)
- **setup**: 3 sekce:
  - Nastaveni Google Ads a S-kliku (7 polozek)
  - Kontrola analytickeho mereni (2 polozky)
  - Tvorba dashboardu v Looker Studio (4 polozky)
- **management**: 3 sekce:
  - Sprava Google Ads (8 polozek -- Shopping, DSA, PMax, Search, Display, Remarketing, Feed, Konverze)
  - Sprava S-kliku (5 polozek)
  - Reporting a komunikace (3 polozky)
- **tierComparison**: Kompletni tabulka z uzivatelskeho vstupu (zakladni setup, denni kontrola, optimalizace 1-2x/2-3x/3-4x tydne, tvorba reklam, kreativy, Mergado, strategie, Freelo, Looker Studio, mesicni reporting)
- **tierPricing**: Zachovat stavajici ceny (growth: 24 900, pro: 34 900, elite: individualni)

### 2. Aktualizace `src/constants/serviceDefaults.ts` -- 'ppc boost'

Prepsat stavajici strucny zaznam na kompletni verzi s:

- **deliverables**: Aktualizovat na 4 hlavni body z "Co ziskate" + klicove deliverables
- **detailed_sections**: Pridat 5 sekci:
  - Nastaveni Google Ads a S-kliku
  - Kontrola analytickeho mereni
  - Tvorba dashboardu v Looker Studio
  - Sprava Google Ads (vcetne Shopping, DSA, PMax, Search, Display, Remarketing, Feed, Konverze)
  - Sprava S-kliku
  - Reporting a komunikace
- **frequency** a **turnaround**: Zachovat
- **requirements**: Aktualizovat (pristupy do Google Ads, Sklik, Merchant Center, GA, produktovy feed)

### 3. Test nabidka s PPC Boost

Pridat do `publicOffersMockData.ts` novou testovaci nabidku na `/offer/test-ppc-boost` s PPC Boost jako core sluzbou, vcetne vsech deliverables, detailed_sections, requirements a tier selection. Umozni overeni, ze se vsechno spravne zobrazuje na verejne nabidce.

## Technicke detaily

- Zadne nove soubory, zadne nove zavislosti
- Zmeny ve 3 souborech: `serviceDetails.ts`, `serviceDefaults.ts`, `publicOffersMockData.ts`
- Data se budou propisovat do nabidek pres existujici mechanismus `mergeWithDefaults()` a `getServiceDetail()`
