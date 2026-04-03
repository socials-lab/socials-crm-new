import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pencil, Save, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead } from '@/types/crm';

interface Signatory {
  name: string;
  position?: string;
  email: string;
  phone: string;
}

interface ProjectContact {
  name: string;
  email: string;
  phone?: string;
}

interface OnboardingDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSave: (updates: Partial<Lead>) => void;
}

export function OnboardingDataDialog({ open, onOpenChange, lead, onSave }: OnboardingDataDialogProps) {
  const [isEditing, setIsEditing] = useState(false);

  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [contacts, setContacts] = useState<ProjectContact[]>([]);
  const [startDate, setStartDate] = useState('');
  const [billingStreet, setBillingStreet] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [billingCountry, setBillingCountry] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [ico, setIco] = useState('');
  const [dic, setDic] = useState('');

  // Sync local edit state from lead when entering edit mode
  const enterEdit = () => {
    setSignatories(Array.isArray(lead.onboarding_signatories) ? (lead.onboarding_signatories as Signatory[]) : []);
    setContacts(Array.isArray(lead.onboarding_project_contacts) ? (lead.onboarding_project_contacts as ProjectContact[]) : []);
    setStartDate(lead.onboarding_start_date || '');
    setBillingStreet(lead.billing_street || '');
    setBillingCity(lead.billing_city || '');
    setBillingZip(lead.billing_zip || '');
    setBillingCountry(lead.billing_country || '');
    setBillingEmail(lead.billing_email || '');
    setIco(lead.ico || '');
    setDic(lead.dic || '');
    setIsEditing(true);
  };

  useEffect(() => {
    if (!open) setIsEditing(false);
  }, [open]);

  const handleSave = () => {
    onSave({
      onboarding_signatories: signatories as unknown as Lead['onboarding_signatories'],
      onboarding_project_contacts: contacts as unknown as Lead['onboarding_project_contacts'],
      onboarding_start_date: startDate || null,
      billing_street: billingStreet || null,
      billing_city: billingCity || null,
      billing_zip: billingZip || null,
      billing_country: billingCountry || null,
      billing_email: billingEmail || null,
      ico: ico || null,
      dic: dic || null,
    });
    setIsEditing(false);
    toast.success('Onboarding data uložena');
  };

  // Read directly from lead prop (always fresh)
  const lSignatories = Array.isArray(lead.onboarding_signatories) ? (lead.onboarding_signatories as Signatory[]) : [];
  const lContacts = Array.isArray(lead.onboarding_project_contacts) ? (lead.onboarding_project_contacts as ProjectContact[]) : [];
  const lStartDate = lead.onboarding_start_date || '';
  const lIco = lead.ico || '';
  const lDic = lead.dic || '';
  const lBillingStreet = lead.billing_street || '';
  const lBillingCity = lead.billing_city || '';
  const lBillingZip = lead.billing_zip || '';
  const lBillingCountry = lead.billing_country || '';
  const lBillingEmail = lead.billing_email || '';

  const hasData = lead.onboarding_form_completed_at || lSignatories.length > 0 || lContacts.length > 0 || lStartDate || lIco || lDic || lBillingStreet || lBillingCity || lBillingEmail;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Onboarding data</DialogTitle>
            <div className="flex gap-1">
              {!isEditing ? (
                <Button variant="ghost" size="sm" onClick={enterEdit}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Upravit
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-3.5 w-3.5 mr-1" />
                    Zrušit
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Uložit
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {!hasData && !isEditing ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Žádná onboarding data nebyla vyplněna.</p>
        ) : isEditing ? (
          /* ===== EDIT MODE ===== */
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Fakturační údaje</h4>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">IČO</Label><Input value={ico} onChange={e => setIco(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">DIČ</Label><Input value={dic} onChange={e => setDic(e.target.value)} className="h-8 text-sm" /></div>
                <div className="col-span-2"><Label className="text-xs">Ulice</Label><Input value={billingStreet} onChange={e => setBillingStreet(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Město</Label><Input value={billingCity} onChange={e => setBillingCity(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">PSČ</Label><Input value={billingZip} onChange={e => setBillingZip(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Země</Label><Input value={billingCountry} onChange={e => setBillingCountry(e.target.value)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Fakturační email</Label><Input value={billingEmail} onChange={e => setBillingEmail(e.target.value)} className="h-8 text-sm" /></div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Statutární zástupci</h4>
              {signatories.map((s, i) => (
                <div key={i} className="p-2 rounded border bg-muted/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Zástupce {i + 1}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setSignatories(prev => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Input value={s.name} onChange={e => { const n = [...signatories]; n[i] = { ...n[i], name: e.target.value }; setSignatories(n); }} placeholder="Jméno" className="h-7 text-xs" />
                    <Input value={s.position || ''} onChange={e => { const n = [...signatories]; n[i] = { ...n[i], position: e.target.value }; setSignatories(n); }} placeholder="Pozice" className="h-7 text-xs" />
                    <Input value={s.email} onChange={e => { const n = [...signatories]; n[i] = { ...n[i], email: e.target.value }; setSignatories(n); }} placeholder="Email" className="h-7 text-xs" />
                    <Input value={s.phone} onChange={e => { const n = [...signatories]; n[i] = { ...n[i], phone: e.target.value }; setSignatories(n); }} placeholder="Telefon" className="h-7 text-xs" />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={() => setSignatories(prev => [...prev, { name: '', email: '', phone: '' }])}>
                <Plus className="h-3 w-3 mr-1" />Přidat zástupce
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Projektové kontakty</h4>
              {contacts.map((c, i) => (
                <div key={i} className="p-2 rounded border bg-muted/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Kontakt {i + 1}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setContacts(prev => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Input value={c.name} onChange={e => { const n = [...contacts]; n[i] = { ...n[i], name: e.target.value }; setContacts(n); }} placeholder="Jméno" className="h-7 text-xs" />
                    <Input value={c.email} onChange={e => { const n = [...contacts]; n[i] = { ...n[i], email: e.target.value }; setContacts(n); }} placeholder="Email" className="h-7 text-xs" />
                    <Input value={c.phone || ''} onChange={e => { const n = [...contacts]; n[i] = { ...n[i], phone: e.target.value }; setContacts(n); }} placeholder="Telefon" className="h-7 text-xs" />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={() => setContacts(prev => [...prev, { name: '', email: '' }])}>
                <Plus className="h-3 w-3 mr-1" />Přidat kontakt
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Datum zahájení spolupráce</h4>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 text-sm w-48" />
            </div>
          </div>
        ) : (
          /* ===== READ MODE — reads directly from lead prop ===== */
          <div className="space-y-5 pt-2">
            {lead.onboarding_form_completed_at && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Vyplněno</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(lead.onboarding_form_completed_at).toLocaleString('cs-CZ')}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Fakturační údaje</h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                {lIco && <p>IČO: <span className="text-foreground">{lIco}</span>{lDic && <> • DIČ: <span className="text-foreground">{lDic}</span></>}</p>}
                {lBillingStreet && <p>{lBillingStreet}{lBillingCity && `, ${lBillingCity}`}{lBillingZip && ` ${lBillingZip}`}{lBillingCountry && `, ${lBillingCountry}`}</p>}
                {lBillingEmail && <p>Email: <span className="text-foreground">{lBillingEmail}</span></p>}
                {!lIco && !lBillingStreet && !lBillingEmail && <p className="italic">Nevyplněno</p>}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Statutární zástupci</h4>
              {lSignatories.length === 0 && <p className="text-sm text-muted-foreground italic">Nevyplněno</p>}
              {lSignatories.map((s, i) => (
                <div key={i} className="p-2 rounded border bg-muted/30">
                  <p className="text-sm font-medium">{s.name}{s.position && <span className="font-normal text-muted-foreground"> — {s.position}</span>}</p>
                  <p className="text-xs text-muted-foreground">{s.email}{s.phone && ` • ${s.phone}`}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Projektové kontakty</h4>
              {lContacts.length === 0 && <p className="text-sm text-muted-foreground italic">Nevyplněno</p>}
              {lContacts.map((c, i) => (
                <div key={i} className="p-2 rounded border bg-muted/30">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.email}{c.phone && ` • ${c.phone}`}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Datum zahájení spolupráce</h4>
              <p className="text-sm text-muted-foreground">
                {lStartDate ? new Date(lStartDate + 'T00:00:00').toLocaleDateString('cs-CZ') : <span className="italic">Nevyplněno</span>}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
