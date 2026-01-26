import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModificationRequestCard } from '@/components/engagements/ModificationRequestCard';
import { useModificationRequests } from '@/hooks/useModificationRequests';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, FileEdit } from 'lucide-react';
import type { AddServiceProposedChanges, UpdateServicePriceProposedChanges } from '@/types/crm';

export default function Modifications() {
  const { 
    pendingRequests, 
    isLoadingPending, 
    approveRequest, 
    rejectRequest,
    isApproving,
    isRejecting 
  } = useModificationRequests();
  const { addEngagementService, updateEngagementService } = useCRMData();
  const { isSuperAdmin } = useUserRole();

  // Filter requests by status
  const pending = pendingRequests?.filter(r => r.status === 'pending') || [];
  const approved = pendingRequests?.filter(r => r.status === 'approved') || [];
  const rejected = pendingRequests?.filter(r => r.status === 'rejected') || [];

  const handleApprove = async (requestId: string) => {
    const request = pendingRequests?.find(r => r.id === requestId);
    if (!request) return;

    try {
      // Execute the actual change based on request type
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
        // Use engagement_service_id from the request itself, not from proposed_changes
        if (request.engagement_service_id) {
          await updateEngagementService(request.engagement_service_id, {
            price: changes.new_price,
          });
        }
      }

      // Mark request as approved
      await approveRequest(requestId);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    await rejectRequest({ requestId, reason });
  };

  if (isLoadingPending) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Úpravy zakázek" 
          description="Správa požadavků na změny zakázek"
        />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Načítání...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Úpravy zakázek" 
        description="Přehled a schvalování požadavků na změny zakázek"
      />

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
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Čekající
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Schválené
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
                  onApprove={isSuperAdmin ? handleApprove : undefined}
                  onReject={isSuperAdmin ? handleReject : undefined}
                  isApproving={isApproving}
                  isRejecting={isRejecting}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approved.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-center">
                  Žádné schválené požadavky
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {approved.map((request) => (
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
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
