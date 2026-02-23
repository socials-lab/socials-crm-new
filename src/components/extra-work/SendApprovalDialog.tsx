import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useCRMData } from '@/hooks/useCRMData';
import { useToast } from '@/hooks/use-toast';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import type { ExtraWork } from '@/types/crm';
import { Copy, Mail, CheckCircle2, Eye, EyeOff, ClipboardCheck } from 'lucide-react';

// localStorage helper for approval tokens
const APPROVAL_STORAGE_KEY = 'extra_work_approvals';

interface StoredApproval {
  extraWorkId: string;
  token: string;
  email: string | null;
  createdAt: string;
}

function getStoredApprovals(): StoredApproval[] {
  try {
    return JSON.parse(localStorage.getItem(APPROVAL_STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveApproval(approval: StoredApproval) {
  const approvals = getStoredApprovals();
  const idx = approvals.findIndex(a => a.extraWorkId === approval.extraWorkId);
  if (idx >= 0) approvals[idx] = approval;
  else approvals.push(approval);
  localStorage.setItem(APPROVAL_STORAGE_KEY, JSON.stringify(approvals));
}

export function getApprovalByToken(token: string): StoredApproval | undefined {
  return getStoredApprovals().find(a => a.token === token);
}

interface SendApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extraWork: ExtraWork;
  onUpdate: (id: string, data: Partial<ExtraWork>) => void;
}

export function SendApprovalDialog({ open, onOpenChange, extraWork, onUpdate }: SendApprovalDialogProps) {
  const { getClientById, clientContacts, colleagues, engagements } = useCRMData();
  const { toast } = useToast();
  const { fillTemplate } = useEmailTemplates();
  const [email, setEmail] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const client = useMemo(() => getClientById(extraWork.client_id), [extraWork.client_id, getClientById]);
  const colleague = useMemo(() => colleagues.find(c => c.id === extraWork.colleague_id), [extraWork.colleague_id, colleagues]);
  const engagement = useMemo(() => engagements.find(e => e.id === extraWork.engagement_id), [extraWork.engagement_id, engagements]);

  const clientName = client?.brand_name || client?.name || 'Klient';

  const defaultEmail = useMemo(() => {
    const contacts = clientContacts.filter(c => c.client_id === extraWork.client_id);
    const primary = contacts.find(c => c.is_primary);
    return primary?.email || contacts[0]?.email || client?.main_contact_email || '';
  }, [extraWork.client_id, clientContacts, client]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: extraWork.currency || 'CZK', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  // Generate default email content
  useEffect(() => {
    if (open) {
      const approvalUrl = getApprovalUrl();

      const hoursLine = extraWork.hours_worked && extraWork.hourly_rate
        ? `Rozsah: ${extraWork.hours_worked}h × ${extraWork.hourly_rate.toLocaleString('cs-CZ')} ${extraWork.currency || 'CZK'}/h`
        : '';

      const { subject, body } = fillTemplate('send_approval', {
        work_name: extraWork.name,
        work_description: extraWork.description ? `Popis: ${extraWork.description}` : '',
        hours_line: hoursLine,
        amount: formatCurrency(extraWork.amount),
        engagement_line: engagement ? `Zakázka: ${engagement.name}` : '',
        colleague_line: colleague ? `Zpracoval/a: ${colleague.full_name}` : '',
        url: approvalUrl,
      });

      setEmailSubject(subject);
      setEmailBody(body);
    }
  }, [open, extraWork.id]);

  const getOrCreateToken = (): string => {
    const existing = getStoredApprovals().find(a => a.extraWorkId === extraWork.id);
    if (existing) return existing.token;

    const token = crypto.randomUUID();
    saveApproval({
      extraWorkId: extraWork.id,
      token,
      email: null,
      createdAt: new Date().toISOString(),
    });
    return token;
  };

  const getApprovalUrl = () => {
    const token = getOrCreateToken();
    return `${window.location.origin}/extra-work-approval/${token}`;
  };

  const handleCopyLink = () => {
    const url = getApprovalUrl();
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({ title: 'Odkaz zkopírován', description: 'Schvalovací odkaz byl zkopírován do schránky.' });
  };

  const handleSendEmail = () => {
    const targetEmail = email || defaultEmail;
    if (!targetEmail) {
      toast({ title: 'Chyba', description: 'Zadejte email.', variant: 'destructive' });
      return;
    }

    if (!emailSubject.trim()) {
      toast({ title: 'Chyba', description: 'Předmět emailu nesmí být prázdný.', variant: 'destructive' });
      return;
    }

    const token = getOrCreateToken();
    saveApproval({
      extraWorkId: extraWork.id,
      token,
      email: targetEmail,
      createdAt: new Date().toISOString(),
    });

    // Store extra work data for the public approval page
    storeExtraWorkForApproval(extraWork, {
      clientName: clientName,
      engagementName: engagement?.name,
      colleagueName: colleague?.full_name,
      colleagueEmail: colleague?.email,
      colleagueId: colleague?.id,
    });

    toast({ title: '📧 Email "odeslán"', description: `Demo: schvalovací email pro ${targetEmail}. Použijte odkaz pro simulaci.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Odeslat ke schválení</DialogTitle>
          <DialogDescription>
            Pošlete klientovi email pro schválení vícepráce „{extraWork.name}" ({formatCurrency(extraWork.amount)}).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Recipient */}
          <div className="grid gap-2">
            <Label>Příjemce</Label>
            <Input
              type="email"
              value={email || defaultEmail}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="klient@firma.cz"
            />
          </div>

          {/* Subject */}
          <div className="grid gap-2">
            <Label>Předmět</Label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Předmět emailu"
            />
          </div>

          {/* Body */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Obsah emailu</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                {showPreview ? 'Upravit' : 'Náhled'}
              </Button>
            </div>
            {showPreview ? (
              <div className="rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap min-h-[200px]">
                {emailBody}
              </div>
            ) : (
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={10}
                className="text-sm font-mono"
                placeholder="Obsah emailu..."
              />
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleSendEmail} className="flex-1">
              <Mail className="h-4 w-4 mr-2" /> Odeslat email
            </Button>
            <Button variant="outline" onClick={handleCopyLink}>
              {linkCopied ? (
                <><CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> Zkopírováno</>
              ) : (
                <><Copy className="h-4 w-4 mr-2" /> Zkopírovat odkaz</>
              )}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                const token = getOrCreateToken();
                const targetEmail = email || defaultEmail;
                saveApproval({
                  extraWorkId: extraWork.id,
                  token,
                  email: targetEmail || null,
                  createdAt: new Date().toISOString(),
                });
                storeExtraWorkForApproval(extraWork, {
                  clientName: clientName,
                  engagementName: engagement?.name,
                  colleagueName: colleague?.full_name,
                  colleagueEmail: colleague?.email,
                  colleagueId: colleague?.id,
                });
                toast({ title: '✅ Označeno jako odeslané', description: 'Vícepráce byla označena jako čekající na schválení.' });
                onOpenChange(false);
              }}
            >
              <ClipboardCheck className="h-4 w-4 mr-2" /> Označit jako odeslané
            </Button>
            <p className="text-xs text-muted-foreground">
              Použijte, pokud jste odkaz poslali ručně (např. přes Freelo). Zaznamená se odeslání bez skutečného emailu.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Demo režim – email se neodesílá, data jsou v localStorage.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zavřít</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// localStorage helper for storing extra work data for the public approval page
const EXTRA_WORKS_CACHE_KEY = 'extra_work_approval_data';

export interface ExtraWorkApprovalData {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  hours_worked: number | null;
  hourly_rate: number | null;
  status: string;
  clientName?: string;
  engagementName?: string;
  colleagueName?: string;
  colleagueEmail?: string;
  colleagueId?: string;
}

export function storeExtraWorkForApproval(work: ExtraWork, meta: { clientName?: string; engagementName?: string; colleagueName?: string; colleagueEmail?: string; colleagueId?: string }) {
  const stored = getStoredExtraWorks();
  const data: ExtraWorkApprovalData = {
    id: work.id,
    name: work.name,
    description: work.description,
    amount: work.amount,
    currency: work.currency,
    hours_worked: work.hours_worked,
    hourly_rate: work.hourly_rate,
    status: work.status,
    ...meta,
  };
  const idx = stored.findIndex(s => s.id === data.id);
  if (idx >= 0) stored[idx] = data;
  else stored.push(data);
  localStorage.setItem(EXTRA_WORKS_CACHE_KEY, JSON.stringify(stored));
}

export function getStoredExtraWorks(): ExtraWorkApprovalData[] {
  try {
    return JSON.parse(localStorage.getItem(EXTRA_WORKS_CACHE_KEY) || '[]');
  } catch { return []; }
}

export function updateStoredExtraWorkStatus(id: string, status: string) {
  const stored = getStoredExtraWorks();
  const idx = stored.findIndex(s => s.id === id);
  if (idx >= 0) {
    stored[idx].status = status;
    localStorage.setItem(EXTRA_WORKS_CACHE_KEY, JSON.stringify(stored));
  }
}
