

## Sidebar - vizualni clusterovani do skupin

Aktualne je vsech 17+ polozek v jednom plache seznamu bez vizualniho oddeleni. Prehlednosti pomuzeme pridanim nazvu skupin (SidebarGroupLabel) a jemnych vizualnich oddelovacu.

### Navrzene skupiny

```text
┌──────────────────────────┐
│  SOCIALS CRM (logo)      │
├──────────────────────────┤
│  🏠 Prehled              │
│  👤 Muj prehled          │
├──── OBCHOD ─────────────┤
│  🎯 Leady               │
│  🏢 Klienti             │
│  📇 Kontakty            │
│  📋 Zakazky             │
│  📝 Navrhy zmen         │
├──── PRACE & DODAVKA ────┤
│  🔧 Viceprace           │
│  💰 Provize             │
│  🎨 Creative Boost      │
│  📅 Meetingy            │
├──── FINANCE ────────────┤
│  🧾 Fakturace           │
│  📦 Sluzby              │
├──── TYM & INTERNI ──────┤
│  👥 Kolegove            │
│  🎓 Nabor               │
│  💡 Feedback Zone        │
│  📚 Akademie            │
├──── REPORTING ──────────┤
│  📊 Analytika           │
├──────────────────────────┤
│  ⚙️ Nastaveni           │
└──────────────────────────┘
```

### Technicke zmeny

**Soubor: `src/components/layout/AppSidebar.tsx`**

1. **Restrukturovat `mainNavItems`** - rozdelit na pole skupin, kazda s nazvem (`label`) a polem polozek (`items`):
   - `null` label pro "Osobni prehledy" (bez nadpisu, jen Prehled + Muj prehled)
   - `"Obchod"` - Leady, Klienti, Kontakty, Zakazky, Navrhy zmen
   - `"Prace & dodavka"` - Viceprace, Provize, Creative Boost, Meetingy
   - `"Finance"` - Fakturace, Sluzby
   - `"Tym & interni"` - Kolegove, Nabor, Feedback Zone, Akademie
   - `"Reporting"` - Analytika

2. **Pouzit `SidebarGroupLabel`** - importovat a pouzit pro nazvy skupin. Styl: maly, uppercase, sedy text (uz je v shadcn default).

3. **Kazda skupina jako vlastni `SidebarGroup`** - s `SidebarGroupLabel` a `SidebarGroupContent > SidebarMenu`.

4. **Vizualni mezery** - kazda SidebarGroup bude mit `pt-2` a jemny separator (Separator komponent nebo border-top) mezi skupinami pro vizualni oddeleni.

5. **Filtrovani zustava** - logika `canViewPage` a `requiresColleague` se aplikuje na kazdou skupinu zvlast. Skupiny, ktere nemaji zadnou viditelnou polozku, se nezobrazuji.

6. **Nastaveni** zustane dole s `mt-auto`.

Zadne dalsi soubory se nemeni. Mobilni navigace (MobileBottomNav) zustava beze zmen.

