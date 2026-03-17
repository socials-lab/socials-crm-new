

## Plan: Zobrazení jmen kolegů u služeb na klientské nabídce

### Kontext
Data o kolezích (jméno, role) jsou již uložena v `pricing_snapshot.colleague_rewards` jako `ColleagueRewardEntry[]` (s polem `colleague_name` a `role`). Stačí je zobrazit na stránce `/upgrade/:token`.

### Změny

**`src/pages/UpgradeOfferPage.tsx`**

V metodě `renderChangeDetailsForItem` (a `renderChangeDetails`) přidám pod detaily každé služby sekci "Váš tým", která zobrazí jména a role kolegů přiřazených k dané službě:

- Pokud má nabídka `pricing_snapshot.colleague_rewards`, vyfiltruju kolegy relevantní pro danou službu (nebo zobrazím všechny pokud jde o single-service nabídku)
- Zobrazím je jako kompaktní seznam s ikonkou uživatele: **Role** — Jméno kolegy
- U bundle nabídek (více položek) se pokusím namatchovat kolegy na službu přes `service_id` nebo zobrazím společný tým pod všemi službami
- Bez cen — klient vidí pouze jméno a pozici/roli

Vizuálně: malá sekce s nadpisem "👤 Váš tým" pod cenou každé služby, s kartičkami nebo badges pro každého kolegu.

### Soubory k úpravě
- `src/pages/UpgradeOfferPage.tsx` — přidání sekce s jmény kolegů do renderChangeDetailsForItem a renderChangeDetails

