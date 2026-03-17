

## Plán: Bug Report & Feature Request systém

### Nové soubory

**1. `src/types/bugReport.ts`** — Typy a konfigurace
- `BugReportType`: `'bug' | 'feature'`
- `BugReportStatus`: `'open' | 'in_progress' | 'resolved'`
- `BugReport` interface: id, type, status, subject, description, page_url, screenshot_url, reported_by, created_at
- Status/type config objekty s labels, barvami, ikonami

**2. `src/data/bugReportsMockData.ts`** — Mock data (8-10 záznamů mix bugů a feature requestů)

**3. `src/hooks/useBugReports.tsx`** — Context provider + hook
- Stav: `reports[]`, CRUD operace (add, updateStatus)
- `unresolvedCount` getter (open + in_progress)
- `addReport({ type, subject, description, pageUrl, screenshotFile })` — vytvoří nový záznam, uloží screenshot jako data URL
- Provider pattern stejný jako `useFeedbackData`

**4. `src/components/bug-reports/BugReportFAB.tsx`** — Plovoucí tlačítko + Dialog
- FAB: `fixed bottom-5 right-5 z-50`, 48×48, `Lightbulb` ikona, shadow-lg
- Při kliknutí: pořídí screenshot přes `html2canvas` (nový npm balíček), uloží `window.location.href`
- Dialog (shadcn): type switcher (Bug/Feature), readonly URL, subject, description, screenshot preview s X/upload
- Submit volá `addReport` + toast + reset + close
- `onSubmit` callback prop pro budoucí backend napojení

**5. `src/components/bug-reports/BugReportImageDialog.tsx`** — Fullscreen screenshot dialog (klik z tabulky)

**6. `src/pages/BugReports.tsx`** — Admin stránka
- PageHeader "Feedback & Bug Reports"
- Tabs filtr: Typ (Vše/Bugy/Návrhy) + Status (Vše/Otevřené/V řešení/Vyřešené)
- Shadcn Table: Typ badge, Status badge s ikonou, Předmět + description, pathname, datum (date-fns cs), img ikona, akce dropdown (změna statusu)
- Admin check přes `useUserRole`

### Úpravy existujících souborů

**7. `src/App.tsx`**
- Import `BugReportsProvider`, obalit routes
- Import `BugReports` page, přidat route `/bug-reports`
- Přidat `<BugReportFAB />` do AppLayout (nebo přímo do App pod BrowserRouter)

**8. `src/components/layout/AppLayout.tsx`**
- Přidat `<BugReportFAB />` před `</main>` (uvnitř protected layout, aby byl viditelný na všech stránkách)

**9. `src/components/layout/AppSidebar.tsx`**
- Přidat nav item "Feedback" s ikonou `Bug` do sekce "Tým & interní", url `/bug-reports`
- Červený badge s `unresolvedCount` z `useBugReports` vedle názvu

**10. `src/constants/permissions.ts`**
- Přidat `{ id: 'bug-reports', label: 'Bug Reports', emoji: '🐛' }`

**11. `package.json`**
- Přidat `html2canvas` dependency

### Poznámky
- Existující Feedback Zone (`/feedback`) zůstane beze změny — nový systém je odděleně na `/bug-reports`
- Submit logika připravena jako callback `onSubmit` pro budoucí backend
- Screenshot se ukládá jako base64 data URL v mock datech

