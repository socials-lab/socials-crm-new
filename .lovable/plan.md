
# Vylepšení Analytics modulu pro majitele agentury

## Cíl
Poskytnout majiteli agentury komplexní přehled o zdraví businessu, klientské bázi, finančním výkonu a týmové kapacitě na základě reálných dat z CRM systému.

---

## Přehled změn

### 1. Nový Executive Dashboard (tab "Přehled")

**Nové KPI karty:**
| KPI | Popis | Výpočet |
|-----|-------|---------|
| ARR (Roční opakované příjmy) | MRR × 12 | `mrr * 12` |
| Revenue Growth | Meziroční růst | `(currentYearRevenue - lastYearRevenue) / lastYearRevenue * 100` |
| Avg. Client Lifetime | Průměrná délka spolupráce | `avg(today - start_date)` pro aktivní klienty |
| Net Revenue Retention | Čistá retence příjmů | `(startMRR - churnMRR + expansionMRR) / startMRR` |
| Pipeline Coverage | Pokrytí pipeline | `expectedValue / (mrr * 3)` (3-měsíční target) |

**Nové vizualizace:**
- **Revenue Composition (reálná data)** - Retainery (engagement monthly_fee) + Vícepráce (extra_works approved) + Jednorázové služby (one_off engagement_services)
- **Client Concentration Chart** - Zobrazení podílu top 5 klientů na celkovém revenue (risk alert pokud > 50%)
- **Monthly Revenue Trend** - Kombinovaný graf (bar + line) s fakturací a marží

**Vylepšené alerty:**
- Klienti s končící smlouvou (< 60 dní)
- Zakázky s klesající marží (MoM pokles > 10%)
- Nevyfakturované položky starší 30 dní

---

### 2. Analýza klientské báze (tab "Klienti & Zakázky")

**Nové metriky:**
| Metrika | Popis |
|---------|-------|
| Client Health Score | Skóre 1-100 na základě: aktivita, tenure, revenue trend |
| Revenue by Industry | Rozložení příjmů podle odvětví klientů |
| Client Tenure Distribution | Histogram délky spolupráce |
| At-Risk Clients | Seznam klientů s negativními signály |

**Nové vizualizace:**
- **Revenue by Industry Pie Chart** - Příjmy podle client.industry
- **Client Tenure Histogram** - Kolik klientů je s námi 0-3, 3-6, 6-12, 12+ měsíců
- **Client Revenue Trend per Client** - Top 5 klientů s vývojem jejich monthly_fee

**At-Risk Client Detection:**
Flagy pro:
- Tenure < 3 měsíce a margin < 20%
- Snižující se monthly_fee (engagement edits)
- Bez extra work za poslední 3 měsíce (nízká aktivita)

---

### 3. Vylepšená Leads Analytics (tab "Leady")

**Nové metriky:**
| Metrika | Popis |
|---------|-------|
| Pipeline Velocity | Průměrný počet dní v každé stage |
| Win Rate by Source | Konverzní poměr podle zdroje |
| Win Rate by Owner | Konverzní poměr podle obchodníka |
| Avg Deal Size | Průměrná hodnota vyhraného dealu |

**Nové vizualizace:**
- **Stage Duration Heatmap** - Kolik dní leady tráví v každé stage
- **Source Performance Table** - Tabulka s počtem, konverzí, avg. deal size per source
- **Monthly Win/Loss Trend** - Stacked bar chart won vs lost

---

### 4. Finanční přehled (tab "Finance")

**Oprava výpočtu reálných příjmů:**
```
Celkové příjmy = 
  Σ(engagement.monthly_fee pro aktivní zakázky v období)
  + Σ(extra_works.amount kde status = 'ready_to_invoice' nebo 'invoiced')
  + Σ(engagement_services.price kde billing_type = 'one_off' a invoiced_in_period = current)
```

**Nové metriky:**
| Metrika | Popis |
|---------|-------|
| Revenue per Colleague | Celkové příjmy / počet aktivních kolegů |
| Avg. Margin by Tier | Průměrná marže podle client tier |
| Cost Structure | Fixed costs vs Variable costs |

**Nové vizualizace:**
- **Revenue per Colleague Bar Chart** - Horizontal bars
- **Margin by Client Tier** - Grouped bar chart (Standard/Gold/Platinum/Diamond)
- **Revenue vs Costs Waterfall** - Příjmy → Náklady na tým → Marže

---

### 5. Nový tab "Tým & Kapacita"

**KPI karty:**
| KPI | Popis |
|-----|-------|
| Aktivní kolegové | Počet kolegů se status = 'active' |
| Celkové náklady na tým | Suma monthly_cost z assignments |
| Prům. náklady/zakázka | Total team cost / active engagements |
| Revenue/Colleague | MRR / active colleagues |

**Vizualizace:**
- **Colleague Workload** - Počet přiřazení na kolegu (bar chart)
- **Team Cost Breakdown** - Pie chart podle cost_model (hourly/fixed/percentage)
- **Top Revenue Generators** - Kolegové seřazení podle revenue jejich zakázek

---

## Technické změny

### Soubory k úpravě/vytvoření:

| Soubor | Změna |
|--------|-------|
| `src/pages/Analytics.tsx` | Přidat nový tab "Tým", rozšířit data calculations |
| `src/components/analytics/AnalyticsOverview.tsx` | Nové KPIs, concentration chart, real revenue breakdown |
| `src/components/analytics/ClientsEngagementsAnalytics.tsx` | Industry breakdown, tenure histogram, at-risk clients |
| `src/components/analytics/LeadsAnalytics.tsx` | Pipeline velocity, win rate by source/owner, avg deal size |
| `src/components/analytics/FinanceAnalytics.tsx` | Real revenue calculation, revenue/colleague, margin by tier |
| `src/components/analytics/TeamCapacityAnalytics.tsx` | **NOVÝ** - Team workload, costs, utilization |

### Data flow změny v `Analytics.tsx`:

```text
Nové computed values:
├── ARR = mrr × 12
├── Client Concentration = top5Revenue / totalRevenue
├── Revenue by Industry = group engagements by client.industry
├── Client Tenure = map clients to (today - start_date)
├── Pipeline Velocity = avg days per stage from lead history
├── Team Costs = sum(assignments.monthly_cost)
└── Revenue per Colleague = mrr / activeColleagues.length
```

---

## Struktura nového Přehledu

```text
┌─────────────────────────────────────────────────────────────────┐
│  KPI Row 1: MRR | ARR | Revenue Growth | Avg Lifetime | NRR    │
├─────────────────────────────────────────────────────────────────┤
│  KPI Row 2: Active Clients | Engagements | Pipeline Coverage   │
├────────────────────────────────┬────────────────────────────────┤
│  MRR Trend (12 months)         │  Revenue Composition (real)    │
│  [Line chart]                  │  [Donut chart]                 │
├────────────────────────────────┼────────────────────────────────┤
│  Client Concentration          │  Monthly Revenue + Margin      │
│  [Horizontal bars top 5]       │  [Combo chart bar + line]      │
├────────────────────────────────┴────────────────────────────────┤
│  Alerts Row: Low Margin | Ending Contracts | Overdue Leads     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pořadí implementace

1. **Analytics.tsx** - Přidat nové výpočty a tab "Tým"
2. **AnalyticsOverview.tsx** - Executive dashboard s reálnými daty
3. **TeamCapacityAnalytics.tsx** - Nová komponenta pro team analytics
4. **ClientsEngagementsAnalytics.tsx** - Industry breakdown, at-risk clients
5. **LeadsAnalytics.tsx** - Pipeline velocity, win rates
6. **FinanceAnalytics.tsx** - Opravit výpočty, přidat revenue/colleague

---

## Poznámky

- Všechna data se počítají z existujících tabulek v Supabase (clients, engagements, engagement_services, extra_works, leads, colleagues, assignments)
- Není potřeba žádná změna databázového schématu
- Výpočty marží využívají data z assignments (monthly_cost, hourly_cost)
- Pro client health score se použije kombinace tenure, margin a aktivity (extra work count)
