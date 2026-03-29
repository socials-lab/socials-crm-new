

## Offboarding kolegy – deaktivace Google Workspace, Slack a Freelo

### Co se bude dělat

Přidáme **offboarding dialog** pro kolegy, který umožní deaktivovat/odebrat kolegu ze 3 systémů:

1. **Google Workspace** – suspendování účtu (ne smazání) přes Admin Directory API
2. **Slack** – deaktivace uživatele přes `users.admin.setInactive`
3. **Freelo** – odebrání ze všech projektů přes API

Plus nastavení statusu kolegy na `left` a zaznamenání data ukončení.

### Struktura

#### 1. Nová edge funkce `offboard-colleague/index.ts`
- Přijme `email` a volitelné flagy: `deactivate_google`, `deactivate_slack`, `remove_freelo`
- **Google**: Použije existující `getGoogleAccessToken()` logiku, zavolá `PUT /admin/directory/v1/users/{userKey}` s `{ suspended: true }`
- **Slack**: Použije `SLACK_ADMIN_TOKEN`, zavolá `users.admin.setInactive` s emailem uživatele (nejdřív lookup přes `users.lookupByEmail`)
- **Freelo**: Použije `FREELO_API_KEY`, najde všechny projekty uživatele a odebere ho (Freelo API `manage-workers` s `remove`)
- Vrátí výsledky pro každý systém (úspěch/chyba)

#### 2. Nový dialog `OffboardColleagueDialog.tsx`
- Otevírá se z `ColleagueCard` tlačítkem "Ukončit spolupráci" (jen pro super admina)
- Zobrazí jméno a email kolegy
- 3 checkboxy (defaultně zaškrtnuté):
  - ☑ Deaktivovat Google Workspace
  - ☑ Deaktivovat Slack
  - ☑ Odebrat z Freelo projektů
- Tlačítko "Ukončit spolupráci" → zavolá edge funkci, pak aktualizuje kolegu (`status: 'left'`)
- Zobrazí souhrn výsledků (co se povedlo, co ne)

#### 3. Úprava `ColleagueCard.tsx`
- Přidat tlačítko "Ukončit spolupráci" vedle "Upravit" (jen pro super admina, jen pro aktivní kolegy)

### Technické detaily

- Google API: scope `https://www.googleapis.com/auth/admin.directory.user` už máme nakonfigurovaný
- Slack: `users.admin.setInactive` vyžaduje admin token – `SLACK_ADMIN_TOKEN` už existuje
- Freelo: API pro odebrání uživatele z projektů – použijeme `manage-workers` endpoint s parametrem pro odebrání
- Všechny potřebné secrets už jsou nakonfigurované

### Omezení
- Freelo API nemusí mít přímý endpoint pro "odebrat ze všech projektů naráz" – možná bude třeba iterovat přes projekty. Ověřím při implementaci.
- Slack `users.admin.setInactive` je undocumented API – stejně jako stávající invite endpoint.

