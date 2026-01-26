
# Přesun informací z leadu na kartu klienta

## Přehled změn

Přesuneme sekci "Z leadu" (onboarding formulář + úvodní nabídka) z detailu zakázky na kartu klienta. Tím zajistíme, že všechny informace o konverzi leadu jsou centralizované u klienta, nikoliv u zakázky.

---

## Vizuální změna

```text
PŘED (zakázka):                      PO (klient):
┌─────────────────────┐              ┌─────────────────────┐
│ Detail zakázky      │              │ Karta klienta       │
├─────────────────────┤              ├─────────────────────┤
│ Služby              │              │ Připnutá poznámka   │
│ Přiřazení kolegové  │              │ Firemní údaje       │
│ Profitabilita       │              │ Fakturační údaje    │
│ Platformy           │              │ Kontakty            │
│ ┌─────────────────┐ │              │ ┌─────────────────┐ │
│ │ 📋 Z leadu      │ │   ──────►   │ │ 📋 Z leadu      │ │
│ │ - Formulář      │ │              │ │ - Formulář      │ │
│ │ - Nabídka       │ │              │ │ - Nabídka       │ │
│ │ - Smlouva       │ │              │ │ - Smlouva       │ │
│ └─────────────────┘ │              │ └─────────────────┘ │
│ Freelo             │              │ Zakázky             │
└─────────────────────┘              └─────────────────────┘
```

---

## Technické změny

### 1. Upravit `src/pages/Clients.tsx`

**Přidat importy:**
- `useLeadsData` hook pro přístup k leadům
- `LeadOriginSection` komponenta

**Přidat helper funkci:**
```typescript
const getLeadByClientId = useCallback((clientId: string) => {
  return leads.find(lead => lead.converted_to_client_id === clientId);
}, [leads]);
```

**Přidat sekci do rozbalené karty klienta:**
- Umístit mezi "Připnutá poznámka" a "Firemní údaje"
- Zobrazit pouze pokud existuje konvertovaný lead s vyplněným formulářem nebo nabídkou

---

### 2. Upravit `src/pages/Engagements.tsx`

**Odstranit:**
- Import `LeadOriginSection`
- Import `useLeadsData` (pokud není používán jinde)
- Helper funkci `getLeadByEngagementId`
- Celý blok renderování `LeadOriginSection` (řádky 1368-1378)

---

### 3. Přesunout komponentu (volitelné)

Přesunout `LeadOriginSection.tsx` z:
```
src/components/engagements/LeadOriginSection.tsx
```
do:
```
src/components/clients/LeadOriginSection.tsx
```

Toto lépe reflektuje, kde je komponenta používána.

---

## Logika propojení

| Pole v Lead | Použití |
|-------------|---------|
| `converted_to_client_id` | Propojení lead → klient |
| `onboarding_form_completed_at` | Kontrola, zda byl formulář vyplněn |
| `offer_url`, `offer_sent_at` | Kontrola, zda existuje nabídka |
| `contract_url`, `contract_signed_at` | Zobrazení smlouvy |
| `potential_services` | Seznam služeb v nabídce |
| `billing_*` | Fakturační údaje z formuláře |
| `contact_*` | Kontaktní osoba z formuláře |

---

## Pořadí implementace

1. Přidat `useLeadsData` a helper do `Clients.tsx`
2. Přesunout `LeadOriginSection.tsx` do složky clients
3. Přidat renderování sekce do karty klienta
4. Odstranit sekci z `Engagements.tsx`
5. Vyčistit nepoužívané importy

---

## Poznámky

- Lead má oba klíče: `converted_to_client_id` i `converted_to_engagement_id`
- Pro zobrazení u klienta použijeme `converted_to_client_id`
- Stávající data v databázi se nemusí měnit
- Komponenta `LeadOriginSection` zůstává funkčně stejná
