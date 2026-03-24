

# Integrační panel pro modul Zájemci

## Co se udela

Webhook `prospect-webhook` uz existuje a funguje. Chybi jen UI, ktere uzivateli ukaze jak ho pouzit. Vytvorim dialog s hotovymi snippety ke kopirovani.

## Nova komponenta: `ProspectIntegrationDialog.tsx`

Dialog se 3 taby:

### Tab 1: HTML Formuler
- Hotovy HTML+JS snippet s formularem (jmeno, email, telefon, firma)
- Konfigurovatelne pole pro `interaction_type` (select: webinar, lead magnet, other) a `interaction_title` (text input — nazev webinare/lead magnetu)
- Po zmene se snippet dynamicky aktualizuje
- Tlacitko "Kopirovat" pro zkopirovat cely snippet

### Tab 2: Webhook API
- Zobrazena URL: `https://empndmpeyrdycjdesoxr.supabase.co/functions/v1/prospect-webhook`
- Authorization header s anon key
- JSON payload priklad
- cURL priklad
- Fetch priklad
- Vse s tlacitky "Kopirovat"

### Tab 3: Test
- Jednoduchy formular primo v CRM pro otestovani webhooku (jmeno, email, typ, nazev)
- Odesle data na webhook a ukaze vysledek

## Uprava `Prospects.tsx`
- Pridani tlacitka "Napojeni" (ikona `Code`) vedle titulku v PageHeader
- Otevre `ProspectIntegrationDialog`

## Zadne DB zmeny — vse uz existuje.

