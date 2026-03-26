

## Přidat sekci "Reporting až na úroveň zisku" do veřejné nabídky

### Umístění
Nová sekce `ReportingSection` se vloží **za CreativePortfolioSection (řádek 1082) a před Loom video (řádek 1084)**.

### Obsah sekce

1. **Nadpis** — "📊 Reporting až na úroveň zisku" 
2. **Popis** — Text o tom, že pro Shoptet klienty dodáváme reporting až na úroveň contribution margin, s přesným přehledem kolik vydělá jaký produkt. V závorce poznámka: *(Na implementaci dalších platforem jako Shopify a Upgates nyní pracujeme.)*
3. **Interaktivní iframe náhled** — embed demo reportu z URL `https://68bb7487-e1f5-44d2-a8a4-9044e8cf5438.lovableproject.com/shared-report/...` přímo v nabídce, aby si klient mohl report proklikat
4. **CTA tlačítko** — "Otevřít demo report" s ikonou ExternalLink, otevře URL v novém tabu

### Vizuální styl
- Konzistentní s ostatními sekcemi (`mb-16 p-6 md:p-8 rounded-2xl border bg-card/50 backdrop-blur-sm`)
- Iframe v `rounded-xl overflow-hidden border` kontejneru s aspect ratio 16:9
- Hover efekt na kartě s popisem

### Soubory k úpravě
- `src/pages/PublicOfferPage.tsx` — přidat funkci `ReportingSection()` a vložit ji za `CreativePortfolioSection`

