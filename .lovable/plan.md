

## Fix: Levý sloupec (sidebar) fixní při scrollu

### Problem
Sidebar ma `sticky top-6`, ale nefunguje, protoze parent kontejner (`flex`) nema dostatecnou vysku nebo sidebar se scrolluje s celou strankou.

### Reseni
V `src/pages/SOP.tsx` na desktopovem layoutu:

1. Zmenit parent flex kontejner tak, aby mel `items-start` (uz ma `md:items-start` - OK)
2. Na sidebar divu zmenit `sticky top-6` na `sticky top-20` (aby respektoval header/navbar) a pridat `self-start`
3. Zajistit, ze hlavni obsahovy sloupec (`flex-1`) nema omezeni, ktere by branilo sticky efektu

### Technicke zmeny

**`src/pages/SOP.tsx`** (radek ~155):
- Sidebar div: zmenit `sticky top-6` na `sticky top-20 self-start` pro spravne ukotveni pod headerem
- Overit, ze parent flex kontejner nema `overflow-hidden` nebo jiny blokujici styl

