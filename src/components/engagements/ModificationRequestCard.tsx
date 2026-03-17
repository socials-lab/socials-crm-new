import { useState } from 'react';
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

  // Render proposed changes based on request type
  const renderChanges = () => {
    const changes = request.proposed_changes;
    
    switch (request.request_type) {
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
      
      case 'new_engagement': {
        const c = changes as NewEngagementProposedChanges;
        return (
          <div className="space-y-1 text-sm">
            {c.new_client_data?.company_name && (
              <p><span className="text-muted-foreground">Nový klient:</span> {c.new_client_data.company_name}
                {c.new_client_data.brand_name && <span className="text-muted-foreground"> ({c.new_client_data.brand_name})</span>}
              </p>
            )}
            <p><span className="text-muted-foreground">Zakázka:</span> {c.engagement_name}</p>
            <p><span className="text-muted-foreground">Služby:</span> {c.services.length}×</p>
            {c.services.map((s, i) => (
              <p key={i} className="ml-3">• {s.name} — {s.price.toLocaleString('cs-CZ')} {s.currency}/{s.billing_type === 'monthly' ? 'měs' : 'jednorázově'}</p>
            ))}
            <p className="font-medium"><span className="text-muted-foreground">Celkem:</span> {c.total_monthly_price.toLocaleString('cs-CZ')} {c.currency}/měs</p>
            <p className="text-xs text-muted-foreground mt-1">📋 Klient vyplní údaje přes onboarding formulář ({c.onboarding_email})</p>
          </div>
        );
      }
      
      default:
        return null;
    }
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
                      {typeLabel}
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
                    {/* Waiting for client badge */}
                    {showCopyLinkOnly && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20">
                        <Clock className="h-3 w-3 mr-1" />
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
                {renderChanges()}
               </div>

              {/* Pricing Snapshot */}
              {request.pricing_snapshot && (
                <div className="rounded-md border p-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    📊 Dopad na marži
                    {request.pricing_snapshot.validation_status === 'green' && (
                      <Badge className="bg-green-100 text-green-700 text-xs px-1.5 py-0">
                        <CheckCircle2 className="h-3 w-3 mr-0.5" />OK
                      </Badge>
                    )}
                    {request.pricing_snapshot.validation_status === 'orange' && (
                      <Badge className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0">
                        <AlertTriangle className="h-3 w-3 mr-0.5" />Varování
                      </Badge>
                    )}
                    {request.pricing_snapshot.validation_status === 'red' && (
                      <Badge className="bg-red-100 text-red-700 text-xs px-1.5 py-0">
                        <ShieldAlert className="h-3 w-3 mr-0.5" />Pod hranicí
                      </Badge>
                    )}
                    {request.pricing_snapshot.requires_admin_approval && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 border-destructive text-destructive">
                        Vyžaduje admin schválení
                      </Badge>
                    )}
                  </div>
                  {/* Recommended vs final price */}
                  {request.pricing_snapshot.recommended_price != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Doporučená cena:</span>
                      <span>{formatCZK(request.pricing_snapshot.recommended_price)}</span>
                      {request.pricing_snapshot.final_edited_price != null && request.pricing_snapshot.final_edited_price !== request.pricing_snapshot.recommended_price && (
                        <>
                          <span className="text-muted-foreground">→ Finální:</span>
                          <span className="font-medium text-primary">{formatCZK(request.pricing_snapshot.final_edited_price)}</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-muted-foreground">Před:</span>{' '}
                      {formatCZK(request.pricing_snapshot.current_total_revenue)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">+ změna:</span>{' '}
                      {formatCZK(request.pricing_snapshot.delta_revenue)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Po:</span>{' '}
                      {formatCZK(request.pricing_snapshot.new_total_revenue)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground">Nová marže:</span>
                    <span className="font-medium">{request.pricing_snapshot.new_margin_percent.toFixed(1)}%</span>
                    {request.pricing_snapshot.multiplier && (
                      <span className="text-muted-foreground">
                        (multiplikátor: {request.pricing_snapshot.multiplier})
                      </span>
                    )}
                    {request.pricing_snapshot.delta_internal_cost > 0 && (
                      <span className="text-muted-foreground">
                        | interní: {formatCZK(request.pricing_snapshot.delta_internal_cost)}
                      </span>
                    )}
                  </div>
                  {request.pricing_snapshot.justification && (
                    <p className="text-muted-foreground italic">
                      Zdůvodnění: {request.pricing_snapshot.justification}
                    </p>
                  )}
                  {request.pricing_snapshot.requires_new_client && request.pricing_snapshot.new_client_data && (
                    <div className="mt-1 p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
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
                    <div className="mt-1 space-y-1">
                      <span className="font-medium">👥 Odměny kolegů:</span>
                      {request.pricing_snapshot.colleague_rewards.map((cr, i) => (
                        <div key={i} className="flex items-center gap-2">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={handleCopyLink}
                      >
                        {linkCopied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        {linkCopied ? 'Zkopírováno' : 'Odkaz'}
                      </Button>
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
