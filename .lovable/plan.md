

## Test stranka pro schvaleni viceprace

Pridam testovaci routu `/extra-work-approval-test`, ktera zobrazi `ExtraWorkApproval` komponentu s mock daty -- bez nutnosti vytvaret skutecnou vicepraci a generovat token.

### Zmeny

**1. Uprava `ExtraWorkApproval.tsx`**
- Pridam volitelny prop `testMode?: boolean`
- Kdyz je `testMode=true`, komponenta pouzije hardcoded mock data misto cteni z localStorage
- Mock data: nazev "Redesign homepage banneru", popis, 5h x 1 200 Kc/h = 6 000 Kc
- Schvaleni/zamitnuti v test modu jen prepne vizualni stav (bez zapisu do localStorage)

**2. Uprava `App.tsx`**
- Pridam routu: `<Route path="/extra-work-approval-test" element={<ExtraWorkApproval testMode />} />`
- Umistim vedle existujiciho `/offer-test` vzoru

### Technicke detaily

**`ExtraWorkApproval.tsx`:**
- Novy prop `testMode?: boolean`
- V useEffect: pokud `testMode`, nastavi mock data a preskoci localStorage lookup
- handleApprove/handleReject v testMode pouze meni actionState bez side effectu

**`App.tsx`:**
- Nova routa `/extra-work-approval-test` s `<ExtraWorkApproval testMode />`

Po implementaci bude stranka dostupna na `/extra-work-approval-test`.

