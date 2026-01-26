-- Aktualizace leadu pro propojení s klientem TestBrand
-- Spusť tento SQL v Supabase SQL Editoru

UPDATE leads 
SET 
  -- Propojení s klientem a zakázkou
  converted_to_client_id = 'c0000000-0000-0000-0000-000000000001',
  converted_to_engagement_id = 'e0000000-0000-0000-0000-000000000001',
  converted_at = '2025-01-01T10:00:00Z',
  stage = 'won',
  
  -- Onboarding formulář
  onboarding_form_sent_at = '2024-12-27T09:00:00Z',
  onboarding_form_completed_at = '2024-12-28T14:30:00Z',
  
  -- Fakturační údaje z formuláře
  billing_street = 'Vinohradská 123',
  billing_city = 'Praha',
  billing_zip = '120 00',
  billing_country = 'Česká republika',
  billing_email = 'fakturace@potentialclient.cz',
  
  -- Nabídka
  offer_sent_at = '2024-12-20T11:00:00Z',
  
  -- Smlouva
  contract_url = 'https://digisign.example.com/contract/abc123',
  contract_created_at = '2024-12-29T08:00:00Z',
  contract_sent_at = '2024-12-29T09:00:00Z',
  contract_signed_at = '2024-12-30T15:00:00Z',
  
  -- Poznámky
  summary = 'Klient hledá komplexní správu sociálních sítí a kreativní výstupy. Měsíční budget na reklamu cca 50 000 CZK.',
  client_message = 'Máme zájem o dlouhodobou spolupráci na správě našich sociálních sítí. Rádi bychom začali od února.'
  
WHERE id = '20000000-0000-0000-0000-000000000001';
