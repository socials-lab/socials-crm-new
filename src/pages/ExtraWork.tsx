import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddExtraWorkDialog } from '@/components/extra-work/AddExtraWorkDialog';
import { EditExtraWorkDialog } from '@/components/extra-work/EditExtraWorkDialog';
import { SendApprovalDialog } from '@/components/extra-work/SendApprovalDialog';
import { ExtraWorkCard } from '@/components/extra-work/ExtraWorkCard';
import { useCRMData } from '@/hooks/useCRMData';
import type { ExtraWork as ExtraWorkType } from '@/types/crm';
import { Plus, Clock, Send, CheckCircle, FileText, XCircle, Loader2, Receipt } from 'lucide-react';

export default function ExtraWork() {
  const { extraWorks, addExtraWork, updateExtraWork, deleteExtraWork } = useCRMData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editWork, setEditWork] = useState<ExtraWorkType | null>(null);
  const [approvalWork, setApprovalWork] = useState<ExtraWorkType | null>(null);

  // Group by status for tabs
  const groups = useMemo(() => {
    const pending = extraWorks.filter(w => w.status === 'pending_approval' && !w.approval_token);
    const waitingClient = extraWorks.filter(w => w.status === 'pending_approval' && !!w.approval_token);
    const clientApproved = extraWorks.filter(w => w.status === 'in_progress');
    const invoicing = extraWorks.filter(w => w.status === 'ready_to_invoice' || w.status === 'invoiced');
    const rejected = extraWorks.filter(w => w.status === 'rejected');
    return { pending, waitingClient, clientApproved, invoicing, rejected };
  }, [extraWorks]);

  // KPI calculations
  const kpis = useMemo(() => {
    const pendingApproval = extraWorks.filter(w => w.status === 'pending_approval');
    const inProgress = extraWorks.filter(w => w.status === 'in_progress');
    const readyToInvoice = extraWorks.filter(w => w.status === 'ready_to_invoice');
    const invoiced = extraWorks.filter(w => w.status === 'invoiced');
    return {
      pendingCount: pendingApproval.length,
      pendingAmount: pendingApproval.reduce((s, w) => s + w.amount, 0),
      inProgressCount: inProgress.length,
      inProgressAmount: inProgress.reduce((s, w) => s + w.amount, 0),
      readyCount: readyToInvoice.length,
      readyAmount: readyToInvoice.reduce((s, w) => s + w.amount, 0),
      invoicedCount: invoiced.length,
      invoicedAmount: invoiced.reduce((s, w) => s + w.amount, 0),
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

  const renderEmptyState = (icon: React.ReactNode, text: string) => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-muted-foreground/50 mb-4">{icon}</div>
        <p className="text-muted-foreground text-center">{text}</p>
      </CardContent>
    </Card>
  );

  const renderCards = (items: ExtraWorkType[]) => (
    <div className="space-y-3">
      {items.map(work => (
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
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <PageHeader
          title="🔧 Vícepráce"
          titleAccent="& schválení"
          description="Správa víceprací a jejich fakturace"
        />
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Přidat vícepráci
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Čeká na schválení"
          value={kpis.pendingCount.toString()}
          subtitle={formatCurrency(kpis.pendingAmount)}
          icon={Clock}
        />
        <KPICard
          title="Schváleno klientem"
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Čekající
            {groups.pending.length > 0 && (
              <Badge variant="secondary" className="ml-1">{groups.pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="waiting-client" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Čeká na klienta
            {groups.waitingClient.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700">{groups.waitingClient.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="client-approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Klient schválil
            {groups.clientApproved.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">{groups.clientApproved.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invoicing" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Fakturace
            {groups.invoicing.length > 0 && (
              <Badge variant="secondary" className="ml-1">{groups.invoicing.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Zamítnuté
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {groups.pending.length === 0
            ? renderEmptyState(<Clock className="h-12 w-12" />, 'Žádné vícepráce čekající na odeslání')
            : renderCards(groups.pending)}
        </TabsContent>

        <TabsContent value="waiting-client" className="space-y-4">
          {groups.waitingClient.length === 0
            ? renderEmptyState(<Send className="h-12 w-12" />, 'Žádné vícepráce čekající na klienta')
            : renderCards(groups.waitingClient)}
        </TabsContent>

        <TabsContent value="client-approved" className="space-y-4">
          {groups.clientApproved.length === 0
            ? renderEmptyState(<CheckCircle className="h-12 w-12" />, 'Žádné vícepráce schválené klientem')
            : renderCards(groups.clientApproved)}
        </TabsContent>

        <TabsContent value="invoicing" className="space-y-4">
          {groups.invoicing.length === 0
            ? renderEmptyState(<FileText className="h-12 w-12" />, 'Žádné vícepráce k fakturaci')
            : renderCards(groups.invoicing)}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {groups.rejected.length === 0
            ? renderEmptyState(<XCircle className="h-12 w-12" />, 'Žádné zamítnuté vícepráce')
            : renderCards(groups.rejected)}
        </TabsContent>
      </Tabs>

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
