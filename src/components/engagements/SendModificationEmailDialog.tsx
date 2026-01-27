import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Send, User, Mail, Building2, Link2, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useCRMData } from '@/hooks/useCRMData';
import type { StoredModificationRequest } from '@/data/modificationRequestsMockData';
import type {
  AddServiceProposedChanges,
  UpdateServicePriceProposedChanges,
  DeactivateServiceProposedChanges,
} from '@/types/crm';

interface SendModificationEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: StoredModificationRequest;
  upgradeLink: string;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  add_service: 'Přidání nové služby',
  update_service_price: 'Změna ceny služby',
  deactivate_service: 'Ukončení služby',
};

const REQUEST_TYPE_SUBJECTS: Record<string, string> = {
  add_service: 'Návrh nové služby',
  update_service_price: 'Návrh změny ceny',
  deactivate_service: 'Ukončení služby',
};

export function SendModificationEmailDialog({
  open,
  onOpenChange,
  request,
  upgradeLink,
}: SendModificationEmailDialogProps) {
  const { colleagues, clients, clientContacts } = useCRMData();
  
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedSenderId, setSelectedSenderId] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const activeColleagues = colleagues.filter(c => c.status === 'active');
  const selectedSender = colleagues.find(c => c.id === selectedSenderId);
  const client = clients.find(c => c.id === request.client_id);
  const clientName = request.client_brand_name || request.client_name;

  // Find the best email for the client
  const findDefaultEmail = (): string => {
    // 1. Check client contacts for this client - prefer decision maker
    const contacts = clientContacts.filter(c => c.client_id === request.client_id);
    const decisionMaker = contacts.find(c => c.is_decision_maker && c.email);
    if (decisionMaker?.email) return decisionMaker.email;
    
    // 2. Primary contact
    const primaryContact = contacts.find(c => c.is_primary && c.email);
    if (primaryContact?.email) return primaryContact.email;
    
    // 3. Any contact with email
    const anyContact = contacts.find(c => c.email);
    if (anyContact?.email) return anyContact.email;
    
    // 4. Client billing email
    if (client?.billing_email) return client.billing_email;
    
    // 5. Client main contact email (legacy)
    if (client?.main_contact_email) return client.main_contact_email;
    
    return '';
  };

  // Get contact name for greeting
  const getContactName = (): string => {
    const contacts = clientContacts.filter(c => c.client_id === request.client_id);
    const decisionMaker = contacts.find(c => c.is_decision_maker);
    if (decisionMaker) return decisionMaker.name;
    
    const primaryContact = contacts.find(c => c.is_primary);
    if (primaryContact) return primaryContact.name;
    
    if (client?.main_contact_name) return client.main_contact_name;
    
    return '';
  };

  // Generate change details text
  const getChangeDetails = (): string => {
    switch (request.request_type) {
      case 'add_service': {
        const c = request.proposed_changes as AddServiceProposedChanges;
        const billingText = c.billing_type === 'monthly' ? '/měs' : ' (jednorázově)';
        return `Služba: ${c.name}\nCena: ${c.price.toLocaleString('cs-CZ')} ${c.currency}${billingText}`;
      }
      case 'update_service_price': {
        const c = request.proposed_changes as UpdateServicePriceProposedChanges;
        return `Služba: ${c.service_name}\nAktuální cena: ${c.old_price.toLocaleString('cs-CZ')} ${c.currency}\nNová cena: ${c.new_price.toLocaleString('cs-CZ')} ${c.currency}`;
      }
      case 'deactivate_service': {
        const c = request.proposed_changes as DeactivateServiceProposedChanges;
        return `Služba: ${c.service_name}`;
      }
      default:
        return '';
    }
  };

  // Initialize form when dialog opens
  useEffect(() => {
    if (open) {
      // Set default email
      setRecipientEmail(findDefaultEmail());
      
      // Set default sender (first active colleague or upsold_by)
      const defaultSender = request.upsold_by_id && activeColleagues.find(c => c.id === request.upsold_by_id)
        ? request.upsold_by_id
        : activeColleagues[0]?.id || '';
      setSelectedSenderId(defaultSender);
      
      // Set default subject
      const subjectPrefix = REQUEST_TYPE_SUBJECTS[request.request_type] || 'Návrh změny';
      setEmailSubject(`${subjectPrefix} – ${clientName} / Socials`);
    }
  }, [open, request]);

  // Generate email content when sender changes
  useEffect(() => {
    if (!selectedSender || !open) return;
    
    const contactName = getContactName();
    const greeting = contactName ? `Dobrý den, ${contactName},` : 'Dobrý den,';
    const changeTypeLabel = REQUEST_TYPE_LABELS[request.request_type] || 'Změna služby';
    const changeDetails = getChangeDetails();
    const effectiveFrom = request.effective_from 
      ? format(new Date(request.effective_from), 'd. MMMM yyyy', { locale: cs })
      : 'po potvrzení';
    const validUntil = request.upgrade_offer_valid_until
      ? format(new Date(request.upgrade_offer_valid_until), 'd. MMMM yyyy', { locale: cs })
      : '14 dní';

    setEmailContent(`${greeting}

rádi bychom Vás informovali o navrhované změně ve spolupráci:

${changeTypeLabel}
${changeDetails}

Platnost od: ${effectiveFrom}

Pro potvrzení této změny prosím klikněte na následující odkaz:
${upgradeLink}

Odkaz je platný do: ${validUntil}

V případě dotazů nás neváhejte kontaktovat.

S pozdravem,
${selectedSender.full_name}
${selectedSender.position}
${selectedSender.email}${selectedSender.phone ? `\n${selectedSender.phone}` : ''}`);
  }, [selectedSender, open, request, upgradeLink]);

  const handleSend = async () => {
    if (!recipientEmail.trim()) {
      toast.error('Zadejte email příjemce');
      return;
    }

    if (!selectedSender) {
      toast.error('Vyberte odesílatele');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error('Zadejte platný email');
      return;
    }

    setIsSending(true);
    
    // Mock sending - will be replaced with actual Edge Function
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Log email action for debugging
    console.log('📧 Email sent:', {
      to: recipientEmail,
      subject: emailSubject,
      sender: selectedSender.full_name,
      requestId: request.id,
    });
    
    setIsSending(false);
    toast.success(`📧 Email odeslán na ${recipientEmail}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Odeslat návrh změny klientovi
          </DialogTitle>
          <DialogDescription>
            Návrh bude odeslán na zadaný email. Klient může změnu potvrdit kliknutím na odkaz.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Client Info */}
          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{clientName}</span>
            </div>
            <div className="text-muted-foreground text-xs">
              {request.engagement_name}
            </div>
          </div>

          {/* Row: Recipient + Sender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recipient Email */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email příjemce</Label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="email@spolecnost.cz"
              />
            </div>

            {/* Sender Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Odesílatel</Label>
              <Select value={selectedSenderId} onValueChange={setSelectedSenderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte odesílatele" />
                </SelectTrigger>
                <SelectContent>
                  {activeColleagues.map((colleague) => (
                    <SelectItem key={colleague.id} value={colleague.id}>
                      <div className="flex items-center gap-2">
                        <span>{colleague.full_name}</span>
                        <span className="text-muted-foreground text-xs">({colleague.position})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sender Info Card - Compact inline */}
          {selectedSender && (
            <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">{selectedSender.full_name}</span>
                <span className="text-muted-foreground text-xs">– {selectedSender.position}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="text-xs">{selectedSender.email}</span>
              </div>
              {selectedSender.phone && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="text-xs">{selectedSender.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Upgrade Link Preview - Compact */}
          <div className="p-1.5 rounded bg-muted/30 text-xs flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate text-muted-foreground">{upgradeLink}</span>
          </div>

          {/* Email Subject */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Předmět emailu</Label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Předmět emailu..."
            />
          </div>

          {/* Email Content - Takes remaining space */}
          <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
            <Label className="text-sm font-medium">Obsah emailu</Label>
            <Textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              className="font-mono text-sm flex-1 min-h-[200px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !recipientEmail || !selectedSender}
          >
            {isSending ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-pulse" />
                Odesílám...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Odeslat email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
