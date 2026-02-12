

## Jednatelé s podíly vlastnictví z ARES

### Co se změní

**1. Rozšíření dat z ARES VR endpointu**
- Kromě jmen jednatelů se z VR API vytáhnou i **společníci** (`spolecnici`) s jejich podíly (`podpiravni.vklad.souhrn.hodnota` / celkový vklad)
- Kombinace dat: jednatel + vlastnický podíl (pokud je zároveň společníkem)
- Nový typ `directors` z `string[]` na `{ name: string; ownership_percent: number | null }[]`

**2. Úprava `fetchAresData` v AddLeadDialog.tsx**
- Parsování `zaznamy[0].spolecnici` pro vlastnické podíly
- Spojení se seznamem jednatelů - přiřazení procent podle jména
- Pokud jednatel není společník, zobrazí se bez procent
- Pokud společník není jednatel, zobrazí se také (jako "Společník")

**3. Zobrazení v AddLeadDialog (ARES info panel)**
- Místo prostých badge s jménem: `Jan Novák (50%)` nebo `Jan Novák (jednatel, 50%)`
- Vizuálně zvýrazněný decision maker (nejvyšší podíl)

**4. Zobrazení v LeadDetailDialog (tab Přehled)**  
- Stejný formát: jméno + podíl + role (jednatel/společník)
- Badge s procentem vlastnictví

**5. Úprava typu v crm.ts**
- `directors: string[] | null` -> `directors: Array<{ name: string; role: string; ownership_percent: number | null }> | null`
- Zpětná kompatibilita: pokud jsou uloženy staré string[], konvertovat při zobrazení

### Technické změny

**Soubory k úpravě:**

1. **`src/types/crm.ts`** - změna typu `directors`
2. **`src/components/leads/AddLeadDialog.tsx`** - rozšíření `fetchAresData`, parsování společníků + podílů, úprava zobrazení
3. **`src/components/leads/LeadDetailDialog.tsx`** - úprava zobrazení jednatelů s podíly

