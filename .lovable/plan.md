
# Plán: Detailní popis služby na upgrade stránce pro klienta

## Cíl
Když klient otevře odkaz na potvrzení změny (`/upgrade/:token`), uvidí kompletní popis služby včetně:
- Co služba obsahuje (deliverables)
- Benefity služby
- Případně tier porovnání (pro GROWTH/PRO/ELITE)

## Zdroje popisu služby

```text
1. STANDARDNÍ SLUŽBA z katalogu:
   → Automaticky načte popis z SERVICE_DETAILS (serviceDetails.ts)
   → Admin může text před odesláním upravit

2. VLASTNÍ SLUŽBA:
   → Admin vyplní popis ručně v dialogu
```

## Změny v datové struktuře

### 1. Rozšířit AddServiceProposedChanges (src/types/crm.ts)

Přidat nová pole pro uložení popisu služby:

| Pole | Typ | Popis |
|------|-----|-------|
| `description` | `string` | Hlavní popis služby |
| `deliverables` | `string[]` | Co klient dostane (bullet points) |
| `benefits` | `string[]` | Benefity služby (volitelné) |
| `tier_comparison` | `TierFeature[]` | Porovnání tier úrovní (volitelné) |

## Změny v UI

### 2. ProposeModificationDialog - Přidat editaci popisu

**Nový krok ve formuláři pro `add_service`:**

1. Po výběru služby z katalogu:
   - Automaticky načíst popis z `SERVICE_DETAILS[code]` nebo `services.description`
   - Zobrazit náhled: tagline, benefits, deliverables
   - Umožnit editaci textu v textarea

2. Pro vlastní službu:
   - Textové pole pro popis
   - Textarea pro deliverables (každý řádek = 1 položka)

**UI návrh:**
```text
┌─────────────────────────────────────────────────┐
│ 📝 Popis služby pro klienta                     │
├─────────────────────────────────────────────────┤
│ Stručný popis:                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Reklama na Facebooku a Instagramu...        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Co klient dostane (každý řádek = 1 bod):        │
│ ┌─────────────────────────────────────────────┐ │
│ │ • Kompletní správa Meta Ads                 │ │
│ │ • Looker Studio reporting 24/7              │ │
│ │ • Měsíční strategické konzultace            │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ⓘ Pro služby z katalogu se popis načte         │
│   automaticky - můžete ho upravit               │
└─────────────────────────────────────────────────┘
```

### 3. UpgradeOfferPage - Zobrazit detaily služby

**Rozšířit renderChangeDetails()** aby pro `add_service` zobrazil:

1. **Název služby + tier badge** (již existuje)
2. **Popis služby** - nový odstavec pod názvem
3. **Co dostanete** - zelený box s deliverables (jako na PublicOfferPage)
4. **Benefity** - volitelný seznam výhod
5. **Cena + efektivní datum** (již existuje)

**Vizuální návrh pro klienta:**
```text
┌─────────────────────────────────────────────────┐
│ 📦 Přidání nové služby                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─ Meta Ads Management ──────────────── PRO ─┐  │
│ │                                            │  │
│ │ Komplexní správa reklamních kampaní        │  │
│ │ na Facebooku a Instagramu                  │  │
│ │                                            │  │
│ │ ┌────────────────────────────────────────┐ │  │
│ │ │ ✅ Co dostanete:                       │ │  │
│ │ │ • Kompletní správa Meta Ads            │ │  │
│ │ │ • Looker Studio reporting 24/7         │ │  │
│ │ │ • Měsíční strategické konzultace       │ │  │
│ │ │ • Optimalizace 2-3x týdně              │ │  │
│ │ └────────────────────────────────────────┘ │  │
│ │                                            │  │
│ │ Měsíční cena: 25 000 CZK                   │  │
│ │ Platnost od: 1. února 2025                 │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ Fakturace za únor: 22 580 CZK (28 dní z 28)     │
└─────────────────────────────────────────────────┘
```

## Technická implementace

### Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `src/types/crm.ts` | Rozšířit `AddServiceProposedChanges` o description, deliverables, benefits |
| `src/components/engagements/ProposeModificationDialog.tsx` | Přidat sekci pro editaci popisu služby |
| `src/pages/UpgradeOfferPage.tsx` | Zobrazit detailní popis služby pro klienta |

### Detaily implementace

**1. src/types/crm.ts**
```typescript
export interface AddServiceProposedChanges {
  service_id: string | null;
  name: string;
  price: number;
  currency: string;
  billing_type: 'monthly' | 'one_off';
  selected_tier?: ServiceTier | null;
  // NEW: Service description for client
  description?: string;
  deliverables?: string[];
  benefits?: string[];
  // Creative Boost specific
  creative_boost_min_credits?: number | null;
  creative_boost_max_credits?: number | null;
  creative_boost_price_per_credit?: number | null;
}
```

**2. ProposeModificationDialog.tsx**

Přidat nové state proměnné:
```typescript
const [serviceDescription, setServiceDescription] = useState('');
const [serviceDeliverables, setServiceDeliverables] = useState('');
const [serviceBenefits, setServiceBenefits] = useState('');
```

Při výběru služby z katalogu automaticky načíst:
```typescript
useEffect(() => {
  if (selectedServiceId && selectedServiceId !== 'custom') {
    const service = services.find(s => s.id === selectedServiceId);
    if (service) {
      // Načíst z SERVICE_DETAILS nebo services table
      const details = SERVICE_DETAILS[service.code];
      if (details) {
        setServiceDescription(details.tagline);
        setServiceDeliverables(details.benefits?.slice(0, 4).join('\n') || '');
        setServiceBenefits(details.benefits?.join('\n') || '');
      } else {
        setServiceDescription(service.description || '');
      }
    }
  }
}, [selectedServiceId]);
```

Přidat do proposed_changes při odeslání:
```typescript
proposed_changes = {
  // ...existing
  description: serviceDescription,
  deliverables: serviceDeliverables.split('\n').filter(Boolean),
  benefits: serviceBenefits.split('\n').filter(Boolean),
};
```

**3. UpgradeOfferPage.tsx**

V `renderChangeDetails()` pro `add_service` přidat:
```typescript
case 'add_service': {
  const c = changes as AddServiceProposedChanges;
  return (
    <div className="space-y-4">
      {/* Header s názvem a tier badge */}
      {/* ... existing code ... */}
      
      {/* Popis služby */}
      {c.description && (
        <p className="text-muted-foreground">{c.description}</p>
      )}
      
      {/* Co dostanete */}
      {c.deliverables && c.deliverables.length > 0 && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-900">
              Co dostanete:
            </p>
          </div>
          <ul className="space-y-2">
            {c.deliverables.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Cena a datum - existing code */}
    </div>
  );
}
```

## Workflow po implementaci

```text
1. KOLEGA v ProposeModificationDialog:
   - Vybere službu z katalogu → popis se načte automaticky
   - NEBO zvolí "Vlastní služba" → vyplní popis ručně
   - Může editovat deliverables před odesláním
   
2. ADMIN schválí požadavek:
   - Vygeneruje se odkaz pro klienta
   
3. KLIENT na /upgrade/:token vidí:
   - Název služby + tier (pokud relevantní)
   - Popis co služba obnáší
   - Zelený box "Co dostanete" s bullet pointy
   - Cenu a od kdy platí
   - Formulář pro potvrzení
```

## Poznámky

- Popis se ukládá přímo do `proposed_changes` v localStorage
- Pro služby z katalogu se jako výchozí použije `SERVICE_DETAILS[code]`
- Admin může popis před odesláním libovolně upravit
- Klient vidí finální verzi textu schválenou adminem
