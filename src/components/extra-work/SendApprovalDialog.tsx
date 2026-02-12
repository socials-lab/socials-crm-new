import { useState, useMemo } from 'react';
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
import { useCRMData } from '@/hooks/useCRMData';
import { useToast } from '@/hooks/use-toast';
import type { ExtraWork } from '@/types/crm';
import { Copy, Mail, CheckCircle2 } from 'lucide-react';

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
  const { getClientById, clientContacts } = useCRMData();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const client = useMemo(() => getClientById(extraWork.client_id), [extraWork.client_id, getClientById]);

  const defaultEmail = useMemo(() => {
    const contacts = clientContacts.filter(c => c.client_id === extraWork.client_id);
    const primary = contacts.find(c => c.is_primary);
    return primary?.email || contacts[0]?.email || client?.main_contact_email || '';
  }, [extraWork.client_id, clientContacts, client]);

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

    const token = getOrCreateToken();
    saveApproval({
      extraWorkId: extraWork.id,
      token,
      email: targetEmail,
      createdAt: new Date().toISOString(),
    });

    // Store extra work data for the public approval page
    storeExtraWorkForApproval(extraWork);

    toast({ title: '📧 Email "odeslán"', description: `Demo: schvalovací email pro ${targetEmail}. Použijte odkaz pro simulaci.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Odeslat ke schválení</DialogTitle>
          <DialogDescription>
            Pošlete klientovi odkaz pro schválení vícepráce "{extraWork.name}".
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Email klienta</Label>
            <Input
              type="email"
              value={email || defaultEmail}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="klient@firma.cz"
            />
          </div>

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

interface ExtraWorkApprovalData {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  hours_worked: number | null;
  hourly_rate: number | null;
  status: string;
}

function storeExtraWorkForApproval(work: ExtraWork) {
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
