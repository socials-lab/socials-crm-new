

## Uvod a emailova verifikace na schvalovaci strance viceprace

Pridame uvodni text a verifikacni formular podle vzoru ze stranky "Navrhy zmen" (`UpgradeOfferPage.tsx`).

### Zmeny v `ExtraWorkApproval.tsx`

**1. Uvodni text**
- Pod nadpis "Schvaleni viceprace" pridame odstavec s osobnim oslovenim, napr.:
  *"Dobry den, radi bychom Vas pozadali o schvaleni nasledujici viceprace v ramci Vasi zakazky. Prosim, prohlednete si detaily nize a potvrdte souhlas."*

**2. Verifikacni formular (vzor z UpgradeOfferPage)**
- Misto dvou tlacitek (Schvalit / Zamitnout) pridame formular:
  - **Email input** (povinny) -- klient musi zadat svuj email jako verifikaci identity
  - **Checkbox** -- "Souhlasim s touto viceprace" (pro schvaleni)
  - **Tlacitko "Schvalit vicepraci"** -- aktivni jen kdyz je vyplneny email a zaskrtnuty checkbox
  - **Odkaz/tlacitko "Zamitnout"** -- zachova stavajici flow se zamitnutim a duvodem
- Po schvaleni se ulozi `client_approval_email` a `client_approved_at` (stejne jako u navrhu zmen)

**3. Stav po schvaleni -- detail potvrzeni**
- Po uspesnem schvaleni zobrazime detail s emailem klienta a casem potvrzeni (stejne jako UpgradeOfferPage)
- Po zamitnuti zobrazime detail s casem zamitnuti

**4. Mock data v testMode**
- Test mode zustava funkcni, schvaleni/zamitnuti meni jen vizualni stav

### Technicke detaily

- Pridame stavy: `email` (string), `agreedToApproval` (boolean)
- Import `Input`, `Label`, `Checkbox` komponent
- Funkce `handleApprove` bude vyzadovat vyplneny email a souhlas
- Pri schvaleni ulozime email a cas do dat (v testMode jen vizualne)
- Formular pro zamitnuti zustava (textarea s duvodem), ale presuneme ho jako sekundarni akci pod hlavni formular
- Ve stavu "approved" zobrazime potvrzovaci kartu s emailem a casem (vzor z UpgradeOfferPage radky 306-346)

