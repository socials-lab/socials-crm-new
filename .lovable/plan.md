

## Plan: Add info tooltips (ℹ️) to non-obvious fields in ProposeModificationDialog

### What
Add small `Info` icon tooltips next to labels throughout the dialog where the meaning or logic isn't immediately obvious. Uses the existing `Tooltip` components from `@/components/ui/tooltip`.

### Implementation

**Single file: `src/components/engagements/ProposeModificationDialog.tsx`**

1. Import `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` from `@/components/ui/tooltip`
2. Create a small inline helper component:
```tsx
const InfoTip = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="h-3.5 w-3.5 ml-1 inline-block text-muted-foreground cursor-help shrink-0" />
    </TooltipTrigger>
    <TooltipContent className="max-w-[300px] text-xs">{text}</TooltipContent>
  </Tooltip>
);
```
3. Wrap `DialogContent` children in `<TooltipProvider delayDuration={200}>`
4. Add `<InfoTip>` next to these labels:

| Field | Tooltip text (CZ) |
|---|---|
| **Multiplikátor** (~line 1018) | "Koeficient pro výpočet ceny nové země. 0.5 = polovina ceny CZ služby. Např. CZ služba za 20 000 Kč × 0.5 = 10 000 Kč pro SK." |
| **Finální cena** (expand_country, ~line 1035) | "Výsledná měsíční cena pro klienta. Automaticky se počítá z multiplikátoru, ale můžete ji ručně upravit." |
| **Nový shop pod jiným SRO** (~line 1074) | "Zaškrtněte, pokud nová země běží pod jinou právní entitou (jiné IČO). Klientovi se odešle onboarding formulář pro vyplnění fakturačních údajů." |
| **Tier** (add_service, ~line 1357) | "Úroveň služby určuje rozsah práce a doporučenou cenu. Growth = základní, Pro = rozšířená, Elite = premium." |
| **Měsíční kreditový balíček** (CB, ~line 1210) | "Maximální počet kreditů, které klient může měsíčně využít. 1 kredit = 1 grafický výstup (post, story, reel cover)." |
| **Cena za kredit** (CB, ~line 1221) | "Kolik klient platí za každý využitý kredit. Doporučeno 400 Kč — nižší cena snižuje marži." |
| **Odměna za kredit — Grafik / Editor** (CB) | "Interní odměna kolegovi za zpracování jednoho kreditu. Marže = cena pro klienta − odměna grafik − odměna editor." |
| **Marže služby** (update_service_price, ~line 1629) | "Marže = (příjmy − náklady) / příjmy. Cíl: 66 %+ (zelená). 63–65 % (oranžová). Pod 63 % (červená) vyžaduje schválení." |
| **Sleva za balíček** (~line 2556) | "Procentuální sleva z celkové ceny, pokud klient přijme všechny položky najednou. Maximum 50 %." |
| **Kdo dohodl (pro provizi)** (~line 2603) | "Kolega, který dohodl upsell s klientem. Dostane 10 % z nového měsíčního fee jako měsíční provizi." |
| **Nové příjmy / Interní náklady / Marže balíčku** (bundle summary, ~line 2441) | Short tooltips on each: revenue = client price sum, costs = colleague rewards sum, margin = (revenue-costs)/revenue |
| **Celková ekonomika klienta** (~line 2469) | "Projekce celkové zakázky po aplikování všech navržených změn — zahrnuje stávající služby + nové položky." |

No other files need changes.

