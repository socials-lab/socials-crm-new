

## Redesign detailu leadu - z Sheet na Dialog s taby

Aktualne je detail leadu v pravem panelu (Sheet), ktery je uzky a nepohodlny pro tolik obsahu. Prevedeme ho na velky centralni Dialog s tabovym rozlozenim, pridame novy typ poznamek (call notes) a celou komunikacni historii (timeline).

### Hlavni zmeny

**1. Sheet -> Dialog (centralni modalni okno)**
- Nahradime `Sheet` komponentu za `Dialog` s `max-w-4xl` a vyskou `90vh`
- Uvnitr `ScrollArea` pro scrollovani obsahu
- Header: nazev firmy, stage badge, tlacitka (Upravit, Historie, Prevest)

**2. Tabove rozlozeni (4 taby)**

```text
[ Prehled | Komunikace | Nabidka | Poznamky ]
```

- **Prehled** - firemni udaje, kontakt, obchodni info, fakturacni udaje, meta (soucasne sekce 1-2 zhustenejsi)
- **Komunikace** - timeline vsech komunikacnich udalosti (zadost o pristupy, onboarding, smlouva, odeslani nabidky) + akce. Celkova historie prace s leadem v chronologickem poradi
- **Nabidka** - sluzby v nabidce, tvorba/odeslani nabidky, celkova cena. Pridavani sluzeb az po nasdileni pristupu (kontrola `access_received_at`)
- **Poznamky** - vsechny poznamky vcetne novych typu (bezna poznamka, poznamka z callu, interni poznamka)

**3. Typy poznamek**
- Rozsireni `LeadNote` typu o pole `note_type`: `'general' | 'call' | 'internal'`
- Kazdy typ bude mit vizualni odliseni (ikona, barva badge)
- Pri pridavani poznamky se vybere typ pomoci segmentovanych tlacitek
- Call poznamky budou mit navic pole pro datum a cas hovoru a ucely poznamek z telefonatu

**4. Komunikacni timeline (tab Komunikace)**
- Chronologicky serazene udalosti z existujicich timestampu leadu:
  - `access_request_sent_at` - Zadost o pristupy odeslana
  - `access_received_at` - Pristupy prijaty
  - `onboarding_form_sent_at` - Onboarding formular odeslan
  - `onboarding_form_completed_at` - Formular vypnen
  - `offer_created_at` - Nabidka vytvorena
  - `offer_sent_at` - Nabidka odeslana
  - `contract_created_at` / `contract_sent_at` / `contract_signed_at` - Smlouva
  - Plus poznamky z `lead.notes` (interleavovane podle datumu)
- Kazda udalost ma akci (tlacitko) pro dalsi krok (napr. u "Cekame na pristupy" -> "Prijato")

**5. Omezeni pridavani sluzeb**
- V tabu Nabidka: tlacitko "Pridat sluzbu" bude disabled pokud `!lead.access_received_at`
- Zobrazi se informacni hlaska "Sluzby lze pridavat az po nasdileni pristupu"

### Technicke zmeny

**Soubory k uprave:**

1. **`src/types/crm.ts`** - Rozsireni `LeadNote` o `note_type: 'general' | 'call' | 'internal'` a volitelne `call_date: string | null`

2. **`src/components/leads/LeadDetailSheet.tsx`** -> prejmenovani na `LeadDetailDialog.tsx`
   - Nahrada Sheet za Dialog
   - Pridani Tabs (Prehled, Komunikace, Nabidka, Poznamky)
   - Rozdeleni soucasneho obsahu do tabu
   - Komunikacni timeline z existujicich timestamp poli
   - Poznamky s vyberem typu

3. **`src/hooks/useLeadsData.tsx`** - Uprava `addNote` funkce pro podporu `note_type` a `call_date`

4. **`src/components/leads/LeadsKanban.tsx`** a **`src/components/leads/LeadsTable.tsx`** a **`src/pages/Leads.tsx`** - Update importu z LeadDetailSheet na LeadDetailDialog

5. **Nova komponenta `src/components/leads/LeadCommunicationTimeline.tsx`** - timeline komponent zobrazujici chronologicky vsechny udalosti + akcni tlacitka

6. **Nova komponenta `src/components/leads/LeadNotesTab.tsx`** - oddeleny tab s poznamkami, vyber typu, filtrovani

**Datovy model** - DB migrace neni nutna, protoze `notes` jsou ulozeny jako JSONB pole v tabulce `leads`. Staci pridat nove pole do JSON struktury poznamky.

### Vizualni styl

- Dialog: `max-w-4xl`, `h-[90vh]`, `overflow-hidden`
- Tabs: plna sirka, pod headerem
- Kazdy tab content: vlastni `ScrollArea`
- Timeline: vertikalni cara s ikonami a timestampy vlevo, obsah vpravo
- Poznamky: barevne badges podle typu (modra = call, seda = obecna, zluta = interni)

