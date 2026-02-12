import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  Building2,
  Calendar,
  User,
  Copy,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  Mail,
  Send,
  FileText,
  Receipt,
  XCircle,
  Check,
  X,
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
import type { ExtraWork, ExtraWorkStatus } from '@/types/crm';
import { useCRMData } from '@/hooks/useCRMData';

interface ExtraWorkCardProps {
  work: ExtraWork;
  onEdit?: (work: ExtraWork) => void;
  onDelete?: (id: string) => void;
  onSendApproval?: (work: ExtraWork) => void;
  onUpdate?: (id: string, data: Partial<ExtraWork>) => void;
}

const STATUS_BORDER_COLORS: Record<ExtraWorkStatus, string> = {
  pending_approval: 'border-l-amber-500',
  in_progress: 'border-l-purple-500',
  ready_to_invoice: 'border-l-blue-500',
  invoiced: 'border-l-emerald-500',
  rejected: 'border-l-red-500',
};

export function ExtraWorkCard({ work, onEdit, onDelete, onSendApproval, onUpdate }: ExtraWorkCardProps) {
  const { getClientById, colleagues, engagements } = useCRMData();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const client = getClientById(work.client_id);
  const colleague = colleagues.find(c => c.id === work.colleague_id);
  const engagement = engagements.find(e => e.id === work.engagement_id);
  const clientName = client?.brand_name || client?.name || 'Neznámý klient';

  const hasToken = !!work.approval_token;
  const isWaitingForClient = work.status === 'pending_approval' && hasToken;
  const isPending = work.status === 'pending_approval' && !hasToken;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: work.currency || 'CZK', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const handleCopyLink = async () => {
    if (work.approval_token) {
      const link = `${window.location.origin}/extra-work-approval/${work.approval_token}`;
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      toast.success('Odkaz zkopírován');
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleDelete = () => {
    onDelete?.(work.id);
    setIsDeleteDialogOpen(false);
  };

  const handleMoveToInvoice = () => {
    onUpdate?.(work.id, { status: 'ready_to_invoice' });
  };

  const createdAt = formatDistanceToNow(new Date(work.created_at), { addSuffix: true, locale: cs });

  return (
    <>
      <Card className={`border-l-4 ${STATUS_BORDER_COLORS[work.status]} hover:border-l-primary transition-colors`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-medium text-sm">{work.name}</h4>
                  {isWaitingForClient && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20">
                      <Clock className="h-3 w-3 mr-1" />
                      Čeká na klienta
                    </Badge>
                  )}
                  {work.status === 'in_progress' && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Klient schválil
                    </Badge>
                  )}
                  {work.status === 'ready_to_invoice' && (
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <FileText className="h-3 w-3 mr-1" />
                      K fakturaci
                    </Badge>
                  )}
                  {work.status === 'invoiced' && (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Receipt className="h-3 w-3 mr-1" />
                      Vyfakturováno
                    </Badge>
                  )}
                  {work.status === 'rejected' && (
                    <Badge variant="destructive">
                      <X className="h-3 w-3 mr-1" />
                      Zamítnuto
                    </Badge>
                  )}
                  {work.upsold_by_id && (
                    <Badge variant="outline" className="text-primary border-primary/30">
                      Upsell
                    </Badge>
                  )}
                </div>
                <p className="text-sm flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {clientName}
                </p>
                {engagement && (
                  <p className="text-xs text-muted-foreground">{engagement.name}</p>
                )}
              </div>

              {/* Date */}
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(work.work_date), 'd. M. yyyy')}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-muted/50 rounded-md p-3">
              <div className="space-y-1 text-sm">
                {work.hours_worked && work.hourly_rate ? (
                  <p>
                    <span className="text-muted-foreground">Práce:</span>{' '}
                    {work.hours_worked}h × {work.hourly_rate.toLocaleString('cs-CZ')} {work.currency || 'CZK'} ={' '}
                    <span className="font-medium">{formatCurrency(work.amount)}</span>
                  </p>
                ) : (
                  <p>
                    <span className="text-muted-foreground">Částka:</span>{' '}
                    <span className="font-medium">{formatCurrency(work.amount)}</span>
                  </p>
                )}
                {colleague && (
                  <p>
                    <span className="text-muted-foreground">Kolega:</span> {colleague.full_name}
                  </p>
                )}
                {work.description && (
                  <p className="text-muted-foreground italic">„{work.description}"</p>
                )}
              </div>
            </div>

            {/* Client approval info */}
            {work.client_approved_at && (
              <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                📧 Klient potvrdil: {format(new Date(work.client_approved_at), 'd.M.yyyy v H:mm')}
                {work.client_approval_email && ` (${work.client_approval_email})`}
              </div>
            )}

            {/* Rejection reason */}
            {work.status === 'rejected' && work.client_rejection_reason && (
              <p className="text-xs text-destructive">
                Důvod zamítnutí: {work.client_rejection_reason}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{createdAt}</span>
                <span>•</span>
                <span>Období: {work.billing_period}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Pending: Send, Edit, Delete */}
                {isPending && (
                  <>
                    {onDelete && (
                      <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button variant="ghost" size="sm" className="h-8" onClick={() => onEdit(work)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Upravit
                      </Button>
                    )}
                    {onSendApproval && (
                      <Button size="sm" className="h-8" onClick={() => onSendApproval(work)}>
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Odeslat ke schválení
                      </Button>
                    )}
                  </>
                )}

                {/* Waiting for client: Copy link, Send email, Edit, Delete */}
                {isWaitingForClient && (
                  <>
                    {onDelete && (
                      <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button variant="ghost" size="sm" className="h-8" onClick={() => onEdit(work)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Upravit
                      </Button>
                    )}
                    {onSendApproval && (
                      <Button variant="outline" size="sm" className="h-8" onClick={() => onSendApproval(work)}>
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        Odeslat email
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="h-8" onClick={handleCopyLink}>
                      {linkCopied ? (
                        <><CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-600" /> Zkopírováno</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5 mr-1" /> Zkopírovat odkaz</>
                      )}
                    </Button>
                  </>
                )}

                {/* Client approved: Move to invoice */}
                {work.status === 'in_progress' && onUpdate && (
                  <Button size="sm" className="h-8" onClick={handleMoveToInvoice}>
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    K fakturaci
                  </Button>
                )}

                {/* Rejected: Delete */}
                {work.status === 'rejected' && onDelete && (
                  <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Smazat vícepráci</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Opravdu chcete smazat vícepráci "{work.name}"? Tuto akci nelze vrátit zpět.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Zrušit</Button>
            <Button variant="destructive" onClick={handleDelete}>Smazat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
