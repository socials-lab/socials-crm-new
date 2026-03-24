
# Modul "Zájemci" (Prospects) — databáze kontaktů z lead magnetů

## Přehled
Nový modul oddělený od lead pipeline, který slouží jako databáze potenciálních zájemců přicházejících přes lead magnety (webináře, stažení materiálů). Kontakty přicházejí přes webhook a lze je převést na lead.

## Datový model

### Nová tabulka: `prospects`
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | uuid PK | |
| name | text | Jméno kontaktu |
| email | text | E-mail |
| phone | text? | Telefon (volitelné) |
| company | text? | Firma (volitelné) |
| status | enum | `new`, `contacted`, `qualified`, `converted`, `irrelevant` |
| converted_to_lead_id | uuid? | Odkaz na lead po konverzi |
| notes | jsonb | Pole poznámek (stejný vzor jako u leadů) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Nová tabulka: `prospect_interactions`
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | uuid PK | |
| prospect_id | uuid FK | |
| type | enum | `webinar_registration`, `lead_magnet_download`, `webinar_attended`, `other` |
| title | text | Název webináře / lead magnetu |
| metadata | jsonb? | Další data z webhooku |
| occurred_at | timestamptz | Kdy se to stalo |
| created_at | timestamptz | |

### Edge Function: `prospect-webhook`
Přijímá POST requesty s daty kontaktu. Pokud kontakt s daným emailem existuje, přidá novou interakci. Pokud ne, vytvoří nový prospect + interakci.

## Frontend komponenty

### Stránka `/prospects` (Zájemci)
- **KPI karty**: Celkem zájemců, Nových tento měsíc, Převedených na lead
- **Tabulka** se sloupci: Jméno, E-mail, Firma, Počet interakcí, Poslední aktivita, Status
- **Filtrování** podle statusu a vyhledávání
- **Detail sheet** (boční panel po kliknutí):
  - Základní info (jméno, email, firma)
  - **Timeline interakcí** — chronologický seznam webinářů, stažených materiálů
  - **Poznámky** — stejný vzor jako `LeadNotesTab` (general, internal, call)
  - **Tlačítko "Převést na lead"** — otevře předvyplněný `AddLeadDialog`

### Navigace
- Nová položka "Zájemci" v sidebaru v sekci "Obchod" (ikona `UserSearch`)
- Přidání do permissions systému (`prospects` page)

## Implementační kroky

1. **DB migrace** — vytvoření tabulek `prospects`, `prospect_interactions` + RLS + enum typy
2. **Edge Function** `prospect-webhook` — příjem webhooků, upsert prospect + insert interakce
3. **Typy** — `Prospect`, `ProspectInteraction`, `ProspectStatus` v `types/crm.ts`
4. **Hook** `useProspectsData` — CRUD operace, přidávání poznámek
5. **Stránka** `Prospects.tsx` — tabulka s KPI, filtry, vyhledávání
6. **Detail** `ProspectDetailSheet.tsx` — boční panel s timeline a poznámkami
7. **Konverze** — dialog pro převod zájemce na lead s předvyplněnými daty
8. **Routing + navigace** — route `/prospects`, sidebar, permissions

## Technické detaily

- Webhook endpoint: `POST /functions/v1/prospect-webhook` s API klíčem pro ověření
- Webhook payload: `{ name, email, phone?, company?, interaction_type, interaction_title, metadata? }`
- Deduplikace přes email — stejný email = stejný prospect, nová interakce
- RLS: stejný vzor jako ostatní tabulky (`is_crm_user`)
- Poznámky: jsonb pole se stejnou strukturou jako u leadů (`{ id, text, note_type, author_name, created_at }`)
