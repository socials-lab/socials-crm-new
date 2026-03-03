import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import type { ExtraWork, ExtraWorkStatus } from '@/types/crm';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Clock, User, Receipt, Loader2, FileText, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusConfig } from './ExtraWorkStatusBadge';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ExtraWorkKanbanProps {
  extraWorks: ExtraWork[];
  onUpdate: (id: string, data: Partial<ExtraWork>) => void;
  searchQuery?: string;
}

interface KanbanColumnProps {
  title: string;
  items: ExtraWork[];
  colorClass: string;
  totalLabel: string;
  onUpdate: (id: string, data: Partial<ExtraWork>) => void;
  targetStatus: ExtraWorkStatus;
}

function KanbanCard({
  work,
  onUpdate,
}: {
  work: ExtraWork;
  onUpdate: (id: string, data: Partial<ExtraWork>) => void;
}) {
  const { getClientById, getColleagueById, approveExtraWork, completeExtraWork } = useCRMData();
  const { isSuperAdmin, role } = useUserRole();
  const { toast } = useToast();
  const client = getClientById(work.client_id);
  const colleague = getColleagueById(work.colleague_id);
  const upsoldBy = work.upsold_by_id ? getColleagueById(work.upsold_by_id) : null;

  // Permission check: only admin/management can approve extra work
  const canApprove = isSuperAdmin || role === 'admin' || role === 'management';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: work.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleStatusChange = async (newStatus: ExtraWorkStatus) => {
    // Permission check for approval actions
    if (work.status === 'pending_approval' && newStatus !== 'pending_approval' && !canApprove) {
      toast({
        title: 'Nedostatečná oprávnění',
        description: 'Pouze admin nebo management může schvalovat vícepráce.',
        variant: 'destructive',
      });
      return;
    }

    // Use proper status transition helpers
    if (newStatus === 'in_progress' && work.status === 'pending_approval') {
      await approveExtraWork(work.id);
      toast({
        title: 'Schváleno',
        description: 'Vícepráce byla schválena a převedena do práce.',
      });
      return;
    }

    if (newStatus === 'ready_to_invoice' && work.status === 'in_progress') {
      await completeExtraWork(work.id);
      toast({
        title: 'K fakturaci',
        description: 'Vícepráce bude zahrnuta v příští fakturaci.',
      });
      return;
    }

    // For other status changes, use update
    const updates: Partial<ExtraWork> = { status: newStatus };
    onUpdate(work.id, updates);
  };

  return (
    <Card className="mb-3 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Editable Name */}
        <Input
          value={work.name}
          onChange={(e) => onUpdate(work.id, { name: e.target.value })}
          className="font-medium text-sm h-8 px-2 border-transparent hover:border-border focus:border-primary"
        />
        
        {/* Client & Upsell badge */}
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{client?.brand_name || '—'}</span>
            {upsoldBy && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-green-50 text-green-700 border-green-200">
                <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                Upsell
              </Badge>
            )}
          </div>
        </div>

        {/* Colleague */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{colleague?.full_name || '—'}</span>
        </div>

        {/* Amount & Hours */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{formatCurrency(work.amount)}</span>
          {work.hours_worked && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{work.hours_worked}h</span>
            </div>
          )}
        </div>

        {/* Date & Status */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{format(parseISO(work.work_date), 'd. MMM yyyy', { locale: cs })}</span>
          <Select
            value={work.status}
            onValueChange={(val) => handleStatusChange(val as ExtraWorkStatus)}
            disabled={work.status === 'invoiced' || (work.status === 'pending_approval' && !canApprove)}
          >
            <SelectTrigger className={cn("h-6 w-28 text-xs border-0 bg-muted/50 px-2", (work.status === 'pending_approval' && !canApprove) && "opacity-70 cursor-not-allowed")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending_approval">Čeká</SelectItem>
              <SelectItem value="in_progress" disabled={work.status === 'pending_approval' && !canApprove}>V procesu</SelectItem>
              <SelectItem value="ready_to_invoice" disabled={work.status === 'pending_approval' && !canApprove}>K fakturaci</SelectItem>
              <SelectItem value="invoiced" disabled>Vyfakturováno</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoice number if invoiced */}
        {work.status === 'invoiced' && work.invoice_number && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
            <Receipt className="h-3 w-3" />
            <span>#{work.invoice_number}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ 
  title, 
  items, 
  colorClass, 
  totalLabel,
  onUpdate,
}: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-[300px]">
      <div className={cn("rounded-t-lg px-4 py-3 border-b-2", colorClass)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs bg-background/80 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        <div className="text-xs mt-1 opacity-80">
          {totalLabel}
        </div>
      </div>
      <div className="bg-muted/30 rounded-b-lg p-3 min-h-[200px] max-h-[70vh] overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Žádné položky
          </div>
        ) : (
          items.map(work => (
            <KanbanCard
              key={work.id}
              work={work}
              onUpdate={onUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function ExtraWorkKanban({ extraWorks, onUpdate, searchQuery }: ExtraWorkKanbanProps) {
  const { getClientById, getColleagueById, getEngagementById } = useCRMData();

  // Apply search filter to extraWorks
  const filteredWorks = useMemo(() => {
    if (!searchQuery) return extraWorks;
    const query = searchQuery.toLowerCase();
    return extraWorks.filter(work => {
      const client = getClientById(work.client_id);
      const colleague = getColleagueById(work.colleague_id);
      const engagement = work.engagement_id ? getEngagementById(work.engagement_id) : null;
      return (
        work.name.toLowerCase().includes(query) ||
        work.description?.toLowerCase().includes(query) ||
        client?.brand_name?.toLowerCase().includes(query) ||
        colleague?.full_name?.toLowerCase().includes(query) ||
        engagement?.name?.toLowerCase().includes(query)
      );
    });
  }, [extraWorks, searchQuery, getClientById, getColleagueById, getEngagementById]);

  const columns = useMemo(() => {
    const pendingApproval = filteredWorks.filter(w => w.status === 'pending_approval');
    const inProgress = filteredWorks.filter(w => w.status === 'in_progress');
    const readyToInvoice = filteredWorks.filter(w => w.status === 'ready_to_invoice');
    const invoiced = filteredWorks.filter(w => w.status === 'invoiced');

    const formatAmountsByCurrency = (works: ExtraWork[]) => {
      if (works.length === 0) return '0';
      const totals = new Map<string, number>();
      works.forEach((work) => {
        totals.set(work.currency, (totals.get(work.currency) ?? 0) + work.amount);
      });
      return Array.from(totals.entries())
        .map(([currency, amount]) => new Intl.NumberFormat('cs-CZ', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount))
        .join(' + ');
    };

    return {
      pendingApproval: {
        items: pendingApproval,
        totalLabel: formatAmountsByCurrency(pendingApproval),
      },
      inProgress: {
        items: inProgress,
        totalLabel: formatAmountsByCurrency(inProgress),
      },
      readyToInvoice: {
        items: readyToInvoice,
        totalLabel: formatAmountsByCurrency(readyToInvoice),
      },
      invoiced: {
        items: invoiced,
        totalLabel: formatAmountsByCurrency(invoiced),
      },
    };
  }, [filteredWorks]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      <KanbanColumn
        title="Čeká na schválení"
        items={columns.pendingApproval.items}
        totalLabel={columns.pendingApproval.totalLabel}
        colorClass="bg-amber-500/10 border-amber-500 text-amber-700"
        onUpdate={onUpdate}
        targetStatus="pending_approval"
      />
      <KanbanColumn
        title="V procesu"
        items={columns.inProgress.items}
        totalLabel={columns.inProgress.totalLabel}
        colorClass="bg-purple-500/10 border-purple-500 text-purple-700"
        onUpdate={onUpdate}
        targetStatus="in_progress"
      />
      <KanbanColumn
        title="K fakturaci"
        items={columns.readyToInvoice.items}
        totalLabel={columns.readyToInvoice.totalLabel}
        colorClass="bg-blue-500/10 border-blue-500 text-blue-700"
        onUpdate={onUpdate}
        targetStatus="ready_to_invoice"
      />
      <KanbanColumn
        title="Vyfakturováno"
        items={columns.invoiced.items}
        totalLabel={columns.invoiced.totalLabel}
        colorClass="bg-emerald-500/10 border-emerald-500 text-emerald-700"
        onUpdate={onUpdate}
        targetStatus="invoiced"
      />
    </div>
  );
}