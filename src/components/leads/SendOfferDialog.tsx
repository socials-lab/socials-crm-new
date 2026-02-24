import { useState, useEffect } from 'react';
import { Send, User, Mail, Building2, ExternalLink } from 'lucide-react';
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
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { EmailCcBccFields } from '@/components/shared/EmailCcBccFields';
import type { Lead, Colleague } from '@/types/crm';

interface SendOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSent?: (ownerId: string, emailData: { subject: string; body: string; recipients: string[] }) => void;
}

export function SendOfferDialog({
  open,
  onOpenChange,
  lead,
  onSent,
}: SendOfferDialogProps) {
  const { colleagues } = useCRMData();
  const { fillTemplate } = useEmailTemplates();
  const [selectedOwnerId, setSelectedOwnerId] = useState(lead.owner_id);
  const cleanWebsite = (website: string | null) => {
    if (!website) return '';
    return website
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  };

  const getDefaultSubject = () => {
    const domain = lead.website ? cleanWebsite(lead.website) : lead.company_name;
    return fillTemplate('send_offer', { domain, company: lead.company_name, contact_name: lead.contact_name }).subject;
  };

  const [emailSubject, setEmailSubject] = useState(getDefaultSubject());
  const [emailContent, setEmailContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);

  const selectedOwner = colleagues.find(c => c.id === selectedOwnerId);
  const activeColleagues = colleagues.filter(c => c.status === 'active');

  // Generate email content when owner changes
  useEffect(() => {
    if (!selectedOwner) return;
    
    const servicesText = lead.potential_services && lead.potential_services.length > 0
      ? lead.potential_services.map(s => {
          const tierText = s.selected_tier ? ` (${s.selected_tier.toUpperCase()})` : '';
          const billingText = s.billing_type === 'monthly' ? '/měs' : ' jednorázově';
          return `  • ${s.name}${tierText}: ${s.price.toLocaleString()} ${s.currency}${billingText}`;
        }).join('\n')
      : '  (žádné služby v nabídce)';

    const hasServices = lead.potential_services && lead.potential_services.length > 0;
    const totalPrice = hasServices
      ? lead.potential_services.reduce((sum, s) => sum + s.price, 0)
      : 0;

    const priceText = hasServices
      ? `Celková cena: ${totalPrice.toLocaleString()} ${lead.currency}${lead.offer_type === 'retainer' ? '/měs' : ''}`
      : 'Cena bude stanovena na základě detailní nabídky.';

    const domain = lead.website ? cleanWebsite(lead.website) : lead.company_name;

    const { body } = fillTemplate('send_offer', {
      contact_name: lead.contact_name,
      company: lead.company_name,
      domain,
      services_list: servicesText,
      price_summary: priceText,
      offer_url_line: lead.offer_url ? `Detailní nabídku naleznete zde: ${lead.offer_url}` : '',
      sender_name: selectedOwner.full_name,
      sender_position: selectedOwner.position,
      sender_email: selectedOwner.email,
      sender_phone: selectedOwner.phone || '',
    });

    setEmailContent(body);
  }, [selectedOwner, lead]);

  const handleSend = async () => {
    if (!lead.contact_email) {
      toast.error('Kontakt nemá vyplněný email');
      return;
    }

    if (!selectedOwner) {
      toast.error('Vyberte odpovědnou osobu');
      return;
    }

    setIsSending(true);
    
    // Mock sending - will be replaced with actual Edge Function
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onSent?.(selectedOwnerId, {
      subject: emailSubject,
      body: emailContent,
      recipients: lead.contact_email ? [lead.contact_email] : [],
    });
    
    setIsSending(false);
    toast.success('📤 Nabídka byla odeslána!');
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedOwnerId(lead.owner_id);
      setEmailSubject(getDefaultSubject());
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>📤 Odeslat nabídku</DialogTitle>
          <DialogDescription>
            Nabídka bude odeslána kontaktní osobě. Vyberte, kdo ji odesílá.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sender Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Odesílatel (odpovědná osoba)</Label>
            <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte osobu" />
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

          {/* Sender Info Card */}
          {selectedOwner && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">{selectedOwner.full_name}</span>
                <span className="text-muted-foreground">– {selectedOwner.position}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{selectedOwner.email}</span>
              </div>
              {selectedOwner.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="ml-6">{selectedOwner.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Recipient Info */}
          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{lead.company_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{lead.contact_name}</span>
              {lead.contact_email && (
                <span className="text-muted-foreground">({lead.contact_email})</span>
              )}
            </div>
            {lead.offer_url && (
              <a 
                href={lead.offer_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Nabídka v Notion</span>
              </a>
            )}
          </div>

          {/* CC / BCC */}
          <EmailCcBccFields cc={cc} onCcChange={setCc} bcc={bcc} onBccChange={setBcc} />

          {/* Email Subject */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Předmět emailu</Label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Předmět emailu..."
            />
          </div>

          {/* Email Content */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Obsah emailu</Label>
            <Textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !lead.contact_email || !selectedOwner}
          >
            {isSending ? (
              <>
                <Send className="h-4 w-4 mr-2 animate-pulse" />
                Odesílám...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Odeslat nabídku
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
