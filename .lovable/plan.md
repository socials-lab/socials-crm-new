

## Vylepšení detailu leadu - 4 oblasti

### 1. Kontaktní osoba: telefon + role

V sekci "Kontaktní osoba" (collapsible) chybí telefon a pozice ve firmě. Přidám `contact_phone` a `contact_position` do zobrazení.

**Soubor:** `src/components/leads/LeadDetailDialog.tsx` (řádky 473-507)
- Přidat řádek s telefonem pod email (ikona Phone + odkaz `tel:`)
- Zobrazit pozici/roli vedle jména kontaktu

### 2. Vizuální odlišení Procesu vs Historie

Aktuálně oba sloupce vypadají jako timeline s kolečky a čárami. Řešení:

**Flow stepper (levý sloupec)** - vizuální redesign:
- Nahradit timeline styl za **kompaktní checklist/karty** - každý krok jako řádek s checkbox ikonou místo kruhů s čárou
- Použít pozadí (`bg-muted/30` rounded karty) pro dokončené kroky
- Akční tlačítka zvýraznit barvou

**Historie komunikace (pravý sloupec)** - default skrytá:
- Timeline se defaultně nezobrazuje
- Místo ní tlačítko "Zobrazit historii (X událostí)" které timeline rozbalí/sbalí
- Inline formulář pro poznámky zůstane vždy viditelný nahoře

**Soubory:**
- `src/components/leads/LeadFlowStepper.tsx` - redesign na checklist karty (bez vertical line)
- `src/components/leads/LeadDetailDialog.tsx` - obalit timeline do collapsible
- `src/components/leads/LeadCommunicationTimeline.tsx` - beze změn (jen wrapper v parent)

### 3. Služby v nabídce - zobrazení + editace + mazání

Po přidání služby uživatel nevidí co přidal. Řešení:

**V flow stepperu** pod krokem "Služby v nabídce":
- Zobrazit seznam přidaných služeb s názvem, cenou a tierem
- U každé služby tlačítko pro smazání (X)
- Celková suma nabídky pod seznamem

**Soubor:** `src/components/leads/LeadFlowStepper.tsx`
- Rozšířit krok `services` o inline zobrazení `lead.potential_services`
- Přidat callback `onRemoveService` pro mazání
- Zobrazit sumář ceny

**Soubor:** `src/components/leads/LeadDetailDialog.tsx`
- Přidat handler `handleRemoveService` který odebere službu z `potential_services`
- Předat nový prop `onRemoveService` do LeadFlowStepper

### 4. Zobrazení vytvořené nabídky

Pokud existuje `offer_url`, zobrazit v kroku "Nabídka vytvořena" odkaz na nabídku.

**Soubor:** `src/components/leads/LeadFlowStepper.tsx`
- V kroku `offer-created`: pokud `lead.offer_url` existuje, zobrazit odkaz "Zobrazit nabídku" (ExternalLink ikona)

### Technické změny - shrnutí

| Soubor | Změna |
|--------|-------|
| `LeadFlowStepper.tsx` | Redesign na checklist styl; služby inline s mazáním; odkaz na nabídku |
| `LeadDetailDialog.tsx` | Telefon + role u kontaktu; collapsible timeline; handler pro mazání služby |
| `LeadCommunicationTimeline.tsx` | Beze změn |

