

## Inline editace v detailu leadu

### Aktuální stav
Kliknutí na "Upravit" otevírá nový dialog (AddLeadDialog) se všemi poli. Uživatel musí opustit detail, vyplnit formulář a uložit.

### Nový přístup
Pole v detailu leadu budou přímo editovatelná. Kliknutím na hodnotu se přepne na input, po odkliknutí/Enteru se uloží. Tlačítko "Upravit" z headeru zmizí.

### Komponenta `InlineEditField`
Nová sdílená komponenta pro inline editaci:
- **Zobrazení**: text s jemnou hover indikací (podtržení/ikona tužky)
- **Editace**: klik přepne na input/textarea/select
- **Uložení**: blur nebo Enter zavolá `updateLead()`
- **Zrušení**: Escape vrátí původní hodnotu
- Varianty: `text`, `textarea`, `select`, `number`, `url`

### Změny v souborech

**1. Nový soubor: `src/components/leads/InlineEditField.tsx`**
- Generická komponenta s props: `value`, `onSave`, `type`, `options` (pro select), `placeholder`, `prefix`, `suffix`
- Hover stav: `cursor-pointer border-b border-dashed border-transparent hover:border-muted-foreground/40`
- Edit stav: renderuje odpovídající input element
- Auto-focus při přepnutí do edit módu

**2. `src/components/leads/LeadDetailDialog.tsx`**
- Odstranit tlačítko "Upravit" z headeru a prop `onEdit`
- Odstranit import a použití `AddLeadDialog` pro editaci (ponechat pro vytváření nových leadů)
- Nahradit statické texty za `InlineEditField` komponenty:

| Sekce | Pole | Typ |
|-------|------|-----|
| Header | Název firmy | text |
| Header | Odhadovaná cena | number |
| Firemní údaje | IČO | text (s ARES lookup) |
| Firemní údaje | DIČ | text |
| Firemní údaje | Web | url |
| Firemní údaje | Obor | text |
| Firemní údaje | Adresa (ulice, město, PSČ) | text |
| Kontakt | Jméno | text |
| Kontakt | Pozice | text |
| Kontakt | Email | text |
| Kontakt | Telefon | text |
| Obchodní info | Zdroj | select |
| Obchodní info | Pravděpodobnost | number (%) |
| Obchodní info | Měsíční investice | number |
| Obchodní info | Zpráva od klienta | textarea |
| Obchodní info | Shrnutí | textarea |
| Fakturace | Fakturační email | text |

Každé pole při uložení volá `updateLead(lead.id, { [field]: newValue })` a zobrazí toast.

**3. `src/pages/Leads.tsx`**
- Odstranit prop `onEdit` z `LeadDetailDialog`
- Odstranit state `editingLead` a logiku pro otevření edit dialogu z detailu (ponechat AddLeadDialog jen pro "Přidat lead")

### Interakční vzor

```text
+------------------------------------------+
|  Firemní údaje                           |
|                                          |
|  IČO          DIČ                        |
|  [12345678]   [CZ12345678]               |
|   ^hover: dashed underline               |
|   ^click: inline input appears           |
|                                          |
|  Web                                     |
|  [www.firma.cz] <- klikni a uprav        |
+------------------------------------------+
```

### Co zůstane beze změny
- `AddLeadDialog` zůstane pro vytváření nových leadů (tlačítko "Přidat lead" na stránce Leads)
- Stav (stage) a odpovědná osoba - už jsou editovatelné přes Select v headeru
- Proces (LeadFlowStepper) - beze změn
- Poznámky a historie - beze změn
