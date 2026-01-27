
# Plán: Kompletní přehled CRM aktivit za posledních 7 dní

## Přehled

Dashboard sekce "Aktivita posledních 7 dní" bude rozšířena o **všechny typy aktivit v CRM**, nejen konverze leadů a zakázky. Uživatelé uvidí kompletní přehled co se v agentuře dělo za poslední týden.

---

## Aktuálně zobrazované aktivity

| Typ | Zdroj dat |
|-----|-----------|
| Noví klienti (z leadů) | `leads` kde `stage='won'` a `converted_at` v posledních 7 dnech |
| Nové zakázky | `engagements` kde `start_date` v posledních 7 dnech |
| Ukončené zakázky | `engagements` kde `end_date` v posledních 7 dnech |
| Ztracené leady | `leads` kde `stage='lost'` a `updated_at` v posledních 7 dnech |

---

## Nově přidané aktivity

| Typ aktivity | Zdroj dat | Ikona | Barva |
|--------------|-----------|-------|-------|
| **Nové leady** | `leads` kde `created_at` v posledních 7 dnech | `UserPlus` | slate |
| **Změny stavu leadů** | `leads` kde `updated_at` v posledních 7 dnech (stage změny) | `ArrowRightLeft` | blue |
| **Odeslané nabídky** | `leads` kde `offer_sent_at` v posledních 7 dnech | `Send` | pink |
| **Podepsané smlouvy** | `leads` kde `contract_signed_at` v posledních 7 dnech | `FileSignature` | emerald |
| **Nové vícepráce** | `extraWorks` kde `created_at` v posledních 7 dnech | `Wrench` | violet |
| **Schválené vícepráce** | `extraWorks` kde `approval_date` v posledních 7 dnech | `CheckCircle` | green |
| **Nové návrhy změn** | `pendingRequests` kde `created_at` v posledních 7 dnech | `FileEdit` | amber |
| **Schválené návrhy změn** | `pendingRequests` kde `approved_at` v posledních 7 dnech | `CheckCircle2` | green |
| **Nové schůzky naplánované** | `meetings` kde `created_at` v posledních 7 dnech | `Calendar` | blue |
| **Naplánované schůzky (proběhlé)** | `meetings` kde `scheduled_at` v posledních 7 dnech a `status='completed'` | `CalendarCheck` | teal |
| **Noví uchazeči** | `applicants` kde `created_at` v posledních 7 dnech | `Users` | slate |
| **Přijatí uchazeči** | `applicants` kde `stage='hired'` a `updated_at` v posledních 7 dnech | `UserCheck` | emerald |

---

## Struktura dat v useMemo

```typescript
const recentActivity = useMemo(() => {
  const sevenDaysAgo = subDays(new Date(), 7);
  
  // === LEADS ===
  // Nové leady
  const newLeads = leads
    .filter(l => isAfter(parseISO(l.created_at), sevenDaysAgo))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  // Konvertované leady (won)
  const newClients = leads
    .filter(l => l.stage === 'won' && l.converted_at && isAfter(parseISO(l.converted_at), sevenDaysAgo))
    .sort((a, b) => new Date(b.converted_at!).getTime() - new Date(a.converted_at!).getTime());
  
  // Odeslané nabídky
  const offersSent = leads
    .filter(l => l.offer_sent_at && isAfter(parseISO(l.offer_sent_at), sevenDaysAgo))
    .sort((a, b) => new Date(b.offer_sent_at!).getTime() - new Date(a.offer_sent_at!).getTime());
  
  // Podepsané smlouvy
  const contractsSigned = leads
    .filter(l => l.contract_signed_at && isAfter(parseISO(l.contract_signed_at), sevenDaysAgo))
    .sort((a, b) => new Date(b.contract_signed_at!).getTime() - new Date(a.contract_signed_at!).getTime());
  
  // Lost leads
  const lostLeads = leads
    .filter(l => l.stage === 'lost' && l.updated_at && isAfter(parseISO(l.updated_at), sevenDaysAgo))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // === ENGAGEMENTS ===
  const newEngagements = engagements
    .filter(e => e.start_date && isAfter(parseISO(e.start_date), sevenDaysAgo))
    .sort((a, b) => new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime());
  
  const endedEngagements = engagements
    .filter(e => e.end_date && isAfter(parseISO(e.end_date), sevenDaysAgo) && ['completed', 'cancelled'].includes(e.status))
    .sort((a, b) => new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime());

  // === EXTRA WORKS ===
  const newExtraWorks = (extraWorks || [])
    .filter(w => isAfter(parseISO(w.created_at), sevenDaysAgo))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  const approvedExtraWorks = (extraWorks || [])
    .filter(w => w.approval_date && isAfter(parseISO(w.approval_date), sevenDaysAgo))
    .sort((a, b) => new Date(b.approval_date!).getTime() - new Date(a.approval_date!).getTime());

  // === MODIFICATIONS ===
  const newModifications = (pendingRequests || [])
    .filter(r => isAfter(parseISO(r.created_at), sevenDaysAgo))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  const approvedModifications = (pendingRequests || [])
    .filter(r => r.approved_at && isAfter(parseISO(r.approved_at), sevenDaysAgo))
    .sort((a, b) => new Date(b.approved_at!).getTime() - new Date(a.approved_at!).getTime());

  // === MEETINGS ===
  const newMeetingsScheduled = meetings
    .filter(m => isAfter(parseISO(m.created_at), sevenDaysAgo))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  const completedMeetings = meetings
    .filter(m => m.status === 'completed' && isAfter(parseISO(m.scheduled_at), sevenDaysAgo))
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  // === APPLICANTS ===
  const newApplicants = applicants
    .filter(a => isAfter(parseISO(a.created_at), sevenDaysAgo))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  const hiredApplicants = applicants
    .filter(a => a.stage === 'hired' && isAfter(parseISO(a.updated_at), sevenDaysAgo))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return {
    // Leads
    newLeads,
    newClients,
    offersSent,
    contractsSigned,
    lostLeads,
    // Engagements
    newEngagements,
    endedEngagements,
    // Extra works
    newExtraWorks,
    approvedExtraWorks,
    // Modifications
    newModifications,
    approvedModifications,
    // Meetings
    newMeetingsScheduled,
    completedMeetings,
    // Applicants
    newApplicants,
    hiredApplicants,
  };
}, [leads, engagements, extraWorks, pendingRequests, meetings, applicants]);
```

---

## Vizuální layout karty

Karta bude mít kompaktní sekce s možností scroll, protože aktivit může být hodně:

```
┌─────────────────────────────────────────────────────────┐
│ 📊 Aktivita posledních 7 dní                            │
├─────────────────────────────────────────────────────────┤
│ 🟢 SALES & LEADY                                        │
│ ├─ ✅ Noví klienti (3) - TestBrand, ABC, XYZ            │
│ ├─ 📤 Odeslané nabídky (2) - FirmaCZ, AgenturaPRO       │
│ ├─ 📝 Podepsané smlouvy (1) - TestBrand                 │
│ └─ ❌ Ztracené leady (1) - OldClient                    │
├─────────────────────────────────────────────────────────┤
│ 📁 ZAKÁZKY & VÍCEPRÁCE                                  │
│ ├─ 🆕 Nové zakázky (2)                                  │
│ ├─ 🔧 Nové vícepráce (5) - 45k CZK                      │
│ └─ ✅ Schválené vícepráce (3) - 28k CZK                 │
├─────────────────────────────────────────────────────────┤
│ 📝 NÁVRHY ZMĚN                                          │
│ ├─ 🆕 Nové návrhy (2)                                   │
│ └─ ✅ Schválené (1)                                     │
├─────────────────────────────────────────────────────────┤
│ 📅 SCHŮZKY                                              │
│ ├─ 📅 Naplánované (4)                                   │
│ └─ ✅ Proběhlé (2)                                       │
├─────────────────────────────────────────────────────────┤
│ 👥 RECRUITMENT                                          │
│ ├─ 🆕 Noví uchazeči (3)                                 │
│ └─ ✅ Přijatí (1)                                        │
└─────────────────────────────────────────────────────────┘
```

---

## Nové importy potřebné

```typescript
import { useMeetingsData } from '@/hooks/useMeetingsData';
import { useApplicantsData } from '@/hooks/useApplicantsData';

// Nové ikony
import { 
  Send, 
  FileSignature, 
  Wrench, 
  CheckCircle2, 
  FileEdit,
  CalendarCheck,
  UserCheck,
  ArrowRightLeft,
} from 'lucide-react';
```

---

## Změny v souboru

| Soubor | Změna |
|--------|-------|
| `src/pages/Dashboard.tsx` | Rozšíření `recentActivity` useMemo + nové sekce v UI |

---

## Kompaktní zobrazení

Aby karta nezabírala příliš místa, aktivity budou zobrazeny jako:
- **Sumarizovaný řádek** pro každý typ aktivity (např. "Odeslané nabídky (2)")
- **Při kliknutí** na řádek se rozbalí detail s jednotlivými položkami
- **Prázdné sekce** se nezobrazují (jako nyní)
- **ScrollArea** s max-height pro případ mnoha aktivit

---

## Pořadí sekcí (priorita shora dolů)

1. **Sales & Leady** - noví klienti, nabídky, smlouvy, ztracené
2. **Zakázky & Vícepráce** - nové zakázky, ukončené, vícepráce
3. **Návrhy změn** - nové, schválené
4. **Schůzky** - naplánované, proběhlé
5. **Recruitment** - noví uchazeči, přijatí

Každá sekce bude mít nadpis pouze pokud obsahuje alespoň jednu aktivitu.
