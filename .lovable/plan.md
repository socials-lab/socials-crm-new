

## Oprava pridavani viceprace + klientske schvalovani pres Supabase

### Problem

Pridavani viceprace selhava, protoze kod posila do databaze sloupce, ktere v tabulce `extra_works` neexistuji (`approval_token`, `client_approval_email`, `client_approved_at`, `client_rejected_at`, `client_rejection_reason`, `upsold_by_id`, `upsell_commission_percent`). Insert tichy selze kvuli `(supabase as any)` ktery obchazi typovou kontrolu.

Schvalovaci stranka (`ExtraWorkApproval`) aktualne funguje pres localStorage -- neni propojena se Supabase.

### Reseni

#### 1. Pridani chybejicich sloupcu do DB

Migrace prida do tabulky `extra_works`:

| Sloupec | Typ | Vychozi |
|---------|-----|---------|
| `approval_token` | text | NULL |
| `client_approval_email` | text | NULL |
| `client_approved_at` | timestamptz | NULL |
| `client_rejected_at` | timestamptz | NULL |
| `client_rejection_reason` | text | NULL |
| `upsold_by_id` | uuid | NULL |
| `upsell_commission_percent` | numeric | NULL |

Zaroven se prida RLS policy pro anonymni pristup k schvalovaci strance (SELECT pres `approval_token`).

#### 2. Uprava AddExtraWorkDialog

- Po uspesnem pridani viceprace se automaticky otevre `SendApprovalDialog` pro odeslani ke schvaleni klientem
- Tok: Pridat vicepraci -> ulozi se do DB -> otevre se dialog pro odeslani schvalovaciho odkazu

#### 3. Prepojeni SendApprovalDialog na Supabase

- Misto localStorage token generovat a ukladat primo do DB sloupce `approval_token`
- Update `extra_works` zaznamu s tokenem a emailem

#### 4. Prepojeni ExtraWorkApproval stranky na edge funkci

- Schvalovaci stranka bude nacitat data z edge funkce `send-extra-work-approval?action=get-by-token`
- Schvaleni/zamitnuti bude volat `action=approve` / `action=reject`
- Odstraneni zavislosti na localStorage

#### 5. Edge funkce -- uz existuje a je funkcni

Edge funkce `send-extra-work-approval` uz obsahuje vsechny potrebne endpointy (get-by-token, approve, reject). Jen je potreba pridat RLS policy aby edge funkce (pouziva service role key) mela pristup.

### Technicke detaily

**Migrace SQL:**

```text
ALTER TABLE extra_works
  ADD COLUMN IF NOT EXISTS approval_token text,
  ADD COLUMN IF NOT EXISTS client_approval_email text,
  ADD COLUMN IF NOT EXISTS client_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_rejection_reason text,
  ADD COLUMN IF NOT EXISTS upsold_by_id uuid,
  ADD COLUMN IF NOT EXISTS upsell_commission_percent numeric;
```

**Upravene soubory:**
- `src/components/extra-work/AddExtraWorkDialog.tsx` -- po pridani otevre approval dialog
- `src/components/extra-work/SendApprovalDialog.tsx` -- prepojit na Supabase misto localStorage
- `src/pages/ExtraWorkApproval.tsx` -- nacitat data z edge funkce misto localStorage
- `src/pages/ExtraWork.tsx` -- propojit flow (po add -> send approval)

