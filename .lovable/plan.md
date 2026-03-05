

## Plan: Auto-invite nového kolegy s defaultním přístupem k "Můj přehled"

### Problém
Při přidání nového kolegy je pozvánka do CRM volitelná (checkbox). Požadavek je, aby se pozvánka posílala vždy automaticky a nový uživatel měl defaultně přístup pouze ke stránce "Můj přehled".

### Změny

**1. `src/components/forms/ColleagueForm.tsx`**
- Odstranit checkbox `invite_to_crm` — při vytváření nového kolegy se pozvánka pošle vždy
- Role selector zůstane viditelný přímo (bez podmínky na checkbox)
- Změnit `invite_to_crm` default na `true` (nebo ho úplně odstranit ze schématu a vždy předat `true`)

**2. `src/pages/Colleagues.tsx`**
- V `handleFormSubmit` odstranit podmínku `if (invite_to_crm && role)` — při vytváření vždy volat `invite-user` edge function
- Fallback role nastavit na `'specialist'` pokud není vybrána

**3. `supabase/functions/invite-user/index.ts`**
- Při insertu do `user_roles` přidat `allowed_pages: ['my-work']` jako default
- To zajistí, že nový uživatel uvidí pouze "Můj přehled" dokud mu admin nerozšíří oprávnění

### Rozsah
3 soubory, žádné nové komponenty. Edge function se automaticky redeployne.

