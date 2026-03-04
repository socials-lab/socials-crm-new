

## Plan: Tracking otevření a kliknutí v rozesílkách + detail rozesílky

### Přehled

Přidáme per-recipient tracking (open/click) pomocí nové tabulky `broadcast_recipients` a tracking edge function. V přehledu rozesílek zobrazíme open rate a click rate. Po kliknutí na řádek se otevře detail sheet se seznamem příjemců a jejich statusy.

### Databázové změny

**Nová tabulka `broadcast_recipients`**
- `id`, `broadcast_id` (FK → broadcasts), `email`, `contact_name`, `company`
- `opened_at` (timestamptz, nullable) — kdy si otevřel email
- `clicked_at` (timestamptz, nullable) — kdy kliknul na odkaz
- `tracking_id` (uuid, unique) — unikátní identifikátor pro tracking pixel/link
- RLS: CRM users can read

**Úprava `broadcasts` tabulky**
- Přidat `open_count` (integer, default 0) a `click_count` (integer, default 0) pro rychlý přehled bez joinů

### Nová edge function: `broadcast-track`

Endpoint volaný z tracking pixelu (open) nebo redirect linku (click):
- `GET /broadcast-track?id={tracking_id}&type=open` — vrátí 1x1 transparentní pixel, zapíše `opened_at`
- `GET /broadcast-track?id={tracking_id}&type=click&url={encoded_url}` — redirectne na URL, zapíše `clicked_at`
- Při každém zápisu aktualizuje `open_count`/`click_count` v `broadcasts` tabulce
- `verify_jwt = false` (veřejný endpoint, volá se z emailového klienta)
- Používá service role key pro zápis do DB

### Úprava edge function: `send-broadcast`

- Při odesílání pro každého příjemce vytvořit záznam v `broadcast_recipients` s unikátním `tracking_id`
- Do HTML těla emailu vložit:
  - Tracking pixel: `<img src="...broadcast-track?id={tracking_id}&type=open" />`
  - Přepsat odkazy v těle na tracking redirect: `broadcast-track?id={tracking_id}&type=click&url={encoded_original_url}`

### Úprava `CreateBroadcastDialog`

- Při ukládání broadcast předat `broadcast_id` do edge function, aby mohla vytvářet záznamy v `broadcast_recipients`

### Úprava `Broadcasts.tsx` — přehled

- Rozšířit select o `open_count`, `click_count`
- Přidat sloupce **Open rate** a **Click rate** (počítáno jako `open_count / recipient_count * 100`)
- Řádky budou klikatelné — otevřou detail sheet

### Nový komponent: `BroadcastDetailSheet`

- Sheet/dialog s detailem rozesílky:
  - Předmět, datum, odesílatel
  - Souhrnné metriky: příjemců, otevřeno, kliknuto (s procentem)
  - Tabulka příjemců: jméno, email, firma, status (otevřeno ✓/✗, kliknuto ✓/✗, čas)
  - Barevné badge pro status (zelená = otevřeno+kliknuto, žlutá = jen otevřeno, šedá = neotevřeno)

### Technické detaily

- Tracking pixel je standardní technika — 1x1 GIF vrácený jako `image/gif` response
- Click tracking funguje přes server-side redirect (302)
- `broadcast-track` funkce musí být veřejná (bez JWT) — emailoví klienti nemají auth
- Pro DB operace v tracking funkci se použije `SUPABASE_SERVICE_ROLE_KEY`
- Idempotence: opakované otevření/kliknutí nezmění `opened_at`/`clicked_at` (pouze první záznam)
- Open tracking má přirozeně nižší spolehlivost (někteří klienti blokují obrázky), ale je to standard

