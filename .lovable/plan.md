
Cíl: upravit flow „Navrhnout úpravu zakázky“ tak, aby:
1) cena byla vždy doporučená, ale finálně editovatelná,
2) interní náklad byl počítán z odměn konkrétních kolegů (ne 0),
3) marže se okamžitě přepočítá podle finální ceny + finálních odměn.

Co jsem našel v aktuálním kódu (root cause):
- V `PricingImpactSection` je u scénářů `expand_country/expand_shop` „Nová cena položky“ jen read-only box a `deltaRevenue` se bere natvrdo z `reference * multiplier`.
- `onPriceChange` se volá z efektu při každém přepočtu, takže ruční edit ceny se přepisuje.
- Doporučení odměn pro core služby se často nevygeneruje, protože lookup čeká tier, ale komponenta ho nedostává (`selected_tier` z katalogové služby tam není).
- Tabulka odměn kolegů se zobrazuje jen když existuje recommendation; jinak může být interní náklad 0 a marže je zkreslená.

Implementační plán

1) Udělat „doporučená vs finální cena“ (editable)
- Soubor: `src/components/engagements/PricingImpactSection.tsx`
- Přidat:
  - `recommendedPrice` (z reference + multiplikátor),
  - editovatelný input „Finální cena položky“ (napojený na `onPriceChange`),
  - text „Doporučená cena: X Kč“ + akce „Použít doporučenou“.
- Přepočet marže bude vycházet z finální (ručně upravené) ceny, ne jen z doporučené.
- U ostatních produktů (addon/custom) zůstane cena editovatelná stejně jako dnes, ale sjednotím UI, aby bylo jasné, co je doporučení a co finální hodnota.

2) Opravit generování doporučených odměn pro kolegy (hlavně nová země)
- Soubor: `src/components/engagements/ProposeModificationDialog.tsx`
- Do `PricingImpactSection` předat explicitně:
  - vybraný tier (`selectedTier`),
  - případně název/službu pro update scénáře.
- Soubor: `src/components/engagements/PricingImpactSection.tsx`
- Reward lookup nepůjde přes `(selectedCatalogService as any).selected_tier`, ale přes prop z parentu.
- Tím se správně načtou Socials/PPC/Performance GROWTH/PRO/ELITE odměny i pro „novou zemi“.

3) Umožnit výběr kolegy a editaci odměny vždy (ne jen při matchi)
- Soubor: `src/components/engagements/PricingImpactSection.tsx`
- Rozšířit sekci „Odměny kolegů“:
  - pokud je recommendation: předvyplnit řádky (role/hodiny/odměna),
  - pokud recommendation není: ukázat prázdný řádek + tlačítko „Přidat kolegu“.
- Každý řádek: role, kolega, hodiny, odměna, typ odměny; možnost smazat/přidat řádek.
- `deltaInternalCost` vždy = součet odměn z tabulky (fallback `manualInternalCost` ponechám jen jako nouzový režim pro custom případy).

4) Zabránit tomu, aby marže šla bez interního nákladu
- Soubor: `src/components/engagements/PricingImpactSection.tsx`
- Přidat validaci/warning:
  - pokud je cena > 0 a interní náklad = 0, zobrazit výrazné upozornění.
- Soubor: `src/components/engagements/ProposeModificationDialog.tsx`
- Před submitem přidat guard (u add_service + pricing snapshot): nepustit odeslání bez interního nákladu nebo bez alespoň jednoho odměňovaného řádku.

5) Uložit a zobrazit vše konzistentně v review
- Soubory: `src/utils/pricingEngine.ts`, `src/components/engagements/ModificationRequestCard.tsx`
- `PricingSnapshot.colleague_rewards` už existuje; doplním, aby se ukládala i finální editovaná cena a byl jasný rozdíl doporučená vs finální (pro audit schvalování).
- V kartě návrhu zobrazit stručně:
  - doporučená cena,
  - finální cena,
  - sumář odměn kolegů,
  - výsledná marže.

Technické detaily (co přesně se bude měnit)
- `ProposeModificationDialog.tsx`
  - nové props do `PricingImpactSection` (`selectedTier`, případně metadata vybrané položky),
  - submit validace interních nákladů.
- `PricingImpactSection.tsx`
  - oddělení `recommendedPrice` a `finalPrice`,
  - odstranění přepisování ruční ceny při každém renderu,
  - robustní rewards editor (pre-fill + manual rows + add/remove),
  - `deltaInternalCost` z kolegů, live přepočet marže.
- `pricingEngine.ts`
  - doplnění snapshotu o pole pro audit finální ceny vs doporučení (bez změny workflow).
- `ModificationRequestCard.tsx`
  - čitelnější zobrazení finální ceny a interních odměn.

Akceptační scénáře po implementaci
1) Nová země: systém nabídne cenu (multiplier), uživatel ji ručně změní, marže se hned přepočte.
2) Nová země + Socials/PPC/Performance tier: objeví se doporučené role a částky, lze vybrat konkrétní kolegy a upravit jejich odměny.
3) Addon/jiný produkt bez match v tabulce: lze ručně přidat kolegy a odměny; marže se počítá z těchto nákladů.
4) Bez interního nákladu nepůjde návrh omylem odeslat (nebo bude minimálně výrazné blokující upozornění dle zvolené validace).
