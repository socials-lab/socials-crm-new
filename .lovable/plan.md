

## Plan: Kontrola přefakturace víceprací klientům

### Problém

Kolegové si fakturují vícepráce (stav `invoiced`), ale není jasné, zda se tyto vícepráce následně přefakturovaly klientovi. Některé se přefakturovat nemají (interní náklady), některé ano — a chybí kontrola.

### Řešení

Přidat na `extra_works` tabulku nový sloupec `client_reinvoice_status` s hodnotami:
- `expected` — vícepráce se má přefakturovat klientovi (default)
- `reinvoiced` — přefakturováno klientovi
- `not_expected` — nepředpokládá se přefakturace klientovi

Plus volitelný sloupec `client_invoice_note` (text) pro poznámku k fakturaci klientovi.

### Databázové změny

```sql
CREATE TYPE client_reinvoice_status AS ENUM ('expected', 'reinvoiced', 'not_expected');
ALTER TABLE extra_works ADD COLUMN client_reinvoice_status client_reinvoice_status DEFAULT 'expected';
ALTER TABLE extra_works ADD COLUMN client_invoice_note text;
```

### UI změny

**1. `src/components/extra-work/ExtraWorkCard.tsx` + `ExtraWorkTable.tsx`**
- Na kartách/tabulce víceprací zobrazit badge s přefakturačním statusem (zelená = přefakturováno, oranžová = čeká na přefakturaci, šedá = nepředpokládá se)
- Zobrazovat pouze u víceprací ve stavu `ready_to_invoice` nebo `invoiced`

**2. `src/components/extra-work/EditExtraWorkDialog.tsx`**
- Přidat select pro `client_reinvoice_status` a textové pole pro `client_invoice_note`
- Admin/PM může označit vícepráci jako "nepředpokládá se přefakturace" nebo "přefakturováno"

**3. Nová sekce v `src/pages/ExtraWork.tsx` nebo dashboard**
- Přidat kontrolní přehled / filtr: "Vyfakturováno kolegou, ale nepřefakturováno klientovi" — seznam víceprací ve stavu `invoiced` kde `client_reinvoice_status = 'expected'` (= potenciální problém)
- Barevné zvýraznění: červená = kolega vyfakturoval, ale klient ještě ne; zelená = přefakturováno; šedá = nepředpokládá se

**4. `src/types/crm.ts`**
- Přidat typ `ClientReinvoiceStatus` a rozšířit `ExtraWork` interface

### Technické detaily
- Default `expected` zajistí, že všechny existující vícepráce budou automaticky flagnuté jako "čeká na přefakturaci"
- Kontrolní přehled bude jednoduchý filtr na stávající stránce víceprací — žádná nová stránka
- Badge se zobrazí vedle existujícího status badge

