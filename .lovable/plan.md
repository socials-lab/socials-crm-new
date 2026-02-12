

## Redesign detailu leadu - jasné flow + kompletní historie

### Problem
Současný 4-tabový layout skrývá důležité akce (onboarding, převedení) do různých tabů. Uživatel musí přepínat mezi taby aby viděl co je potřeba udělat. Chybí jasná vizuální flow od začátku do konce.

### Nový layout: 2 sloupcový s flow kroky

```text
+-------------------------------------------+---------------------------+
|  Header: Firma, badge, Upravit, Převést   |                           |
+-------------------------------------------+                           |
|                                           |                           |
|  FLOW KROKY (vertikální stepper)          |   TIMELINE + POZNÁMKY     |
|                                           |                           |
|  1. [✓] Lead vytvořen                     |   [Přidat poznámku]       |
|  2. [✓] Žádost o přístupy odeslána        |   [Přidat záznam hovoru]  |
|  3. [ ] Přístupy přijaty -> [Potvrdit]    |                           |
|  4. [ ] Služby přidány (3/0)              |   -- Timeline --          |
|  5. [ ] Audit proveden                    |   12.2. Nabídka odeslána  |
|  6. [ ] Nabídka vytvořena -> [Vytvořit]   |     "Text emailu..."      |
|  7. [ ] Nabídka odeslána -> [Odeslat]     |   10.2. Záznam z hovoru   |
|  8. [ ] Onboarding odeslán -> [Odeslat]   |     "Klient souhlasí..."   |
|  9. [ ] Smlouva podepsána                 |   8.2. Žádost o přístupy  |
| 10. [ ] Převedeno na zakázku -> [Převést] |     "Odeslána na..."       |
|                                           |   5.2. Lead vytvořen      |
|  --- Firemní údaje (collapsible) ---      |                           |
|  --- Kontakt (collapsible) ---            |                           |
|  --- Obchodní info ---                    |                           |
+-------------------------------------------+---------------------------+
```

### Co se změní

**1. Zrušení 4 tabů, nahrazení 2-sloupcovým layoutem**
- Levý sloupec (~60%): Flow stepper + detailní info (collapsible sekce)
- Pravý sloupec (~40%): Timeline historie + přidávání poznámek

**2. Flow stepper (levý sloupec)**
Vizuální vertikální stepper se všemi kroky lead procesu:
- Zelená fajfka = hotovo (s datem)
- Oranžový kroužek = aktuální krok (s akčním tlačítkem)
- Šedý prázdný = budoucí krok
- Každý krok má inline akční tlačítko pokud je relevantní

Kroky:
1. Lead vytvořen (created_at)
2. Žádost o přístupy odeslána (access_request_sent_at) -> tlačítko "Odeslat"
3. Přístupy přijaty (access_received_at) -> tlačítko "Potvrdit"
4. Služby v nabídce (počet služeb) -> tlačítko "Přidat službu"
5. Nabídka vytvořena (offer_created_at) -> tlačítko "Vytvořit nabídku"
6. Nabídka odeslána (offer_sent_at) -> tlačítko "Odeslat nabídku"
7. Onboarding formulář odeslán (onboarding_form_sent_at) -> tlačítko "Odeslat formulář"
8. Onboarding vyplněn (onboarding_form_completed_at)
9. Smlouva odeslána + podepsána (contract_sent_at, contract_signed_at)
10. Převedeno na zakázku (converted_at) -> tlačítko "Převést na zakázku"

**3. Timeline s obsahem komunikace (pravý sloupec)**
- Zobrazení co bylo napsáno/odesláno klientovi (texty emailů z RequestAccessDialog, SendOfferDialog, SendOnboardingFormDialog)
- Poznámky z hovorů a interní poznámky prokládané chronologicky
- Inline formulář pro rychlé přidání poznámky (typ: obecná / hovor / interní)
- Každá událost ukazuje kdo ji provedl (pokud je owner_id)

**4. Detailní info pod flow stepperem**
- Collapsible sekce: Firemní údaje (IČO, DIČ, ARES, jednatelé), Kontakt, Obchodní info, Fakturace
- Defaultně otevřené pro nové leady, zavřené pro rozpracované

**5. Obsah komunikace**
- V timeline se zobrazí i text/předmět odeslaných emailů
- RequestAccessDialog, SendOfferDialog, SendOnboardingFormDialog budou při odeslání ukládat obsah emailu do poznámky leadu (note_type: 'email_sent')
- Rozšíření LeadNoteType o 'email_sent' a 'email_received'
- Pole `subject` a `recipients` v LeadNote pro emailové poznámky

### Technické změny

**Soubory k úpravě:**

1. **`src/types/crm.ts`**
   - Rozšíření LeadNoteType o `'email_sent' | 'email_received'`
   - Přidání volitelných polí do LeadNote: `subject`, `recipients`

2. **`src/components/leads/LeadDetailDialog.tsx`** - kompletní přepis
   - Zrušení Tabs, nahrazení 2-sloupcovým layoutem
   - Levý sloupec: nová komponenta LeadFlowStepper + collapsible info sekce
   - Pravý sloupec: timeline + inline přidávání poznámek
   - Přesun tlačítka "Převést na zakázku" do flow stepperu jako poslední krok

3. **`src/components/leads/LeadCommunicationTimeline.tsx`** - refaktor
   - Zrušení sekce "Čekající akce" (přesunuto do flow stepperu)
   - Přidání zobrazení emailového obsahu (subject, recipients, text)
   - Vizuální odlišení emailů odeslaných vs přijatých
   - Inline formulář pro přidání poznámky přímo v timeline

4. **`src/components/leads/LeadNotesTab.tsx`** - sloučení do timeline
   - Funkcionalita přidávání poznámek se přesune do inline formuláře v pravém sloupci
   - Soubor může zůstat jako helper nebo se smaže

5. **`src/components/leads/RequestAccessDialog.tsx`** - při odeslání uložit obsah emailu jako poznámku

6. **`src/components/leads/SendOfferDialog.tsx`** - při odeslání uložit obsah jako poznámku

7. **`src/components/leads/SendOnboardingFormDialog.tsx`** - při odeslání uložit obsah jako poznámku

8. **`src/hooks/useLeadsData.tsx`** - rozšíření addNote o nová pole (subject, recipients)

**Nové soubory:**
- `src/components/leads/LeadFlowStepper.tsx` - vertikální stepper komponenta

### Vizuální styl
- Dialog: `max-w-5xl`, `h-[90vh]`
- Levý sloupec: stepper s ikonami, zelená/oranžová/šedá
- Pravý sloupec: border-left oddělení, vlastní ScrollArea
- Flow kroky: kompaktní, ale jasně čitelné
- Collapsible sekce: Radix Collapsible s chevronem
