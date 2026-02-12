

## Kontrola spolehlivosti plátce DPH

### Jak to funguje
Ministerstvo financí ČR provozuje **bezplatnou veřejnou SOAP webovou službu** na adrese `https://adisrws.mfcr.cz/dpr/axis2/services/rozhraniCRPDPH.rozhraniCRPDPHSOAP`, která pro zadané DIČ vrátí:
- **ANO** -- plátce DPH je nespolehlivý
- **NE** -- plátce DPH je spolehlivý
- **NENALEZEN** -- subjekt není v registru plátců DPH

Není potřeba žádný API klíč. Limit je 10 000 dotazů/den.

### Kroky implementace

#### 1. Nová edge funkce `vat-reliability`
- Přijme DIČ jako query parametr
- Pošle SOAP request na MFCR endpoint (operace `getStatusNespolehlivyPlatce`)
- Parsuje XML odpověď a vrátí JSON s hodnotami:
  - `nespolehlivyPlatce`: "ANO" | "NE" | "NENALEZEN"
  - `cisloFu`: číslo finančního úřadu (volitelné)

#### 2. Nový hook `useVatReliability`
- Volá edge funkci přes `supabase.functions.invoke`
- Aktivuje se pouze pokud lead má vyplněné DIČ
- Cachuje výsledek (staleTime 1 hodina)

#### 3. Automatické volání při uložení IČO
- V `LeadDetailDialog.tsx` -- po úspěšném doplnění DIČ z ARES se ihned zavolá kontrola spolehlivosti
- Výsledek se uloží do leadu (nový sloupec `vat_payer_status`)

#### 4. DB migrace
- Přidat sloupec `vat_payer_status TEXT` do tabulky `leads` (hodnoty: "reliable", "unreliable", "not_found", null)

#### 5. Zobrazení v UI
- V sekci "Firemní údaje" pod DIČ:
  - Spolehlivý plátce: zelený badge "Spolehlivý plátce DPH"
  - Nespolehlivý plátce: **červený alert s varováním** "NESPOLEHLIVÝ PLÁTCE DPH" -- výrazné upozornění
  - Nenalezen v registru: šedý text "Není plátce DPH"
- V demo datech pro Socials Advertising doplnit `vat_payer_status: "reliable"`

### Technické detaily

**Nové soubory:**
- `supabase/functions/vat-reliability/index.ts` -- SOAP volání na MFCR

**Upravené soubory:**
- `src/hooks/useVatReliability.tsx` -- nový hook (nebo inline v LeadDetailDialog)
- `src/types/crm.ts` -- přidat `vat_payer_status` do Lead
- `src/components/leads/LeadDetailDialog.tsx` -- zobrazení badge/alertu, volání při uložení IČO
- `src/hooks/useLeadsData.tsx` -- demo data
- DB migrace -- nový sloupec

**SOAP request formát:**
```text
POST https://adisrws.mfcr.cz/dpr/axis2/services/rozhraniCRPDPH.rozhraniCRPDPHSOAP
Content-Type: text/xml

<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <StatusNespolehlivyPlatceRequest xmlns="http://adis.mfcr.cz/rozhraniCRPDPH/">
      <dic>CZ08186464</dic>
    </StatusNespolehlivyPlatceRequest>
  </soapenv:Body>
</soapenv:Envelope>
```

**Odpověď parsování:** Regex na atribut `nespolehlivyPlatce="ANO|NE|NENALEZEN"` z XML.

