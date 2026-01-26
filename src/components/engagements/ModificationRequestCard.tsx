import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';
import { 
  Package, 
  DollarSign, 
  UserPlus, 
  UserMinus, 
  Settings,
  Check, 
  X, 
  Calendar,
  User,
  Building2,
  Copy,
  CheckCircle2,
  Clock,
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
} from '@/types/crm';
import type { StoredModificationRequest } from '@/data/modificationRequestsMockData';

interface ModificationRequestCardProps {
  request: StoredModificationRequest;
  onApprove?: (requestId: string) => Promise<void>;
  onReject?: (requestId: string, reason: string) => Promise<void>;
  onApply?: (requestId: string) => Promise<void>;
  isApproving?: boolean;
  isRejecting?: boolean;
  isApplying?: boolean;
}

const REQUEST_TYPE_ICONS: Record<ModificationRequestType, typeof Package> = {
  add_service: Package,
  update_service_price: DollarSign,
  deactivate_service: X,
  add_assignment: UserPlus,
  update_assignment: Settings,
  remove_assignment: UserMinus,
};

const REQUEST_TYPE_COLORS: Record<ModificationRequestType, string> = {
  add_service: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  update_service_price: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  deactivate_service: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  add_assignment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  update_assignment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  remove_assignment: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const REQUEST_TYPE_LABELS: Record<ModificationRequestType, string> = {
  add_service: 'Přidání služby',
  update_service_price: 'Změna ceny',
  deactivate_service: 'Ukončení služby',
  add_assignment: 'Přiřazení kolegy',
  update_assignment: 'Změna odměny',
  remove_assignment: 'Odebrání kolegy',
};

export function ModificationRequestCard({
  request,
  onApprove,
  onReject,
  onApply,
  isApproving,
  isRejecting,
  isApplying,
}: ModificationRequestCardProps) {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
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
      
      case 'remove_assignment': {
        const c = changes as RemoveAssignmentProposedChanges;
        return (
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Kolega:</span> {c.colleague_name}</p>
            <p><span className="text-muted-foreground">Role:</span> {c.role_on_engagement}</p>
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
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    Zamítnuto
                  </Badge>
                )}

                {/* Copy link button for approved requests waiting for client */}
                {showCopyLinkOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={handleCopyLink}
                  >
                    {linkCopied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {linkCopied ? 'Zkopírováno' : 'Zkopírovat odkaz'}
                  </Button>
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
    </>
  );
}
