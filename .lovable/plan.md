
# Plán: Oprava scrollování v dialogu "Upravit zakázku"

## Problém
Scroll v Sheet komponentě pro úpravu zakázky nefunguje. Přestože bylo přidáno `flex flex-col h-full` a `overflow-y-auto`, formulář přetéká a není scrollovatelný.

## Příčina
Základní `SheetContent` komponenta má nastavené `p-6` (padding) a `h-full`, ale chybí `overflow-hidden` na kontejneru. Současný přístup s `flex-1 min-h-0 overflow-y-auto` nefunguje správně, protože:
1. `SheetContent` má defaultní padding `p-6`, který zabírá místo
2. Chybí `overflow-hidden` na `SheetContent`, takže flex layout nezná správné hranice

## Řešení
Použít stejný pattern jako fungující `AddEngagementServiceDialog`:

```tsx
<SheetContent className="sm:max-w-lg flex flex-col overflow-hidden p-0">
  <SheetHeader className="shrink-0 p-6 pb-0">
    <SheetTitle>...</SheetTitle>
  </SheetHeader>
  <div className="flex-1 overflow-y-auto p-6 pt-4">
    <EngagementForm ... />
  </div>
</SheetContent>
```

### Klíčové změny:
| Prvek | Současně | Nově |
|-------|----------|------|
| `SheetContent` | `h-full flex flex-col` | `flex flex-col overflow-hidden p-0` |
| `SheetHeader` | `shrink-0` | `shrink-0 p-6 pb-0` |
| Scroll wrapper | `mt-6 flex-1 min-h-0 overflow-y-auto pr-2` | `flex-1 overflow-y-auto p-6 pt-4` |

## Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `src/pages/Engagements.tsx` | Přepsat Sheet strukturu pro scroll |

## Technický detail
- `p-0` na `SheetContent` odstraní defaultní padding a přesune ho na child elementy
- `overflow-hidden` na kontejneru zajistí, že flex layout bude respektovat hranice
- `flex-1 overflow-y-auto` na scroll wrapperu vytvoří scrollovatelnou oblast
- Padding se přesune přímo na `SheetHeader` a scroll wrapper
