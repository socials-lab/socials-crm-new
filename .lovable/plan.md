

## Plan: Zobrazit odesílatele v přehledu rozesílek

### Změny

**1. `src/pages/Broadcasts.tsx`**
- Rozšířit select query o `sent_by` a joinovat na `profiles` tabulku pro získání jména odesílatele
- Přidat sloupec "Odeslal" do tabulky mezi Předmět a Příjemců
- Zobrazit jméno (first_name + last_name) uživatele, který rozesílku odeslal

**2. `src/components/broadcasts/CreateBroadcastDialog.tsx`**
- Již ukládá `sent_by: user?.id` — žádná změna potřeba
- Dialog je přístupný jen adminům (tlačítko skryté pro ostatní)

### Technické detaily
- Query: `broadcasts` se selectne s `sent_by` a přes něj se joinuje `profiles(first_name, last_name)`
- Protože `broadcasts` tabulka není v generated types (používá `as any`), join se provede buď přes separátní dotaz na profiles, nebo inline
- Jednodušší varianta: načíst `sent_by` UUID a pak udělat lookup na profiles separátně, nebo použít `.select('*, profiles!sent_by(first_name, last_name)')` s typovým přetypováním

