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
import type { ExtraWork, ExtraWorkStatus } from '@/types/crm';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Clock, User, Receipt, Loader2, FileText, TrendingUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusConfig } from './ExtraWorkStatusBadge';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ExtraWorkKanbanProps {
  extraWorks: ExtraWork[];
  onUpdate: (id: string, data: Partial<ExtraWork>) => void;
}

interface KanbanColumnProps {
  title: string;
  items: ExtraWork[];
  colorClass: string;
  total: number;
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
  const { getClientById, getColleagueById } = useCRMData();
  const { toast } = useToast();
  const client = getClientById(work.client_id);
  const colleague = getColleagueById(work.colleague_id);
  const upsoldBy = work.upsold_by_id ? getColleagueById(work.upsold_by_id) : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleStatusChange = (newStatus: ExtraWorkStatus) => {
    const updates: Partial<ExtraWork> = { status: newStatus };
    
    if (work.status === 'pending_approval' && newStatus !== 'pending_approval' && !work.approval_date) {
      updates.approval_date = new Date().toISOString();
    }

    onUpdate(work.id, updates);

    if (newStatus === 'ready_to_invoice') {
      toast({
        title: 'K fakturaci',
        description: 'Vícepráce bude zahrnuta v příští fakturaci.',
      });
    }
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

        {/* Financial details */}
        {(() => {
          const hours = work.hours_worked || 0;
          const rate = work.hourly_rate || 0;
          const clientAmount = work.amount || Math.round(hours * rate);
          const intRate = work.internal_hourly_rate || colleague?.internal_hourly_cost || 0;
          const colleagueCost = intRate > 0 && hours > 0 ? Math.round(hours * intRate) : 0;
          const upsellCommission = work.upsold_by_id && clientAmount > 0
            ? Math.round(clientAmount * (work.upsell_commission_percent || 10) / 100)
            : 0;
          const margin = clientAmount - colleagueCost - upsellCommission;
          const marginPct = clientAmount > 0 ? Math.round((margin / clientAmount) * 100) : 0;
          const marginColor = marginPct >= 40
            ? 'text-emerald-600 dark:text-emerald-400'
            : marginPct >= 20
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-red-600 dark:text-red-400';

          return (
            <div className="bg-muted/50 rounded-md p-2.5 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">💰 Klient</span>
                <span className="font-semibold">{formatCurrency(clientAmount)}</span>
              </div>
              {hours > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {hours}h × {formatCurrency(rate)}
                  </span>
                </div>
              )}
              {colleagueCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">🧑‍💻 Odměna ({formatCurrency(intRate)}/h)</span>
                  <span className="font-medium">{formatCurrency(colleagueCost)}</span>
                </div>
              )}
              {upsellCommission > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    📈 Provize ({work.upsell_commission_percent || 10}%)
                    {upsoldBy && ` — ${upsoldBy.full_name}`}
                  </span>
                  <span className="font-medium">{formatCurrency(upsellCommission)}</span>
                </div>
              )}
              {colleagueCost > 0 && (
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="text-muted-foreground">📊 Marže</span>
                  <span className={cn('font-semibold', marginColor)}>
                    {formatCurrency(margin)} ({marginPct}%)
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Date & Status */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{format(parseISO(work.work_date), 'd. MMM yyyy', { locale: cs })}</span>
          <Select
            value={work.status}
            onValueChange={(val) => handleStatusChange(val as ExtraWorkStatus)}
            disabled={work.status === 'invoiced'}
          >
            <SelectTrigger className="h-6 w-28 text-xs border-0 bg-muted/50 px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending_approval">Čeká</SelectItem>
              <SelectItem value="client_approved">Schváleno</SelectItem>
              <SelectItem value="in_progress">V procesu</SelectItem>
              <SelectItem value="ready_to_invoice">K fakturaci</SelectItem>
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
  total, 
  onUpdate,
}: KanbanColumnProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
          {formatCurrency(total)}
        </div>
      </div>
      <div className="bg-muted/30 rounded-b-lg p-3 min-h-[400px]">
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

export function ExtraWorkKanban({ extraWorks, onUpdate }: ExtraWorkKanbanProps) {
  const columns = useMemo(() => {
    const pendingApproval = extraWorks.filter(w => w.status === 'pending_approval');
    const clientApproved = extraWorks.filter(w => w.status === 'client_approved');
    const inProgress = extraWorks.filter(w => w.status === 'in_progress');
    const readyToInvoice = extraWorks.filter(w => w.status === 'ready_to_invoice');
    const invoiced = extraWorks.filter(w => w.status === 'invoiced');

    return {
      pendingApproval: {
        items: pendingApproval,
        total: pendingApproval.reduce((sum, w) => sum + w.amount, 0),
      },
      clientApproved: {
        items: clientApproved,
        total: clientApproved.reduce((sum, w) => sum + w.amount, 0),
      },
      inProgress: {
        items: inProgress,
        total: inProgress.reduce((sum, w) => sum + w.amount, 0),
      },
      readyToInvoice: {
        items: readyToInvoice,
        total: readyToInvoice.reduce((sum, w) => sum + w.amount, 0),
      },
      invoiced: {
        items: invoiced,
        total: invoiced.reduce((sum, w) => sum + w.amount, 0),
      },
    };
  }, [extraWorks]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      <KanbanColumn
        title="Čeká na schválení"
        items={columns.pendingApproval.items}
        total={columns.pendingApproval.total}
        colorClass="bg-amber-500/10 border-amber-500 text-amber-700"
        onUpdate={onUpdate}
        targetStatus="pending_approval"
      />
      <KanbanColumn
        title="Schváleno klientem"
        items={columns.clientApproved.items}
        total={columns.clientApproved.total}
        colorClass="bg-teal-500/10 border-teal-500 text-teal-700"
        onUpdate={onUpdate}
        targetStatus="client_approved"
      />
      <KanbanColumn
        title="V procesu"
        items={columns.inProgress.items}
        total={columns.inProgress.total}
        colorClass="bg-purple-500/10 border-purple-500 text-purple-700"
        onUpdate={onUpdate}
        targetStatus="in_progress"
      />
      <KanbanColumn
        title="K fakturaci"
        items={columns.readyToInvoice.items}
        total={columns.readyToInvoice.total}
        colorClass="bg-blue-500/10 border-blue-500 text-blue-700"
        onUpdate={onUpdate}
        targetStatus="ready_to_invoice"
      />
      <KanbanColumn
        title="Vyfakturováno"
        items={columns.invoiced.items}
        total={columns.invoiced.total}
        colorClass="bg-emerald-500/10 border-emerald-500 text-emerald-700"
        onUpdate={onUpdate}
        targetStatus="invoiced"
      />
    </div>
  );
}