import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Button } from '@/components/ui/button';
import { ExtraWorkTable } from '@/components/extra-work/ExtraWorkTable';
import { ExtraWorkKanban } from '@/components/extra-work/ExtraWorkKanban';
import { AddExtraWorkDialog } from '@/components/extra-work/AddExtraWorkDialog';
import { EditExtraWorkDialog } from '@/components/extra-work/EditExtraWorkDialog';
import { SendApprovalDialog } from '@/components/extra-work/SendApprovalDialog';
import { useCRMData } from '@/hooks/useCRMData';
import type { ExtraWork as ExtraWorkType, ExtraWorkStatus } from '@/types/crm';
import { Plus, Clock, Loader2, FileText, Receipt, LayoutList, Columns3 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type ViewMode = 'table' | 'kanban';

export default function ExtraWork() {
  const { extraWorks, addExtraWork, updateExtraWork, deleteExtraWork } = useCRMData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editWork, setEditWork] = useState<ExtraWorkType | null>(null);
  const [approvalWork, setApprovalWork] = useState<ExtraWorkType | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filterStatus, setFilterStatus] = useState<ExtraWorkStatus | 'all'>('all');
  const [filterClientId, setFilterClientId] = useState<string | 'all'>('all');
  const [filterColleagueId, setFilterColleagueId] = useState<string | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<string | 'all'>('all');

  // Apply filters for kanban view
  const filteredExtraWorks = useMemo(() => {
    return extraWorks.filter(work => {
      if (filterClientId !== 'all' && work.client_id !== filterClientId) return false;
      if (filterColleagueId !== 'all' && work.colleague_id !== filterColleagueId) return false;
      if (filterMonth !== 'all') {
        const workMonth = work.work_date.substring(0, 7);
        if (workMonth !== filterMonth) return false;
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
    };
  }, [extraWorks]);

  const handleAddExtraWork = async (data: any) => {
    const result = await addExtraWork(data);
    return result;
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
      <div className="grid gap-4 md:grid-cols-4">
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
      </div>

      {/* View */}
      {viewMode === 'table' ? (
        <ExtraWorkTable
          extraWorks={extraWorks}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onEdit={(work) => setEditWork(work)}
          onSendApproval={(work) => {
            setApprovalWork(work);
          }}
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
          extraWorks={filteredExtraWorks}
          onUpdate={handleUpdate}
        />
      )}

      <AddExtraWorkDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddExtraWork}
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