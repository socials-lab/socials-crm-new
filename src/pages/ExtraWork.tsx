import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Button } from '@/components/ui/button';
import { AddExtraWorkDialog } from '@/components/extra-work/AddExtraWorkDialog';
import { EditExtraWorkDialog } from '@/components/extra-work/EditExtraWorkDialog';
import { SendApprovalDialog } from '@/components/extra-work/SendApprovalDialog';
import { ExtraWorkTable } from '@/components/extra-work/ExtraWorkTable';
import { ExtraWorkKanban } from '@/components/extra-work/ExtraWorkKanban';
import { useCRMData } from '@/hooks/useCRMData';
import type { ExtraWork as ExtraWorkType, ExtraWorkStatus } from '@/types/crm';
import { Plus, Clock, Loader2, FileText, Receipt, TrendingUp, LayoutList, Columns3 } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

export default function ExtraWork() {
  const { extraWorks, addExtraWork, updateExtraWork, deleteExtraWork } = useCRMData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editWork, setEditWork] = useState<ExtraWorkType | null>(null);
  const [approvalWork, setApprovalWork] = useState<ExtraWorkType | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');

  // Filter state
  const [filterStatus, setFilterStatus] = useState<ExtraWorkStatus | 'all'>('all');
  const [filterClientId, setFilterClientId] = useState<string | 'all'>('all');
  const [filterColleagueId, setFilterColleagueId] = useState<string | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<string | 'all'>('all');

  // KPI calculations
  const kpis = useMemo(() => {
    const pendingApproval = extraWorks.filter(w => w.status === 'pending_approval');
    const inProgress = extraWorks.filter(w => w.status === 'in_progress');
    const readyToInvoice = extraWorks.filter(w => w.status === 'ready_to_invoice');
    const invoiced = extraWorks.filter(w => w.status === 'invoiced');
    const upsells = extraWorks.filter(w => w.upsold_by_id);
    const upsellAmount = upsells.reduce((s, w) => s + w.amount, 0);
    const avgUpsellCommission = upsells.length > 0
      ? Math.round(upsellAmount * (upsells[0]?.upsell_commission_percent || 10) / 100 / upsells.length)
      : 0;
    return {
      pendingCount: pendingApproval.length,
      pendingAmount: pendingApproval.reduce((s, w) => s + w.amount, 0),
      inProgressCount: inProgress.length,
      inProgressAmount: inProgress.reduce((s, w) => s + w.amount, 0),
      readyCount: readyToInvoice.length,
      readyAmount: readyToInvoice.reduce((s, w) => s + w.amount, 0),
      invoicedCount: invoiced.length,
      invoicedAmount: invoiced.reduce((s, w) => s + w.amount, 0),
      upsellCount: upsells.length,
      upsellAmount,
      avgUpsellCommission,
    };
  }, [extraWorks]);

  const handleUpdate = (id: string, data: Partial<ExtraWorkType>) => {
    updateExtraWork(id, data);
  };

  const handleDelete = (id: string) => {
    deleteExtraWork(id);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <PageHeader
          title="🔧 Vícepráce"
          titleAccent="& schválení"
          description="Správa víceprací a jejich fakturace"
        />
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Toggle
              pressed={viewMode === 'table'}
              onPressedChange={() => setViewMode('table')}
              size="sm"
              className="rounded-none data-[state=on]:bg-muted"
              aria-label="Tabulkový pohled"
            >
              <LayoutList className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={viewMode === 'kanban'}
              onPressedChange={() => setViewMode('kanban')}
              size="sm"
              className="rounded-none data-[state=on]:bg-muted"
              aria-label="Kanban pohled"
            >
              <Columns3 className="h-4 w-4" />
            </Toggle>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Přidat vícepráci
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <KPICard
          title="Čeká na schválení"
          value={kpis.pendingCount.toString()}
          subtitle={formatCurrency(kpis.pendingAmount)}
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
          value={kpis.readyCount.toString()}
          subtitle={formatCurrency(kpis.readyAmount)}
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
          subtitle={`${kpis.upsellCount} položek · ${formatCurrency(kpis.avgUpsellCommission)} p…`}
          icon={TrendingUp}
        />
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <ExtraWorkTable
          extraWorks={extraWorks}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onEdit={(w) => setEditWork(w)}
          onSendApproval={(w) => setApprovalWork(w)}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          filterClientId={filterClientId}
          onFilterClientChange={setFilterClientId}
          filterColleagueId={filterColleagueId}
          onFilterColleagueChange={setFilterColleagueId}
          filterMonth={filterMonth}
          onFilterMonthChange={setFilterMonth}
        />
      ) : (
        <ExtraWorkKanban
          extraWorks={extraWorks}
          onUpdate={handleUpdate}
        />
      )}

      <AddExtraWorkDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={(data) => addExtraWork(data)}
        onCreated={(work) => setApprovalWork(work)}
      />

      {editWork && (
        <EditExtraWorkDialog
          open={!!editWork}
          onOpenChange={(open) => !open && setEditWork(null)}
          extraWork={editWork}
          onSave={handleUpdate}
        />
      )}

      {approvalWork && (
        <SendApprovalDialog
          open={!!approvalWork}
          onOpenChange={(open) => !open && setApprovalWork(null)}
          extraWork={approvalWork}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
