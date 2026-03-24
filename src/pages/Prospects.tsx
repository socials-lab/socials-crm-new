import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, ArrowRightLeft, Search, ExternalLink, Code } from 'lucide-react';
import { ProspectIntegrationDialog } from '@/components/prospects/ProspectIntegrationDialog';
import { useProspectsData } from '@/hooks/useProspectsData';
import { ProspectDetailSheet } from '@/components/prospects/ProspectDetailSheet';
import { PROSPECT_STATUS_LABELS, PROSPECT_STATUS_COLORS } from '@/types/prospect';
import type { ProspectStatus, ProspectWithInteractions } from '@/types/prospect';
import { cn } from '@/lib/utils';

export default function Prospects() {
  const { prospects, isLoading } = useProspectsData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | 'all'>('all');
  const [interactionFilter, setInteractionFilter] = useState<string>('all');
  const [selectedProspect, setSelectedProspect] = useState<ProspectWithInteractions | null>(null);
  const [integrationOpen, setIntegrationOpen] = useState(false);

  // Collect unique interaction titles for filter dropdown
  const interactionTitles = useMemo(() => {
    const titles = new Set<string>();
    prospects.forEach(p => p.interactions.forEach(i => titles.add(i.title)));
    return Array.from(titles).sort();
  }, [prospects]);

  const filtered = useMemo(() => {
    return prospects.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (interactionFilter !== 'all') {
        const hasMatch = p.interactions.some(i => i.title === interactionFilter);
        if (!hasMatch) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.company || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [prospects, search, statusFilter, interactionFilter]);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const newThisMonth = prospects.filter(p => p.created_at.startsWith(thisMonth)).length;
  const convertedCount = prospects.filter(p => p.status === 'converted').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zájemci"
        description="Kontakty z lead magnetů a webinářů"
        actions={
          <Button variant="outline" onClick={() => setIntegrationOpen(true)} className="gap-1.5">
            <Code className="h-4 w-4" />
            Napojení
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Celkem zájemců" value={prospects.length} icon={Users} />
        <KPICard title="Nových tento měsíc" value={newThisMonth} icon={UserPlus} />
        <KPICard title="Převedených na lead" value={convertedCount} icon={ArrowRightLeft} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hledat dle jména, emailu, firmy..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrovat status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny statusy</SelectItem>
            {(Object.entries(PROSPECT_STATUS_LABELS) as [ProspectStatus, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={interactionFilter} onValueChange={v => setInteractionFilter(v)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Lead magnet / webinář" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny lead magnety</SelectItem>
            {interactionTitles.map(title => (
              <SelectItem key={title} value={title}>{title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jméno</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead className="text-center">Interakce</TableHead>
              <TableHead>Poslední aktivita</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Načítání...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {search || statusFilter !== 'all' ? 'Žádní zájemci neodpovídají filtru' : 'Zatím žádní zájemci'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(prospect => (
                <TableRow
                  key={prospect.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedProspect(prospect)}
                >
                  <TableCell className="font-medium">{prospect.name}</TableCell>
                  <TableCell className="text-muted-foreground">{prospect.email}</TableCell>
                  <TableCell>{prospect.company || '—'}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{prospect.interaction_count}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {prospect.last_interaction_at
                      ? new Date(prospect.last_interaction_at).toLocaleDateString('cs-CZ')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-xs', PROSPECT_STATUS_COLORS[prospect.status])}>
                      {PROSPECT_STATUS_LABELS[prospect.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProspectDetailSheet
        prospect={selectedProspect}
        onClose={() => setSelectedProspect(null)}
      />

      <ProspectIntegrationDialog
        open={integrationOpen}
        onOpenChange={setIntegrationOpen}
      />
    </div>
  );
}
