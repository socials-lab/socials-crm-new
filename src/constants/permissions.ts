export const ALL_PAGES = [
  // Osobní přehledy
  { id: 'dashboard', label: 'Přehled', emoji: '🏠' },
  { id: 'my-work', label: 'Můj přehled', emoji: '👤' },
  // Obchodní proces
  { id: 'leads', label: 'Leady', emoji: '🎯' },
  { id: 'clients', label: 'Klienti', emoji: '🏢' },
  { id: 'contacts', label: 'Kontakty', emoji: '📇' },
  { id: 'engagements', label: 'Zakázky', emoji: '📋' },
  { id: 'modifications', label: 'Úpravy zakázek', emoji: '✏️' },
  { id: 'broadcasts', label: 'Rozesílky', emoji: '📨' },
  // Práce & dodávka
  { id: 'extra-work', label: 'Vícepráce', emoji: '🔧' },
  { id: 'creative-boost', label: 'Creative Boost', emoji: '🎨' },
  { id: 'meetings', label: 'Meetingy', emoji: '📅' },
  // Finance & služby
  { id: 'invoicing', label: 'Fakturace', emoji: '🧾' },
  { id: 'services', label: 'Služby', emoji: '📦' },
  // Tým & interní
  { id: 'colleagues', label: 'Kolegové', emoji: '👥' },
  { id: 'recruitment', label: 'Nábor', emoji: '🎓' },
  { id: 'feedback', label: 'Feedback Zone', emoji: '💡' },
  { id: 'academy', label: 'Akademie', emoji: '📚' },
  { id: 'sop', label: 'SOP', emoji: '📖' },
  // Reporting
  { id: 'analytics', label: 'Analytika', emoji: '📊' },
  // Nastavení
  { id: 'settings', label: 'Nastavení', emoji: '⚙️' },
] as const;

export type PageId = typeof ALL_PAGES[number]['id'];

export const PAGE_GROUPS = [
  { label: 'Osobní přehledy', pages: ['dashboard', 'my-work'] },
  { label: 'Obchodní proces', pages: ['leads', 'clients', 'contacts', 'engagements', 'modifications', 'broadcasts'] },
  { label: 'Práce & dodávka', pages: ['extra-work', 'creative-boost', 'meetings'] },
  { label: 'Finance & služby', pages: ['invoicing', 'services'] },
  { label: 'Tým & interní', pages: ['colleagues', 'recruitment', 'feedback', 'academy', 'sop'] },
  { label: 'Reporting & nastavení', pages: ['analytics', 'settings'] },
] as const;
