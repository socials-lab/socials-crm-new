import { useState } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Bug, Lightbulb, Clock, Wrench, CheckCircle, ImageIcon, MoreHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BugReportImageDialog } from '@/components/bug-reports/BugReportImageDialog';
import { useBugReports } from '@/hooks/useBugReports';
import { useUserRole } from '@/hooks/useUserRole';
import type { BugReportType, BugReportStatus } from '@/types/bugReport';

const STATUS_ICON: Record<BugReportStatus, React.ReactNode> = {
  open: <Clock className="h-3.5 w-3.5" />,
  in_progress: <Wrench className="h-3.5 w-3.5" />,
  resolved: <CheckCircle className="h-3.5 w-3.5" />,
};

const STATUS_VARIANT: Record<BugReportStatus, string> = {
  open: 'bg-destructive/10 text-destructive',
  in_progress: 'bg-muted text-foreground',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const STATUS_LABELS: Record<BugReportStatus, string> = {
  open: 'Otevřené',
  in_progress: 'V řešení',
  resolved: 'Vyřešené',
};

const ALL_STATUSES: BugReportStatus[] = ['open', 'in_progress', 'resolved'];

function getPathname(url: string) {
  try {
    return new URL(url, 'https://x.com').pathname;
  } catch {
    return url;
  }
}

export default function BugReports() {
  const { reports, updateStatus } = useBugReports();
  const { role } = useUserRole();
  const isAdmin = role === 'admin' || role === 'management';

  const [typeFilter, setTypeFilter] = useState<'all' | BugReportType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | BugReportStatus>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const filtered = reports.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Bug Reports & Feedback" />

      <div className="flex flex-wrap gap-4">
        <Tabs value={typeFilter} onValueChange={v => setTypeFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Vše</TabsTrigger>
            <TabsTrigger value="bug" className="gap-1"><Bug className="h-3.5 w-3.5" /> Bugy</TabsTrigger>
            <TabsTrigger value="feature" className="gap-1"><Lightbulb className="h-3.5 w-3.5" /> Návrhy</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Vše</TabsTrigger>
            <TabsTrigger value="open">Otevřené</TabsTrigger>
            <TabsTrigger value="in_progress">V řešení</TabsTrigger>
            <TabsTrigger value="resolved">Vyřešené</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Typ</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead>Předmět</TableHead>
              <TableHead className="hidden md:table-cell">Nahlásil</TableHead>
              <TableHead className="hidden lg:table-cell max-w-[200px]">Stránka</TableHead>
              <TableHead className="hidden md:table-cell w-[140px]">Datum</TableHead>
              <TableHead className="w-[50px]">Img</TableHead>
              {isAdmin && <TableHead className="w-[50px]">Akce</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-muted-foreground py-8">
                  Žádné záznamy
                </TableCell>
              </TableRow>
            )}
            {filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell>
                  <Badge variant="outline" className={r.type === 'bug' ? 'bg-destructive/10 text-destructive border-0' : 'bg-primary/10 text-primary border-0'}>
                    {r.type === 'bug' ? <Bug className="h-3 w-3 mr-1" /> : <Lightbulb className="h-3 w-3 mr-1" />}
                    {r.type === 'bug' ? 'Bug' : 'Návrh'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`border-0 gap-1 ${STATUS_VARIANT[r.status]}`}>
                    {STATUS_ICON[r.status]}
                    {STATUS_LABELS[r.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{r.subject}</div>
                  {r.description && <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">{r.reported_by}</TableCell>
                <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-xs text-muted-foreground">
                  {getPathname(r.page_url)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  {format(new Date(r.created_at), 'd. M. yyyy HH:mm', { locale: cs })}
                </TableCell>
                <TableCell>
                  {r.screenshot_url ? (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewImage(r.screenshot_url)}>
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {ALL_STATUSES.filter(s => s !== r.status).map(s => (
                          <DropdownMenuItem key={s} onClick={() => updateStatus(r.id, s)}>
                            {STATUS_ICON[s]}
                            <span className="ml-1.5">{STATUS_LABELS[s]}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BugReportImageDialog imageUrl={previewImage} open={!!previewImage} onOpenChange={v => { if (!v) setPreviewImage(null); }} />
    </div>
  );
}
