
# Plán: Oprava schvalovacího workflow pro frontend-only systém

## Identifikovaný problém

Tlačítka "Schválit" a "Zamítnout" jsou podmíněna hodnotou `isSuperAdmin` z databáze Supabase:
```typescript
onApprove={isSuperAdmin ? handleApprove : undefined}
onReject={isSuperAdmin ? handleReject : undefined}
```

Protože systém má fungovat čistě na frontendu bez závislosti na databázi, je nutné tuto podmínku upravit.

## Workflow po opravě

```text
1. KOLEGA navrhne přidání služby
       ↓
2. ADMIN vidí požadavek v "Čekající" a klikne "Schválit"
       ↓
3. Systém:
   - Pro služby (add_service, update_service_price, deactivate_service):
     → Vygeneruje token + odkaz pro klienta
     → Zobrazí dialog s odkazem k odeslání/zkopírování
   - Pro interní změny (assignment):
     → Rovnou označí jako schváleno
       ↓
4. KLIENT obdrží odkaz, otevře /upgrade/:token
   - Vidí detaily změny + poměrnou fakturaci
   - Vyplní email, zaškrtne souhlas, klikne "Potvrdit"
       ↓
5. V ADMINU se požadavek zobrazí s badge "Klient potvrdil"
   - Admin vidí kdy a kdo (email) potvrdil
   - Může se pustit do práce
```

## Technické změny

### 1. Modifications.tsx - Odstranit závislost na isSuperAdmin

Nahradit podmínku `isSuperAdmin` jednodušší logikou - např. povolit všem přihlášeným uživatelům:

```typescript
// Před:
onApprove={isSuperAdmin ? handleApprove : undefined}

// Po:
onApprove={handleApprove}
```

### 2. Modifications.tsx - Přidat success dialog po schválení

Po kliknutí na "Schválit" pro služby zobrazit dialog s:
- Potvrzením že požadavek byl schválen
- Odkazem pro klienta (pokud je client-facing typ)
- Tlačítkem pro zkopírování odkazu

### 3. ModificationRequestCard.tsx - Zobrazit odkaz pro schválené požadavky

Pro schválené požadavky se statusem `approved` a existujícím tokenem zobrazit:
- Tlačítko "Zkopírovat odkaz" (aktuálně se zobrazuje jen pro pending)
- Badge "Čeká na klienta"

### 4. Přidat záložku "Čeká na klienta" do Modifications

Nová záložka pro požadavky se statusem `approved` kde:
- Token existuje (client-facing)
- Klient ještě nepotvrdil

## Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `src/pages/Modifications.tsx` | Odstranit isSuperAdmin podmínku, přidat success dialog, přidat záložku "Čeká na klienta" |
| `src/components/engagements/ModificationRequestCard.tsx` | Zobrazit odkaz i pro approved status, přidat badge "Čeká na klienta" |

## Detailní implementace

### Modifications.tsx

1. **Odebrat závislost na isSuperAdmin:**
   - Řádky 180-181: změnit na `onApprove={handleApprove}` a `onReject={handleReject}`

2. **Přidat state pro success dialog:**
   ```typescript
   const [successDialogOpen, setSuccessDialogOpen] = useState(false);
   const [approvedRequest, setApprovedRequest] = useState<StoredModificationRequest | null>(null);
   ```

3. **Upravit handleApprove:**
   - Po úspěšném schválení nastavit `approvedRequest` a otevřít dialog
   - Refresh dat pro aktualizaci seznamu

4. **Přidat success dialog UI:**
   - Zobrazit odkaz pro klienta (pokud existuje token)
   - Tlačítko pro zkopírování
   - Info o dalším kroku

5. **Přidat novou kategorii požadavků:**
   ```typescript
   const waitingForClient = pendingRequests?.filter(
     r => r.status === 'approved' && r.upgrade_offer_token && !r.client_approved_at
   ) || [];
   ```

### ModificationRequestCard.tsx

1. **Zobrazit tlačítko "Odkaz" i pro approved status:**
   ```typescript
   // Aktuálně: showActions = onApprove && onReject && request.status === 'pending'
   // Změnit logiku pro zobrazení kopírování odkazu nezávisle na showActions
   ```

2. **Přidat badge "Čeká na klienta":**
   ```typescript
   {request.status === 'approved' && hasUpgradeToken && !isClientApproved && (
     <Badge variant="outline" className="text-amber-600">
       <Clock className="h-3 w-3 mr-1" />
       Čeká na klienta
     </Badge>
   )}
   ```
