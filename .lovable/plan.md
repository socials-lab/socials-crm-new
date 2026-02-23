
## Správa emailových šablon v Nastavení

Centralizovaná správa všech emailových šablon používaných v CRM. Šablony se ukládají do Supabase a jednotlivé dialogy je načítají jako výchozí obsah.

### Identifikované emailové šablony (7)

| Šablona | Použití | Proměnné |
|---------|---------|----------|
| Nabídka spolupráce | SendOfferDialog | `{company}`, `{domain}` |
| Onboarding formulář | SendOnboardingFormDialog | `{contact_name}`, `{company}`, `{url}` |
| Žádost o přístupy | RequestAccessDialog | `{company}` |
| Schválení vícepráce | SendApprovalDialog | `{work_name}`, `{amount}`, `{url}` |
| Návrh změny zakázky | SendModificationEmailDialog | `{client}`, `{type}` |
| Pozvánka na pohovor | SendInterviewInviteDialog | `{name}`, `{position}`, `{sender}` |
| Odmítnutí kandidáta | SendRejectionEmailDialog | `{name}`, `{position}`, `{sender}` |

### Co se vytvoří

**1. Databáze** - nová tabulka `email_templates`
- `id` (uuid, PK)
- `template_key` (text, unique) - identifikátor šablony (např. `send_offer`, `interview_invite`)
- `name` (text) - lidsky čitelný název
- `subject_template` (text) - šablona předmětu s placeholdery `{variable}`
- `body_template` (text) - šablona těla emailu s placeholdery
- `description` (text) - popis, kde se šablona používá
- `available_variables` (text[]) - seznam dostupných proměnných
- `updated_at`, `updated_by` (uuid)
- RLS: CRM users can read, admins can update

**2. Komponenta `EmailTemplatesManager`** (`src/components/settings/EmailTemplatesManager.tsx`)
- Seznam všech šablon jako karty/accordion
- Kliknutím na šablonu se otevře editor s:
  - Editovatelným předmětem
  - Editovatelným tělem (textarea)
  - Seznamem dostupných proměnných (kliknutím se vloží do textu)
  - Tlačítko "Uložit" a "Obnovit výchozí"
- Zobrazí se na stránce Nastavení jako nová sekce přes celou šířku

**3. Hook `useEmailTemplates`** (`src/hooks/useEmailTemplates.tsx`)
- Načítá šablony z Supabase
- Funkce `getTemplate(key)` vrací šablonu
- Funkce `fillTemplate(key, variables)` nahradí placeholdery hodnotami
- Funkce `updateTemplate(key, subject, body)` uloží změny
- Fallback na hardcoded výchozí hodnoty pokud šablona v DB neexistí

**4. Úprava Settings stránky**
- Přidání nové sekce "Emailové šablony" pod stávající karty
- Zabere celou šířku (lg:col-span-2)

**5. Úprava emailových dialogů**
- Každý dialog začne používat `useEmailTemplates` hook
- Místo hardcoded textů zavolá `fillTemplate('template_key', { variable: value })`
- Uživatel stále může text upravit v dialogu před odesláním

### Technické detaily

- Výchozí šablony se seednou migrací (INSERT s ON CONFLICT DO NOTHING)
- Proměnné v šablonách používají formát `{variable_name}`
- `fillTemplate` provede jednoduché string.replace pro každou proměnnou
- Šablony se cachují přes React Query, invalidace po uložení
- Seed data obsahují aktuální hardcoded texty ze všech dialogů
