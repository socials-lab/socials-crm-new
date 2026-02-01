import { Link } from 'react-router-dom';
import { Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useModificationRequests } from '@/hooks/useModificationRequests';
import { useCRMData } from '@/hooks/useCRMData';
import { ModificationRequestCard } from '@/components/engagements/ModificationRequestCard';
import { toast } from 'sonner';
import type { AddServiceProposedChanges } from '@/types/crm';
import type { StoredModificationRequest } from '@/data/modificationRequestsMockData';

export function PendingModificationsSection() {
  const { 
    pendingRequests, 
    isLoadingPending,
    approveRequest,
    rejectRequest,
    isApproving,
    isRejecting,
  } = useModificationRequests();
  
  const {
    addEngagementService,
    updateEngagementService,
    deleteEngagementService,
    addAssignment,
    updateAssignment,
    removeAssignment,
  } = useCRMData();

  // Handle approval with actual data modification
  const handleApprove = async (request: StoredModificationRequest) => {
    try {
      // Apply the change based on request type
      switch (request.request_type) {
        case 'add_service': {
          const changes = request.proposed_changes as AddServiceProposedChanges;
          await addEngagementService({
            engagement_id: request.engagement_id,
            service_id: changes.service_id,
            name: changes.name,
            price: changes.price,
            currency: changes.currency,
            billing_type: changes.billing_type,
            selected_tier: changes.selected_tier || null,
            is_active: true,
            notes: '',
            invoicing_status: changes.billing_type === 'one_off' ? 'pending' : 'not_applicable',
            invoiced_at: null,
            invoiced_in_period: null,
            invoice_id: null,
            creative_boost_min_credits: changes.creative_boost_min_credits || null,
            creative_boost_max_credits: changes.creative_boost_max_credits || null,
            creative_boost_price_per_credit: changes.creative_boost_price_per_credit || null,
            upsold_by_id: request.upsold_by_id,
            upsell_commission_percent: request.upsell_commission_percent,
            effective_from: request.effective_from,
          });
          break;
        }
        
        case 'update_service_price': {
          if (request.engagement_service_id) {
            const changes = request.proposed_changes as { new_price: number };
            await updateEngagementService(request.engagement_service_id, {
              price: changes.new_price,
            });
          }
          break;
        }
        
        case 'deactivate_service': {
          if (request.engagement_service_id) {
            await updateEngagementService(request.engagement_service_id, {
              is_active: false,
            });
          }
          break;
        }
        
        case 'add_assignment': {
          const changes = request.proposed_changes as {
            colleague_id: string;
            role_on_engagement: string;
            cost_model: 'hourly' | 'fixed_monthly' | 'percentage';
            hourly_cost?: number | null;
            monthly_cost?: number | null;
            percentage_of_revenue?: number | null;
          };
          await addAssignment({
            engagement_id: request.engagement_id,
            colleague_id: changes.colleague_id,
            role_on_engagement: changes.role_on_engagement,
            cost_model: changes.cost_model,
            hourly_cost: changes.hourly_cost || null,
            monthly_cost: changes.monthly_cost || null,
            percentage_of_revenue: changes.percentage_of_revenue || null,
            engagement_service_id: null,
            start_date: request.effective_from || new Date().toISOString().split('T')[0],
            end_date: null,
            notes: '',
          });
          break;
        }
        
        case 'update_assignment': {
          if (request.engagement_assignment_id) {
            const changes = request.proposed_changes as {
              new_cost_model: 'hourly' | 'fixed_monthly' | 'percentage';
              new_hourly_cost?: number | null;
              new_monthly_cost?: number | null;
              new_percentage?: number | null;
              new_role?: string;
            };
            await updateAssignment(request.engagement_assignment_id, {
              cost_model: changes.new_cost_model,
              hourly_cost: changes.new_hourly_cost || null,
              monthly_cost: changes.new_monthly_cost || null,
              percentage_of_revenue: changes.new_percentage || null,
              role_on_engagement: changes.new_role || undefined,
            });
          }
          break;
        }
        
        case 'remove_assignment': {
          if (request.engagement_assignment_id) {
            await removeAssignment(request.engagement_assignment_id);
          }
          break;
        }
      }
      
      // Mark request as approved
      await approveRequest(request.id);
      toast.success('Změna byla schválena a aplikována');
    } catch (error) {
      console.error('Error applying modification:', error);
      toast.error('Nepodařilo se aplikovat změnu');
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    await rejectRequest({ requestId, reason });
  };

  if (isLoadingPending) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Návrhy změn k schválení
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (pendingRequests.length === 0) {
    return null; // Don't show section if no pending requests
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            ⏳ Návrhy změn k schválení ({pendingRequests.length})
          </CardTitle>
          {pendingRequests.length > 3 && (
            <Link to="/engagements">
              <Button variant="ghost" size="sm" className="text-xs">
                Zobrazit vše
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingRequests.slice(0, 3).map((request) => (
          <ModificationRequestCard
            key={request.id}
            request={request}
            onApprove={() => handleApprove(request)}
            onReject={handleReject}
            isApproving={isApproving}
            isRejecting={isRejecting}
          />
        ))}
        {pendingRequests.length > 3 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <AlertCircle className="h-4 w-4" />
            <span>+ {pendingRequests.length - 3} dalších požadavků</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
