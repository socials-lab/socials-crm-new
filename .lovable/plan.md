

## Plán: Nová zakázka pro stávajícího klienta (jiné SRO)

### Současný stav
V `expand_country` flow existuje checkbox "Nový shop je pod jiným SRO" s poli pro název, IČO, DIČ. To ale řeší jen přidání země ke stávající službě pod jinou entitu — **ne** vytvoření kompletně nové zakázky s vlastním portfoliem služeb.

Pro úplně novou zakázku (eshop B pod jiným SRO) je potřeba flow, který:
- Vezme existujícího klienta jako referenci
- Umožní zadat údaje nového SRO (nový klient v systému)
- Vytvoří novou nabídku s vlastním výběrem služeb a cen
- Po schválení vytvoří nového klienta + novou zakázku

### Navrhované řešení

**Nový typ úpravy: `new_engagement`** — "Nová zakázka (jiné SRO)"

Přidá se jako 6. typ do dropdown v `ProposeModificationDialog`. Tento typ je specifický tím, že výsledkem není úprava stávající zakázky, ale vytvoření nové.

### Změny

**1. `src/types/crm.ts`**
- Přidat `'new_engagement'` do `ModificationRequestType`
- Label: "Nová zakázka (jiné SRO)"
- Přidat do `isClientFacingRequestType`

**2. `src/components/engagements/ProposeModificationDialog.tsx`**
- Přidat `new_engagement` do `VISIBLE_REQUEST_TYPES` a `REQUEST_TYPE_LABELS`
- Nový flow pro `requestType === 'new_engagement'`:
  1. **Údaje nového klienta/SRO** — název společnosti, brand, IČO, DIČ (povinné pole: název)
  2. **Výběr služeb** — multi-select z katalogu služeb (stejný jako u `add_service`, ale lze přidat více najednou), každá s cenou a tierem
  3. **Celková měsíční cena** — součet všech služeb (auto-kalkulace)
  4. **Kontaktní osoba** — možnost zkopírovat z referenční zakázky nebo zadat novou
- `proposed_changes` bude obsahovat: `new_client_data`, `services[]` (pole služeb s cenami), `engagement_name`, `contact_person`

**3. `src/components/engagements/ModificationRequestCard.tsx`**
- Přidat ikonu a barvu pro `new_engagement` (např. `Building2`, indigo)

**4. `src/data/modificationRequestsMockData.ts`**
- Přidat `new_engagement` do validních typů

**5. `src/types/upgradeOffer.ts`**
- Přidat `'new_engagement'` do `UpgradeOfferChangeType`

### Flow v dialogu

```text
Krok 1: Vyber referenční zakázku (stávající klient)
Krok 2: Typ úpravy → "Nová zakázka (jiné SRO)"
Krok 3: Údaje nového SRO + výběr služeb s cenami
Krok 4: Datum, kdo dohodl, poznámka
→ Submit → Návrh ke schválení
```

### Výsledný seznam typů v dropdown
1. Přidání nové země
2. Přidání nové služby  
3. Úprava služby (cena + odměny)
4. Deaktivace služby
5. Přiřazení kolegy
6. **Nová zakázka (jiné SRO)** ← nový

### Dotčené soubory
- `src/types/crm.ts`
- `src/types/upgradeOffer.ts`
- `src/components/engagements/ProposeModificationDialog.tsx`
- `src/components/engagements/ModificationRequestCard.tsx`
- `src/data/modificationRequestsMockData.ts`

