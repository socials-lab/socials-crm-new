

## Oprava auto-fill adresy a přidání spisové značky

### Problem 1: Adresa se nedoplňuje
V `LeadDetailDialog` se při uložení IČO volá `updateLead` dvakrát rychle za sebou -- jednou pro IČO a podruhé pro adresu z ARES. První volání **nemá `await`**, což způsobuje race condition: obě mutace běží paralelně, invalidují stejný query cache, a druhý update se ztratí.

**Oprava:** Sloučit oba updateLead volání do jednoho. Nejdříve stáhnout data z ARES, pak uložit IČO + adresu + všechno ostatní najednou v jednom `updateLead` callu.

### Problem 2: Chybí spisová značka
ARES VR API vrací pole `spisovaZnacka` s údaji `soud`, `oddil`, `vlozka` (např. "C 314420 vedená u Městského soudu v Praze"). Tato data se momentálně nescrapují.

---

### Kroky implementace

#### 1. Rozšířit `fetchAresData` v `src/utils/aresUtils.ts`
- Přidat do `AresData` interface dvě nová pole: `spisovaZnacka: string | null` a `evidpiravnUrad: string | null`
- Z VR API endpointu extrahovat `spisovaZnacka[0].oddil`, `spisovaZnacka[0].vlozka`, `spisovaZnacka[0].soud`
- Sestavit čitelný řetězec: "C 314420 vedená u Městského soudu v Praze"

Mapování soudů (kód -> název):
- MSPH = Městský soud v Praze
- KSCB = Krajský soud v Českých Budějovicích
- KSPL = Krajský soud v Plzni
- KSUL = Krajský soud v Ústí nad Labem
- KSHK = Krajský soud v Hradci Králové
- KSBR = Krajský soud v Brně
- KSOS = Krajský soud v Ostravě

#### 2. Přidat DB sloupec `court_registration`
- Přidat sloupec `court_registration TEXT` do tabulky `leads`

#### 3. Aktualizovat typ `Lead` v `src/types/crm.ts`
- Přidat `court_registration: string | null`

#### 4. Opravit auto-fill v `LeadDetailDialog.tsx`
- Přepsat handler `onSave` pro IČO pole:
  - Nejdříve zavolat `fetchAresData` (pokud je IČO validní 8-místný)
  - Pokud ARES vrátí data, sloučit IČO + adresu + všechna data do JEDNOHO `updateLead` volání
  - Pokud ARES nevrátí data, uložit pouze IČO
- Přidat zobrazení spisové značky pod IČO/DIČ v sekci "Firemní údaje"

#### 5. Zobrazení spisové značky v detailu leadu
- Přidat nový řádek pod IČO/DIČ grid s ikonou `Scale` (lucide) a textem spisové značky
- Formát: "C 314420, Městský soud v Praze"

---

### Technické detaily

**Upravené soubory:**
- `src/utils/aresUtils.ts` -- přidat `spisovaZnacka` do `AresData` a parsování z VR API
- `src/types/crm.ts` -- přidat `court_registration` do `Lead` interface
- `src/components/leads/LeadDetailDialog.tsx` -- opravit race condition, zobrazit spisovou značku
- DB migrace -- přidat sloupec `court_registration` do tabulky `leads`

**Kořen problému s adresou:**
Řádek 417 volá `updateLead(lead.id, { ico: v })` bez `await`, a řádek 435 volá `updateLead(lead.id, updates)`. Obě mutace se odpalují téměř současně. Řešení: jeden `updateLead` call se všemi daty.
