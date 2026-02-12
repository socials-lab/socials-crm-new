

## Přidání vzorového leadu Socials Advertising s.r.o.

Na základě IČO 08186464 se jedná o firmu **Socials Advertising s.r.o.** (web: socials.cz) -- agentura zaměřená na výkonnostní reklamu (Meta Ads, PPC, video/banner kreativy).

### Co se udělá

1. **SQL migrace** -- nový INSERT do tabulky `leads` s reálnými údaji firmy:
   - Název: Socials Advertising s.r.o.
   - IČO: 08186464
   - Web: https://www.socials.cz
   - Obor: Marketing / Online reklama
   - Stav: `new_lead`
   - Zdroj: `inbound`
   - Kontaktní údaje (vzorové)
   - UUID: `20000000-0000-0000-0000-000000000002`

2. **Soubor `docs/supabase-migration-complete.sql`** -- přidání INSERT příkazu za existující lead (řádek ~679)

3. **Spuštění SQL** -- vložení záznamu přímo do databáze, aby se lead ihned zobrazil v aplikaci

### Technické detaily

```sql
INSERT INTO public.leads (
  id, company_name, ico, website, industry, 
  contact_name, contact_email, stage, source, 
  estimated_price, currency, probability_percent
) VALUES (
  '20000000-0000-0000-0000-000000000002',
  'Socials Advertising s.r.o.',
  '08186464',
  'https://www.socials.cz',
  'Marketing',
  'Kontaktní osoba',
  'info@socials.cz',
  'new_lead',
  'inbound',
  50000,
  'CZK',
  50
);
```

Žádné změny ve frontendovém kódu nejsou potřeba -- lead se automaticky načte z databáze přes existující `useLeadsData` hook.

