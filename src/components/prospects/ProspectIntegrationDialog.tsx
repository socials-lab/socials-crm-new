import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check, Globe, FlaskConical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

if (!SUPABASE_URL) {
  throw new Error('Missing Supabase environment variable VITE_SUPABASE_URL for prospect integration.');
}

const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/prospect-crm-sync`;
const WEBHOOK_SECRET_PLACEHOLDER = 'YOUR_PROSPECT_SYNC_WEBHOOK_SECRET';

type ExternalEventType =
  | 'webinar_registration'
  | 'webinar_attended'
  | 'lead_magnet_registration'
  | 'lead_magnet_download'
  | 'satisfaction_survey_submitted'
  | 'custom';

const EVENT_TYPE_LABELS: Record<ExternalEventType, string> = {
  webinar_registration: 'Registrace na webinář',
  webinar_attended: 'Účast na webináři',
  lead_magnet_registration: 'Registrace na lead magnet',
  lead_magnet_download: 'Stažení lead magnetu',
  satisfaction_survey_submitted: 'Vyplněný dotazník spokojenosti',
  custom: 'Vlastní událost',
};
const EVENT_TYPE_OPTIONS: Array<{ value: ExternalEventType; label: string }> = [
  { value: 'webinar_registration', label: EVENT_TYPE_LABELS.webinar_registration },
  { value: 'webinar_attended', label: EVENT_TYPE_LABELS.webinar_attended },
  { value: 'lead_magnet_registration', label: EVENT_TYPE_LABELS.lead_magnet_registration },
  { value: 'lead_magnet_download', label: EVENT_TYPE_LABELS.lead_magnet_download },
  { value: 'satisfaction_survey_submitted', label: EVENT_TYPE_LABELS.satisfaction_survey_submitted },
  { value: 'custom', label: EVENT_TYPE_LABELS.custom },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Zkopírováno');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Zkopírováno' : 'Kopírovat'}
    </Button>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <CopyButton text={code} />
      </div>}
      <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono">
        {code}
      </pre>
      {!label && <div className="flex justify-end"><CopyButton text={code} /></div>}
    </div>
  );
}

export function ProspectIntegrationDialog({ open, onOpenChange }: Props) {
  const [eventType, setEventType] = useState<ExternalEventType>('webinar_registration');
  const [eventTitle, setEventTitle] = useState('');
  const [testSecret, setTestSecret] = useState('');

  // Test tab state
  const [testName, setTestName] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);

  const titlePlaceholder = eventType === 'webinar_registration' || eventType === 'webinar_attended'
    ? 'Např. Webinář: Facebook Ads 2026'
    : eventType === 'lead_magnet_registration' || eventType === 'lead_magnet_download'
      ? 'Např. E-book: 10 tipů pro PPC'
      : eventType === 'satisfaction_survey_submitted'
        ? 'Např. Dotazník Q2 2026'
      : 'Název aktivity';

  const curlSnippet = `curl -X POST '${WEBHOOK_URL}' \\
  -H 'Content-Type: application/json' \\
  -H 'x-webhook-secret: ${WEBHOOK_SECRET_PLACEHOLDER}' \\
  -d '{
    "name": "Jan Novák",
    "email": "jan@firma.cz",
    "phone": "+420123456789",
    "company": "Firma s.r.o.",
    "event_type": "${eventType}",
    "event_title": "${eventTitle || titlePlaceholder}",
    "source_system": "webinar-platform",
    "external_contact_id": "ext-123",
    "metadata": { "campaign": "spring-2026" }
  }'`;

  const fetchSnippet = `const response = await fetch('${WEBHOOK_URL}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': '${WEBHOOK_SECRET_PLACEHOLDER}'
  },
  body: JSON.stringify({
    name: 'Jan Novák',
    email: 'jan@firma.cz',
    phone: '+420123456789',
    company: 'Firma s.r.o.',
    event_type: '${eventType}',
    event_title: '${eventTitle || titlePlaceholder}',
    source_system: 'webinar-platform',
    external_contact_id: 'ext-123',
    metadata: { campaign: 'spring-2026' }
  })
});

const data = await response.json();
console.log(data);`;

  const payloadExample = JSON.stringify({
    name: 'Jan Novák',
    email: 'jan@firma.cz',
    phone: '+420123456789',
    company: 'Firma s.r.o.',
    event_type: eventType,
    event_title: eventTitle || titlePlaceholder,
    source_system: 'landing-page',
    external_contact_id: 'ext-123',
    metadata: { source: 'landing-page' }
  }, null, 2);

  const handleTest = async () => {
    if (!testName || !testEmail || !eventTitle || !testSecret) {
      toast.error('Vyplňte jméno, e-mail, název události a webhook secret');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': testSecret
        },
        body: JSON.stringify({
          name: testName,
          email: testEmail,
          event_type: eventType,
          event_title: eventTitle,
          source_system: 'manual-test',
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Testovací zájemce byl úspěšně vytvořen!');
        setTestName('');
        setTestEmail('');
      } else {
        toast.error(`Chyba: ${data.error || 'Neznámá chyba'}`);
      }
    } catch {
      toast.error('Chyba připojení k webhooku');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Napojení landing pages (univerzální webhook)</DialogTitle>
          <DialogDescription>
            Jeden endpoint pro registraci i aktualizaci kontaktu podle e-mailu. Funguje pro webináře, lead magnety i dotazníky.
          </DialogDescription>
        </DialogHeader>

        {/* Source config — always visible */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium">Konfigurace události</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Typ události</Label>
              <Select value={eventType} onValueChange={v => setEventType(v as ExternalEventType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[200]">
                  {EVENT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Název události *</Label>
              <Input
                value={eventTitle}
                onChange={e => setEventTitle(e.target.value)}
                placeholder={titlePlaceholder}
              />
            </div>
          </div>
          {!eventTitle && (
            <p className="text-xs text-amber-600 dark:text-amber-400">⚠ Vyplňte název události pro vygenerování kódu</p>
          )}
          <Textarea
            readOnly
            className="text-xs bg-background"
            value={`Upsert chování:\n- pokud e-mail existuje => aktualizuje se existující zájemce\n- pokud e-mail neexistuje => vytvoří se nový zájemce\n- vždy se přidá nová interakce do historie`}
          />
        </div>

        <Tabs defaultValue="api" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Webhook API
            </TabsTrigger>
            <TabsTrigger value="test" className="gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" />
              Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Webhook URL a příklady pro vlastní napojení. Zkopírujte a předejte AI pro napojení formuláře.
            </p>

            <CodeBlock code={WEBHOOK_URL} label="Webhook URL" />
            <CodeBlock code={`x-webhook-secret: ${WEBHOOK_SECRET_PLACEHOLDER}`} label="Authorization header" />
            <CodeBlock code={payloadExample} label="JSON payload" />
            <CodeBlock code={curlSnippet} label="cURL příklad" />
            <CodeBlock code={fetchSnippet} label="JavaScript fetch příklad" />
          </TabsContent>

          <TabsContent value="test" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Odešlete testovací data a ověřte, že napojení funguje.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Jméno *</Label>
                <Input value={testName} onChange={e => setTestName(e.target.value)} placeholder="Jan Novák" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">E-mail *</Label>
                <Input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="jan@firma.cz" type="email" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Webhook secret *</Label>
              <Input
                value={testSecret}
                onChange={e => setTestSecret(e.target.value)}
                type="password"
                placeholder="PROSPECT_SYNC_WEBHOOK_SECRET"
              />
            </div>

            <Button onClick={handleTest} disabled={testing || !eventTitle || !testSecret} className="w-full">
              {testing && <Loader2 className="h-4 w-4 animate-spin" />}
              {testing ? 'Odesílám...' : 'Odeslat testovací data'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
