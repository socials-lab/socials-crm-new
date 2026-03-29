import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Send, PhoneCall, Plus, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { useMeetingScheduleUrl } from '@/hooks/useMeetingScheduleUrl';
import { EmailCcBccFields } from '@/components/shared/EmailCcBccFields';
import type { Applicant } from '@/types/applicant';

interface SendInterviewInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant;
  onSend: (emailData: { subject: string; message: string; recipients: string[] }) => void;
}

const DEFAULT_BCC = ['danny@socials.cz', 'dana.bauerova@socials.cz'];

export function SendInterviewInviteDialog({ 
  open, 
  onOpenChange, 
  applicant,
  onSend 
}: SendInterviewInviteDialogProps) {
  const { user } = useAuth();
  const { fillTemplate } = useEmailTemplates();
  const { meetingUrl } = useMeetingScheduleUrl();
  const senderName = [user?.user_metadata?.first_name, user?.user_metadata?.last_name].filter(Boolean).join(' ') || 'Socials';

  const getDefaults = () => {
    const urlValue = meetingUrl || '[DOPLŇTE ODKAZ NA SJEDNÁNÍ SCHŮZKY]';
    return fillTemplate('interview_invite', {
      name: applicant.full_name.split(' ')[0],
      position: applicant.position,
      sender: senderName,
      meeting_url: urlValue,
    });
  };

  const [toEmails, setToEmails] = useState<string[]>([]);
  const [newToEmail, setNewToEmail] = useState('');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>(DEFAULT_BCC);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (open && !initialized && fillTemplate) {
    const defaults = getDefaults();
    setToEmails(applicant.email ? [applicant.email] : []);
    setNewToEmail('');
    setCcEmails([]);
    setBccEmails(DEFAULT_BCC);
    setEmailSubject(defaults.subject);
    setEmailContent(defaults.body);
    setInitialized(true);
  }

  const addEmail = (
    email: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void
  ) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Neplatný email');
      return;
    }
    if (list.includes(trimmed)) {
      toast.error('Email už je v seznamu');
      return;
    }
    setList([...list, trimmed]);
    setInput('');
  };

  const removeEmail = (email: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter(e => e !== email));
  };

  const handleSend = async () => {
    if (toEmails.length === 0) {
      toast.error('Zadejte alespoň jednoho příjemce');
      return;
    }
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onSend({ subject: emailSubject, message: emailContent, recipients: toEmails });
    setIsSending(false);
    toast.success('Pozvánka na pohovor byla odeslána');
    onOpenChange(false);
  };

  const handleMarkAsSent = () => {
    onSend({ subject: emailSubject, message: emailContent, recipients: toEmails });
    toast.success('Pozvánka na pohovor byla označena jako odeslaná');
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      const defaults = getDefaults();
      setToEmails(applicant.email ? [applicant.email] : []);
      setNewToEmail('');
      setCcEmails([]);
      setBccEmails(DEFAULT_BCC);
      setEmailSubject(defaults.subject);
      setEmailContent(defaults.body);
      setInitialized(true);
    } else {
      setInitialized(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5" />
            Pozvánka na pohovor
          </DialogTitle>
          <DialogDescription>
            Odešlete kandidátovi pozvánku na pohovor s odkazem na sjednání schůzky.
            {!meetingUrl && (
              <span className="block text-amber-600 mt-1">
                ⚠️ Nemáte nastavenou URL pro sjednání schůzky. Nastavte ji v Nastavení → Profil.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* To */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Komu</Label>
            <div className="space-y-2">
              {toEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {toEmails.map(email => (
                    <Badge key={email} variant="secondary" className="gap-1 pr-1 font-normal">
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email, toEmails, setToEmails)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newToEmail}
                  onChange={(e) => setNewToEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(newToEmail, toEmails, setToEmails, setNewToEmail); } }}
                  placeholder="Přidat příjemce..."
                  className="text-sm"
                />
                <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => addEmail(newToEmail, toEmails, setToEmails, setNewToEmail)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* CC / BCC */}
          <EmailCcBccFields
            cc={ccEmails}
            onCcChange={setCcEmails}
            bcc={bccEmails}
            onBccChange={setBccEmails}
            defaultExpanded={true}
          />

          {/* Subject */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Předmět emailu</Label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Předmět emailu..."
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Obsah emailu</Label>
            <Textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              rows={12}
              className="font-mono text-sm leading-relaxed"
              placeholder="Text emailu..."
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            variant="secondary"
            onClick={handleMarkAsSent}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Označit jako odeslané
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || toEmails.length === 0}
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
