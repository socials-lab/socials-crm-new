
# Rozsirenni SOP -- 12 kategorii, 50 SOP, lepsi navigace

## Co se zmeni

Aktualne mame 3 kategorie a 3 clanky. Rozsireni zahrnuje:

1. **12 kategorii** pokryvajicich vsechny oblasti Socials
2. **15+ demo clanku** rozlozenych mezi kategorie (realisticke pro demo)
3. **Vylepsenni UI pro skalovatelnost** -- aby to fungovalo i s 50+ SOP

## Novych 12 kategorii

| # | Kategorie | Ikona | Priklad clanku |
|---|-----------|-------|----------------|
| 1 | Onboarding klienta | Briefcase | Nastaveni klienta v CRM, Prvni brief |
| 2 | Performance marketing | BarChart3 | Spusteni Google Ads, Meta Ads setup |
| 3 | Interni procesy | Settings | Viceprace, Dovolena, Reporting |
| 4 | Social media management | Palette | Tvorba content planu, Schvalovani |
| 5 | Fakturace a finance | FileText | Vystaveni faktury, Upominky |
| 6 | Prodej a leady | Target | Kvalifikace leadu, Nabidky |
| 7 | Klientsky servis | Users | Reklamace, Escalace |
| 8 | Nastroje a technologie | Zap | Google Analytics, GTM |
| 9 | HR a tym | Users | Onboarding kolegy, 1-on-1 |
| 10 | Brand a design | Palette | Brand manualy, Sablony |
| 11 | Reporty a analytika | BarChart3 | Mesicni reporty, KPI |
| 12 | SEO a obsah | BookOpen | Keyword research, Audit |

## Vylepsenni zobrazeni pro skalovatelnost

### A) Collapsible sidebar s kategoriemi (leva strana)
Misto grid karet zavedeme **dvoupanelovy layout**:
- **Levy panel**: seznam kategorii jako kompaktni menu (vzdy viditelny, na mobilu skryvatelny)
- **Pravy panel**: seznam clanku vybrane kategorie

### B) Pocitadlo a kompaktni karty kategorii
- Kategorie zobrazeny jako kompaktni radky s ikonou, nazvem a poctem clanku
- Aktivni kategorie zvyraznena
- Na mobilu se prepina mezi kategoriemi a clanky

### C) Vyhledavani s kategorizovanymi vysledky
- Vysledky hledani seskupeny podle kategorii
- U kazdeho vysledku zobrazen nazev kategorie jako badge
- Snippet textu s zvyraznenou hledanou frazi

### D) Tagy jako filtry
- Pod search barem rada tag-badges ze vsech clanku
- Klik na tag = filtr podle tagu (kombinovatelne s textem)

## Technicke zmeny

### `src/hooks/useSOPData.tsx`
- Rozsireni `demoCategories` na 12 polozek
- Rozsireni `demoArticles` na 15+ polozek s realnym obsahem
- Pridani category name do search results

### `src/pages/SOP.tsx`
- Novy dvoupanelovy layout: levy sloupec s kategoriemi (sidebar styl), pravy s clanky
- Pridani tag-filtru pod search bar
- Seskupene vysledky hledani podle kategorii
- Responzivni: na mobilu kategorie jako horizontalni scrollovatelne chipy nahoze

### `src/components/sop/SOPCategoryCard.tsx`
- Pridani kompaktni varianty (prop `compact`) pro sidebar zobrazeni -- radek s ikonou, nazvem, poctem

### `src/components/sop/SOPArticleCard.tsx`
- Pridani category badge k vysledkum hledani
- Zobrazeni tagu vzdy (ne jen pri hledani)

### `src/components/sop/SOPSearch.tsx`
- Pridani tag-badges filtru pod search input
- Klik na tag ho prida/odebere z filtru

## Jak to bude vypadat

**Desktop**:
- Search bar + tag filtry nahore (pres celou sirku)
- Pod tim dva sloupce: levy (250px) s kategoriemi jako lista, pravy s clanky
- Klik na kategorii = okamzite zobrazeni clanku vpravo

**Mobil**:
- Search bar nahore
- Horizontalni scrollovatelne category chipy
- Pod tim seznam clanku vybrane kategorie
- "Vsechny kategorie" jako default zobrazeni s gridu karet

**Hledani**:
- Vysledky seskupene: "Onboarding klienta (2 vysledky)" > clanky, "Interni procesy (1 vysledek)" > clanky
- Kazdy vysledek ma zvyrazneny snippet a category badge
