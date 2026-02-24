

# Pridani sluzby Video Boost

## Co se zmeni

Pridame novou addon sluzbu "Video Boost" do vsech 3 klicovych souboru, aby se zobrazovala na strance /services, spravne se propisovala do nabidek a byla dostupna jako mock service v CRM.

Video Boost je samostatna sluzba (ne kreditova) s 2 variantami: Standard (4 900 Kc / video) a AI b-roll (6 900 Kc / video), oboji s moznosti balicku 3 videi se slevou 10 %.

## Zmeny v souborech

### 1. `src/constants/serviceDetails.ts` -- pridat VIDEO_BOOST

Novy zaznam `VIDEO_BOOST` (pred SKLIK):

- **tagline**: "Vykonnostni videa pro Meta Ads / TikTok Ads"
- **platforms**: Meta Ads (Reels, Stories), TikTok Ads (Shorts)
- **targetAudience**: Firmy a e-shopy, ktere chteji vykonnostni videa pro reklamy na socialnich sitich
- **benefits**: 3 body (videa ktera prodavaji, rychla produkce bez nataceni, vice variant z jednoho zadani)
- **setup**: 1 sekce -- Ucel videa a nabidka (4 body: co se komunikuje, ucel videa, produkty, creative brief)
- **management**: 3 sekce:
  - Scenar a voiceover (3 hooky na koncept) -- kreativni uhel, voiceover script (HOOK 3x, MAIN, CTA), schvalovani
  - Strih videa a AI prvky -- zabery, AI voiceover, AI titulky, AI b-rolly, format 9:16 / 15-30s
  - Revize a finalni export -- 1 kolo v cene, dalsi 1 700 Kc/hod, formaty pro Meta a TikTok
- **tierComparison**: Tabulka porovnani Standard vs AI b-roll (1 koncept, 3 hooky, AI voiceover+titulky, AI b-rolly, cena za 1 video, balicek 3 videi)
- **tierPricing**: growth (Standard) 4 900 Kc, pro (AI b-roll) 6 900 Kc, elite null (neni pouzito -- sluzba nema tiery v klasickem smyslu)

Poznamka: Video Boost nema klasicke GROWTH/PRO/ELITE tiery jako jine sluzby. Misto toho ma 2 varianty (Standard a AI b-roll). tierPricing pouzijeme pro zobrazeni cen variant, tierComparison pro porovnani obsahu.

### 2. `src/constants/serviceDefaults.ts` -- pridat 'video boost'

Novy zaznam `'video boost'` s:

- **deliverables**: 3 hlavni body + dodaci podrobnosti
  - Videa, ktera prodavaji -- jasna nabidka, benefit a silne CTA
  - Rychla produkce bez zbytecneho nataceni (vase zabery + AI voiceover, titulky, b-rolly)
  - Vice variant z jednoho zadani -- 3 ruzne hooky pro A/B testovani
  - Format 9:16, delka 15-30 sekund, pripravene primo do reklam
  - 1 kolo revizi v cene kazdeho videa
- **frequency**: Prubezne dle objednavek
- **turnaround**: Standardni dodani do 5 pracovnich dnu
- **requirements**: Zabery produktu/sluzby, cile a ucel videa, produkty/sluzby k propagaci
- **detailed_sections**: 5 sekci:
  1. Jak sluzba probiha -- Ucel videa a nabidka (4 body)
  2. Scenar a voiceover (3 hooky na koncept) -- kreativni uhel, script, schvaleni
  3. Strih videa a AI prvky -- zabery, voiceover, titulky, b-rolly, format
  4. Revize a finalni export -- 1 kolo zdarma, dalsi 1 700 Kc/hod, formaty
  5. Varianty sluzby a ceny -- Standard (4 900 / 13 230 za 3), AI b-roll (6 900 / 18 630 za 3)

### 3. `src/hooks/useCRMData.tsx` -- pridat mock service

Pridat `VIDEO_BOOST` do pole `MOCK_SERVICES`:
- **id**: 'srv-10'
- **code**: 'VIDEO_BOOST'
- **name**: 'Video Boost'
- **service_type**: 'addon'
- **category**: 'creative'
- **base_price**: 4900 (cena za 1 video Standard)
- **tier_pricing**: null (neni tier-based)
- **default_deliverables**: 3 body z benefitu

### 4. `src/data/publicOffersMockData.ts` -- test nabidka

Pridat novou testovaci nabidku `/offer/test-video-boost` s Video Boost jako addon sluzbou, vcetne vsech deliverables a detailed_sections pro overeni zobrazeni.

## Technicke detaily

- Zmeny ve 4 souborech
- Zadne nove zavislosti
- Video Boost je addon sluzba (ne core s tiery), pouziva jednoduchy cenik s 2 variantami
- tierComparison se pouzije pro porovnani Standard vs AI b-roll variant v detailu sluzby
- Revize za 1 700 Kc/hod (ne kreditove)

