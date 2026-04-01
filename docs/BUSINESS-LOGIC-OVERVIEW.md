# Socials CRM – Přehled Business Logiky

## Co to je?

Interní CRM systém pro marketingovou agenturu **Socials**, která se specializuje na výkonnostní marketing (PPC reklama), správu sociálních sítí a kreativní služby pro české klienty.

---

## Hlavní účel systému

Pokrýt celý životní cyklus práce s klientem:

1. **Akvizice** – Získání nového leadu a jeho provedení obchodním procesem
2. **Onboarding** – Sběr údajů, podpis smlouvy, nastavení spolupráce
3. **Provoz** – Správa zakázek, přiřazení týmu, sledování práce
4. **Fakturace** – Generování faktur za měsíční služby, jednorázové práce, vícepráce
5. **Analytika** – Přehled výkonnosti, marží, týmové kapacity

---

## Klíčové entity

### Klient (Client)

Firma, se kterou agentura spolupracuje.

- **Identifikace**: Název, IČO, DIČ, web
- **Fakturační údaje**: Adresa, fakturační email
- **Klasifikace**: 
  - Status: aktivní / pozastavený / ztracený
  - Tier: standard / gold / platinum / diamond (úroveň péče)
- **Akvizice**: Kdo klienta přivedl, jaký kanál

### Kontakt (Client Contact)

Lidé na straně klienta.

- Primární kontakt (hlavní osoba pro komunikaci)
- Decision maker (kdo rozhoduje o spolupráci)
- Může jich být více na jednoho klienta

### Zakázka (Engagement)

Smlouva / projekt s klientem. Jeden klient může mít více zakázek.

- **Typy**:
  - **Retainer** – měsíční paušál, dlouhodobá spolupráce
  - **Jednorázově** – projekt s jasným koncem
  - **Interní** – interní projekty agentury

- **Billing model**:
  - Fixní částka
  - Procento ze spendu (investice do reklamy)
  - Hybrid

- **Obsahuje**:
  - Seznam služeb s cenami
  - Přiřazené kolegy (tým)
  - Odkaz na Freelo (projektový nástroj)
  - Odkaz na nabídku a smlouvu
  - Reklamní platformy (Meta Ads, Google Ads, Sklik...)

### Služba (Service)

Katalog služeb, které agentura nabízí.

- **Core služby** – s odstupňovanými cenami dle velikosti klienta:
  - GROWTH (menší klienti)
  - PRO (střední)
  - ELITE (velcí klienti)

- **Add-on služby** – pevná cena

- **Kategorie**: Performance, Kreativa, Lead generace, Analytika, Consulting

### Kolega (Colleague)

Člen týmu – zaměstnanec nebo freelancer.

- Pozice a seniorita (junior / mid / senior / partner)
- Interní hodinová sazba (pro výpočet marže)
- Měsíční kapacita v hodinách
- Freelancer flag

---

## Obchodní pipeline (Leads)

### Fáze leadu

```
Nový lead
    ↓
Schůzka proběhla
    ↓
Čekáme na přístupy (do reklamních účtů)
    ↓
Přístupy přijaty
    ↓
Příprava nabídky
    ↓
Nabídka odeslána
    ↓
┌─────────────────┐
│  Vyhráno (won)  │ → Konverze na Klienta + Zakázku
│  Prohráno       │
│  Odloženo       │
└─────────────────┘
```

### Co se u leadu sleduje

- Firma a kontaktní osoba
- Zdroj (doporučení, inbound, cold outreach, event, LinkedIn, web)
- Odhadovaná cena zakázky
- Pravděpodobnost úspěchu (%)
- Měsíční investice klienta do reklamy (ad spend)
- Potenciální služby (co by si koupili)
- Historie komunikace a poznámky

### Automatizované kroky

1. **Žádost o přístupy** – odeslání emailu s žádostí o přístup do reklamních účtů (Meta Ads, Google Ads, Sklik)
2. **Onboarding formulář** – klient vyplní své údaje (IČO, fakturace, kontakty pro podpis, kontakty pro Freelo)
3. **Smlouva** – připravena k podpisu v DigiSign
4. **Konverze** – automatické vytvoření klienta a zakázky při výhře

### Proč přístupy PŘED nabídkou?

Agentura potřebuje vidět do reklamních účtů klienta, aby mohla:
- Zhodnotit aktuální stav kampaní
- Odhadnout potřebný čas a zdroje
- Připravit **realistickou cenovou nabídku**

Bez přístupů by byla nabídka nepřesná. Proto je workflow:
```
Schůzka → Žádost o přístupy → Analýza → Nabídka → Smlouva
```

---

## Creative Boost – Kreditový systém

Speciální služba pro kreativní výstupy (grafika, videa).

### Jak to funguje

1. Klient má měsíční kreditový balíček (např. 30–50 kreditů)
2. Každý typ výstupu má hodnotu v kreditech:
   - Banner = X kreditů
   - Video = Y kreditů
   - Překlad = Z kreditů
3. **Express dodání** = 1.5× násobek kreditů
4. Fakturuje se podle skutečně spotřebovaných kreditů

### Sledování

- Kolik kreditů klient využil vs. kolik má k dispozici
- Který kolega kredity odpracoval (pro výpočet odměn)
- Historie změn nastavení (max kredity, cena za kredit)

---

## Vícepráce (Extra Work)

Práce nad rámec retaineru, která se fakturuje zvlášť.

### Workflow

```
Ke schválení → V realizaci → Připraveno k fakturaci → Fakturováno
```

### Co se sleduje

- Klient a zakázka
- Kdo práci odvedl
- Počet hodin a hodinová sazba
- Fakturační období
- Kdo práci prodal (upsell tracking)

---

## Fakturace

### Zdroje fakturačních položek

1. **Měsíční služby** – automaticky z aktivních zakázek
2. **Jednorázové služby** – sledovány jako "čekající na fakturaci"
3. **Vícepráce** – schválené položky připravené k fakturaci
4. **Creative Boost** – dle spotřebovaných kreditů

### Integrace

- Fakturoid (český fakturační systém) – plánováno
- Generování čísla faktury (FV-2025-001)

---

## Meetingy

Správa schůzek – interních i s klienty.

### Základní údaje
- Název, popis, typ (interní / klientský)
- Datum, čas, délka
- Místo nebo video odkaz
- Klient a zakázka (pokud relevantní)

### Účastníci
- Kolegové z týmu (role: organizátor / povinný / volitelný)
- Externí účastníci (jméno, email)
- Sledování účasti (přijal / odmítl / zúčastnil se)

### Úkoly z meetingu
- Název a popis úkolu
- Přiřazení kolegovi
- Priorita (nízká / střední / vysoká)
- Deadline
- Status (todo / in progress / done)

### Transcript a Shrnutí

Textová pole pro ruční vložení:
- **Transcript** – záznam z nahrávky meetingu (Google Meet, Zoom, Fathom...)
- **Shrnutí** – manuálně vytvořené shrnutí klíčových bodů, rozhodnutí a akčních úkolů

### Kalendářní pozvánky

Pole `calendar_invites_sent_at` připraveno pro budoucí integraci s Google Calendar.

---

## Nábor (Recruitment)

Pipeline pro uchazeče o práci.

### Fáze

```
Nový uchazeč → Pozván na pohovor → Pohovor proběhl → Nabídka odeslána
    ↓                                                       ↓
Zamítnut / Stáhl přihlášku                              Přijat
                                                           ↓
                                                    Konverze na Kolegu
```

### Onboarding uchazeče

Po přijetí uchazeč vyplní:
- IČO a fakturační údaje (pokud freelancer)
- Hodinová sazba
- Bankovní účet

---

## Feedback Zone

Interní systém pro návrhy a zpětnou vazbu od týmu.

- Kategorie: Procesy, Služby, Komunikace, Systém, Ostatní
- Hlasování (palec nahoru / dolů)
- Status: Nový → V hodnocení → Přijato / Zamítnuto → Implementováno

---

## Role a oprávnění

| Role | Přístup |
|------|---------|
| **Super Admin** | Vše |
| **Admin / Management** | Celé CRM včetně financí |
| **Project Manager** | Práce s klienty, bez financí |
| **Specialist** | Pouze vlastní práce |
| **Finance** | Zaměření na fakturaci |

### Granulární oprávnění

- `can_see_financials` – vidí ceny, marže, fakturaci
- `allowed_pages` – seznam povolených sekcí

---

## Dashboard

### Pro všechny

- Dnešní meetingy
- Nadcházející narozeniny kolegů (14 dní)
- Kontakty týmu
- Odkaz na SOP a procesy (Notion)

### Pro management

- Počet aktivních klientů a zakázek
- Nově vyhrané zakázky
- Top klienti dle tržeb
- Poslední zakázky

---

## Klíčové metriky

- **Pipeline value** – očekávaná hodnota leadů (vážená pravděpodobností)
- **Conversion rate** – poměr vyhraných vs. prohraných leadů
- **Monthly revenue** – součet měsíčních plateb z retainerů
- **Margin** – tržby mínus interní náklady na tým (hodinové sazby × čas)
- **Colleague credits** – kredity odpracované v Creative Boost

---

## Integrace – detailní popis

### Fakturoid (fakturační systém)

**Status:** Připraveno, simulováno

**Funkce:**
- Vytvoření faktury z CRM → odeslání dat do Fakturoidu
- Fakturoid vygeneruje číslo faktury (formát YYYY-NNNN)
- Uložení `fakturoid_id` a `fakturoid_url` pro propojení
- Odkaz na fakturu ve Fakturoidu přímo z CRM
- Položky faktury: měsíční služby + vícepráce + Creative Boost

**Co se posílá:**
- Klient (IČO, DIČ, fakturační adresa)
- Položky faktury (název, cena, množství)
- Období fakturace

---

### DigiSign (elektronický podpis smluv)

**Status:** Pouze URL odkaz

**Plánovaná integrace:**
- Vygenerování smlouvy z dat leadu/zakázky
- Odeslání k podpisu přes DigiSign API
- Webhook při podpisu → aktualizace stavu v CRM
- Uložení URL podepsané smlouvy

**Aktuálně:** Pouze ruční vložení odkazu na smlouvu.

---

### ARES (registr firem)

**Status:** Mock implementace

**Funkce:**
- Uživatel zadá IČO
- Systém stáhne z ARES: název firmy, DIČ, sídlo
- Automatické vyplnění formuláře

**Plánováno:** Napojení na reálné ARES API (Supabase Edge Function).

---

### Odesílání emailů

**Status:** Mock implementace

**Typy emailů:**
1. **Žádost o přístupy** – šablona pro klienta s instrukcemi pro nasdílení Meta/Google/Sklik účtů
2. **Onboarding formulář** – odkaz na formulář pro vyplnění firemních údajů
3. **Pozvánka na pohovor** – pro uchazeče v náboru
4. **Zamítnutí uchazeče** – zdvořilostní email

**Plánováno:** Supabase Edge Function + SMTP / Resend / Postmark.

---

### Freelo (projektový nástroj)

**Status:** Pouze URL odkaz

**Funkce:** Uložení odkazu na projekt ve Freelu u zakázky.

**Možná budoucí integrace:**
- Automatické vytvoření projektu při konverzi leadu
- Přidání klientských kontaktů do Freela
- Sync úkolů

---

### Notion (dokumenty, SOP)

**Status:** Pouze URL odkazy

**Použití:**
- Odkaz na nabídku je generovaný z `public_offers.token` (neukládá se jako `leads.offer_url`)
- Odkaz na SOP a procesy na dashboardu

---

### Kalendář / Google Calendar

**Status:** Není implementováno

**Plánováno:**
- Sync meetingů s Google Calendar
- Odeslání kalendářních pozvánek účastníkům
- Pole `calendar_invites_sent_at` již existuje

---

### Shrnutí integračního stavu

| Služba | Aktuální stav | Plná integrace |
|--------|---------------|----------------|
| Fakturoid | Simulace API | Chybí reálné API |
| DigiSign | Pouze URL | Chybí API + webhooky |
| ARES | Mock data | Chybí Edge Function |
| Emaily | Mock odesílání | Chybí SMTP integrace |
| Freelo | Pouze URL | Možná v budoucnu |
| Notion | Pouze URL | Pouze odkazy |
| Google Calendar | Nic | Plánováno |

---

## Typický workflow

### Nový klient

1. Lead přijde (web formulář, doporučení, LinkedIn...)
2. Sales rep zavolá / domluví schůzku
3. Po schůzce požádá o přístupy do reklamních účtů
4. Připraví nabídku v Notion
5. Odešle nabídku klientovi
6. Klient vyplní onboarding formulář (údaje firmy, kontakty)
7. Vygeneruje se smlouva
8. Po podpisu: lead → klient + zakázka
9. Přiřadí se tým, nastaví se služby
10. Měsíční fakturace běží automaticky

### Měsíční fakturace

1. Systém sebere aktivní služby ze zakázek
2. Přidá schválené vícepráce
3. Přidá Creative Boost dle spotřeby
4. Vytvoří fakturu → odešle do Fakturoidu

---

## Shrnutí

Socials CRM je komplexní nástroj pro řízení marketingové agentury pokrývající:

- ✅ Obchodní pipeline (leady)
- ✅ Onboarding klientů
- ✅ Správu zakázek a služeb
- ✅ Přiřazování týmu
- ✅ Kreditový systém pro kreativu
- ✅ Sledování víceprací
- ✅ Fakturaci
- ✅ Nábor nových kolegů
- ✅ Interní feedback
- ✅ Role a oprávnění

Cílem je mít vše na jednom místě místo rozptýlení ve spreadsheetech, emailech a různých nástrojích.
