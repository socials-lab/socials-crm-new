import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Code, Globe, FlaskConical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { INTERACTION_TYPE_LABELS } from '@/types/prospect';
import type { ProspectInteractionType } from '@/types/prospect';

const WEBHOOK_URL = 'https://empndmpeyrdycjdesoxr.supabase.co/functions/v1/prospect-webhook';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcG5kbXBleXJkeWNqZGVzb3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTQ5NTUsImV4cCI6MjA4MTE3MDk1NX0.X3I3FU2QRZD16rLwePdC3C2r7UIlGQuvJ6wWZnzgGEQ';

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
  const [interactionType, setInteractionType] = useState<ProspectInteractionType>('webinar_registration');
  const [interactionTitle, setInteractionTitle] = useState('');

  // Test tab state
  const [testName, setTestName] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);

  const titlePlaceholder = interactionType === 'webinar_registration' || interactionType === 'webinar_attended'
    ? 'Např. Webinář: Facebook Ads 2026'
    : interactionType === 'lead_magnet_download'
      ? 'Např. E-book: 10 tipů pro PPC'
      : 'Název aktivity';

  const htmlSnippet = `<!-- Socials CRM — Formulář pro zájemce -->
<form id="prospect-form" style="max-width:400px;font-family:sans-serif;">
  <div style="margin-bottom:12px;">
    <label for="pf-name" style="display:block;margin-bottom:4px;font-size:14px;">Jméno *</label>
    <input id="pf-name" name="name" required
      style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;" />
  </div>
  <div style="margin-bottom:12px;">
    <label for="pf-email" style="display:block;margin-bottom:4px;font-size:14px;">E-mail *</label>
    <input id="pf-email" name="email" type="email" required
      style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;" />
  </div>
  <div style="margin-bottom:12px;">
    <label for="pf-phone" style="display:block;margin-bottom:4px;font-size:14px;">Telefon</label>
    <input id="pf-phone" name="phone" type="tel"
      style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;" />
  </div>
  <div style="margin-bottom:12px;">
    <label for="pf-company" style="display:block;margin-bottom:4px;font-size:14px;">Firma</label>
    <input id="pf-company" name="company"
      style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;" />
  </div>
  <button type="submit"
    style="background:#000;color:#fff;padding:10px 24px;border:none;border-radius:4px;cursor:pointer;font-size:14px;">
    Odeslat
  </button>
  <p id="pf-msg" style="margin-top:8px;font-size:13px;"></p>
</form>

<script>
document.getElementById('prospect-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const msg = document.getElementById('pf-msg');
  msg.textContent = 'Odesílám...';
  try {
    const res = await fetch('${WEBHOOK_URL}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${ANON_KEY}'
      },
      body: JSON.stringify({
        name: document.getElementById('pf-name').value,
        email: document.getElementById('pf-email').value,
        phone: document.getElementById('pf-phone').value || null,
        company: document.getElementById('pf-company').value || null,
        interaction_type: '${interactionType}',
        interaction_title: '${interactionTitle || titlePlaceholder}'
      })
    });
    if (res.ok) {
      msg.textContent = 'Děkujeme za registraci!';
      msg.style.color = 'green';
      e.target.reset();
    } else {
      msg.textContent = 'Chyba při odesílání.';
      msg.style.color = 'red';
    }
  } catch {
    msg.textContent = 'Chyba sítě.';
    msg.style.color = 'red';
  }
});
</script>`;

  const curlSnippet = `curl -X POST '${WEBHOOK_URL}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer ${ANON_KEY}' \\
  -d '{
    "name": "Jan Novák",
    "email": "jan@firma.cz",
    "phone": "+420123456789",
    "company": "Firma s.r.o.",
    "interaction_type": "${interactionType}",
    "interaction_title": "${interactionTitle || titlePlaceholder}"
  }'`;

  const fetchSnippet = `const response = await fetch('${WEBHOOK_URL}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${ANON_KEY}'
  },
  body: JSON.stringify({
    name: 'Jan Novák',
    email: 'jan@firma.cz',
    phone: '+420123456789',
    company: 'Firma s.r.o.',
    interaction_type: '${interactionType}',
    interaction_title: '${interactionTitle || titlePlaceholder}'
  })
});

const data = await response.json();
console.log(data);`;

  const payloadExample = JSON.stringify({
    name: 'Jan Novák',
    email: 'jan@firma.cz',
    phone: '+420123456789',
    company: 'Firma s.r.o.',
    interaction_type: interactionType,
    interaction_title: interactionTitle || titlePlaceholder,
    metadata: { source: 'landing-page' }
  }, null, 2);

  const handleTest = async () => {
    if (!testName || !testEmail || !interactionTitle) {
      toast.error('Vyplňte jméno, e-mail a název zdroje');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify({
          name: testName,
          email: testEmail,
          interaction_type: interactionType,
          interaction_title: interactionTitle,
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Testovací zájemce byl úspěšně vytvořen!');
        setTestName('');
        setTestEmail('');
        setTestTitle('');
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Napojení landing pages</DialogTitle>
          <DialogDescription>
            Vyplňte zdroj (typ a název), vygeneruje se kód pro napojení formuláře na vaší landing page.
          </DialogDescription>
        </DialogHeader>

        {/* Source config — always visible */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium">Zdroj kontaktu</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Typ zdroje</Label>
              <Select value={interactionType} onValueChange={v => setInteractionType(v as ProspectInteractionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(INTERACTION_TYPE_LABELS) as [ProspectInteractionType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Název zdroje *</Label>
              <Input
                value={interactionTitle}
                onChange={e => setInteractionTitle(e.target.value)}
                placeholder={titlePlaceholder}
              />
            </div>
          </div>
          {!interactionTitle && (
            <p className="text-xs text-amber-600 dark:text-amber-400">⚠ Vyplňte název zdroje pro vygenerování kódu</p>
          )}
        </div>

        <Tabs defaultValue="form" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="form" className="gap-1.5">
              <Code className="h-3.5 w-3.5" />
              HTML formulář
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Webhook API
            </TabsTrigger>
            <TabsTrigger value="test" className="gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" />
              Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Zkopírujte tento kód a dejte ho AI (nebo vložte přímo do landing page). Obsahuje formulář i odesílací logiku.
            </p>
            <CodeBlock code={htmlSnippet} label="HTML + JavaScript snippet" />
          </TabsContent>

          <TabsContent value="api" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Webhook URL a příklady pro vlastní napojení. Zkopírujte a předejte AI pro napojení formuláře.
            </p>

            <CodeBlock code={WEBHOOK_URL} label="Webhook URL" />
            <CodeBlock code={`Authorization: Bearer ${ANON_KEY}`} label="Authorization header" />
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

            <Button onClick={handleTest} disabled={testing || !interactionTitle} className="w-full">
              {testing && <Loader2 className="h-4 w-4 animate-spin" />}
              {testing ? 'Odesílám...' : 'Odeslat testovací data'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
