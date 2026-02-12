

## Vylepšení detailu klienta -- doplnění údajů z leadu

### Co se změní

V rozbalené kartě klienta se do sekce "Firemní údaje" přidají:

1. **Spolehlivý plátce DPH** -- barevný badge vedle DIČ (zelený = spolehlivý, červený = nespolehlivý), využívající existující hook `useVatReliability`
2. **Odkaz na Hlídač státu** -- vedle odkazu na ARES přidat ikonu s odkazem na `https://www.hlidacstatu.cz/subjekt/{ico}`
3. **Finanční varování (dotace, insolvence)** -- zobrazit `CompanyFinancials` komponentu pod firemní údaje klienta, stejně jako u leadu

### Technické detaily

**Soubor: `src/pages/Clients.tsx`**

1. Importovat `useVatReliability` hook a ikony `ShieldCheck`, `ShieldAlert`
2. V sekci "Firemní údaje" (řádek ~480-527):
   - U řádku s IČO (řádek ~482) přidat vedle ARES ikony i odkaz na Hlídač státu
   - U řádku s DIČ (řádek ~494-496) přidat VAT reliability badge -- volat `useVatReliability(client.dic)` a zobrazit výsledek jako barevný štítek
3. Pod sekci firemních údajů přidat `CompanyFinancials` komponentu pro zobrazení varování o dotacích a insolvenci

Protože `useVatReliability` je hook a nelze ho volat podmíněně uvnitř mapy, vytvoří se malá pomocná komponenta `ClientCompanyInfo`, která zapouzdří volání hooku pro konkrétního klienta.

**Nová komponenta (inline v `Clients.tsx` nebo samostatný soubor):**

```text
ClientVatBadge({ dic }) 
  -> useVatReliability(dic)
  -> zobrazí ShieldCheck (zelený) nebo ShieldAlert (červený) badge
```

Žádné nové závislosti ani databázové změny nejsou potřeba -- vše využívá existující kód.

