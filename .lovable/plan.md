
# Funnel Tracking - Frontend-only s Mock Daty

## Shrnutí

Přepíšu funnel tracking systém tak, aby fungoval čistě na frontendu bez databáze. Přidám historická mock data pro demo účely, aby bylo jasně vidět jak systém funguje.

---

## Co se změní

### 1. Hook `useLeadTransitions.tsx`
- **Odstraním** Supabase REST API volání
- **Přidám** localStorage pro persistenci dat
- **Přidám** historická mock data pro demo (přechody za posledních 6 měsíců)

### 2. Nová Mock Data
Vytvořím realistická historická data:
- ~50 potvrzených přechodů za posledních 6 měsíců
- Různé konverzní poměry mezi fázemi (realistické hodnoty)
- Data pro trend graf (měsíční konverze)

---

## Mock Data Struktura

```typescript
// Historická data pro demo - 6 měsíců zpětně
const MOCK_TRANSITIONS = [
  // Srpen 2025 - 12 přechodů
  { from: 'new_lead', to: 'meeting_done', value: 45000, date: '2025-08-05' },
  { from: 'meeting_done', to: 'waiting_access', value: 45000, date: '2025-08-08' },
  // ... více přechodů
  
  // Září 2025 - 15 přechodů
  // Říjen 2025 - 10 přechodů
  // Listopad 2025 - 8 přechodů
  // Prosinec 2025 - 12 přechodů
  // Leden 2026 - 6 přechodů (aktuální měsíc)
];
```

---

## Očekávané konverzní poměry (demo)

| Přechod | Konverze |
|---------|----------|
| Nový → Schůzka | ~85% |
| Schůzka → Čekáme přístupy | ~70% |
| Čekáme → Přístupy | ~80% |
| Přístupy → Nabídka | ~90% |
| Nabídka → Odesláno | ~95% |
| Odesláno → Won | ~40% |
| **Celková konverze** | **~20%** |

---

## Technické Kroky

### Krok 1: Vytvořit mock data soubor
**Nový soubor: `src/data/leadTransitionsMockData.ts`**
- 50+ historických přechodů
- Rozložení přes 6 měsíců
- Realistické hodnoty leadů (20k - 150k Kč)

### Krok 2: Přepsat useLeadTransitions hook
**Upravit: `src/hooks/useLeadTransitions.tsx`**
- Odstranit Supabase volání
- Použít localStorage + mock data jako základ
- Při prvním načtení naplnit localStorage mock daty
- Nové potvrzené přechody ukládat do localStorage

### Krok 3: Zachovat stejné API
- `confirmTransition()` - uloží do localStorage
- `getSummary()` - vypočítá z localStorage
- `getMonthlyTrend()` - trend z localStorage

---

## Soubory k vytvoření/úpravě

1. **Nový**: `src/data/leadTransitionsMockData.ts` - historická mock data
2. **Upravit**: `src/hooks/useLeadTransitions.tsx` - frontend-only implementace

---

## Výsledek

Po implementaci uživatel uvidí:
- Funnel analytiku s realistickými daty
- Konverzní poměry mezi fázemi s progress bary
- Trend graf s daty za posledních 12 měsíců
- Při přesouvání leadů a potvrzení se data aktualizují v reálném čase
- Data přetrvají v localStorage mezi relacemi
