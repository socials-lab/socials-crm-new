

## Sdileni tabulky cerpani kreditu Creative Boost s klientem

Pridame verejnou stranku a share link pro sdileni prehledu cerpani kreditu na urovni zakazky.

### Jak to bude fungovat

1. V dropdown menu u kazdeho klienta v Creative Boost prehledu pribudne polozka "Sdilet s klientem"
2. Kliknuti vygeneruje token a otevre dialog s odkazem ke zkopirovani (vzor: `SendApprovalDialog`)
3. Klient otevre verejnou stranku `/creative-boost/:token` -- vidi tabulku vystupu, progress kreditu a celkove shrnuti za dany mesic
4. Zadny login neni potreba, data se ukladaji do localStorage (demo rezim jako u ostatnich verejnych stranek)

### Nove soubory

**`src/pages/PublicCreativeBoostPage.tsx`**
- Verejny read-only prehled cerpani kreditu pro jeden mesic jednoho klienta
- Zobrazuje: nazev klienta/brandu, mesic, tabulku vystupu (typ, pocet, express, kredity), progress bar cerpani, shrnuti (vyuzito/maximum)
- Design inspirovany `PublicOfferPage` a `ExtraWorkApproval` -- Socials logo, minimalisticky layout
- Podpora `testMode` prop pro `/creative-boost-share-test`

### Upravene soubory

**`src/components/creative-boost/ClientsOverview.tsx`**
- Do `DropdownMenu` pridame polozku "Sdilet s klientem" s ikonou `Share2`
- Po kliknuti se otevre jednoduchy dialog s URL odkazem a tlacitkem "Zkopirovat odkaz"
- Token se generuje jako `crypto.randomUUID()` a uklada do localStorage spolu s daty pro sdileni

**`src/App.tsx`**
- Pridame route `/creative-boost/:token` pro `PublicCreativeBoostPage`
- Pridame test route `/creative-boost-share-test`

### Technicke detaily

- Data pro verejnou stranku se ukladaji do localStorage pod klicem `creative_boost_shares`
- Struktura ulozeneho zaznamu:
  ```text
  {
    token: string,
    clientId: string,
    clientName: string,
    brandName: string,
    year: number,
    month: number,
    maxCredits: number,
    usedCredits: number,
    pricePerCredit: number,
    outputs: Array<{ typeName, category, normalCount, expressCount, credits }>,
    createdAt: string
  }
  ```
- Pri generovani odkazu se aktualn data "zmrazi" do localStorage -- klient vidi snapshot
- Verejn stranka nepotrebuje autentizaci ani CreativeBoostProvider (cte primo z localStorage)

