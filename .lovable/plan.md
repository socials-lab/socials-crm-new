

## Přidat sekci "Proč spolupracovat právě s námi?" do veřejné nabídky

### Umístění
Sekce se vloží **za OnboardingProcessSection (řádek 880) a před Loom video (řádek 883)** — tedy mezi timeline onboardingu a video/kontakt.

### Struktura sekce `WhyUsSection`

Nová komponenta uvnitř `PublicOfferPage.tsx` obsahující:

1. **Hlavní nadpis** — "🏆 Proč spolupracovat právě s námi?"
2. **Úvodní odstavec** — "Chceme, aby pro vás byla spolupráce..." + "Ne sliby, ale skutečný business dopad..."
3. **4 karty s klíčovými argumenty** (grid 1 col mobile, 2 col desktop):
   - 💰 **30+ mil. Kč** reklamních rozpočtů měsíčně — zkušenosti s velkými i středními e-shopy
   - 👨‍💻 **Výhradně seniorní specialisté** s 5+ lety zkušeností — žádní junioři
   - 🏅 **Certifikovaní partneři** Meta, Google, TikTok, Sklik + zlatý Shoptet partner — přímé kontakty, přístup k betám
   - 🤝 **Pečlivý výběr klientů** — jdeme jen do spolupráce, kde jsme přesvědčeni o výsledcích
4. **Případové studie CTA** — odkaz na socials.cz/pripadove-studie
5. **Podcast CTA** — odkaz na socials.cz/socials-podcast
6. **Recenze klientů** — odkaz na Shoptet Partner Portál

### Styl
- Konzistentní s existujícím dark mode designem (`bg-muted/50`, `border`, `rounded-xl`)
- Karty s emoji ikonou, tučným číslem/tvrzením a popisem pod ním
- Odkazy jako `text-primary hover:underline` s `ExternalLink` ikonou

### Soubory k úpravě
- `src/pages/PublicOfferPage.tsx` — přidat `WhyUsSection` komponentu a vložit ji za `OnboardingProcessSection`

