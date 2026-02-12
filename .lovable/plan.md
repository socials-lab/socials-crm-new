

## Redesign detailu leadu - jasné flow + kompletní historie

### ✅ Implementováno

**Layout:** 2-sloupcový dialog (max-w-5xl, h-[90vh])
- Levý sloupec: Flow stepper + collapsible info sekce (firma, kontakt, obchodní info, fakturace)
- Pravý sloupec (380px): Inline formulář pro poznámky + timeline historie

**Flow stepper (LeadFlowStepper.tsx):**
1. Lead vytvořen ✓
2. Žádost o přístupy → tlačítko Odeslat
3. Přístupy přijaty → tlačítko Potvrdit  
4. Služby v nabídce → tlačítko Přidat službu
5. Nabídka vytvořena → tlačítko Vytvořit
6. Nabídka odeslána → tlačítko Odeslat
7. Onboarding formulář → tlačítko Odeslat formulář
8. Smlouva → tlačítko Označit/Potvrdit podpis
9. Převedeno na zakázku → tlačítko Převést

**Timeline:** Zobrazuje emaily (odeslaný/přijatý s vizuálním odlišením), hovory, interní poznámky, systémové události chronologicky.

**Typy:** LeadNoteType rozšířen o `email_sent` | `email_received`, LeadNote má `subject` a `recipients`.
