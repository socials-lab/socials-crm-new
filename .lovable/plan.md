

## Oprava údajů o jednatelích leadu Socials Advertising s.r.o.

### Co je špatně
V demo leadu jsou uvedeni fiktivní jednatelé (Daniel Kocián 70%, Petra Nováková 30%). Správné údaje z obchodního rejstříku jsou jiné.

### Skutečné údaje z rejstříku (IČO 08186464)

| Osoba | Role | Podíl |
|-------|------|-------|
| Daniel Bauer | Jednatel (od 23.5.2019) | 80 % |
| Otakar Lucák | Jednatel (od 26.8.2021) | 20 % |

- Sídlo: Korunní 2569/108, Vinohrady, 101 00 Praha
- Základní kapitál: 100 000 Kč
- Založena: 23.5.2019
- DIČ: CZ08186464
- Spisová značka: C 314420/MSPH

### Co se změní

Soubor `src/hooks/useLeadsData.tsx` -- aktualizace demo leadu:

1. **directors** -- oprava na skutečné jednatele:
   - Daniel Bauer, Jednatel, 80 %
   - Otakar Lucák, Jednatel, 20 %
2. **founded_date** -- oprava na `2019-05-23`
3. **contact_name** -- oprava na `Daniel Bauer` (hlavní jednatel)
4. **contact_phone** -- oprava na `+420 774 536 699` (z rejstříku)
5. **contact_email** -- ponechat `danny@socials.cz` nebo změnit na `socials@socials.cz` (oficiální e-mail z rejstříku)
6. **dic** -- doplnit `CZ08186464`

Jedná se o jedinou změnu v jednom souboru, pouze úprava hodnot v objektu `demoSocialsLead`.

