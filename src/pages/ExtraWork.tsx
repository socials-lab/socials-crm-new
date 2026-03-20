import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AddExtraWorkDialog } from '@/components/extra-work/AddExtraWorkDialog';
import { EditExtraWorkDialog } from '@/components/extra-work/EditExtraWorkDialog';
import { SendApprovalDialog } from '@/components/extra-work/SendApprovalDialog';
import { ExtraWorkCard } from '@/components/extra-work/ExtraWorkCard';
import { useCRMData } from '@/hooks/useCRMData';
import type { ExtraWork as ExtraWorkType } from '@/types/crm';
import { Plus, Clock, Loader2, FileText, Receipt, TrendingUp, Send, CheckCircle2, Package, XCircle } from 'lucide-react';

type TabKey = 'pending' | 'waiting_client' | 'client_approved' | 'active' | 'rejected' | 'ready_to_invoice' | 'invoiced';

const TAB_CONFIG: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'pending', label: 'Čekající', icon: Clock },
  { key: 'waiting_client', label: 'Čeká na klienta', icon: Send },
  { key: 'client_approved', label: 'Klient potvrdil', icon: CheckCircle2 },
  { key: 'active', label: 'Aktivované', icon: Package },
  { key: 'ready_to_invoice', label: 'K fakturaci', icon: FileText },
  { key: 'invoiced', label: 'Vyfakturováno', icon: Receipt },
  { key: 'rejected', label: 'Zamítnuté', icon: XCircle },
];

function isClientApprovedStage(work: ExtraWorkType) {
  return work.status === 'in_progress' && !!work.client_approved_at && !work.approved_by;
}

function filterByTab(works: ExtraWorkType[], tab: TabKey): ExtraWorkType[] {
  switch (tab) {
    case 'pending':
      return works.filter(w => w.status === 'pending_approval' && !w.approval_token);
    case 'waiting_client':
      return works.filter(w => w.status === 'pending_approval' && !!w.approval_token);
    case 'client_approved':
      return works.filter(isClientApprovedStage);
    case 'active':
      return works.filter(w => w.status === 'in_progress' && !isClientApprovedStage(w));
    case 'ready_to_invoice':
      return works.filter(w => w.status === 'ready_to_invoice');
    case 'invoiced':
      return works.filter(w => w.status === 'invoiced');
    case 'rejected':
      return works.filter(w => w.status === 'rejected');
    default:
      return works;
  }
}

function formatAmountsByCurrency(works: ExtraWorkType[]): string {
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
}

export default function ExtraWork() {
  const { extraWorks, addExtraWork, updateExtraWork, deleteExtraWork } = useCRMData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editWork, setEditWork] = useState<ExtraWorkType | null>(null);
  const [approvalWork, setApprovalWork] = useState<ExtraWorkType | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('pending');

  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      pending: 0, waiting_client: 0, client_approved: 0,
      active: 0, ready_to_invoice: 0, invoiced: 0, rejected: 0,
    };
    extraWorks.forEach(w => {
      if (w.status === 'pending_approval') {
        if (w.approval_token) counts.waiting_client++;
        else counts.pending++;
      } else if (isClientApprovedStage(w)) counts.client_approved++;
      else if (w.status === 'in_progress') counts.active++;
      else if (w.status === 'ready_to_invoice') counts.ready_to_invoice++;
      else if (w.status === 'invoiced') counts.invoiced++;
      else if (w.status === 'rejected') counts.rejected++;
    });
    return counts;
  }, [extraWorks]);

  const filteredWorks = useMemo(() => filterByTab(extraWorks, activeTab), [extraWorks, activeTab]);

  const kpis = useMemo(() => {
    const pendingApproval = extraWorks.filter(w => w.status === 'pending_approval');
    const inProgress = extraWorks.filter(w => w.status === 'in_progress');
    const readyToInvoice = extraWorks.filter(w => w.status === 'ready_to_invoice');
    const invoiced = extraWorks.filter(w => w.status === 'invoiced');
    const upsells = extraWorks.filter(w => w.upsold_by_id);
    const upsellAmount = upsells.reduce((s, w) => s + w.amount, 0);
    const upsellCommissionByCurrency = new Map<string, number>();
    upsells.forEach((work) => {
      const commission = Math.round(work.amount * (work.upsell_commission_percent || 10) / 100);
      upsellCommissionByCurrency.set(
        work.currency,
        (upsellCommissionByCurrency.get(work.currency) ?? 0) + commission,
      );
    });
    const upsellCommissionLabel = Array.from(upsellCommissionByCurrency.entries())
      .map(([currency, amount]) => new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount))
      .join(' + ');

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
      pendingAmountLabel: formatAmountsByCurrency(pendingApproval),
      inProgressAmountLabel: formatAmountsByCurrency(inProgress),
      readyAmountLabel: formatAmountsByCurrency(readyToInvoice),
      invoicedAmountLabel: formatAmountsByCurrency(invoiced),
      upsellAmountLabel: formatAmountsByCurrency(upsells),
      upsellCommissionLabel,
    };
  }, [extraWorks]);

  const handleUpdate = (id: string, data: Partial<ExtraWorkType>) => {
    return updateExtraWork(id, data);
  };

  const handleDelete = (id: string) => {
    deleteExtraWork(id);
  };

  return (
    <div className="space-y-4 animate-fade-in p-4 md:space-y-6 md:p-6">
      <PageHeader
        title="🔧 Vícepráce"
        titleAccent="& schválení"
        description="Správa víceprací a jejich fakturace"
        actions={
          <Button className="w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Přidat vícepráci
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-5">
        <KPICard
          title="Čeká na schválení"
          value={kpis.pendingCount.toString()}
          subtitle={kpis.pendingAmountLabel}
          icon={Clock}
        />
        <KPICard
          title="V procesu"
          value={kpis.inProgressCount.toString()}
          subtitle={kpis.inProgressAmountLabel}
          icon={Loader2}
        />
        <KPICard
          title="K fakturaci"
          value={kpis.readyCount.toString()}
          subtitle={kpis.readyAmountLabel}
          icon={FileText}
        />
        <KPICard
          title="Vyfakturováno"
          value={kpis.invoicedAmountLabel}
          subtitle={`${kpis.invoicedCount} položek`}
          icon={Receipt}
        />
        <KPICard
          title="Upsell"
          value={kpis.upsellAmountLabel}
          subtitle={`${kpis.upsellCount} položek · Provize ${kpis.upsellCommissionLabel || '0'}`}
          icon={TrendingUp}
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1.5 rounded-xl">
          {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
            <TabsTrigger
              key={key}
              value={key}
              className="flex items-center gap-1.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-3 py-2"
            >
              <Icon className="h-4 w-4" />
              {label}
              {tabCounts[key] > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-[20px] px-1.5 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  {tabCounts[key]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_CONFIG.map(({ key }) => (
          <TabsContent key={key} value={key} className="mt-4">
            {filteredWorks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Žádné položky v této kategorii
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
                {filteredWorks.map(work => (
                  <ExtraWorkCard
                    key={work.id}
                    work={work}
                    onEdit={(w) => setEditWork(w)}
                    onDelete={handleDelete}
                    onSendApproval={(w) => setApprovalWork(w)}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <AddExtraWorkDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={addExtraWork}
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
