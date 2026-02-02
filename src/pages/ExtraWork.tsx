import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExtraWorkTable } from '@/components/extra-work/ExtraWorkTable';
import { ExtraWorkKanban } from '@/components/extra-work/ExtraWorkKanban';
import { ExtraWorkMobileList } from '@/components/extra-work/ExtraWorkMobileList';
import { AddExtraWorkDialog } from '@/components/extra-work/AddExtraWorkDialog';
import { useCRMData } from '@/hooks/useCRMData';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ExtraWork as ExtraWorkType, ExtraWorkStatus } from '@/types/crm';
import { Plus, Clock, Loader2, FileText, Receipt, LayoutList, Columns3, TrendingUp } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type ViewMode = 'table' | 'kanban';

export default function ExtraWork() {
  const { extraWorks, addExtraWork, updateExtraWork, deleteExtraWork, isLoading } = useCRMData();
  const isMobile = useIsMobile();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filterStatus, setFilterStatus] = useState<ExtraWorkStatus | 'all'>('all');
  const [filterClientId, setFilterClientId] = useState<string | 'all'>('all');
  const [filterColleagueId, setFilterColleagueId] = useState<string | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Apply filters for kanban view - use billing_period for consistent filtering
  const filteredExtraWorks = useMemo(() => {
    return extraWorks.filter(work => {
      if (filterClientId !== 'all' && work.client_id !== filterClientId) return false;
      if (filterColleagueId !== 'all' && work.colleague_id !== filterColleagueId) return false;
      if (filterMonth !== 'all') {
        // Use billing_period for filtering, consistent with ExtraWorkTable
        if (work.billing_period !== filterMonth) return false;
      }
      return true;
    });
  }, [extraWorks, filterClientId, filterColleagueId, filterMonth]);

  // KPI calculations with new status system
  const kpis = useMemo(() => {
    const pendingApproval = extraWorks.filter(w => w.status === 'pending_approval');
    const inProgress = extraWorks.filter(w => w.status === 'in_progress');
    const readyToInvoice = extraWorks.filter(w => w.status === 'ready_to_invoice');
    const invoiced = extraWorks.filter(w => w.status === 'invoiced');

    return {
      pendingApprovalCount: pendingApproval.length,
      pendingApprovalAmount: pendingApproval.reduce((sum, w) => sum + w.amount, 0),
      inProgressCount: inProgress.length,
      inProgressAmount: inProgress.reduce((sum, w) => sum + w.amount, 0),
      readyToInvoiceCount: readyToInvoice.length,
      readyToInvoiceAmount: readyToInvoice.reduce((sum, w) => sum + w.amount, 0),
      invoicedCount: invoiced.length,
      invoicedAmount: invoiced.reduce((sum, w) => sum + w.amount, 0),
      // Upsell metrics
      upsellCount: extraWorks.filter(w => w.upsold_by_id).length,
      upsellAmount: extraWorks.filter(w => w.upsold_by_id).reduce((sum, w) => sum + w.amount, 0),
      upsellCommission: extraWorks
        .filter(w => w.upsold_by_id && w.upsell_commission_percent)
        .reduce((sum, w) => sum + (w.amount * (w.upsell_commission_percent || 0) / 100), 0),
    };
  }, [extraWorks]);

  const handleAddExtraWork = (data: Omit<ExtraWorkType, 'id' | 'created_at' | 'updated_at' | 'status' | 'approval_date' | 'approved_by' | 'invoice_id' | 'invoice_number' | 'invoiced_at'>) => {
    addExtraWork(data);
  };

  const handleUpdate = (id: string, data: Partial<ExtraWorkType>) => {
    updateExtraWork(id, data);
  };

  const handleDelete = (id: string) => {
    deleteExtraWork(id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="🔧 Vícepráce"
        titleAccent="& schválení"
        description="Správa víceprací a jejich fakturace"
        actions={
          <div className="flex items-center gap-3">
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
              <ToggleGroupItem value="table" aria-label="Tabulka">
                <LayoutList className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="kanban" aria-label="Kanban">
                <Columns3 className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Přidat vícepráci
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <KPICard
          title="Čeká na schválení"
          value={kpis.pendingApprovalCount.toString()}
          subtitle={formatCurrency(kpis.pendingApprovalAmount)}
          icon={Clock}
        />
        <KPICard
          title="V procesu"
          value={kpis.inProgressCount.toString()}
          subtitle={formatCurrency(kpis.inProgressAmount)}
          icon={Loader2}
        />
        <KPICard
          title="K fakturaci"
          value={kpis.readyToInvoiceCount.toString()}
          subtitle={formatCurrency(kpis.readyToInvoiceAmount)}
          icon={FileText}
        />
        <KPICard
          title="Vyfakturováno"
          value={formatCurrency(kpis.invoicedAmount)}
          subtitle={`${kpis.invoicedCount} položek`}
          icon={Receipt}
        />
        <KPICard
          title="Upsell"
          value={formatCurrency(kpis.upsellAmount)}
          subtitle={`${kpis.upsellCount} položek • ${formatCurrency(kpis.upsellCommission)} provize`}
          icon={TrendingUp}
        />
      </div>

      {/* View - use mobile list on small screens for table view */}
      {viewMode === 'table' ? (
        isMobile ? (
          <ExtraWorkMobileList
            extraWorks={filteredExtraWorks}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ) : (
          <ExtraWorkTable
            extraWorks={extraWorks}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            filterClientId={filterClientId}
            onFilterClientChange={setFilterClientId}
            filterColleagueId={filterColleagueId}
            onFilterColleagueChange={setFilterColleagueId}
            filterMonth={filterMonth}
            onFilterMonthChange={setFilterMonth}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )
      ) : (
        <ExtraWorkKanban
          extraWorks={filteredExtraWorks}
          onUpdate={handleUpdate}
          searchQuery={searchQuery}
        />
      )}

      <AddExtraWorkDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddExtraWork}
      />
    </div>
  );
}