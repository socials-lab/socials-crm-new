
## Uprava Thank You stranky - info o Socials emailu a dalsich krocich

### Co se zmeni

Na thank you obrazovce po odeslani onboardingu se upravi kroky "Co bude nasledovat" tak, aby reflektovaly realny proces:

**Nove kroky:**

1. **Zalozime ti Socials email** - Na tvuj osobni email (ten ktery jsi vyplnil/a) ti prijdou prihlasovaci udaje k novemu firemnimu emailu @socials.cz. Tam najdes dalsi instrukce.

2. **Pristup do nastroju** - Automaticky ti zalozime ucty ve Freelo (projektovy nastroj) a Slacku (komunikace). Pozvanka prijde na tvuj novy Socials email.

3. **Smlouva k podpisu** - Na zaklade vyplnenych udaju pripravime smlouvu o spolupraci a posleme ti ji k podpisu.

4. **Ozveme se s dalsim postupem** - Domluvime se na vsem potrebnem pro start spoluprace.

Navic se prida informacni box s upozornenim: "Zkontroluj si osobni email vcetne slozky spam - prihlasovaci udaje ti prijdou behem 24 hodin."

### Technicke detaily

**Soubor:** `src/pages/ApplicantOnboardingForm.tsx` (radky 288-312)

Uprava obsahu `CardContent` v sekci `isSubmitted` - nahrazeni stavajicich 2 kroku za 4 nove kroky s popisem automatizace (Google Workspace, Slack, Freelo, CRM profil). Pridani Alert/info boxu o kontrole emailu.
