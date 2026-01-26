
# Plán: Automatické generování nabídky změny pro klienta

## Přehled funkcionality

Při návrhu přidání nové služby (nebo jiné změny) se automaticky vytvoří veřejná stránka, kde klient vidí navrhovanou změnu a může ji přijmout jedním kliknutím.

## Workflow

```
KOLEGA navrhne přidání služby
        │
        ▼
Automaticky se vytvoří "Upgrade Offer"
s unikátním tokenem
        │
        ▼
Kolega dostane odkaz, který může poslat klientovi
(např. /upgrade/abc123xyz)
        │
        ▼
KLIENT otevře odkaz a vidí:
- O jakou zakázku jde
- Jaká služba se přidává
- Za jakou cenu (+ poměrná fakturace)
- Od kdy to platí
        │
        ▼
Klient potvrdí:
- Vyplní email (pro ověření)
- Zaškrtne souhlas
- Klikne "Souhlasím s touto změnou"
        │
        ▼
V CRM se zobrazí, že klient souhlasil
Admin může schválit a aplikovat změnu
```

## Datový model

### Nová struktura: `EngagementUpgradeOffer`

```typescript
interface EngagementUpgradeOffer {
  id: string;
  token: string;                    // Unikátní identifikátor pro URL
  modification_request_id: string;  // Vazba na požadavek úpravy
  
  // Informace o zakázce
  engagement_id: string;
  engagement_name: string;
  client_name: string;
  
  // Navrhovaná změna (kopie z modification request)
  change_type: 'add_service' | 'update_service_price' | ...;
  change_summary: string;          // Lidsky čitelný popis změny
  proposed_changes: object;        // Detaily změny
  
  // Finanční info
  new_monthly_price?: number;
  price_difference?: number;
  effective_from: string;
  prorated_first_month?: number;
  
  // Status
  status: 'pending' | 'accepted' | 'expired';
  valid_until: string;
  
  // Potvrzení klientem
  accepted_at?: string;
  accepted_by_email?: string;
  accepted_by_name?: string;
  
  // Kontaktní osoba z naší strany
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  
  created_at: string;
}
```

## UI Komponenty

### 1. Rozšíření ProposeModificationDialog

Po úspěšném vytvoření požadavku:
- Automaticky se vygeneruje upgrade offer
- Zobrazí se dialog s odkazem pro klienta
- Možnost zkopírovat odkaz jedním kliknutím

```
┌─────────────────────────────────────────────────────────────────────┐
│ ✅ Požadavek na úpravu byl vytvořen                            [×] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 📧 Odkaz pro klienta                                               │
│                                                                     │
│ Pošlete tento odkaz klientovi pro potvrzení změny:                 │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ https://app.example.com/upgrade/abc123xyz     [📋] [🔗]         ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ Klient uvidí:                                                      │
│ • Služba: Meta Ads SK                                              │
│ • Cena: 12 000 CZK/měs                                             │
│ • Od: 15. února 2026                                               │
│                                                                     │
│ Po potvrzení klientem se požadavek automaticky označí jako         │
│ "Klient souhlasí" a můžete ho schválit.                            │
│                                                                     │
│                                                        [Zavřít]    │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Nová veřejná stránka: `/upgrade/:token`

Jednoduchá, přehledná stránka pro klienta:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         [LOGO]                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│              📋 Návrh úpravy spolupráce                            │
│                                                                     │
│         Pro: TestBrand s.r.o. – Retainer 2026                      │
│                                                                     │
│ ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  🆕 Přidání nové služby                                            │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ 📘 Meta Ads SK                                                │ │
│  │                                                               │ │
│  │ Správa kampaní na slovenském trhu                            │ │
│  │                                                               │ │
│  │ Cena: 12 000 CZK / měsíc                                     │ │
│  │ Od: 15. února 2026                                           │ │
│  │                                                               │ │
│  │ ┌───────────────────────────────────────────────────────────┐│ │
│  │ │ 💡 Fakturace za únor: 6 414 CZK (14 dní z 28)            ││ │
│  │ │ Od března: plná měsíční cena                              ││ │
│  │ └───────────────────────────────────────────────────────────┘│ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  📝 Potvrzení změny                                                │
│                                                                     │
│  Váš email: [________________________]                             │
│                                                                     │
│  [✓] Souhlasím s touto změnou spolupráce                          │
│                                                                     │
│               [Potvrdit změnu]                                      │
│                                                                     │
│  Platnost nabídky: do 14. února 2026                               │
│                                                                     │
│ ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  💬 Máte dotazy? Kontaktujte mě                                    │
│  Jan Novák • jan.novak@socials.cz • +420 123 456 789              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. Úprava stránky Modifications

V kartě požadavku zobrazit:
- Zda byl vygenerován odkaz pro klienta
- Zda klient už potvrdil
- Badge "Klient souhlasí" vedle statusu

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📦 Přidání služby                          [Čeká] [✓ Klient potvrdil] │
│ TestBrand – Retainer 2026                                           │
│ Služba: Meta Ads SK • 12 000 CZK/měs                               │
│ Od: 15.2.2026                                                       │
│ Navrhl: Danny • před 2 hodinami                                     │
│                                                                     │
│ 📧 Klient potvrdil: 13.2.2026 v 14:32 (jan@testbrand.cz)           │
│                                                                     │
│ [📋 Zkopírovat odkaz]  [✓ Schválit]  [✕ Zamítnout]                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Implementační kroky

### Fáze 1: Datová vrstva (localStorage)

**Nové soubory:**
- `src/types/upgradeOffer.ts` - typy pro UpgradeOffer
- `src/data/upgradeOffersMockData.ts` - mock store (localStorage)

**Funkce:**
- `createUpgradeOffer(modificationRequest)` - vytvoří offer při návrhu změny
- `getUpgradeOfferByToken(token)` - načte offer pro veřejnou stránku
- `acceptUpgradeOffer(token, email)` - označí jako přijatý klientem
- `getUpgradeOfferByModificationId(id)` - pro zobrazení v kartě

### Fáze 2: Veřejná stránka

**Nové soubory:**
- `src/pages/UpgradeOfferPage.tsx` - veřejná stránka `/upgrade/:token`

**Funkcionalita:**
- Zobrazení detailů změny (služba, cena, datum)
- Kalkulace poměrné fakturace
- Formulář pro potvrzení (email + checkbox)
- Kontaktní údaje
- Success state po potvrzení

**Routing:**
- Přidat route `/upgrade/:token` do `App.tsx`

### Fáze 3: Integrace s ProposeModificationDialog

**Úpravy:**
- Po úspěšném vytvoření požadavku automaticky vytvořit UpgradeOffer
- Zobrazit success dialog s odkazem pro klienta
- Možnost zkopírovat odkaz

### Fáze 4: Rozšíření ModificationRequestCard

**Úpravy:**
- Přidat badge "Klient potvrdil" pokud offer.status === 'accepted'
- Přidat tlačítko "Zkopírovat odkaz pro klienta"
- Zobrazit kdy a kdo (email) potvrdil

### Fáze 5: Rozšíření hook useModificationRequests

**Úpravy:**
- Propojit s upgrade offers
- Při fetchování požadavků načíst i status potvrzení od klienta

## Typy změn podporované v UpgradeOffer

| Typ změny | Zobrazení pro klienta |
|-----------|----------------------|
| add_service | "Přidání nové služby" + detaily služby |
| update_service_price | "Změna ceny služby" + stará → nová cena |
| deactivate_service | "Ukončení služby" + od kdy |

Pro změny týkající se kolegů (add_assignment, update_assignment, remove_assignment) se upgrade offer **nevytváří** - to je interní záležitost.

## Soubory k vytvoření/úpravě

**Nové soubory:**
- `src/types/upgradeOffer.ts`
- `src/data/upgradeOffersMockData.ts`
- `src/pages/UpgradeOfferPage.tsx`

**Úpravy:**
- `src/components/engagements/ProposeModificationDialog.tsx` - generování offeru
- `src/components/engagements/ModificationRequestCard.tsx` - zobrazení statusu
- `src/App.tsx` - nová route
- `src/hooks/useModificationRequests.tsx` - propojení s offers

## Příklad generování lidsky čitelného popisu

```typescript
function generateChangeSummary(request: ModificationRequest): string {
  switch (request.request_type) {
    case 'add_service':
      return `Přidání služby "${request.proposed_changes.name}" za ${request.proposed_changes.price.toLocaleString()} ${request.proposed_changes.currency}/měs`;
    case 'update_service_price':
      return `Změna ceny z ${request.proposed_changes.old_price.toLocaleString()} na ${request.proposed_changes.new_price.toLocaleString()} ${currency}/měs`;
    case 'deactivate_service':
      return `Ukončení služby od ${formatDate(request.effective_from)}`;
    default:
      return 'Úprava zakázky';
  }
}
```

## Bezpečnostní poznámky

- Token je náhodný string (12+ znaků) - nelze uhodnout
- Email slouží pouze pro identifikaci, není vyžadováno přihlášení
- Nabídka má omezenou platnost (default 14 dní)
- Po přijetí nelze změnu znovu přijmout (idempotence)
