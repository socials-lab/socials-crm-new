

## Plan: Datum začátku platnosti + poměrná cena + potvrzovací email

### Co se změní

**1. Datum začátku platnosti (editovatelné klientem)**

Na stránce `/upgrade/:token` (UpgradeOfferPage.tsx) přidám do potvrzovacího formuláře pole s datem začátku spolupráce:
- Předvyplněné z `offer.effective_from` (nebo 1. den příštího měsíce pokud chybí)
- Klient může datum upravit přes DatePicker (kalendář)
- Při změně data se automaticky přepočítá poměrná cena za první měsíc
- Datum se uloží při potvrzení nabídky

**2. Poměrná cena za první měsíc**

Pod datepickerem se dynamicky zobrazí kalkulace:
- Měsíční cena × zbývající dny / dny v měsíci = poměrná cena
- Formát: "Fakturace za [měsíc]: X Kč (Y dní z Z)"
- Přepočítává se live při změně data

**3. Uložení klientem zvoleného data**

- Do `StoredModificationRequest` přidám pole `client_chosen_effective_from`
- Funkce `clientAcceptOffer` bude přijímat i datum a uloží ho

**4. Potvrzovací email klientovi**

Po úspěšném potvrzení nabídky klientem se zobrazí na success stránce souhrn toho, co klient odsouhlasil. Zároveň se simuluje odeslání potvrzovacího emailu (toast notifikace). Email bude obsahovat:
- Název zakázky a klienta
- Typ změny a detail (služba, cena)
- Zvolené datum začátku
- Poměrnou cenu za první měsíc
- Datum a čas potvrzení

### Soubory k úpravě

- `src/pages/UpgradeOfferPage.tsx` — datepicker, live prorated kalkulace, rozšíření formuláře, success screen se souhrnem emailu
- `src/data/modificationRequestsMockData.ts` — rozšíření `clientAcceptOffer` o datum, přidání pole `client_chosen_effective_from`

