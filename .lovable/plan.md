
# Plán: Aktualizace Executive Dashboard

## Přehled změn

Dashboard bude aktualizován o následující změny:
1. Sales pipeline leadů bude odpovídat všem 9 stavům z modulu Leady
2. Plánovaná fakturace na následující měsíc bude přidána nahoru k hlavním KPI
3. Quick Actions sekce dole bude odstraněna (odkazy "Nový lead", "Návrhy změn")
4. Přibude přehled pipeline návrhů změn podle statusů
5. Přibude přehled aktivních víceprací podle statusů

---

## Detailní popis změn

### 1. Plánovaná fakturace na další měsíc (nová KPI karta nahoře)

Nová metrika bude vypočítána z:
- **Aktivní zakázky (retainery)**: součet `monthly_fee` všech aktivních engagementů
- **Schválené vícepráce**: částky z extra works se statusem `ready_to_invoice`
- **One-off služby k fakturaci**: engagement services s `billing_type: 'one_off'` a `invoicing_status: 'pending'`

Zobrazení:
- Nová KPI karta s ikonou `Receipt` nebo `DollarSign`
- Hodnota ve formátu "XXXk CZK"
- Subtitle: "Plánováno na [měsíc]"

### 2. Sales Pipeline 1:1 se stavy leadů

Aktuální 4 stavy budou rozšířeny na všech 9 stavů:

| Stav | Label | Barva |
|------|-------|-------|
| new_lead | Nový lead | slate-500 |
| meeting_done | Schůzka proběhla | blue-500 |
| waiting_access | Čekáme na přístupy | amber-500 |
| access_received | Přístupy přijaty | teal-500 |
| preparing_offer | Příprava nabídky | violet-500 |
| offer_sent | Nabídka odeslána | pink-500 |
| won | Vyhráno | emerald-500 |
| lost | Prohráno | red-500 |
| postponed | Odloženo | gray-500 |

Stavy won/lost/postponed budou zobrazeny ve zmenšené/oddělené sekci jako "Uzavřené".

### 3. Pipeline návrhů změn (nová sekce)

Nová karta zobrazující počty modifikačních požadavků podle statusů:

| Status | Label |
|--------|-------|
| pending | Čeká na schválení |
| approved | Čeká na klienta |
| client_approved | Klient potvrdil |

Celková hodnota navrhovaných změn (součet cen z `proposed_changes`).

### 4. Přehled aktivních víceprací (nová sekce)

Nová karta zobrazující vícepráce podle statusů:

| Status | Label |
|--------|-------|
| pending_approval | Ke schválení |
| in_progress | V řešení |
| ready_to_invoice | K fakturaci |

Celková hodnota aktivních víceprací (součet `amount`).

### 5. Odstranění Quick Actions Footer

Celá sekce "Quick Actions Footer" (řádky 551-581) bude odstraněna, protože:
- Navigace je dostupná v sidebar menu
- Dashboard má sloužit jako přehled, ne jako rozcestník

---

## Nový layout Dashboard

```text
+------------------------------------------+
|  📈 MRR  |  💰 Fakturace  |  🎯 Pipeline  |  🏢 Klienti  |  👥 Tým  |
|  (příští měsíc nahoře v hlavních KPI)                              |
+------------------------------------------+

+-------------------+  +-------------------+
| ⚠️ Čekající na     |  (zůstává beze změn)
| schválení         |                      
+-------------------+                      

+-------------------+  +-------------------+
| 📊 Aktivita       |  | 🎯 Sales Pipeline |
| posledních 7 dní  |  | (všech 9 stavů)   |
|                   |  |                   |
+-------------------+  +-------------------+

+-------------------+  +-------------------+
| ⭐ Top klienti    |  | 📝 Návrhy změn    |
|                   |  | pipeline          |
+-------------------+  +-------------------+

+-------------------+  +-------------------+
| 👥 Tým & Meetingy |  | 🔧 Aktivní        |
|                   |  | vícepráce         |
+-------------------+  +-------------------+
```

---

## Technické detaily

### Soubor k úpravě
`src/pages/Dashboard.tsx`

### Nové výpočty v useMemo

```typescript
// Plánovaná fakturace na další měsíc
const nextMonthInvoicing = useMemo(() => {
  const activeEngagements = engagements.filter(e => e.status === 'active');
  const retainerTotal = activeEngagements.reduce((sum, e) => sum + (e.monthly_fee || 0), 0);
  
  const extraWorksToInvoice = extraWorks
    ?.filter(w => w.status === 'ready_to_invoice')
    .reduce((sum, w) => sum + w.amount, 0) || 0;
  
  const oneOffPending = engagementServices
    ?.filter(s => s.billing_type === 'one_off' && s.invoicing_status === 'pending')
    .reduce((sum, s) => sum + s.price, 0) || 0;
  
  return {
    retainer: retainerTotal,
    extraWorks: extraWorksToInvoice,
    oneOff: oneOffPending,
    total: retainerTotal + extraWorksToInvoice + oneOffPending,
  };
}, [engagements, extraWorks, engagementServices]);

// Rozšířená pipeline leadů
const leadsPipeline = useMemo(() => ({
  new_lead: leads.filter(l => l.stage === 'new_lead').length,
  meeting_done: leads.filter(l => l.stage === 'meeting_done').length,
  waiting_access: leads.filter(l => l.stage === 'waiting_access').length,
  access_received: leads.filter(l => l.stage === 'access_received').length,
  preparing_offer: leads.filter(l => l.stage === 'preparing_offer').length,
  offer_sent: leads.filter(l => l.stage === 'offer_sent').length,
  won: leads.filter(l => l.stage === 'won').length,
  lost: leads.filter(l => l.stage === 'lost').length,
  postponed: leads.filter(l => l.stage === 'postponed').length,
}), [leads]);

// Pipeline návrhů změn
const modificationsPipeline = useMemo(() => {
  const requests = pendingRequests || [];
  return {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    client_approved: requests.filter(r => r.status === 'client_approved').length,
    totalValue: requests
      .filter(r => ['pending', 'approved', 'client_approved'].includes(r.status))
      .reduce((sum, r) => {
        const changes = r.proposed_changes as any;
        return sum + (changes.price || changes.new_price || 0);
      }, 0),
  };
}, [pendingRequests]);

// Pipeline víceprací
const extraWorksPipeline = useMemo(() => {
  const works = extraWorks || [];
  return {
    pending_approval: works.filter(w => w.status === 'pending_approval').length,
    in_progress: works.filter(w => w.status === 'in_progress').length,
    ready_to_invoice: works.filter(w => w.status === 'ready_to_invoice').length,
    totalValue: works
      .filter(w => ['pending_approval', 'in_progress', 'ready_to_invoice'].includes(w.status))
      .reduce((sum, w) => sum + w.amount, 0),
  };
}, [extraWorks]);
```

### Nové importy
- `Receipt` z lucide-react (pro ikonu fakturace)
- `engagementServices` z useCRMData hook

### Změny v komponentách

1. **KPI Grid**: Přidat 5. kartu "Fakturace" nebo nahradit jednu z existujících
2. **Sales Pipeline Card**: Rozšířit na 9 stavů, oddělit "Uzavřené" (won/lost/postponed)
3. **Nová Card**: Návrhy změn pipeline
4. **Nová Card**: Aktivní vícepráce pipeline
5. **Odstranit**: Quick Actions Footer sekce

---

## Vizuální poznámky

- Sales pipeline bude mít kompaktnější progress bary pro 9 stavů
- Won/Lost/Postponed budou zobrazeny jako malé badge/chip komponenty pod hlavní pipeline
- Nové karty pro změny a vícepráce budou mít podobný styl jako stávající karty
- Fakturace KPI bude zvýrazněna (např. border-primary) pro důraz na business cíl
