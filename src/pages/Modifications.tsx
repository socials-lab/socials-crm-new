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
import { SendModificationEmailDialog } from '@/components/engagements/SendModificationEmailDialog';
import { useModificationRequests, type StoredModificationRequest } from '@/hooks/useModificationRequests';
import { useCRMData } from '@/hooks/useCRMData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, CheckCircle, XCircle, FileEdit, Plus, Copy, Check, Send, PackageCheck, Calendar, Mail, Building2, FileText, ArrowRight, ChevronDown, ChevronRight, History } from 'lucide-react';
import { toast } from 'sonner';
import type { ModificationProposedChanges } from '@/types/crm';

interface OnboardingData {
  company_name: string;
  ico?: string | null;
  dic?: string | null;
  website?: string | null;
  industry?: string | null;
  billing_street?: string | null;
  billing_city?: string | null;
  billing_zip?: string | null;
  billing_country?: string | null;
  billing_email?: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone?: string | null;
  contact_position?: string | null;
}

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

const REQUEST_TYPE_LABELS_SHORT: Record<string, string> = {
  add_service: 'Přidání služby',
  update_service_price: 'Změna ceny',
  deactivate_service: 'Ukončení služby',
  add_assignment: 'Přiřazení kolegy',
  update_assignment: 'Změna odměny',
  expand_country: 'Rozšíření země',
  new_engagement: 'Nová zakázka',
};

function CollapsibleModificationCard({ request, cardContent }: { request: StoredModificationRequest; cardContent: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const clientName = request.client_brand_name || request.client_name;
  const typeLabel = REQUEST_TYPE_LABELS_SHORT[request.request_type] || request.request_type;
  const effectiveDate = request.client_chosen_effective_from || request.effective_from;
  
  // Summary of pricing changes
  const snapshot = request.pricing_snapshot as any;
  const deltaRevenue = snapshot?.delta_revenue;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className={`p-1.5 rounded-md ${request.status === 'client_approved' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-primary/10'}`}>
                {request.status === 'client_approved' 
                  ? <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  : <PackageCheck className="h-4 w-4 text-primary" />
                }
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{clientName}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{typeLabel}</Badge>
                  {request.items && request.items.length > 1 && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {request.items.length} položek
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{request.engagement_name}</span>
                  {request.client_approved_at && (
                    <span className="flex items-center gap-1 shrink-0 text-green-600 dark:text-green-400">
                      <Mail className="h-3 w-3" />
                      {request.client_email}
                      <span className="text-muted-foreground mx-0.5">·</span>
                      {format(new Date(request.client_approved_at), "d.M.yyyy 'v' H:mm")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-3 sm:ml-4 sm:gap-4">
              {deltaRevenue != null && (
                <span className={`text-sm font-semibold ${deltaRevenue >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                  {deltaRevenue >= 0 ? '+' : ''}{deltaRevenue.toLocaleString('cs-CZ')} Kč
                </span>
              )}
              {effectiveDate && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  od {format(new Date(effectiveDate), 'd.M.yyyy')}
                </span>
              )}
              {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t">
            {cardContent}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function Modifications() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [approvedRequest, setApprovedRequest] = useState<StoredModificationRequest | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<StoredModificationRequest | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRequest, setEmailRequest] = useState<StoredModificationRequest | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  
  const { 
    pendingRequests, 
    isLoadingPending, 
    approveRequest, 
    rejectRequest,
    applyRequest,
    updateRequest,
    deleteRequest,
    submitDraft,
    isApproving,
    isRejecting,
    isApplying,
    isUpdating,
    isDeleting,
    refresh
  } = useModificationRequests();
  const { addClient, addEngagement, addContact, addEngagementService } = useCRMData();
  const availableMonths = useMemo(() => generateAvailableMonths(), []);

  // Filter requests by status
  const drafts = pendingRequests?.filter(r => r.status === 'draft') || [];
  const pending = pendingRequests?.filter(r => r.status === 'pending') || [];
  const waitingForClient = pendingRequests?.filter(r => r.status === 'approved' && r.upgrade_offer_token && !r.client_approved_at) || [];
  const clientApproved = pendingRequests?.filter(r =>
    r.status === 'client_approved' || (r.status === 'approved' && !r.upgrade_offer_token)
  ) || [];
  const applied = pendingRequests?.filter(r => r.status === 'applied') || [];
  const rejected = pendingRequests?.filter(r => r.status === 'rejected') || [];

  const isClientFacingType = (type: string) => {
    return ['expand_country', 'add_service', 'update_service_price', 'deactivate_service', 'new_engagement'].includes(type);
  };

  const handleApprove = async (requestId: string) => {
    const request = pendingRequests?.find(r => r.id === requestId);
    if (!request) return;

    try {
      if (request.status === 'draft') {
        await submitDraft(request.id);
      }

      if (isClientFacingType(request.request_type)) {
        const updatedRequest = await approveRequest(requestId);
        setApprovedRequest(updatedRequest || request);
        setSuccessDialogOpen(true);
      } else {
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
    const request = pendingRequests?.find(r => r.id === requestId);
    if (!request) return;

    try {
      if (request.request_type === 'expand_country') {
        const changes = request.proposed_changes as any;
        await addEngagementService({
          engagement_id: request.engagement_id,
          service_id: changes.service_id || null,
          name: changes.service_name || changes.reference_service_name || 'Rozšířená služba',
          price: changes.price || 0,
          currency: changes.currency || 'CZK',
          billing_type: 'monthly',
          is_active: true,
          notes: '',
          selected_tier: changes.selected_tier || null,
          creative_boost_min_credits: null,
          creative_boost_max_credits: null,
          creative_boost_price_per_credit: null,
          creative_boost_fixed_billing: true,
          invoicing_status: 'not_applicable',
          invoiced_at: null,
          invoiced_in_period: null,
          invoice_id: null,
          effective_from: request.client_chosen_effective_from || request.effective_from || null,
          upsold_by_id: request.upsold_by_id,
          upsell_commission_percent: request.upsell_commission_percent,
        });
      } else if (request.request_type === 'new_engagement') {
        const changes = request.proposed_changes as any;
        const requiresOnboarding = !!changes.is_different_sro && !!changes.send_onboarding_form;

        if (requiresOnboarding) {
          if (!request.onboarding_data) {
            toast.error('Nejdříve vyplňte onboarding data klienta.');
            return;
          }
          await handleCreateClientFromOnboarding(request);
          return;
        }

        const newEngagement = await addEngagement({
          client_id: request.client_id,
          name: changes.engagement_name || `${request.engagement_name} - nová zakázka`,
          type: 'retainer',
          billing_model: 'fixed_fee',
          monthly_fee: changes.total_monthly_price || 0,
          one_off_fee: 0,
          currency: changes.currency || 'CZK',
          status: 'active',
          start_date: request.client_chosen_effective_from || request.effective_from || new Date().toISOString().split('T')[0],
          end_date: null,
          notes: '',
          platforms: [],
          freelo_url: null,
          offer_url: null,
          contract_url: null,
          contact_person_id: null,
          notice_period_months: null,
          managed_countries: [],
          pinned_notes: '',
        });

        for (const svc of changes.services || []) {
          await addEngagementService({
            engagement_id: newEngagement.id,
            service_id: svc.service_id || null,
            name: svc.name,
            price: svc.price || 0,
            currency: svc.currency || 'CZK',
            billing_type: svc.billing_type || 'monthly',
            is_active: true,
            notes: '',
            selected_tier: svc.selected_tier || null,
            creative_boost_min_credits: null,
            creative_boost_max_credits: null,
            creative_boost_price_per_credit: null,
            creative_boost_fixed_billing: true,
            invoicing_status: 'not_applicable',
            invoiced_at: null,
            invoiced_in_period: null,
            invoice_id: null,
            effective_from: request.client_chosen_effective_from || request.effective_from || null,
            upsold_by_id: request.upsold_by_id,
            upsell_commission_percent: request.upsell_commission_percent,
          });
        }
      }

      await applyRequest(requestId);
    } catch (error) {
      console.error('Error applying request:', error);
      toast.error('Nepodařilo se aktivovat změnu');
    }
  };

  const handleEdit = (request: StoredModificationRequest) => {
    if (request.status === 'pending' || request.status === 'draft') {
      // For pending/draft requests, open the full creation dialog pre-filled
      setEditingRequest(request);
      setDialogOpen(true);
    } else {
      // For other statuses, use the simpler edit dialog
      setEditingRequest(request);
      setEditDialogOpen(true);
    }
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

  const handleInlineUpdate = (requestId: string, updates: Partial<Pick<StoredModificationRequest, 'proposed_changes' | 'items'>>) => {
    updateRequest(requestId, updates);
  };

  const handleSubmitDraft = async (requestId: string) => {
    await submitDraft(requestId);
  };
  const handleSendEmail = (request: StoredModificationRequest) => {
    setEmailRequest(request);
    setEmailDialogOpen(true);
  };

  const handleCreateClientFromOnboarding = async (request: StoredModificationRequest) => {
    if (!request.onboarding_data) {
      toast.error('Klient ještě nevyplnil fakturační údaje');
      return;
    }
    
    const d = request.onboarding_data as OnboardingData;
    const changes = request.proposed_changes as any;
    
    try {
      // 1. Create new client
      const newClient = await addClient({
        name: d.company_name,
        brand_name: changes.new_client_data?.brand_name || d.company_name,
        ico: d.ico || '',
        dic: d.dic || null,
        website: d.website || '',
        country: d.billing_country || 'CZ',
        industry: d.industry || '',
        status: 'active',
        tier: 'standard',
        billing_street: d.billing_street || null,
        billing_city: d.billing_city || null,
        billing_zip: d.billing_zip || null,
        billing_country: d.billing_country || null,
        billing_email: d.billing_email || null,
        main_contact_name: d.contact_name,
        main_contact_email: d.contact_email,
        main_contact_phone: d.contact_phone || '',
        acquisition_channel: '',
        sales_representative_id: null,
        start_date: request.client_chosen_effective_from || request.effective_from || new Date().toISOString().split('T')[0],
        created_by: null,
        end_date: null,
        notes: `Vytvořeno z návrhu změny: ${request.engagement_name}`,
        pinned_notes: '',
      });

      // 2. Create contact person
      await addContact({
        client_id: newClient.id,
        name: d.contact_name,
        email: d.contact_email,
        phone: d.contact_phone || null,
        position: d.contact_position || null,
        is_primary: true,
        is_decision_maker: true,
        notes: '',
      });

      // 3. Create engagement
      const totalMonthly = changes.total_monthly_price || 0;
      const newEngagement = await addEngagement({
        client_id: newClient.id,
        name: changes.engagement_name,
        type: 'retainer',
        billing_model: 'fixed_fee',
        monthly_fee: totalMonthly,
        one_off_fee: 0,
        currency: changes.currency || 'CZK',
        status: 'active',
        start_date: request.client_chosen_effective_from || request.effective_from || new Date().toISOString().split('T')[0],
        end_date: null,
        notes: '',
        platforms: [],
        freelo_url: null,
        offer_url: null,
        contract_url: null,
        contact_person_id: null,
        notice_period_months: null,
        managed_countries: [],
        pinned_notes: '',
      });

      // 4. Create engagement services
      for (const svc of changes.services || []) {
        await addEngagementService({
          engagement_id: newEngagement.id,
          service_id: svc.service_id || null,
          name: svc.name,
          price: svc.price,
          currency: svc.currency || 'CZK',
          billing_type: svc.billing_type || 'monthly',
          is_active: true,
          notes: '',
          selected_tier: svc.selected_tier || null,
          creative_boost_min_credits: null,
          creative_boost_max_credits: null,
          creative_boost_price_per_credit: null,
          creative_boost_fixed_billing: true,
          invoicing_status: 'not_applicable',
          invoiced_at: null,
          invoiced_in_period: null,
          invoice_id: null,
          upsold_by_id: request.upsold_by_id || null,
          upsell_commission_percent: request.upsell_commission_percent || 0,
          effective_from: request.client_chosen_effective_from || request.effective_from || null,
        });
      }

      // 5. Mark modification as applied
      await applyRequest(request.id);

      toast.success(`Klient "${d.company_name}" a zakázka "${changes.engagement_name}" byly úspěšně vytvořeny!`, {
        duration: 5000,
      });
      refresh();
    } catch (error) {
      console.error('Error creating client from onboarding:', error);
      toast.error('Nepodařilo se vytvořit klienta. Zkuste to prosím znovu.');
    }
  };

  const getUpgradeLink = (token: string | null) => {
    if (!token) return '';
    return `${window.location.origin}/upgrade/${token}`;
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

  const totalActive = drafts.length + pending.length + waitingForClient.length + clientApproved.length;

  if (isLoadingPending) {
    return (
      <div className="space-y-4 p-4 md:space-y-6 md:p-6">
        <PageHeader 
          title="Návrhy změn" 
          description="Připravte nabídku na rozšíření spolupráce se stávajícím klientem"
        />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Načítání...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:space-y-6 md:p-6">
      <PageHeader 
        title="Návrhy změn" 
        description="Připravte nabídku na rozšíření spolupráce se stávajícím klientem"
      />

      <ProposeModificationDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingRequest(null);
        }}
        editingRequest={editingRequest?.status === 'pending' || editingRequest?.status === 'draft' ? editingRequest : null}
      />
      
      {/* Send Email Dialog */}
      {emailRequest && (
        <SendModificationEmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          request={emailRequest}
          upgradeLink={getUpgradeLink(emailRequest.upgrade_offer_token)}
        />
      )}

      {/* Hero CTA card */}
      <Card className="border-primary/30 bg-primary/[0.03]">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <FileEdit className="h-5 w-5 text-primary" />
                Nový návrh na úpravu zakázky
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg">
                Přidejte novou službu, rozšiřte stávající službu o další zemi nebo e-shop, upravte cenu — systém automaticky spočítá dopad na marži a připraví nabídku pro klienta.
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} size="lg" className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Navrhnout úpravu
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline summary */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{pending.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ke schválení</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
              <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{waitingForClient.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">U klienta</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{clientApproved.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">K aktivaci</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-muted">
              <PackageCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{applied.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Aktivováno</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue={drafts.length > 0 ? "drafts" : "pending"} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Koncepty
            {drafts.length > 0 && (
              <Badge variant="secondary" className="ml-1">{drafts.length}</Badge>
            )}
          </TabsTrigger>
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
            K aktivaci
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

        <TabsContent value="drafts" className="space-y-4">
          {drafts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-center">
                  Žádné rozpracované návrhy
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {drafts.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-muted-foreground/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-muted-foreground">
                            <FileText className="h-3 w-3 mr-1" />
                            Koncept
                          </Badge>
                        </div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {request.client_brand_name || request.client_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{request.engagement_name}</p>
                        {request.note && (
                          <p className="text-sm text-muted-foreground mt-1 italic">„{request.note}"</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(request)}
                        >
                          <FileEdit className="h-3.5 w-3.5 mr-1" />
                          Upravit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitDraft(request.id)}
                        >
                          <ArrowRight className="h-3.5 w-3.5 mr-1" />
                          Odeslat ke schválení
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(request.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

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
                  onInlineUpdate={handleInlineUpdate}
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
                  onSendEmail={handleSendEmail}
                  onInlineUpdate={handleInlineUpdate}
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
                  Žádné požadavky připravené k aktivaci
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {clientApproved.map((request) => (
                <CollapsibleModificationCard
                  key={request.id}
                  request={request}
                  cardContent={
                    <ModificationRequestCard
                      request={request}
                      onApply={handleApply}
                      onCreateClient={handleCreateClientFromOnboarding}
                      isApplying={isApplying}
                    />
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applied" className="space-y-4">
          {/* Month filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex min-w-0 items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtr podle měsíce:</span>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
                {(() => {
                  const filteredApplied = applied.filter(r => {
                    const date = new Date(r.updated_at || r.created_at);
                    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    return monthStr === selectedMonth;
                  });
                  return filteredApplied.length;
                })()} záznamů
              </Badge>
            )}
          </div>

          {(() => {
            // Filter applied requests by month too
            const filteredApplied = selectedMonth === 'all'
              ? applied
              : applied.filter(r => {
                  const date = new Date(r.updated_at || r.created_at);
                  const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                  return monthStr === selectedMonth;
                });

            const allEmpty = filteredApplied.length === 0;

            if (allEmpty) {
              return (
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
              );
            }

            const grouped: Record<string, StoredModificationRequest[]> = {};
            filteredApplied.forEach(item => {
              const date = new Date(item.updated_at || item.created_at);
              const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(item);
            });

            return (
              <div className="space-y-6">
                {Object.entries(grouped)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([monthKey, items]) => (
                    <div key={monthKey}>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        {getMonthLabel(monthKey)}
                        <Badge variant="secondary" className="ml-2">{items.length}</Badge>
                      </h3>
                      <div className="grid gap-3">
                        {items.map((item) => (
                          <CollapsibleModificationCard
                            key={item.id}
                            request={item}
                            cardContent={<ModificationRequestCard request={item} />}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            );
          })()}
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
