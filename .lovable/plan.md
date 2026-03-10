

## Žádost o schůzku v lead flow + URL na sjednání meetingu v profilu

### Co se změní

**1. DB migrace -- `profiles` tabulka + `leads` tabulka**
- Přidat sloupec `meeting_schedule_url TEXT` do `profiles` (URL na Calendly/Cal.com každého uživatele)
- Přidat sloupec `meeting_request_sent_at TIMESTAMPTZ` do `leads` (tracking odeslání žádosti o schůzku)

**2. `src/types/crm.ts` -- Lead interface**
- Přidat `meeting_request_sent_at: string | null` do `Lead` interface

**3. `src/pages/Settings.tsx` -- Pole pro meeting URL v profilu**
- Přidat input pole "URL pro sjednání schůzky" (placeholder: `https://calendly.com/...`) do sekce Profil
- Uložení do `profiles.meeting_schedule_url` přes Supabase

**4. `src/components/leads/LeadFlowStepper.tsx` -- Nový krok**
- Přidat krok "Žádost o schůzku" (ikona `Calendar`) jako **2. krok** (mezi "Lead vytvořen" a "Žádost o přístupy")
- `isComplete` = `!!lead.meeting_request_sent_at`
- Action button otevře nový dialog `SendMeetingRequestDialog`
- Přidat `onSendMeetingRequest` do props

**5. Nový `src/components/leads/SendMeetingRequestDialog.tsx`**
- Dialog na odeslání emailu s žádostí o online schůzku
- Předvyplněný email template s proměnnou `{meeting_url}` (URL z profilu aktuálního uživatele)
- Načte `meeting_schedule_url` z `profiles` pro přihlášeného uživatele
- Standardní email pole: To, CC, BCC, Subject, Body (stejný vzor jako `RequestAccessDialog`)
- Po odeslání: uloží `meeting_request_sent_at` na lead

**6. Nový email template `meeting_request`**
- Přidat do `useEmailTemplates` hook defaultní šablonu pro žádost o schůzku
- Proměnné: `{company}`, `{name}`, `{meeting_url}`, `{signature}`

**7. `src/components/leads/LeadDetailDialog.tsx` + `LeadDetailSheet.tsx`**
- Přidat state `isMeetingRequestOpen` a handler
- Propojit `onSendMeetingRequest` callback na `LeadFlowStepper`

**8. `src/hooks/useLeadsData.tsx`**
- Zajistit mapování nového sloupce `meeting_request_sent_at`

### Soubory k úpravě
- DB migrace (profiles + leads)
- `src/types/crm.ts`
- `src/pages/Settings.tsx`
- `src/components/leads/LeadFlowStepper.tsx`
- `src/components/leads/LeadDetailDialog.tsx`
- `src/components/leads/LeadDetailSheet.tsx`
- `src/components/leads/SendMeetingRequestDialog.tsx` (nový)
- `src/hooks/useEmailTemplates.tsx`
- `src/hooks/useLeadsData.tsx`

