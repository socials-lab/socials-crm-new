
## Editace viceprace + schvalovaci flow klientem

### Prehled

Pridame:
1. **Edit dialog** pro viceprace (zmena kolegy, hodin, sazby, popisu)
2. **Schvalovaci flow** -- klient musi schvalit viceprace pres verejnou stranku, nez se na ni zacne pracovat
3. **Odeslani/kopirovani odkazu** klientovi

### Flow schvalovani

```text
Vytvoreni viceprace (status: pending_approval)
        |
        v
CRM uzivatel posle klientovi odkaz na schvalovaci stranku
  (email nebo kopirovani URL)
        |
        v
Klient na verejne strance vidi seznam viceprace a schvali/zamitne
        |
  +-----+------+
  |            |
  v            v
approved    rejected
(in_progress)  (cancelled/pending_approval)
        |
        v
Prace probiha -> ready_to_invoice -> invoiced
```

### Zmeny v databazi

Pridame do tabulky `extra_works`:
- `approval_token` (text, unique) -- UUID token pro verejny odkaz
- `client_approval_email` (text) -- email kam se posilal odkaz
- `client_approved_at` (timestamptz) -- kdy klient schvalil
- `client_rejected_at` (timestamptz) -- kdy klient zamitl
- `client_rejection_reason` (text) -- duvod zamitnuti

### Novy stav

Pridame do enumu `extra_work_status` hodnotu `rejected`, aby klient mohl viceprace zamitnout.

### Soubory

| Soubor | Akce | Popis |
|--------|------|-------|
| `src/components/extra-work/EditExtraWorkDialog.tsx` | Novy | Dialog pro editaci viceprace (kolega, hodiny, sazba, popis) |
| `src/components/extra-work/SendApprovalDialog.tsx` | Novy | Dialog s moznosti zadat email klienta nebo zkopirovat odkaz |
| `src/pages/ExtraWorkApproval.tsx` | Novy | Verejna stranka kde klient schvali/zamitne viceprace |
| `src/components/extra-work/ExtraWorkTable.tsx` | Uprava | Pridat tlacitko "Editovat" a "Odeslat ke schvaleni" v dropdown menu |
| `src/pages/ExtraWork.tsx` | Uprava | Napojit edit dialog |
| `src/types/crm.ts` | Uprava | Pridat nova pole do ExtraWork interface, pridat `rejected` status |
| `src/App.tsx` | Uprava | Pridat route `/extra-work-approval/:token` |
| DB migrace | Nova | Pridat sloupce a enum hodnotu |
| `supabase/functions/send-extra-work-approval/index.ts` | Novy | Edge function pro odeslani emailu se schvalovacim odkazem (stub jako send-onboarding-summary) |

### Detaily implementace

**EditExtraWorkDialog**: Predvyplneny formular s moznosti zmenit kolegu, pocet hodin, sazbu (automaticky prepocet castky), nazev, popis. Nelze editovat viceprace ve stavu `invoiced`.

**SendApprovalDialog**: 
- Predvyplneny email z kontaktu klienta (`client_contacts` nebo `clients.main_contact_email`)
- Tlacitko "Odeslat email" (vola edge function)
- Tlacitko "Zkopirovat odkaz" (kopirovani URL do schranky)
- Generuje unikatni `approval_token` pri prvnim pouziti

**ExtraWorkApproval (verejna stranka)**:
- Nacte viceprace podle tokenu (z DB)
- Zobrazi: nazev, popis, hodiny, sazba, castka, klient, zakazka
- Tlacitka: "Schvaluji" (zmeni status na `in_progress`) a "Zamitnout" (s moznosti duvodu)
- Po akci zobrazi potvrzeni
- Branding Socials (logo, barvy) -- stejny styl jako UpgradeOfferPage

**RLS**: Verejna stranka bude pristupovat pres edge function (service role), ne primo z klienta. Alternativne pridame RLS policy pro anon read by token.

### Technicka poznamka

Edge function `send-extra-work-approval` bude zatim jen logovat payload (jako send-onboarding-summary). Pro skutecne odesilani emailu bude potreba napojit Resend API pozdeji.
