

## Implementace napojení na Hlídač státu - HOTOVO

### Co bylo implementováno
- Edge funkce `company-financials` volající API Hlídače státu
- React hook `useCompanyFinancials` s cachováním
- UI komponenta `CompanyFinancials` v detailu leadu
- Nahrazení odkazu na Justice.cz novou komponentou

### Poznámky
- Endpoint `GetDetailInfo` (s finančními údaji) vrací 403 - vyžaduje placenou licenci
- Základní endpoint `/firmy/ico/{ico}` vrací: jméno firmy, datové schránky
- Komponenta zobrazí dostupná data + link na profil na Hlídači státu
- Pokud by se upgrade licence povedl, komponenta automaticky zobrazí i obrat, zaměstnance, DPH info atd.
