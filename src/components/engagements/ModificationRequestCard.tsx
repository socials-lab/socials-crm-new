import { useState } from 'react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';
import { 
  Package, 
  DollarSign, 
  UserPlus, 
  Globe,
  Settings,
  Check, 
  X, 
  Calendar,
  User,
  Building2,
  Copy,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  Mail,
  AlertTriangle,
  ShieldAlert,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { 
  ModificationRequestType,
  ModificationRequestItem,
  AddServiceProposedChanges,
  UpdateServicePriceProposedChanges,
  DeactivateServiceProposedChanges,
  AddAssignmentProposedChanges,
  UpdateAssignmentProposedChanges,
  RemoveAssignmentProposedChanges,
  NewEngagementProposedChanges,
} from '@/types/crm';
import type { StoredModificationRequest } from '@/data/modificationRequestsMockData';
import { formatCZK } from '@/utils/pricingEngine';

interface ModificationRequestCardProps {
  request: StoredModificationRequest;
  onApprove?: (requestId: string) => Promise<void>;
  onReject?: (requestId: string, reason: string) => Promise<void>;
  onApply?: (requestId: string) => Promise<void>;
  onEdit?: (request: StoredModificationRequest) => void;
  onDelete?: (requestId: string) => Promise<void>;
  onSendEmail?: (request: StoredModificationRequest) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  isApplying?: boolean;
  isDeleting?: boolean;
}

const REQUEST_TYPE_ICONS: Record<ModificationRequestType, typeof Package> = {
  expand_country: Globe,
  add_service: Package,
  update_service_price: DollarSign,
  deactivate_service: X,
  add_assignment: UserPlus,
  update_assignment: Settings,
  new_engagement: Building2,
};

const REQUEST_TYPE_COLORS: Record<ModificationRequestType, string> = {
  expand_country: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  add_service: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  update_service_price: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  deactivate_service: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  add_assignment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  update_assignment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  new_engagement: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const REQUEST_TYPE_LABELS: Record<ModificationRequestType, string> = {
  expand_country: 'Nová země',
  add_service: 'Přidání služby',
  update_service_price: 'Změna ceny',
  deactivate_service: 'Ukončení služby',
  add_assignment: 'Přiřazení kolegy',
  update_assignment: 'Změna odměny',
  new_engagement: 'Nová zakázka',
};

export function ModificationRequestCard({
  request,
  onApprove,
  onReject,
  onApply,
  onEdit,
  onDelete,
  onSendEmail,
  isApproving,
  isRejecting,
  isApplying,
  isDeleting,
}: ModificationRequestCardProps) {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  
  const Icon = REQUEST_TYPE_ICONS[request.request_type];
  const colorClass = REQUEST_TYPE_COLORS[request.request_type];
  const typeLabel = REQUEST_TYPE_LABELS[request.request_type];
  
  // Check if this is a bundled (multi-item) request
  const isBundled = request.items && request.items.length > 1;
  
  // Check if client has approved
  const isClientApproved = request.status === 'client_approved';
  const isApplied = request.status === 'applied';
  const hasUpgradeToken = !!request.upgrade_offer_token;
  
  const handleApprove = async () => {
    if (onApprove) {
      await onApprove(request.id);
    }
  };
  
  const handleReject = async () => {
    if (!rejectionReason.trim() || !onReject) return;
    await onReject(request.id, rejectionReason);
    setIsRejectDialogOpen(false);
    setRejectionReason('');
  };

  const handleApply = async () => {
    if (onApply) {
      await onApply(request.id);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(request.id);
      setIsDeleteDialogOpen(false);
    }
  };
  
  const handleCopyLink = async () => {
    if (request.upgrade_offer_token) {
      const link = `${window.location.origin}/upgrade/${request.upgrade_offer_token}`;
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      toast.success('Odkaz zkopírován');
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // Check if actions should be shown
  const showActions = onApprove && onReject && request.status === 'pending';
  
  // Show copy link for approved requests that are waiting for client
  const showCopyLinkOnly = request.status === 'approved' && hasUpgradeToken && !isClientApproved;
  
  // Show apply button for client-approved requests
  const showApplyButton = isClientApproved && onApply;
  
  // Show edit button for pending or approved (waiting for client) requests
  const canEdit = onEdit && ['pending', 'approved'].includes(request.status) && !isApplied;
  
  // Show delete button for pending, approved (waiting), or rejected requests
  const canDelete = onDelete && ['pending', 'approved', 'rejected'].includes(request.status) && !isApplied && !isClientApproved;

  // Render changes for a given type and proposed_changes
  const renderChangesForItem = (itemType: ModificationRequestType, changes: any) => {
    switch (itemType) {
      case 'add_service': {
        const c = changes as AddServiceProposedChanges;
        return (
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Služba:</span> {c.name}</p>
            <p><span className="text-muted-foreground">Cena:</span> {c.price.toLocaleString('cs-CZ')} {c.currency}/{c.billing_type === 'monthly' ? 'měs' : 'jednorázově'}</p>
            {c.selected_tier && (
              <p><span className="text-muted-foreground">Tier:</span> {c.selected_tier.toUpperCase()}</p>
            )}
          </div>
        );
      }
      case 'update_service_price': {
        const c = changes as UpdateServicePriceProposedChanges;
        return (
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Služba:</span> {c.service_name}</p>
            <p>
              <span className="text-muted-foreground">Cena:</span>{' '}
              <span className="line-through text-muted-foreground">{c.old_price.toLocaleString('cs-CZ')}</span>
              {' → '}
              <span className="font-medium text-primary">{c.new_price.toLocaleString('cs-CZ')}</span>
              {' '}{c.currency}
            </p>
          </div>
        );
      }
      case 'deactivate_service': {
        const c = changes as DeactivateServiceProposedChanges;
        return (
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Služba:</span> {c.service_name}</p>
            <p><span className="text-muted-foreground">Aktuální cena:</span> {c.price.toLocaleString('cs-CZ')} {c.currency}</p>
          </div>
        );
      }
      case 'add_assignment': {
        const c = changes as AddAssignmentProposedChanges;
        return (
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Kolega:</span> {c.colleague_name}</p>
            <p><span className="text-muted-foreground">Role:</span> {c.role_on_engagement}</p>
            {c.cost_model === 'fixed_monthly' && c.monthly_cost && (
              <p><span className="text-muted-foreground">Odměna:</span> {c.monthly_cost.toLocaleString('cs-CZ')} Kč/měs</p>
            )}
            {c.cost_model === 'hourly' && c.hourly_cost && (
              <p><span className="text-muted-foreground">Odměna:</span> {c.hourly_cost.toLocaleString('cs-CZ')} Kč/h</p>
            )}
            {c.cost_model === 'percentage' && c.percentage_of_revenue && (
              <p><span className="text-muted-foreground">Odměna:</span> {c.percentage_of_revenue}%</p>
            )}
          </div>
        );
      }
      case 'update_assignment': {
        const c = changes as UpdateAssignmentProposedChanges;
        return (
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Kolega:</span> {c.colleague_name}</p>
            {c.old_role !== c.new_role && (
              <p>
                <span className="text-muted-foreground">Role:</span>{' '}
                <span className="line-through text-muted-foreground">{c.old_role}</span>
                {' → '}
                <span className="font-medium">{c.new_role}</span>
              </p>
            )}
            {c.new_cost_model === 'fixed_monthly' && (
              <p>
                <span className="text-muted-foreground">Měsíční odměna:</span>{' '}
                {c.old_monthly_cost && <span className="line-through text-muted-foreground">{c.old_monthly_cost.toLocaleString('cs-CZ')}</span>}
                {' → '}
                <span className="font-medium">{c.new_monthly_cost?.toLocaleString('cs-CZ')}</span> Kč
              </p>
            )}
          </div>
        );
      }
      case 'expand_country': {
        const c = changes as any;
        return (
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Služba:</span> {c.service_name || c.reference_service_name}</p>
            <p><span className="text-muted-foreground">Země:</span> {c.new_country_name || c.new_country_code}</p>
            <p><span className="text-muted-foreground">Cena:</span> {c.price?.toLocaleString('cs-CZ')} {c.currency}</p>
          </div>
        );
      }
      case 'new_engagement': {
        const c = changes as NewEngagementProposedChanges;
        return (
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Typ:</span> {c.is_different_sro ? 'Jiné SRO (nová firma)' : 'Stejné SRO'}</p>
            {c.is_different_sro && c.new_client_data?.company_name && (
              <p><span className="text-muted-foreground">Nový klient:</span> {c.new_client_data.company_name}
                {c.new_client_data.brand_name && <span className="text-muted-foreground"> ({c.new_client_data.brand_name})</span>}
              </p>
            )}
            <p><span className="text-muted-foreground">Zakázka:</span> {c.engagement_name}</p>
            <p><span className="text-muted-foreground">Služby:</span> {c.services.length}×</p>
            {c.services.map((s, i) => (
              <div key={i} className="ml-3">
                <p>• {s.name} — {s.price.toLocaleString('cs-CZ')} {s.currency}/{s.billing_type === 'monthly' ? 'měs' : 'jednorázově'}</p>
                {s.assignments && s.assignments.length > 0 && (
                  <div className="ml-4 text-xs text-muted-foreground">
                    {s.assignments.map((a, aIdx) => (
                      <p key={aIdx}>
                        👤 {a.colleague_name} ({a.role || 'bez role'}) — {a.cost_model === 'hourly' ? `${a.hourly_cost?.toLocaleString('cs-CZ')} Kč/hod` : a.cost_model === 'percentage' ? `${a.percentage_of_revenue}%` : `${a.monthly_cost?.toLocaleString('cs-CZ')} Kč/měs`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <p className="font-medium"><span className="text-muted-foreground">Celkem:</span> {c.total_monthly_price.toLocaleString('cs-CZ')} {c.currency}/měs</p>
            {c.is_different_sro && c.onboarding_email && (
              <p className="text-xs text-muted-foreground mt-1">📋 Klient vyplní údaje přes onboarding formulář ({c.onboarding_email})</p>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  // Render proposed changes based on request type
  const renderChanges = () => {
    return renderChangesForItem(request.request_type, request.proposed_changes);
  };

  // Render all bundled items
  const renderBundledItems = () => {
    if (!request.items || request.items.length <= 1) return null;
    
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          📋 Nabídka obsahuje {request.items.length} položek
        </p>
        {request.items.map((item, idx) => {
          const itemIcon = REQUEST_TYPE_ICONS[item.request_type];
          const ItemIcon = itemIcon;
          const itemColor = REQUEST_TYPE_COLORS[item.request_type];
          const itemLabel = REQUEST_TYPE_LABELS[item.request_type];
          return (
            <div key={item.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${itemColor}`}>
                  <ItemIcon className="h-3 w-3" />
                </div>
                <Badge variant="outline" className="text-xs">
                  {idx + 1}. {itemLabel}
                </Badge>
              </div>
              {renderChangesForItem(item.request_type, item.proposed_changes)}
            </div>
          );
        })}
        {/* Combined total for bundled items */}
        {(() => {
          let totalDelta = 0;
          let totalInternalCost = 0;
          for (const item of request.items!) {
            const c = item.proposed_changes as any;
            if (item.request_type === 'add_service' || item.request_type === 'expand_country') {
              totalDelta += c.price || 0;
            } else if (item.request_type === 'update_service_price') {
              totalDelta += (c.new_price || 0) - (c.old_price || 0);
            } else if (item.request_type === 'deactivate_service') {
              totalDelta -= c.price || 0;
            }
            if (item.pricing_snapshot) {
              totalInternalCost += item.pricing_snapshot.delta_internal_cost || 0;
            }
          }
          const discountPercent = (request as any).bundle_discount_percent || 0;
          const discountAmount = discountPercent > 0 ? Math.round(totalDelta * discountPercent / 100) : 0;
          const revenueAfterDiscount = totalDelta - discountAmount;
          const marginAmount = revenueAfterDiscount - totalInternalCost;
          const marginPercent = revenueAfterDiscount > 0 ? Math.round((marginAmount / revenueAfterDiscount) * 100) : 0;
          const marginColor = marginPercent >= 66 ? 'text-green-600' : marginPercent >= 63 ? 'text-yellow-600' : 'text-destructive';

          return (
            <div className="space-y-1 pt-2 border-t">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Příjmy</p>
                  <p className="font-semibold">+{totalDelta.toLocaleString('cs-CZ')} Kč</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Náklady</p>
                  <p className="font-semibold">{totalInternalCost > 0 ? `-${totalInternalCost.toLocaleString('cs-CZ')} Kč` : '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Marže</p>
                  <p className={cn("font-semibold", marginColor)}>
                    {totalInternalCost > 0 ? `${marginPercent} %` : '—'}
                  </p>
                </div>
              </div>
              {discountPercent > 0 && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">🏷️ Sleva za balíček:</span>
                    <span className="font-medium text-primary">-{discountPercent} % (-{discountAmount.toLocaleString('cs-CZ')} Kč)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span>Po slevě:</span>
                    <span className={cn(revenueAfterDiscount >= 0 ? "text-green-600" : "text-destructive")}>
                      {revenueAfterDiscount.toLocaleString('cs-CZ')} Kč/měs
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

  const clientName = request.client_brand_name || request.client_name || 'Neznámý klient';
  const engagementName = request.engagement_name || 'Neznámá zakázka';
  const requestedAt = formatDistanceToNow(new Date(request.requested_at), {
    addSuffix: true, 
    locale: cs 
  });

  return (
    <>
      <Card className="border-l-4 border-l-primary/50 hover:border-l-primary transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`p-2 rounded-lg shrink-0 ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline">
                      {isBundled ? `Nabídka (${request.items!.length} položek)` : typeLabel}
                    </Badge>
                    {/* Client confirmation badge */}
                    {isClientApproved && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Klient potvrdil
                      </Badge>
                    )}
                    {/* Applied badge */}
                    {isApplied && (
                      <Badge className="bg-primary/10 text-primary">
                        <Check className="h-3 w-3 mr-1" />
                        Aktivováno
                      </Badge>
                    )}
                    {/* Pending - waiting for admin approval */}
                    {request.status === 'pending' && (
                      <Badge variant="outline" className="text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        Čeká na schválení
                      </Badge>
                    )}
                    {/* Approved & waiting for client */}
                    {showCopyLinkOnly && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20">
                        <Mail className="h-3 w-3 mr-1" />
                        Čeká na klienta
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {clientName}
                  </h4>
                  <p className="text-xs text-muted-foreground">{engagementName}</p>
                </div>
                
                {/* Effective date */}
                {request.effective_from && (
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Od: {format(new Date(request.effective_from), 'd. M. yyyy')}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Changes */}
              <div className="bg-muted/50 rounded-md p-3">
                {isBundled ? renderBundledItems() : renderChanges()}
              </div>

              {/* Pricing Snapshot - Clear before/after overview */}
              {request.pricing_snapshot && (
                <div className="rounded-lg border-2 border-muted p-4 space-y-3">
                  {/* Header with validation status */}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm flex items-center gap-2">
                      📊 Dopad na marži
                    </span>
                    {request.pricing_snapshot.validation_status === 'green' && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />OK
                      </Badge>
                    )}
                    {request.pricing_snapshot.validation_status === 'orange' && (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />Varování
                      </Badge>
                    )}
                    {request.pricing_snapshot.validation_status === 'red' && (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                        <ShieldAlert className="h-3 w-3 mr-1" />Pod hranicí
                      </Badge>
                    )}
                  </div>

                  {/* Before → After comparison grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* BEFORE */}
                    <div className="rounded-md bg-muted/60 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Před změnou</p>
                      <p className="text-lg font-bold">{formatCZK(request.pricing_snapshot.current_total_revenue)}</p>
                      <p className="text-xs text-muted-foreground">měsíčně</p>
                    </div>
                    {/* CHANGE */}
                    <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Změna</p>
                      <p className={cn("text-lg font-bold", request.pricing_snapshot.delta_revenue >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                        {request.pricing_snapshot.delta_revenue >= 0 ? '+' : ''}{formatCZK(request.pricing_snapshot.delta_revenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.pricing_snapshot.delta_internal_cost > 0 && (
                          <span>náklad: {formatCZK(request.pricing_snapshot.delta_internal_cost)}</span>
                        )}
                      </p>
                    </div>
                    {/* AFTER */}
                    <div className="rounded-md bg-primary/10 border-2 border-primary/30 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-primary font-medium mb-1">Po změně</p>
                      <p className="text-lg font-bold text-primary">{formatCZK(request.pricing_snapshot.new_total_revenue)}</p>
                      <p className="text-xs text-muted-foreground">měsíčně</p>
                    </div>
                  </div>

                  {/* Margin comparison */}
                  <div className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Marže:</span>
                      {request.pricing_snapshot.current_margin_percent != null && (
                        <>
                          <span className="font-medium">{request.pricing_snapshot.current_margin_percent.toFixed(1)}%</span>
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <span className={cn(
                        "font-bold text-base",
                        request.pricing_snapshot.new_margin_percent >= 66 ? "text-green-600 dark:text-green-400" : 
                        request.pricing_snapshot.new_margin_percent >= 63 ? "text-amber-600 dark:text-amber-400" : 
                        "text-destructive"
                      )}>
                        {request.pricing_snapshot.new_margin_percent.toFixed(1)}%
                      </span>
                    </div>
                    {request.pricing_snapshot.multiplier && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        multiplikátor: {request.pricing_snapshot.multiplier}
                      </span>
                    )}
                  </div>

                  {request.pricing_snapshot.requires_admin_approval && (
                    <Badge variant="outline" className="text-xs border-destructive text-destructive">
                      ⚠️ Vyžaduje admin schválení
                    </Badge>
                  )}

                  {request.pricing_snapshot.justification && (
                    <p className="text-xs text-muted-foreground italic border-l-2 border-muted-foreground/30 pl-2">
                      Zdůvodnění: {request.pricing_snapshot.justification}
                    </p>
                  )}

                  {request.pricing_snapshot.requires_new_client && request.pricing_snapshot.new_client_data && (
                    <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs">
                      <span className="font-medium text-blue-800 dark:text-blue-300">🏢 Nový klient (jiné SRO):</span>{' '}
                      <span>{request.pricing_snapshot.new_client_data.company_name}</span>
                      {request.pricing_snapshot.new_client_data.brand_name && (
                        <span className="text-muted-foreground"> ({request.pricing_snapshot.new_client_data.brand_name})</span>
                      )}
                      {request.pricing_snapshot.new_client_data.ico && (
                        <span className="text-muted-foreground ml-1">IČO: {request.pricing_snapshot.new_client_data.ico}</span>
                      )}
                    </div>
                  )}

                  {request.pricing_snapshot.colleague_rewards && request.pricing_snapshot.colleague_rewards.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="font-medium">👥 Odměny kolegů:</span>
                      {request.pricing_snapshot.colleague_rewards.map((cr, i) => (
                        <div key={i} className="flex items-center gap-2 ml-4">
                          <span className="text-muted-foreground">{cr.role}:</span>
                          {cr.colleague_name && <span>{cr.colleague_name}</span>}
                          <span className="font-medium">
                            {cr.reward.toLocaleString('cs-CZ')} {cr.reward_type === 'per_credit' ? 'Kč/kredit' : 'Kč'}
                          </span>
                          {cr.hours > 0 && (
                            <span className="text-muted-foreground">({cr.hours}h)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
               
              {/* Note */}
              {request.note && (
                <p className="text-xs text-muted-foreground italic">
                  "{request.note}"
                </p>
              )}

              {/* Rejection reason */}
              {request.status === 'rejected' && request.rejection_reason && (
                <p className="text-xs text-destructive">
                  Důvod zamítnutí: {request.rejection_reason}
                </p>
              )}
              
              {/* Client acceptance info */}
              {isClientApproved && request.client_approved_at && (
                <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                  📧 Klient potvrdil: {format(new Date(request.client_approved_at), 'd.M.yyyy v H:mm')} ({request.client_email})
                </div>
              )}

              {/* Email sending history */}
              {request.emails_sent && request.emails_sent.length > 0 && (
                <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md space-y-1">
                  <span className="font-medium">📨 Historie odeslaných emailů:</span>
                  {request.emails_sent.map((email, idx) => (
                    <div key={idx} className="flex items-center gap-2 ml-4">
                      <span>{format(new Date(email.sent_at), 'd.M.yyyy H:mm')}</span>
                      <span>→</span>
                      <span className="font-medium">{email.sent_to}</span>
                      <span className="text-muted-foreground">(odeslal: {email.sent_by_name})</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Navrhl: {request.upsold_by_name || 'Neznámý'}</span>
                  <span>•</span>
                  <span>{requestedAt}</span>
                </div>
                
              {/* Status badge for reviewed requests */}
                {request.status === 'approved' && !showCopyLinkOnly && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
                    <Check className="h-3 w-3 mr-1" />
                    Schváleno
                  </Badge>
                )}
                {request.status === 'rejected' && (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      <X className="h-3 w-3 mr-1" />
                      Zamítnuto
                    </Badge>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-destructive hover:text-destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}

                {/* Copy link button for approved requests waiting for client */}
                {showCopyLinkOnly && (
                  <div className="flex items-center gap-2">
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => onEdit?.(request)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Upravit
                      </Button>
                    )}
                    {onSendEmail && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => onSendEmail(request)}
                      >
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        Odeslat email
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={handleCopyLink}
                    >
                      {linkCopied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      {linkCopied ? 'Zkopírováno' : 'Zkopírovat odkaz'}
                    </Button>
                  </div>
                )}

                {/* Apply button for client-approved requests */}
                {showApplyButton && (
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={handleApply}
                    disabled={isApplying}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    {isApplying ? 'Aktivuji...' : 'Aktivovat do zakázky'}
                  </Button>
                )}
                
                {/* Actions for pending requests */}
                {showActions && (
                  <div className="flex items-center gap-2">
                    {/* Delete button */}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {/* Edit button */}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => onEdit?.(request)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Upravit
                      </Button>
                    )}
                    {/* Copy link button - only shown if there's a token */}
                    {hasUpgradeToken && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => window.open(`/upgrade/${request.upgrade_offer_token}`, '_blank')}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Náhled
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={handleCopyLink}
                        >
                          {linkCopied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                          {linkCopied ? 'Zkopírováno' : 'Odkaz'}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={() => setIsRejectDialogOpen(true)}
                      disabled={isApproving || isRejecting}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Zamítnout
                    </Button>
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={handleApprove}
                      disabled={isApproving || isRejecting}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      {isApproving ? 'Schvaluji...' : 'Schválit'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Rejection dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Zamítnout požadavek</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Důvod zamítnutí</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Uveďte důvod zamítnutí..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Zrušit
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isRejecting}
            >
              {isRejecting ? 'Zamítám...' : 'Zamítnout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Smazat návrh změny</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Opravdu chcete smazat tento návrh změny? Tuto akci nelze vrátit zpět.
            </p>
            <div className="bg-muted p-3 rounded-md text-sm">
              <p><span className="text-muted-foreground">Typ:</span> {typeLabel}</p>
              <p><span className="text-muted-foreground">Klient:</span> {request.client_brand_name || request.client_name}</p>
              <p><span className="text-muted-foreground">Zakázka:</span> {request.engagement_name}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Zrušit
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Mažu...' : 'Smazat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
