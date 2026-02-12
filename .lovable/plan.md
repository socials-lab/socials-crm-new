

## Redesign viceprace flow podle vzoru "Navrhy zmen"

### Aktualni stav

Viceprace pouziva tabulkovy/kanban pohled s inline status dropdowny a filtrovanim. Navrhy zmen pouziva prehledny tab-based layout rozdeleny podle stavu workflow (Cekajici, Ceka na klienta, Klient potvrdil, Aktivovane, Zamitnute) s kartovym zobrazenim.

### Zmeny

Stranka ExtraWork.tsx se prepise na tab-based layout s kartovym zobrazenim, stejne jako Modifications.tsx:

**1. Nova komponenta `ExtraWorkCard`**
- Kartove zobrazeni jedne viceprace (podobne jako `ModificationRequestCard`)
- Zobrazuje: nazev, klient, zakazka, kolega, hodiny x sazba = castka, upsell badge
- Akce podle stavu:
  - `pending_approval`: tlacitka "Odeslat ke schvaleni" (otevre SendApprovalDialog) + "Upravit" + "Smazat"
  - `pending_approval` (s tokenem, odeslano klientovi): badge "Ceka na klienta" + "Zkopirovat odkaz" + "Odeslat email"
  - `in_progress` (klient schvalil): badge "Klient schvalil" + tlacitko "K fakturaci"
  - `ready_to_invoice`: badge "K fakturaci"
  - `invoiced`: badge "Vyfakturovano"
  - `rejected`: badge "Zamitnuto" + "Smazat"

**2. Prepis ExtraWork.tsx**
- Odebrat table/kanban toggle, ExtraWorkTable a ExtraWorkKanban
- Pridat Tabs s peti zalozkami:
  - Cekajici (pending_approval bez tokenu)
  - Ceka na klienta (pending_approval s tokenem)
  - Schvaleno klientem (in_progress -- presunuto po klientskem schvaleni)
  - K fakturaci / Vyfakturovano (ready_to_invoice + invoiced)
  - Zamitnute (rejected)
- Zachovat KPI karty nahore
- Zachovat tlacitko "Pridat vicepraci"

**3. Uprava statusoveho flow**
- `pending_approval` = vytvoreno, jeste neodeslano klientovi
- `pending_approval` + `approval_token` existuje = odeslano, ceka na klienta
- `in_progress` = klient schvalil (nastavi se na approval page)
- `ready_to_invoice` = admin presune k fakturaci
- `invoiced` = vyfakturovano
- `rejected` = klient nebo admin zamitl

### Technicke detaily

**Nove soubory:**
- `src/components/extra-work/ExtraWorkCard.tsx` -- kartova komponenta pro jednu vicepraci

**Upravene soubory:**
- `src/pages/ExtraWork.tsx` -- kompletni prepis na tab-based layout s Tabs komponentou
  - Import `Tabs, TabsContent, TabsList, TabsTrigger` z `@/components/ui/tabs`
  - Rozdeleni extraWorks do skupin podle stavu (useMemo)
  - Kazda TabsContent zobrazuje grid ExtraWorkCard komponent
  - Prazdne stavy zobrazuji placeholder (ikona + text), stejne jako u Modifications

**Zachovane soubory (beze zmen):**
- `AddExtraWorkDialog.tsx` -- dialog pro pridani
- `EditExtraWorkDialog.tsx` -- dialog pro upravu
- `SendApprovalDialog.tsx` -- dialog pro odeslani ke schvaleni
- `ExtraWorkApproval.tsx` -- verejna stranka pro klienta

**Smazane importy/zavislosti:**
- ExtraWorkTable a ExtraWorkKanban se prestanu importovat v ExtraWork.tsx (soubory zustanou pro pripad potreby)
