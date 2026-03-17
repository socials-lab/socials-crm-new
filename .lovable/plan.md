

## Plan: Přidání nové země jako samostatný typ úpravy

### Problém
Aktuálně je "Přidání nové země" schované jako scénář uvnitř "Přidání nové služby", kde se uživatel musí proklikat k referenční službě. Přitom přidání nové země je nejčastější úprava a koncepčně je jiná — nejde o novou službu, ale o rozšíření stávající služby do další země.

### Navrhované změny

**1. Nový typ úpravy `expand_country` v typovém systému**
- `src/types/crm.ts`: Přidat `'expand_country'` do `ModificationRequestType`, label "Přidání nové země"
- Přidat do `isClientFacingRequestType`

**2. Úprava dropdown typů v dialogu**
- `src/components/engagements/ProposeModificationDialog.tsx`:
  - Přidat `expand_country` do `VISIBLE_REQUEST_TYPES` a `REQUEST_TYPE_LABELS` 
  - Nový blok pro `requestType === 'expand_country'` ve step 3:
    1. **Referenční služba** — dropdown stávajících aktivních služeb na zakázce (např. "Socials Boost CZ – 25 000 Kč")
    2. **Nová země** — výběr z `MANAGED_COUNTRIES` (multi-select nebo single select pro zemi, kterou přidáváme)
    3. **Název nové služby** — auto-generovaný z referenční služby + kód země (např. "Socials Boost SK"), editovatelný
    4. **Multiplikátor + Finální cena** — jako aktuálně v PricingImpactSection pro expand_country
    5. **Odměny kolegů** — automaticky z referenční služby × multiplikátor

**3. Zjednodušení `add_service`**
- Z `add_service` flow odstranit celou logiku referenční služby a scénářů (expand_country, expand_shop)
- `add_service` bude čistě "přidávám úplně novou službu" — bez referenční služby, bez multiplikátoru
- `PricingImpactSection` pro `add_service` nebude ukazovat typ scénáře ani referenční službu, jen přímý vstup ceny a odměn kolegů

**4. Úprava `PricingImpactSection.tsx`**
- Přidat nový prop `requestType` pro rozlišení chování
- Pro `expand_country`: zobrazit referenční službu, multiplikátor, kalkulaci ceny, auto-odměny
- Pro `add_service` / `add_addon`: skrýt scénáře, jen přímý vstup interních nákladů/odměn
- Ponechat `expand_shop` jako scénář v rámci `expand_country` flow (checkbox "Nový shop pod jiným SRO" zůstane)

**5. Handlesubmit pro `expand_country`**
- Nový case v `handleSubmit` switch — `proposed_changes` bude obsahovat:
  - `reference_service_id`, `reference_service_name`
  - `new_country_code`, `new_country_name`
  - `service_name` (nový název služby)
  - `price` (finální cena po multiplikátoru)
  - `multiplier`
  - `pricing_snapshot` z PricingImpactSection

**6. Co zůstane u `expand_shop`**
- `expand_shop` scénář zůstane jako checkbox/varianta v rámci `expand_country` — "Jedná se o nový shop / značku pod jiným SRO?" Tím se otevřou pole pro nového klienta (IČO, DIČ atd.)

### Výsledný seznam typů úprav v dropdown
1. **Přidání nové země** ← nový, nejčastější
2. Přidání nové služby
3. Úprava služby (cena + odměny)
4. Deaktivace služby
5. Přiřazení kolegy

### Dotčené soubory
- `src/types/crm.ts` — nový typ
- `src/components/engagements/ProposeModificationDialog.tsx` — nový flow pro expand_country, zjednodušení add_service
- `src/components/engagements/PricingImpactSection.tsx` — refaktor pro podporu nového requestType
- `src/utils/pricingEngine.ts` — případné drobné úpravy typů
- `src/types/upgradeOffer.ts` — pokud potřeba rozšířit UpgradeOfferChangeType

