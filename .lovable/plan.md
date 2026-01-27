

# Implementace Funnel Průchodnosti s Potvrzením

## Shrnutí

Implementace trackingu průchodnosti leadů funnelem s potvrzovacím mechanismem, který zabrání tomu, aby omylem provedené změny fází ovlivňovaly analytické metriky. Řešení zahrnuje novou databázovou tabulku pro potvrzené přechody, UI pro potvrzování změn stavu, a vizualizaci dat v Analytics tabu.

---

## Jak to bude fungovat

### 1. Potvrzovací mechanismus

Když uživatel přesune lead do nové fáze (drag & drop na Kanban nebo změna v detailu), systém:
1. **Okamžitě změní stav leadu** v databázi (pro aktuální workflow)
2. **Zobrazí potvrzovací dialog** s dotazem: "Potvrdit přechod pro analytiku?"
3. **Při potvrzení** uloží záznam do nové tabulky `lead_stage_transitions`
4. **Při odmítnutí** se nic neuloží do historie pro analytiku

### 2. Co se trackuje

Každý potvrzený přechod obsahuje:
- Z které fáze do které
- Kdy přechod nastal
- Kdo ho provedl
- Hodnota leadu v době přechodu

---

## Vizuální návrh

### Potvrzovací toast/dialog po změně fáze:
```text
+------------------------------------------+
|  Fáze změněna na "Nabídka odeslána"      |
|                                          |
|  Započítat do funnel analytiky?          |
|                                          |
|  [Potvrdit pro analytiku]    [Přeskočit] |
+------------------------------------------+
```

### Nová sekce v Analytics - "Funnel Průchodnost":
```text
+--------------------------------------------------+
|  Funnel Průchodnost (potvrzené přechody)         |
|--------------------------------------------------|
|  Nový lead → Meeting      85%    (17/20)         |
|  Meeting → Čekáme         70%    (12/17)         |
|  Čekáme → Přístupy        83%    (10/12)         |
|  Přístupy → Nabídka       90%    (9/10)          |
|  Nabídka → Odesláno       100%   (9/9)           |
|  Odesláno → Won           45%    (4/9)           |
+--------------------------------------------------+
|  Celková konverze: Nový → Won: 20%               |
+--------------------------------------------------+
```

### Trend graf:
- X-osa: měsíce
- Y-osa: % konverze pro každou fázi
- Linie pro každý přechod mezi fázemi

---

## Technické kroky

### Krok 1: Databáze

**Nová tabulka `lead_stage_transitions`:**

```sql
CREATE TABLE lead_stage_transitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    from_stage lead_stage NOT NULL,
    to_stage lead_stage NOT NULL,
    transition_value numeric DEFAULT 0,  -- hodnota leadu v době přechodu
    confirmed_at timestamptz DEFAULT now() NOT NULL,
    confirmed_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

-- RLS policies pro CRM users
ALTER TABLE lead_stage_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM users can read lead_stage_transitions"
ON lead_stage_transitions FOR SELECT
USING (is_crm_user(auth.uid()));

CREATE POLICY "CRM users can manage lead_stage_transitions"
ON lead_stage_transitions FOR ALL
USING (is_crm_user(auth.uid()));

-- Index pro rychlé dotazy
CREATE INDEX idx_lead_transitions_confirmed 
ON lead_stage_transitions(confirmed_at);

CREATE INDEX idx_lead_transitions_stages 
ON lead_stage_transitions(from_stage, to_stage);
```

### Krok 2: Frontend - Potvrzovací komponenta

**Nový soubor: `src/components/leads/ConfirmStageTransitionDialog.tsx`**

- AlertDialog komponenta
- Zobrazí odkud → kam se lead přesouvá
- Tlačítka "Potvrdit pro analytiku" a "Přeskočit"
- Volá hook pro uložení potvrzené transition

### Krok 3: Hook pro správu transitions

**Nový soubor: `src/hooks/useLeadTransitions.tsx`**

```typescript
// Funkce:
// - fetchTransitions() - načte všechny potvrzené přechody
// - confirmTransition(leadId, fromStage, toStage, value) - uloží potvrzený přechod
// - getConversionRates() - vypočítá konverzní poměry mezi fázemi
// - getTransitionTrend(months) - trend přechodů za posledních N měsíců
```

### Krok 4: Integrace do LeadsKanban.tsx

**Úprava `handleDrop` funkce:**

```typescript
const handleDrop = (e, stage) => {
  // 1. Změnit stav okamžitě
  onStageChange(draggedLeadId, stage);
  
  // 2. Zobrazit potvrzovací dialog
  setTransitionToConfirm({
    leadId: draggedLeadId,
    fromStage: lead.stage,
    toStage: stage,
    leadValue: lead.estimated_price
  });
};
```

### Krok 5: Integrace do LeadDetailSheet.tsx

**Úprava `handleStageChange` funkce:**

Stejná logika jako v Kanban - po změně zobrazit potvrzovací dialog.

### Krok 6: Nová Analytics komponenta

**Nový soubor: `src/components/analytics/FunnelPassthroughAnalytics.tsx`**

- Zobrazí konverzní poměry mezi všemi fázemi
- Graf trendu konverzí v čase
- Filtrování podle období (měsíc/kvartál/rok)
- Detailní tabulka s počty přechodů

### Krok 7: Integrace do Analytics.tsx

- Přidat nový tab "Funnel" nebo sekci do LeadsAnalytics
- Předat data z hooku do komponenty

---

## Soubory k vytvoření/úpravě

### Nové soubory:
1. `src/hooks/useLeadTransitions.tsx` - hook pro práci s transitions
2. `src/components/leads/ConfirmStageTransitionDialog.tsx` - potvrzovací dialog
3. `src/components/analytics/FunnelPassthroughAnalytics.tsx` - vizualizace

### Soubory k úpravě:
1. `src/types/crm.ts` - přidat typ `LeadStageTransition`
2. `src/components/leads/LeadsKanban.tsx` - přidat potvrzovací dialog po drop
3. `src/components/leads/LeadDetailSheet.tsx` - přidat potvrzovací dialog po změně stavu
4. `src/pages/Analytics.tsx` - integrace nové komponenty
5. `src/components/analytics/LeadsAnalytics.tsx` - přidat sekci pro funnel průchodnost

### Databázové změny:
- Migrace pro vytvoření tabulky `lead_stage_transitions`
- RLS policies pro tabulku

---

## Přínosy řešení

1. **Přesná analytika** - jen potvrzené přechody se počítají
2. **Historická data** - trend konverzí v čase
3. **Minimální friction** - jednoduchý toast místo blokujícího dialogu
4. **Zpětná kompatibilita** - stávající workflow zůstává nezměněn
5. **Hodnota v kontextu** - trackuje se hodnota leadu při přechodu

