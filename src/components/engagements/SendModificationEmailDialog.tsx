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
import { useAuth } from '@/hooks/useAuth';
import { recordEmailSent, type StoredModificationRequest } from '@/data/modificationRequestsMockData';
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
  const { user } = useAuth();
  
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Get sender from logged-in user's colleague record
  const currentUserColleague = colleagues.find(c => c.profile_id === user?.id);
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
      
      // Set default subject
      const subjectPrefix = REQUEST_TYPE_SUBJECTS[request.request_type] || 'Návrh změny';
      setEmailSubject(`${subjectPrefix} – ${clientName} / Socials`);
    }
  }, [open, request]);

  // Generate email content when dialog opens or sender info available
  useEffect(() => {
    if (!currentUserColleague || !open) return;
    
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
${currentUserColleague.full_name}
${currentUserColleague.position}
${currentUserColleague.email}${currentUserColleague.phone ? `\n${currentUserColleague.phone}` : ''}`);
  }, [currentUserColleague, open, request, upgradeLink]);

  const handleSend = async () => {
    if (!recipientEmail.trim()) {
      toast.error('Zadejte email příjemce');
      return;
    }

    if (!currentUserColleague) {
      toast.error('Nepodařilo se načíst informace o odesílateli');
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
    
    // Record the email in history
    recordEmailSent(
      request.id,
      recipientEmail,
      currentUserColleague.id,
      currentUserColleague.full_name
    );
    
    // Log email action for debugging
    console.log('📧 Email sent:', {
      to: recipientEmail,
      subject: emailSubject,
      sender: currentUserColleague.full_name,
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

          {/* Sender Info Card - Current user */}
          {currentUserColleague && (
            <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">{currentUserColleague.full_name}</span>
                <span className="text-muted-foreground text-xs">– {currentUserColleague.position}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="text-xs">{currentUserColleague.email}</span>
              </div>
              {currentUserColleague.phone && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="text-xs">{currentUserColleague.phone}</span>
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
            disabled={isSending || !recipientEmail || !currentUserColleague}
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
