import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { InlineEditText, InlineEditNumber } from './InlineEditCell';
import { BillingPeriodDialog } from './BillingPeriodDialog';
import { statusConfig } from './ExtraWorkStatusBadge';
import { useCRMData } from '@/hooks/useCRMData';
import { useToast } from '@/hooks/use-toast';
import type { ExtraWork, ExtraWorkStatus } from '@/types/crm';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { 
  MoreVertical, 
  Eye, 
  Search,
  Clock,
  Loader2,
  FileText,
  Receipt,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ExtraWorkTableProps {
  extraWorks: ExtraWork[];
  onUpdate: (id: string, data: Partial<ExtraWork>) => void;
  onDelete: (id: string) => void;
  filterStatus?: ExtraWorkStatus | 'all';
  onFilterStatusChange?: (status: ExtraWorkStatus | 'all') => void;
  filterClientId?: string | 'all';
  onFilterClientChange?: (clientId: string | 'all') => void;
  filterColleagueId?: string | 'all';
  onFilterColleagueChange?: (colleagueId: string | 'all') => void;
  filterMonth?: string | 'all';
  onFilterMonthChange?: (month: string | 'all') => void;
}

export function ExtraWorkTable({
  extraWorks,
  onUpdate,
  onDelete,
  filterStatus = 'all',
  onFilterStatusChange,
  filterClientId = 'all',
  onFilterClientChange,
  filterColleagueId = 'all',
  onFilterColleagueChange,
  filterMonth = 'all',
  onFilterMonthChange,
}: ExtraWorkTableProps) {
  const { clients, colleagues, getClientById, getEngagementById, getColleagueById } = useCRMData();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [billingPeriodDialogOpen, setBillingPeriodDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string; work: ExtraWork } | null>(null);

  // Get available months from billing periods
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    extraWorks.forEach(work => {
      months.add(work.billing_period);
    });
    return Array.from(months).sort().reverse();
  }, [extraWorks]);

  const filteredWorks = useMemo(() => {
    return extraWorks.filter(work => {
      if (filterStatus !== 'all' && work.status !== filterStatus) {
        return false;
      }
      if (filterClientId !== 'all' && work.client_id !== filterClientId) {
        return false;
      }
      if (filterColleagueId !== 'all' && work.colleague_id !== filterColleagueId) {
        return false;
      }
      if (filterMonth !== 'all') {
        if (work.billing_period !== filterMonth) return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const client = getClientById(work.client_id);
        const colleague = getColleagueById(work.colleague_id);
        const engagement = work.engagement_id ? getEngagementById(work.engagement_id) : null;
        return (
          work.name.toLowerCase().includes(query) ||
          work.description.toLowerCase().includes(query) ||
          client?.brand_name.toLowerCase().includes(query) ||
          colleague?.full_name.toLowerCase().includes(query) ||
          engagement?.name.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [extraWorks, filterStatus, filterClientId, filterColleagueId, filterMonth, searchQuery, getClientById, getColleagueById, getEngagementById]);

  const activeClients = useMemo(() => clients.filter(c => c.status === 'active'), [clients]);
  const activeColleagues = useMemo(() => colleagues.filter(c => c.status === 'active'), [colleagues]);

  const formatCurrency = (amount: number, currency: string = 'CZK') => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'LLLL yyyy', { locale: cs });
  };

  // Handle hours change with auto-calculation
  const handleHoursChange = (id: string, hours: number | null) => {
    const work = extraWorks.find(w => w.id === id);
    if (work && hours !== null && work.hourly_rate) {
      const newAmount = Math.round(hours * work.hourly_rate);
      onUpdate(id, { hours_worked: hours, amount: newAmount });
    } else {
      onUpdate(id, { hours_worked: hours });
    }
  };

  // Handle rate change with auto-calculation
  const handleRateChange = (id: string, rate: number | null) => {
    const work = extraWorks.find(w => w.id === id);
    if (work && rate !== null && work.hours_worked) {
      const newAmount = Math.round(work.hours_worked * rate);
      onUpdate(id, { hourly_rate: rate, amount: newAmount });
    } else {
      onUpdate(id, { hourly_rate: rate });
    }
  };

  // Handle status change - show billing period dialog when changing to ready_to_invoice
  const handleStatusChange = (id: string, newStatus: ExtraWorkStatus) => {
    const work = extraWorks.find(w => w.id === id);
    if (!work) return;

    // If changing to ready_to_invoice, show billing period dialog
    if (newStatus === 'ready_to_invoice') {
      setPendingStatusChange({ id, work });
      setBillingPeriodDialogOpen(true);
      return;
    }

    const updates: Partial<ExtraWork> = { status: newStatus };

    // Set approval_date when moving out of pending_approval
    if (work.status === 'pending_approval' && newStatus !== 'pending_approval' && !work.approval_date) {
      updates.approval_date = new Date().toISOString();
    }

    onUpdate(id, updates);
  };

  // Handle billing period confirmation
  const handleBillingPeriodConfirm = (billingPeriod: string) => {
    if (!pendingStatusChange) return;

    const { id, work } = pendingStatusChange;
    const updates: Partial<ExtraWork> = {
      status: 'ready_to_invoice',
      billing_period: billingPeriod,
    };

    // Set approval_date if not already set
    if (work.status === 'pending_approval' && !work.approval_date) {
      updates.approval_date = new Date().toISOString();
    }

    onUpdate(id, updates);
    
    toast({
      title: 'K fakturaci',
      description: `Vícepráce bude zahrnuta ve fakturaci za ${formatMonthLabel(billingPeriod)}.`,
    });

    setPendingStatusChange(null);
  };

  // Status icon component
  const StatusIcon = ({ status }: { status: ExtraWorkStatus }) => {
    const icons = {
      pending_approval: Clock,
      in_progress: Loader2,
      ready_to_invoice: FileText,
      invoiced: Receipt,
    };
    const Icon = icons[status];
    return <Icon className="h-3.5 w-3.5" />;
  };

  // Bulk selection helpers
  const selectableWorks = filteredWorks.filter(w => w.status !== 'invoiced');
  const allSelected = selectableWorks.length > 0 && selectableWorks.every(w => selectedIds.has(w.id));
  const someSelected = selectableWorks.some(w => selectedIds.has(w.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableWorks.map(w => w.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkStatusChange = (newStatus: ExtraWorkStatus) => {
    selectedIds.forEach(id => {
      handleStatusChange(id, newStatus);
    });
    toast({
      title: 'Stav změněn',
      description: `${selectedIds.size} položek aktualizováno.`,
    });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => {
      onDelete(id);
    });
    toast({
      title: 'Smazáno',
      description: `${selectedIds.size} položek odstraněno.`,
    });
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hledat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {onFilterMonthChange && (
          <Select value={filterMonth} onValueChange={onFilterMonthChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Měsíc" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny měsíce</SelectItem>
              {availableMonths.map(month => (
                <SelectItem key={month} value={month}>
                  {formatMonthLabel(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {onFilterClientChange && (
          <Select value={filterClientId} onValueChange={onFilterClientChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Klient" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všichni klienti</SelectItem>
              {activeClients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.brand_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {onFilterColleagueChange && (
          <Select value={filterColleagueId} onValueChange={onFilterColleagueChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Kolega" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všichni kolegové</SelectItem>
              {activeColleagues.map(col => (
                <SelectItem key={col.id} value={col.id}>
                  {col.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {onFilterStatusChange && (
          <Select value={filterStatus} onValueChange={onFilterStatusChange as (value: string) => void}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Stav" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny stavy</SelectItem>
              <SelectItem value="pending_approval">Čeká na schválení</SelectItem>
              <SelectItem value="in_progress">V procesu</SelectItem>
              <SelectItem value="ready_to_invoice">K fakturaci</SelectItem>
              <SelectItem value="invoiced">Vyfakturováno</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
          <span className="text-sm font-medium">
            Vybráno: {selectedIds.size}
          </span>
          <Select onValueChange={(val) => handleBulkStatusChange(val as ExtraWorkStatus)}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Změnit stav na..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending_approval">Čeká na schválení</SelectItem>
              <SelectItem value="in_progress">V procesu</SelectItem>
              <SelectItem value="ready_to_invoice">K fakturaci</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Smazat ({selectedIds.size})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Smazat vybrané vícepráce?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tato akce je nevratná. Bude odstraněno {selectedIds.size} položek.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Zrušit</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                  Smazat
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Zrušit výběr
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Vybrat vše"
                  className={someSelected && !allSelected ? "opacity-50" : ""}
                />
              </TableHead>
              <TableHead className="w-[200px]">Zakázka & Klient</TableHead>
              <TableHead className="w-[130px]">Kolega</TableHead>
              <TableHead className="w-[180px]">Název</TableHead>
              <TableHead className="w-[240px]">Hodiny × Sazba = Částka</TableHead>
              <TableHead className="w-[100px]">Období</TableHead>
              <TableHead className="w-[180px]">Stav</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Žádné vícepráce nenalezeny
                </TableCell>
              </TableRow>
            ) : (
              filteredWorks.map(work => {
                const client = getClientById(work.client_id);
                const colleague = getColleagueById(work.colleague_id);
                const engagement = work.engagement_id ? getEngagementById(work.engagement_id) : null;
                const config = statusConfig[work.status];
                const isInvoiced = work.status === 'invoiced';
                const upsoldBy = work.upsold_by_id ? getColleagueById(work.upsold_by_id) : null;
                
                return (
                  <TableRow key={work.id}>
                    {/* Checkbox */}
                    <TableCell className="py-2">
                      <Checkbox
                        checked={selectedIds.has(work.id)}
                        onCheckedChange={() => toggleSelect(work.id)}
                        disabled={isInvoiced}
                        aria-label={`Vybrat ${work.name}`}
                      />
                    </TableCell>
                    
                    {/* Zakázka & Klient */}
                    <TableCell className="py-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {engagement?.name || '—'}
                          </span>
                          {upsoldBy && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-green-50 text-green-700 border-green-200 shrink-0" title={`Prodal: ${upsoldBy.full_name} (provize ${work.upsell_commission_percent || 10}%)`}>
                              <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                              Upsell
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {client?.brand_name}
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Kolega */}
                    <TableCell className="py-2">
                      <span className="text-sm truncate">{colleague?.full_name}</span>
                    </TableCell>
                    
                    {/* Název */}
                    <TableCell className="py-2">
                      <InlineEditText
                        value={work.name}
                        onChange={(value) => onUpdate(work.id, { name: value })}
                        className="text-sm font-medium"
                      />
                    </TableCell>
                    
                    {/* Hodiny × Sazba = Částka */}
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1 text-sm">
                        <InlineEditNumber
                          value={work.hours_worked}
                          onChange={(value) => handleHoursChange(work.id, value)}
                          className="w-[50px]"
                          placeholder="0"
                        />
                        <span className="text-muted-foreground text-xs">h ×</span>
                        <InlineEditNumber
                          value={work.hourly_rate}
                          onChange={(value) => handleRateChange(work.id, value)}
                          className="w-[70px]"
                          placeholder="0"
                        />
                        <span className="text-muted-foreground text-xs">=</span>
                        <span className="font-semibold whitespace-nowrap">
                          {formatCurrency(work.amount)}
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Období */}
                    <TableCell className="py-2">
                      <span className="text-sm text-muted-foreground">
                        {formatMonthLabel(work.billing_period).split(' ')[0].slice(0, 3)} {work.billing_period.split('-')[0]}
                      </span>
                    </TableCell>
                    
                    {/* Stav - Inline Select */}
                    <TableCell className="py-2">
                      <Select
                        value={work.status}
                        onValueChange={(val) => handleStatusChange(work.id, val as ExtraWorkStatus)}
                        disabled={work.status === 'invoiced'}
                      >
                        <SelectTrigger 
                          className={cn(
                            "h-8 w-[160px] text-xs gap-1.5",
                            config.className,
                            work.status === 'invoiced' && "opacity-70 cursor-not-allowed"
                          )}
                        >
                          <StatusIcon status={work.status} />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending_approval" className="text-xs">
                            Čeká na schválení
                          </SelectItem>
                          <SelectItem value="in_progress" className="text-xs">
                            V procesu
                          </SelectItem>
                          <SelectItem value="ready_to_invoice" className="text-xs">
                            K fakturaci
                          </SelectItem>
                          <SelectItem value="invoiced" disabled className="text-xs">
                            Vyfakturováno
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    
                    {/* Akce */}
                    <TableCell className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {work.status === 'invoiced' && work.invoice_number && (
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Faktura #{work.invoice_number}
                            </DropdownMenuItem>
                          )}
                          {!isInvoiced && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Smazat
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Smazat vícepráci?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tato akce je nevratná. Vícepráce "{work.name}" bude trvale odstraněna.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Zrušit</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDelete(work.id)} className="bg-destructive hover:bg-destructive/90">
                                    Smazat
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
        <span>Zobrazeno {filteredWorks.length} z {extraWorks.length} víceprací</span>
        <span>
          Celkem: {formatCurrency(filteredWorks.reduce((sum, w) => sum + w.amount, 0))}
        </span>
      </div>

      {/* Billing Period Dialog */}
      {pendingStatusChange && (
        <BillingPeriodDialog
          open={billingPeriodDialogOpen}
          onOpenChange={(open) => {
            setBillingPeriodDialogOpen(open);
            if (!open) setPendingStatusChange(null);
          }}
          workName={pendingStatusChange.work.name}
          workDate={pendingStatusChange.work.work_date}
          currentBillingPeriod={pendingStatusChange.work.billing_period}
          onConfirm={handleBillingPeriodConfirm}
        />
      )}
    </div>
  );
}