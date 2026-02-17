
# Navrhy na upravu SOP + Owner kazdeho SOP

## Co se zmeni

Kazde SOP bude mit **ownera** (zodpovednou osobu z CRM uzivatelu). Kdokoliv z tymu bude moci navrhnout upravu SOP, pokud ho povazuje za neaktualni. Notifikace o navrhu prijde adminovi a ownerovi daneho SOP.

## Datove zmeny

### 1. Rozsireni tabulky `sop_articles` -- pridani `owner_id`
- Novy sloupec `owner_id UUID REFERENCES profiles(id)` (nullable, pro zpetnou kompatibilitu)
- Owner je CRM uzivatel zodpovedny za udrzovani SOP

### 2. Nova tabulka `sop_update_suggestions`
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | UUID PK | |
| article_id | UUID FK -> sop_articles | Ktere SOP se tyka |
| suggested_by | UUID FK -> profiles(id) | Kdo navrhl |
| reason | TEXT | Duvod proc SOP neni aktualni |
| status | TEXT | 'pending' / 'accepted' / 'dismissed' |
| resolved_by | UUID | Kdo navrh vyresil |
| resolved_at | TIMESTAMPTZ | Kdy |
| created_at | TIMESTAMPTZ | |

RLS: CRM uzivatele mohou cist a vkladat, admini mohou menit status.

## Frontend zmeny

### 3. `SOPArticle` interface + `useSOPData` hook
- Pridat `owner_id` do `SOPArticle` interface a demo dat
- Pridat metody `suggestUpdate(articleId, reason)` a `resolveSuggestion(id, status)`
- Pridat stav `suggestions` s nacitanim ze Supabase / demo fallback

### 4. `AddSOPArticleDialog` -- pole pro ownera
- Novy Select "Zodpovedna osoba" s vyberem z kolegu (kteri maji `profile_id`)
- Pri editaci predvyplneny soucasny owner
- Data kolegu z `useCRMData` hooku

### 5. `SOPArticle` stranka -- tlacitko "Navrhnout upravu"
- Novy button "Navrhnout upravu" (ikona `MessageSquarePlus`) viditelny pro vsechny uzivatele
- Klik otevre dialog `SuggestSOPUpdateDialog`:
  - Textarea pro duvod ("Co je neaktualni nebo chybi?")
  - Tlacitko "Odeslat navrh"
- Po odeslani: ulozeni do `sop_update_suggestions` + notifikace adminovi a ownerovi
- Na strance zobrazit badge "X navrhu na upravu" pokud existuji pending navrhy (viditelne pro ownera a adminy)

### 6. Info o ownerovi na strance SOP
- Pod nadpisem clanku zobrazit "Zodpovedny: Jmeno" s avatarem
- Klikatelne pro admin -> moznost zmenit ownera

### 7. Notifikace
- Novy typ `sop_update_suggested` v `NotificationType`
- Novy entity type `sop` v `EntityType`
- Pri vytvoreni navrhu zavolat `createNotification` pro:
  - Ownera SOP (pokud ma `profile_id`)
  - Vsechny adminy (pres `notifyAdmins`)
- Link v notifikaci smeruje na `/sop/{articleId}`

### 8. Prehled navrhu pro adminy
- Na hlavni SOP strance pridat indikator (cerveny badge) u clanku ktere maji pending navrhy
- Na `SOPArticle` strance sekce "Navrhy na upravu" (viditelna pro ownera + adminy) s moznosti:
  - Prijmout navrh (status -> accepted)
  - Zamitnout navrh (status -> dismissed)

## Soubory k uprave

| Soubor | Zmena |
|--------|-------|
| `src/hooks/useSOPData.tsx` | Pridat owner_id, suggestions CRUD, demo data |
| `src/types/notifications.ts` | Pridat `sop_update_suggested`, entity type `sop` |
| `src/components/sop/AddSOPArticleDialog.tsx` | Pridat Select pro ownera |
| `src/components/sop/SuggestSOPUpdateDialog.tsx` | **Novy** -- dialog pro navrh upravy |
| `src/components/sop/SOPUpdateSuggestions.tsx` | **Novy** -- seznam navrhu pro adminy/ownera |
| `src/pages/SOPArticle.tsx` | Tlacitko navrhnout upravu, zobrazeni ownera, sekce navrhu |
| `src/components/sop/SOPArticleCard.tsx` | Badge s poctem pending navrhu |
| SQL migrace | `sop_articles.owner_id` + tabulka `sop_update_suggestions` |
