

## Plan: Modul "Rozesílky" pro hromadné emaily aktivním klientům

### Popis
Nový modul v navigaci, který umožní vytvořit a odeslat hromadný email na kontakty aktivních klientů. Uživatel napíše předmět a tělo emailu, vybere příjemce (defaultně všechny kontakty aktivních klientů), a odešle rozesílku.

### Změny

**1. `src/constants/permissions.ts`**
- Přidat `'broadcasts'` do ALL_PAGES s emoji 📨 a label "Rozesílky"
- Přidat do PAGE_GROUPS pod "Obchod"

**2. `src/components/layout/AppSidebar.tsx`**
- Přidat navigační položku `{ title: '📨 Rozesílky', url: '/broadcasts', page: 'broadcasts' }` do sekce "Obchod"

**3. `src/pages/Broadcasts.tsx`** (nový soubor)
- Stránka se seznamem odeslaných rozesílek (tabulka: datum, předmět, počet příjemců)
- Tlačítko "Nová rozesílka" otevře dialog
- Načítá historii z Supabase tabulky `broadcasts`

**4. `src/components/broadcasts/CreateBroadcastDialog.tsx`** (nový soubor)
- Dialog s formulářem:
  - Předmět emailu (text input)
  - Tělo emailu (textarea s podporou proměnných `{company}`, `{contact_name}`, `{signature}`)
  - Seznam příjemců: automaticky načtení kontaktů aktivních klientů (client_contacts kde client.status = 'active'), s checkboxy pro výběr/odznačení
  - CC/BCC pole (existující EmailCcBccFields)
  - Tlačítko Odeslat
- Na odeslání: uloží záznam do `broadcasts` tabulky a zavolá edge function

**5. `src/components/broadcasts/RecipientSelector.tsx`** (nový soubor)
- Komponenta pro výběr příjemců
- Zobrazí kontakty seskupené podle klienta
- "Vybrat vše" / "Zrušit vše" tlačítka
- Filtr podle jména/firmy
- Zobrazuje jen kontakty s vyplněným emailem

**6. `supabase/functions/send-broadcast/index.ts`** (nová edge function)
- Přijme seznam příjemců, předmět, tělo
- Zatím jen loguje payload (stejný pattern jako `send-onboarding-summary`)
- Připraveno na napojení Resend API

**7. `src/App.tsx`**
- Přidat route `/broadcasts` → `<Broadcasts />`

**8. Supabase migrace** - nová tabulka `broadcasts`:
```text
broadcasts
  id          uuid PK
  subject     text NOT NULL
  body        text NOT NULL
  recipient_count integer
  recipients  jsonb (pole emailů + jmen)
  sent_by     uuid (ref profiles)
  created_at  timestamptz
```
- RLS: CRM users can manage/read

### Technické detaily
- Kontakty se načítají joinovaně: `client_contacts` + `clients` kde `clients.status = 'active'` a `client_contacts.email IS NOT NULL`
- Edge function zatím jen loguje, reálné odesílání se napojí přes Resend API později
- Proměnné v šabloně se nahrazují per-příjemce (každý dostane personalizovaný email s `{contact_name}` a `{company}`)

