import { useState } from 'react';
import { Send, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface RequestAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  contactEmail: string | null;
  companyName: string;
  leadId: string;
  onSent?: (platforms: string[]) => void;
}

const PLATFORMS = [
  { id: 'meta_ads', label: 'Meta Ads' },
  { id: 'google_ads', label: 'Google Ads' },
  { id: 'sklik', label: 'S-klik' },
] as const;

export function RequestAccessDialog({
  open,
  onOpenChange,
  contactName,
  contactEmail,
  companyName,
  leadId,
  onSent,
}: RequestAccessDialogProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const getDefaultSubject = () => {
    return `Žádost o nasdílení přístupů - ${companyName} / Socials`;
  };

  const [emailSubject, setEmailSubject] = useState(getDefaultSubject());
  const [emailContent, setEmailContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Generate default email when dialog opens or platforms change
  const generateDefaultEmail = (platforms: string[]) => {
    const platformNames = platforms
      .map(id => PLATFORMS.find(p => p.id === id)?.label)
      .filter(Boolean)
      .join(', ');

    return `Dobrý den ${contactName},

rádi bychom Vás požádali o nasdílení přístupů k následujícím reklamním účtům:

${platformNames || '[vyberte platformy]'}

Přístupy prosím nasdílejte na email: ads@socials.cz

Pro Meta Ads: Přidejte nás jako partnera s přístupem k reklamnímu účtu.
Pro Google Ads: Přidejte email jako uživatele s oprávněním "Správce".
Pro S-klik: Přidejte email jako uživatele s rolí "Administrátor".

Děkujeme za spolupráci.

S pozdravem,
Tým Socials`;
  };

  const handlePlatformToggle = (platformId: string) => {
    const newSelection = selectedPlatforms.includes(platformId)
      ? selectedPlatforms.filter(id => id !== platformId)
      : [...selectedPlatforms, platformId];
    
    setSelectedPlatforms(newSelection);
    setEmailContent(generateDefaultEmail(newSelection));
  };

  const handleSend = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Vyberte alespoň jednu platformu');
      return;
    }

    if (!contactEmail) {
      toast.error('Kontakt nemá vyplněný email');
      return;
    }

    setIsSending(true);
    
    // Mock sending - will be replaced with actual Edge Function
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Notify parent about sent platforms
    const platformLabels = selectedPlatforms
      .map(id => PLATFORMS.find(p => p.id === id)?.label)
      .filter(Boolean) as string[];
    onSent?.(platformLabels);
    
    setIsSending(false);
    toast.success('Žádost o přístupy byla odeslána');
    onOpenChange(false);
    
    // Reset state
    setSelectedPlatforms([]);
    setEmailContent('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset when opening
      setSelectedPlatforms([]);
      setEmailSubject(getDefaultSubject());
      setEmailContent(generateDefaultEmail([]));
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>📧 Žádost o nasdílení přístupů</DialogTitle>
          <DialogDescription>
            Vyberte platformy a upravte znění emailu před odesláním.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Platformy</Label>
            <div className="flex flex-wrap gap-4">
              {PLATFORMS.map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.id}
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => handlePlatformToggle(platform.id)}
                  />
                  <Label
                    htmlFor={platform.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {platform.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Recipient Info */}
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Příjemce:</span>
              <span className="font-medium">{contactName}</span>
              {contactEmail && (
                <span className="text-muted-foreground">({contactEmail})</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground">Společnost:</span>
              <span className="font-medium">{companyName}</span>
            </div>
          </div>

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
              rows={10}
              className="font-mono text-sm"
              placeholder="Vyberte platformy pro vygenerování emailu..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || selectedPlatforms.length === 0 || !contactEmail}
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
