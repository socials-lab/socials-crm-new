import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModificationRequestCard } from '@/components/engagements/ModificationRequestCard';
import { ProposeModificationDialog } from '@/components/engagements/ProposeModificationDialog';
import { EditModificationRequestDialog } from '@/components/engagements/EditModificationRequestDialog';
import { useModificationRequests } from '@/hooks/useModificationRequests';
import { useCRMData } from '@/hooks/useCRMData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, XCircle, FileEdit, Plus, Copy, Check, Send, PackageCheck, Calendar, Mail, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AddServiceProposedChanges, UpdateServicePriceProposedChanges, ModificationProposedChanges } from '@/types/crm';
import type { StoredModificationRequest } from '@/data/modificationRequestsMockData';
import { getAppliedModificationsHistory, type AppliedModificationHistory } from '@/data/appliedModificationsHistory';

// Helper to get month label
function getMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return format(date, 'LLLL yyyy', { locale: cs });
}

// Generate available months (current + last 12 months)
function generateAvailableMonths(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

// Component to display applied history entry with client confirmation details
function AppliedHistoryCard({ entry }: { entry: AppliedModificationHistory }) {
  const REQUEST_TYPE_LABELS: Record<string, string> = {
    add_service: 'Přidání služby',
    update_service_price: 'Změna ceny',
    deactivate_service: 'Ukončení služby',
    add_assignment: 'Přiřazení kolegy',
    update_assignment: 'Změna odměny',
    remove_assignment: 'Odebrání kolegy',
  };

  const typeLabel = REQUEST_TYPE_LABELS[entry.request_type] || entry.request_type;
  const clientName = entry.client_brand_name || entry.client_name;
  
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-primary/10 text-primary">
                  <Check className="h-3 w-3 mr-1" />
                  Aktivováno
                </Badge>
                <Badge variant="outline">{typeLabel}</Badge>
              </div>
              <h4 className="font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {clientName}
              </h4>
              <p className="text-sm text-muted-foreground">{entry.engagement_name}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(entry.applied_at), 'd. M. yyyy', { locale: cs })}
              </div>
            </div>
          </div>

          {/* Proposed changes summary */}
          <div className="bg-muted/50 rounded-md p-3 text-sm">
            {entry.request_type === 'add_service' && (
              <>
                <p><span className="text-muted-foreground">Služba:</span> {(entry.proposed_changes as any).name}</p>
                <p><span className="text-muted-foreground">Cena:</span> {((entry.proposed_changes as any).price || 0).toLocaleString('cs-CZ')} {(entry.proposed_changes as any).currency}</p>
              </>
            )}
            {entry.request_type === 'update_service_price' && (
              <p>
                <span className="text-muted-foreground">Nová cena:</span> {((entry.proposed_changes as any).new_price || 0).toLocaleString('cs-CZ')} {(entry.proposed_changes as any).currency}
              </p>
            )}
            {entry.request_type === 'deactivate_service' && (
              <p><span className="text-muted-foreground">Služba:</span> {(entry.proposed_changes as any).service_name} (deaktivováno)</p>
            )}
          </div>

          {/* Client confirmation details */}
          {entry.client_email && entry.client_approved_at && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 text-sm">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-1">
                <CheckCircle className="h-4 w-4" />
                Potvrzeno klientem
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-green-600 dark:text-green-300">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{entry.client_email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(entry.client_approved_at), 'd. M. yyyy v H:mm', { locale: cs })}</span>
                </div>
              </div>
            </div>
          )}

          {/* Effective from & commission info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {entry.effective_from && (
              <span>Účinnost od: {format(new Date(entry.effective_from), 'd. M. yyyy')}</span>
            )}
            {entry.upsold_by_name && (
              <span>Upsell: {entry.upsold_by_name} ({entry.upsell_commission_percent}%)</span>
            )}
            {entry.note && (
              <span className="italic">„{entry.note}"</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Modifications() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [approvedRequest, setApprovedRequest] = useState<StoredModificationRequest | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<StoredModificationRequest | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  const { 
    pendingRequests, 
    isLoadingPending, 
    approveRequest, 
    rejectRequest,
    applyRequest,
    updateRequest,
    deleteRequest,
    isApproving,
    isRejecting,
    isApplying,
    isUpdating,
    isDeleting,
    refresh
  } = useModificationRequests();
  const { addEngagementService, updateEngagementService } = useCRMData();

  // Get applied modifications history
  const appliedHistory = useMemo(() => getAppliedModificationsHistory(), [pendingRequests]);
  const availableMonths = useMemo(() => generateAvailableMonths(), []);

  // Filter requests by status
  const pending = pendingRequests?.filter(r => r.status === 'pending') || [];
  const waitingForClient = pendingRequests?.filter(r => r.status === 'approved' && r.upgrade_offer_token && !r.client_approved_at) || [];
  const clientApproved = pendingRequests?.filter(r => r.status === 'client_approved') || [];
  const applied = pendingRequests?.filter(r => r.status === 'applied') || [];
  const approved = pendingRequests?.filter(r => r.status === 'approved' && (!r.upgrade_offer_token || r.client_approved_at)) || [];
  const rejected = pendingRequests?.filter(r => r.status === 'rejected') || [];

  // Filter applied history by month
  const filteredHistory = useMemo(() => {
    if (selectedMonth === 'all') return appliedHistory;
    return appliedHistory.filter(h => h.applied_month === selectedMonth);
  }, [appliedHistory, selectedMonth]);

  const isClientFacingType = (type: string) => {
    return ['add_service', 'update_service_price', 'deactivate_service'].includes(type);
  };

  const handleApprove = async (requestId: string) => {
    const request = pendingRequests?.find(r => r.id === requestId);
    if (!request) return;

    try {
      // For client-facing changes, just approve and show dialog with link
      // The actual service change will be applied after client confirms
      if (isClientFacingType(request.request_type)) {
        // Mark request as approved (this generates the token)
        const updatedRequest = await approveRequest(requestId);
        
        // Refresh to get updated request with token
        refresh();
        
        // Find the updated request
        const freshRequests = pendingRequests?.find(r => r.id === requestId);
        setApprovedRequest(updatedRequest || freshRequests || request);
        setSuccessDialogOpen(true);
      } else {
        // For internal changes (assignments), execute immediately
        if (request.request_type === 'add_service') {
          const changes = request.proposed_changes as AddServiceProposedChanges;
          await addEngagementService({
            engagement_id: request.engagement_id,
            service_id: changes.service_id || null,
            name: changes.name,
            price: changes.price,
            currency: changes.currency,
            billing_type: changes.billing_type,
            is_active: true,
            notes: '',
            selected_tier: changes.selected_tier || null,
            creative_boost_min_credits: changes.creative_boost_min_credits || null,
            creative_boost_max_credits: changes.creative_boost_max_credits || null,
            creative_boost_price_per_credit: changes.creative_boost_price_per_credit || null,
            creative_boost_colleague_reward_per_credit: null,
            invoicing_status: 'not_applicable',
            invoiced_at: null,
            invoiced_in_period: null,
            invoice_id: null,
            effective_from: request.effective_from,
            upsold_by_id: request.upsold_by_id,
            upsell_commission_percent: request.upsell_commission_percent,
          });
        } else if (request.request_type === 'update_service_price') {
          const changes = request.proposed_changes as UpdateServicePriceProposedChanges;
          if (request.engagement_service_id) {
            await updateEngagementService(request.engagement_service_id, {
              price: changes.new_price,
            });
          }
        }
        await approveRequest(requestId);
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    await rejectRequest({ requestId, reason });
  };

  const handleApply = async (requestId: string) => {
    await applyRequest(requestId);
  };

  const handleEdit = (request: StoredModificationRequest) => {
    setEditingRequest(request);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (requestId: string, updates: {
    proposed_changes?: ModificationProposedChanges;
    effective_from?: string | null;
    note?: string | null;
    upsell_commission_percent?: number;
  }) => {
    await updateRequest(requestId, updates);
  };

  const handleDelete = async (requestId: string) => {
    await deleteRequest(requestId);
  };

  const handleCopyLink = async () => {
    if (approvedRequest?.upgrade_offer_token) {
      const link = `${window.location.origin}/upgrade/${approvedRequest.upgrade_offer_token}`;
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      toast.success('Odkaz zkopírován do schránky');
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const getClientLink = () => {
    if (approvedRequest?.upgrade_offer_token) {
      return `${window.location.origin}/upgrade/${approvedRequest.upgrade_offer_token}`;
    }
    return '';
  };

  if (isLoadingPending) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <PageHeader 
          title="Návrhy změn" 
          description="Přidání nových služeb, změny cen, deaktivace služeb a další úpravy zakázek"
        />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Načítání...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Návrhy změn" 
          description="Přidání nových služeb, změny cen, deaktivace služeb a další úpravy zakázek"
        />
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Navrhnout úpravu
        </Button>
      </div>

      <ProposeModificationDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Čeká na schválení</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schváleno</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approved.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zamítnuto</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejected.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Čekající
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="waiting-client" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Čeká na klienta
            {waitingForClient.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700">{waitingForClient.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="client-approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Klient potvrdil
            {clientApproved.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">{clientApproved.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="applied" className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4" />
            Aktivované
            {applied.length > 0 && (
              <Badge variant="secondary" className="ml-1">{applied.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Zamítnuté
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileEdit className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-center">
                  Žádné požadavky čekající na schválení
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pending.map((request) => (
                <ModificationRequestCard
                  key={request.id}
                  request={request}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isApproving={isApproving}
                  isRejecting={isRejecting}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="waiting-client" className="space-y-4">
          {waitingForClient.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Send className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-center">
                  Žádné požadavky čekající na klienta
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {waitingForClient.map((request) => (
                <ModificationRequestCard
                  key={request.id}
                  request={request}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="client-approved" className="space-y-4">
          {clientApproved.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-center">
                  Žádné požadavky potvrzené klientem
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {clientApproved.map((request) => (
                <ModificationRequestCard
                  key={request.id}
                  request={request}
                  onApply={handleApply}
                  isApplying={isApplying}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applied" className="space-y-4">
          {/* Month filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtr podle měsíce:</span>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Vyberte měsíc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny měsíce</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {getMonthLabel(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMonth !== 'all' && (
              <Badge variant="secondary">
                {filteredHistory.length} záznamů
              </Badge>
            )}
          </div>

          {filteredHistory.length === 0 && applied.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PackageCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-center">
                  {selectedMonth === 'all' 
                    ? 'Žádné aktivované změny' 
                    : `Žádné aktivované změny v ${getMonthLabel(selectedMonth)}`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Show history entries with client confirmation details */}
              {filteredHistory.map((historyEntry) => (
                <AppliedHistoryCard key={historyEntry.id} entry={historyEntry} />
              ))}
              
              {/* Also show applied requests that might not be in history yet */}
              {selectedMonth === 'all' && applied.filter(r => 
                !filteredHistory.some(h => h.modification_request_id === r.id)
              ).map((request) => (
                <ModificationRequestCard
                  key={request.id}
                  request={request}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejected.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <XCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-center">
                  Žádné zamítnuté požadavky
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rejected.map((request) => (
                <ModificationRequestCard
                  key={request.id}
                  request={request}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Success dialog after approval */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Požadavek schválen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Požadavek byl interně schválen. Nyní je potřeba odeslat odkaz klientovi k potvrzení.
            </p>
            
            {approvedRequest?.upgrade_offer_token && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Odkaz pro klienta:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getClientLink()}
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-400">Další kroky:</p>
              <ol className="list-decimal list-inside mt-1 text-amber-600 dark:text-amber-300 space-y-1">
                <li>Zkopírujte odkaz a odešlete ho klientovi</li>
                <li>Klient potvrdí změnu na stránce</li>
                <li>Požadavek se přesune do "Klient potvrdil"</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)}>
              Zavřít
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit modification request dialog */}
      <EditModificationRequestDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        request={editingRequest}
        onSave={handleSaveEdit}
        isSaving={isUpdating}
      />
    </div>
  );
}
