import { useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { 
  Building2, 
  Globe, 
  User, 
  Mail, 
  Phone, 
  ExternalLink,
  TrendingUp,
  FileText,
  MapPin,
  Clock,
  Coins,
  ChevronDown,
  MessageSquare,
  Lock,
  Plus,
  Send,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useCRMData } from '@/hooks/useCRMData';
import { useLeadTransitions } from '@/hooks/useLeadTransitions';
import { ConvertLeadDialog } from './ConvertLeadDialog';
import { LeadHistoryDialog } from './LeadHistoryDialog';
import { AddLeadServiceDialog } from './AddLeadServiceDialog';
import { RequestAccessDialog } from './RequestAccessDialog';
import { SendOnboardingFormDialog } from './SendOnboardingFormDialog';
import { SendOfferDialog } from './SendOfferDialog';
import { CreateOfferDialog } from './CreateOfferDialog';
import { ConfirmStageTransitionDialog } from './ConfirmStageTransitionDialog';
import { LeadFlowStepper } from './LeadFlowStepper';
import { LeadCommunicationTimeline } from './LeadCommunicationTimeline';
import { InlineEditField } from './InlineEditField';
import { CompanyFinancials } from './CompanyFinancials';
import type { Lead, LeadStage, LeadService, LeadNoteType } from '@/types/crm';
import type { PendingTransition } from '@/types/leadTransitions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { fetchAresData } from '@/utils/aresUtils';

interface LeadDetailDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STAGE_LABELS: Record<LeadStage, string> = {
  new_lead: 'Nový lead',
  meeting_done: 'Schůzka proběhla',
  waiting_access: 'Čekáme na přístupy',
  access_received: 'Přístupy přijaty',
  preparing_offer: 'Příprava nabídky',
  offer_sent: 'Nabídka odeslána',
  won: 'Vyhráno',
  lost: 'Prohráno',
  postponed: 'Odloženo',
};

const STAGE_COLORS: Record<LeadStage, string> = {
  new_lead: 'bg-slate-500/10 text-slate-700 border-slate-500/30',
  meeting_done: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  waiting_access: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  access_received: 'bg-green-500/10 text-green-700 border-green-500/30',
  preparing_offer: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
  offer_sent: 'bg-pink-500/10 text-pink-700 border-pink-500/30',
  won: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  lost: 'bg-red-500/10 text-red-700 border-red-500/30',
  postponed: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
};

const SOURCE_LABELS: Record<Lead['source'], string> = {
  referral: 'Doporučení',
  inbound: 'Inbound',
  cold_outreach: 'Cold outreach',
  event: 'Event/konference',
  linkedin: 'LinkedIn',
  website: 'Web',
  other: 'Jiný',
};

export function LeadDetailDialog({ lead: leadProp, open, onOpenChange }: LeadDetailDialogProps) {
  const { updateLeadStage, updateLead, addNote, getLeadHistory, getLeadById } = useLeadsData();
  const { colleagues, services } = useCRMData();
  const { confirmTransition, isConfirming } = useLeadTransitions();
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isRequestAccessOpen, setIsRequestAccessOpen] = useState(false);
  const [isOnboardingFormOpen, setIsOnboardingFormOpen] = useState(false);
  const [isSendOfferOpen, setIsSendOfferOpen] = useState(false);
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);
  const [sharedOfferUrl, setSharedOfferUrl] = useState<string | null>(null);
  const [showContractWarning, setShowContractWarning] = useState(false);
  const [showOnboardingWarning, setShowOnboardingWarning] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  // Inline note form state
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<LeadNoteType>('general');
  const [callDate, setCallDate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [isLoadingAres, setIsLoadingAres] = useState(false);
  const isProcessingWarning = useRef(false);

  const lead = leadProp?.id ? getLeadById(leadProp.id) ?? leadProp : leadProp;

  if (!lead) return null;

  const owner = colleagues.find(c => c.id === lead.owner_id);
  const canConvert = !lead.converted_to_client_id && !['won', 'lost'].includes(lead.stage);
  const history = getLeadHistory(lead.id);
  const isNewLead = lead.stage === 'new_lead';

  const handleStageChange = (newStage: LeadStage) => {
    const fromStage = lead.stage;
    updateLeadStage(lead.id, newStage);
    toast.success('Stav leadu byl změněn');
    setPendingTransition({
      leadId: lead.id,
      leadName: lead.company_name,
      fromStage,
      toStage: newStage,
      leadValue: lead.estimated_price || 0,
    });
    setShowTransitionDialog(true);
  };

  const handleConfirmTransition = () => {
    if (pendingTransition) {
      confirmTransition({
        leadId: pendingTransition.leadId,
        fromStage: pendingTransition.fromStage,
        toStage: pendingTransition.toStage,
        transitionValue: pendingTransition.leadValue,
      });
      toast.success('Přechod byl potvrzen pro analytiku');
    }
    setShowTransitionDialog(false);
    setPendingTransition(null);
  };

  const handleSkipTransition = () => {
    setShowTransitionDialog(false);
    setPendingTransition(null);
  };

  const handleAddNote = (text: string, type: LeadNoteType, date: string | null, subject?: string | null, recipients?: string[] | null) => {
    addNote(lead.id, text, type, date, subject, recipients);
    toast.success('Poznámka byla přidána');
  };

  const handleInlineNoteSubmit = () => {
    if (!noteText.trim()) return;
    const isEmail = noteType === 'email_sent' || noteType === 'email_received';
    const subject = isEmail && emailSubject.trim() ? emailSubject.trim() : null;
    const recipients = isEmail && emailRecipients.trim() 
      ? emailRecipients.split(',').map(r => r.trim()).filter(Boolean) 
      : null;
    handleAddNote(
      noteText.trim(), 
      noteType, 
      noteType === 'call' && callDate ? callDate : null,
      subject,
      recipients,
    );
    setNoteText('');
    setCallDate('');
    setEmailSubject('');
    setEmailRecipients('');
  };

  const handleAddService = (service: LeadService) => {
    const currentServices = lead.potential_services || [];
    const updatedServices = [...currentServices, service];
    const newEstimatedPrice = updatedServices.reduce((sum, s) => sum + s.price, 0);
    updateLead(lead.id, {
      potential_services: updatedServices,
      estimated_price: newEstimatedPrice,
    });
    toast.success('Služba byla přidána do nabídky');
  };

  const handleConvertClick = () => {
    const hasOnboardingCompleted = !!lead.onboarding_form_completed_at;
    const hasContract = !!lead.contract_url;
    if (!hasOnboardingCompleted) {
      setShowOnboardingWarning(true);
    } else if (!hasContract) {
      setShowContractWarning(true);
    } else {
      setIsConvertOpen(true);
    }
  };

  const handleOnboardingWarningConfirm = () => {
    if (isProcessingWarning.current) return;
    isProcessingWarning.current = true;
    const hasContract = !!lead.contract_url;
    setTimeout(() => {
      if (!hasContract) {
        setShowContractWarning(true);
      } else {
        setIsConvertOpen(true);
      }
      isProcessingWarning.current = false;
    }, 150);
  };

  return (
    <>
      {/* Onboarding Form Warning Dialog */}
      <AlertDialog open={showOnboardingWarning} onOpenChange={setShowOnboardingWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚠️ Onboarding formulář nebyl vyplněn
            </AlertDialogTitle>
            <AlertDialogDescription>
              Klient zatím nevyplnil onboarding formulář. Bez něj nebudete mít kompletní údaje.
              Opravdu chcete pokračovat?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleOnboardingWarningConfirm}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Ano, přesto pokračovat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showContractWarning} onOpenChange={setShowContractWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚠️ Smlouva nebyla podepsána
            </AlertDialogTitle>
            <AlertDialogDescription>
              Pro tento lead zatím nebyla vytvořena nebo podepsána smlouva.
              Opravdu chcete pokračovat?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => setTimeout(() => setIsConvertOpen(true), 100)}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Ano, pokračovat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b flex-shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <DialogTitle className="text-xl font-semibold">
                  <InlineEditField
                    value={lead.company_name}
                    onSave={(v) => { updateLead(lead.id, { company_name: v }); toast.success('Uloženo'); }}
                    placeholder="Název firmy"
                    displayClassName="text-xl font-semibold"
                  />
                </DialogTitle>
                <Badge variant="outline" className={cn("text-xs", STAGE_COLORS[lead.stage])}>
                  {STAGE_LABELS[lead.stage]}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                {lead.ico && <span>IČO: {lead.ico}</span>}
                {owner && <span>• {owner.full_name}</span>}
                <span>•</span>
                <InlineEditField
                  value={lead.estimated_price}
                  onSave={(v) => { updateLead(lead.id, { estimated_price: Number(v) || 0 }); toast.success('Uloženo'); }}
                  type="number"
                  suffix={lead.currency}
                  placeholder="Cena"
                  emptyText="Zadat cenu"
                />
              </div>
            </div>
          </div>

          {/* 2-column layout */}
          <div className="flex-1 flex min-h-0">
            {/* Left column: Flow + Info */}
            <ScrollArea className="flex-1 border-r">
              <div className="p-6 space-y-6">
                {/* Stage selector */}
                <div className="flex items-center gap-3">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">Stav:</label>
                  <Select value={lead.stage} onValueChange={handleStageChange}>
                    <SelectTrigger className="h-8 w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STAGE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={lead.owner_id} 
                    onValueChange={(id) => {
                      updateLead(lead.id, { owner_id: id });
                      toast.success('Majitel leadu byl změněn');
                    }}
                  >
                    <SelectTrigger className="h-8 w-auto">
                      <SelectValue placeholder="Odpovědná osoba" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {colleagues.filter(c => c.status === 'active').map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Flow stepper */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Proces</h4>
                  <LeadFlowStepper
                    lead={lead}
                    onRequestAccess={() => setIsRequestAccessOpen(true)}
                    onMarkAccessReceived={() => {
                      updateLead(lead.id, { 
                        access_received_at: new Date().toISOString(),
                        stage: 'access_received' as LeadStage 
                      });
                      toast.success('🔑 Přístupy byly přijaty!');
                    }}
                    onAddService={() => setIsAddServiceOpen(true)}
                    onCreateOffer={() => setIsCreateOfferOpen(true)}
                    onSendOffer={() => setIsSendOfferOpen(true)}
                    onSendOnboarding={() => setIsOnboardingFormOpen(true)}
                    onMarkContractSent={() => {
                      updateLead(lead.id, { contract_sent_at: new Date().toISOString() });
                      toast.success('✉️ Smlouva byla označena jako odeslaná');
                    }}
                    onMarkContractSigned={() => {
                      updateLead(lead.id, { contract_signed_at: new Date().toISOString() });
                      toast.success('✅ Smlouva byla podepsána!');
                    }}
                    onConvert={handleConvertClick}
                    onRemoveService={(index) => {
                      const currentServices = [...(lead.potential_services || [])];
                      currentServices.splice(index, 1);
                      const newEstimatedPrice = currentServices.reduce((sum, s) => sum + s.price, 0);
                      updateLead(lead.id, {
                        potential_services: currentServices,
                        estimated_price: newEstimatedPrice,
                      });
                      toast.success('Služba byla odebrána');
                    }}
                  />
                </div>

                <Separator />

                {/* Collapsible: Company Info */}
                <Collapsible defaultOpen={isNewLead}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Firemní údaje</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 pt-3">
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-muted-foreground text-xs">IČO</span>
                          <div className="flex items-center gap-2">
                            <InlineEditField
                              value={lead.ico}
                              onSave={async (v) => {
                                updateLead(lead.id, { ico: v });
                                toast.success('IČO uloženo');
                                const cleanIco = v.replace(/\s/g, '');
                                if (cleanIco.length === 8 && /^\d{8}$/.test(cleanIco)) {
                                  setIsLoadingAres(true);
                                  const data = await fetchAresData(cleanIco);
                                  if (data) {
                                    const updates: Partial<Lead> = {};
                                    if (data.street) updates.billing_street = data.street;
                                    if (data.city) updates.billing_city = data.city;
                                    if (data.zip) updates.billing_zip = data.zip;
                                    if (data.companyName && !lead.company_name) updates.company_name = data.companyName;
                                    if (data.dic) updates.dic = data.dic;
                                    if (data.legalForm) (updates as any).legal_form = data.legalForm;
                                    if (data.foundedDate) (updates as any).founded_date = data.foundedDate;
                                    if (data.nace) (updates as any).ares_nace = data.nace;
                                    if (data.directors?.length) (updates as any).directors = data.directors;
                                    if (Object.keys(updates).length > 0) {
                                      updateLead(lead.id, updates);
                                      toast.success('Adresa a údaje doplněny z ARES');
                                    }
                                  } else {
                                    toast.error('Subjekt nebyl nalezen v ARES');
                                  }
                                  setIsLoadingAres(false);
                                }
                              }}
                              placeholder="Zadat IČO"
                              displayClassName="font-medium"
                            />
                            {isLoadingAres && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            {lead.ico && (
                              <a
                                href={`https://ares.gov.cz/ekonomicke-subjekty/res/${lead.ico}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                              >
                                <ExternalLink className="h-3 w-3" />
                                ARES
                              </a>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">DIČ</span>
                          <InlineEditField
                            value={lead.dic}
                            onSave={(v) => { updateLead(lead.id, { dic: v }); toast.success('Uloženo'); }}
                            placeholder="Zadat DIČ"
                            displayClassName="font-medium"
                          />
                        </div>
                      </div>
                      {lead.legal_form && (
                        <p className="text-muted-foreground">Právní forma: <span className="font-medium text-foreground">{lead.legal_form}</span></p>
                      )}
                      {lead.founded_date && (
                        <p className="text-muted-foreground">Datum vzniku: <span className="font-medium text-foreground">{new Date(lead.founded_date).toLocaleDateString('cs-CZ')}</span></p>
                      )}
                      {lead.ares_nace && (
                        <p className="text-muted-foreground">CZ-NACE: <span className="font-medium text-foreground">{lead.ares_nace}</span></p>
                      )}
                      {lead.directors && lead.directors.length > 0 && (
                        <div>
                          <span className="text-muted-foreground text-xs">Jednatelé / společníci</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {lead.directors.map((d, i) => {
                              const dir = typeof d === 'string' ? { name: d, role: 'jednatel', ownership_percent: null } : d;
                              const isTopOwner = i === 0 && dir.ownership_percent !== null && dir.ownership_percent > 0;
                              const label = dir.ownership_percent !== null
                                ? `${dir.name} (${dir.role}, ${dir.ownership_percent}%)`
                                : `${dir.name} (${dir.role})`;
                              return (
                                <Badge 
                                  key={i} 
                                  variant={isTopOwner ? "default" : "secondary"} 
                                  className={cn("text-xs", isTopOwner && "bg-amber-500/90 hover:bg-amber-500 text-white border-amber-600")}
                                >
                                  {isTopOwner && '👑 '}{label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground text-xs">Web</span>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <InlineEditField
                            value={lead.website}
                            onSave={(v) => { updateLead(lead.id, { website: v }); toast.success('Uloženo'); }}
                            type="url"
                            placeholder="Zadat web"
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Obor</span>
                        <InlineEditField
                          value={lead.industry}
                          onSave={(v) => { updateLead(lead.id, { industry: v }); toast.success('Uloženo'); }}
                          placeholder="Zadat obor"
                        />
                      </div>
                      {lead.ico && (
                        <CompanyFinancials ico={lead.ico} />
                      )}

                      {/* Address - inline editable */}
                      <div className="flex items-start gap-2 pt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="space-y-1">
                          <InlineEditField
                            value={lead.billing_street}
                            onSave={(v) => { updateLead(lead.id, { billing_street: v }); toast.success('Uloženo'); }}
                            placeholder="Ulice"
                            emptyText="Zadat ulici"
                          />
                          <div className="flex items-center gap-2">
                            <InlineEditField
                              value={lead.billing_zip}
                              onSave={(v) => { updateLead(lead.id, { billing_zip: v }); toast.success('Uloženo'); }}
                              placeholder="PSČ"
                              emptyText="PSČ"
                            />
                            <InlineEditField
                              value={lead.billing_city}
                              onSave={(v) => { updateLead(lead.id, { billing_city: v }); toast.success('Uloženo'); }}
                              placeholder="Město"
                              emptyText="Město"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Collapsible: Contact */}
                <Collapsible defaultOpen={isNewLead}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Kontaktní osoba</span>
                    <span className="text-xs text-muted-foreground ml-1">{lead.contact_name}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 pt-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <InlineEditField
                          value={lead.contact_name}
                          onSave={(v) => { updateLead(lead.id, { contact_name: v }); toast.success('Uloženo'); }}
                          placeholder="Jméno kontaktu"
                          displayClassName="font-medium"
                        />
                        <span className="text-muted-foreground">–</span>
                        <InlineEditField
                          value={lead.contact_position}
                          onSave={(v) => { updateLead(lead.id, { contact_position: v }); toast.success('Uloženo'); }}
                          placeholder="Pozice"
                          emptyText="Zadat pozici"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <InlineEditField
                          value={lead.contact_email}
                          onSave={(v) => { updateLead(lead.id, { contact_email: v }); toast.success('Uloženo'); }}
                          placeholder="E-mail"
                          emptyText="Zadat e-mail"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <InlineEditField
                          value={lead.contact_phone}
                          onSave={(v) => { updateLead(lead.id, { contact_phone: v }); toast.success('Uloženo'); }}
                          placeholder="Telefon"
                          emptyText="Zadat telefon"
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Collapsible: Sales info */}
                <Collapsible defaultOpen={isNewLead}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Obchodní info</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 pt-3">
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-muted-foreground">Zdroj</span>
                          <InlineEditField
                            value={lead.source}
                            onSave={(v) => { updateLead(lead.id, { source: v as Lead['source'] }); toast.success('Uloženo'); }}
                            type="select"
                            options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
                          />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Pravděpodobnost</span>
                          <InlineEditField
                            value={lead.probability_percent}
                            onSave={(v) => { updateLead(lead.id, { probability_percent: Number(v) || 0 }); toast.success('Uloženo'); }}
                            type="number"
                            suffix="%"
                            placeholder="0"
                            displayClassName="font-medium"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Měsíční investice:</span>
                        <InlineEditField
                          value={lead.ad_spend_monthly}
                          onSave={(v) => { updateLead(lead.id, { ad_spend_monthly: Number(v) || 0 }); toast.success('Uloženo'); }}
                          type="number"
                          suffix="Kč"
                          placeholder="0"
                          displayClassName="font-medium"
                          emptyText="Zadat"
                        />
                      </div>
                      <div className="p-3 rounded-lg border-l-4 border-primary/50 bg-muted/30">
                        <span className="text-xs text-muted-foreground block mb-1">Zpráva od klienta:</span>
                        <InlineEditField
                          value={lead.client_message}
                          onSave={(v) => { updateLead(lead.id, { client_message: v }); toast.success('Uloženo'); }}
                          type="textarea"
                          placeholder="Zadat zprávu od klienta..."
                          emptyText="Klikni pro přidání zprávy"
                        />
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <span className="text-xs text-muted-foreground block mb-1">Shrnutí:</span>
                        <InlineEditField
                          value={lead.summary}
                          onSave={(v) => { updateLead(lead.id, { summary: v }); toast.success('Uloženo'); }}
                          type="textarea"
                          placeholder="Zadat shrnutí..."
                          emptyText="Klikni pro přidání shrnutí"
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Billing info */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Fakturační údaje</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 pt-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <InlineEditField
                          value={lead.billing_email}
                          onSave={(v) => { updateLead(lead.id, { billing_email: v }); toast.success('Uloženo'); }}
                          placeholder="Fakturační e-mail"
                          emptyText="Zadat fakturační e-mail"
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Conversion status */}
                {lead.converted_to_client_id && (
                  <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                    <p className="text-sm text-emerald-700 font-medium">
                      ✓ Lead byl převeden na zakázku
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lead.converted_at && new Date(lead.converted_at).toLocaleDateString('cs-CZ')}
                    </p>
                  </div>
                )}

                {/* Meta */}
                <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Vytvořeno: {new Date(lead.created_at).toLocaleDateString('cs-CZ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Poslední aktivita: {new Date(lead.updated_at).toLocaleDateString('cs-CZ')}</span>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Right column: Notes + Collapsible Timeline */}
            <div className="w-[380px] flex flex-col min-h-0">
              <ScrollArea className="flex-1">
                <div className="p-5 space-y-4">
                  {/* Inline note form */}
                  <div className="space-y-2 p-3 rounded-lg border bg-card">
                    <div className="flex gap-1 flex-wrap">
                      {([
                        { type: 'general' as const, icon: <MessageSquare className="h-3 w-3" />, label: 'Poznámka' },
                        { type: 'call' as const, icon: <Phone className="h-3 w-3" />, label: 'Hovor' },
                        { type: 'email_sent' as const, icon: <Send className="h-3 w-3" />, label: 'Odeslaný e-mail' },
                        { type: 'email_received' as const, icon: <Mail className="h-3 w-3" />, label: 'Přijatý e-mail' },
                        { type: 'internal' as const, icon: <Lock className="h-3 w-3" />, label: 'Interní' },
                      ]).map(({ type, icon, label }) => (
                        <Button
                          key={type}
                          variant={noteType === type ? 'default' : 'outline'}
                          size="sm"
                          className="gap-1 text-xs h-7"
                          onClick={() => setNoteType(type)}
                        >
                          {icon}
                          {label}
                        </Button>
                      ))}
                    </div>
                    {noteType === 'call' && (
                      <Input
                        type="datetime-local"
                        value={callDate}
                        onChange={(e) => setCallDate(e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Datum hovoru"
                      />
                    )}
                    {(noteType === 'email_sent' || noteType === 'email_received') && (
                      <>
                        <Input
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="h-8 text-xs"
                          placeholder="Předmět e-mailu"
                        />
                        <Input
                          value={emailRecipients}
                          onChange={(e) => setEmailRecipients(e.target.value)}
                          className="h-8 text-xs"
                          placeholder={noteType === 'email_sent' ? 'Příjemci (oddělte čárkou)' : 'Od koho (e-mail)'}
                        />
                      </>
                    )}
                    <Textarea
                      placeholder={
                        noteType === 'call' 
                          ? 'Co bylo probíráno...' 
                          : noteType === 'internal'
                            ? 'Interní poznámka...'
                            : noteType === 'email_sent'
                              ? 'Obsah odeslaného e-mailu...'
                              : noteType === 'email_received'
                                ? 'Obsah přijatého e-mailu...'
                                : 'Přidat poznámku...'
                      }
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                      className="text-sm min-h-[60px]"
                    />
                    <Button 
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleInlineNoteSubmit}
                      disabled={!noteText.trim()}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Přidat
                    </Button>
                  </div>

                  {/* Collapsible Timeline */}
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Historie komunikace</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-auto">
                        {(lead.notes?.length || 0) + (lead.access_request_sent_at ? 1 : 0) + (lead.offer_sent_at ? 1 : 0)} událostí
                      </Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <LeadCommunicationTimeline
                        lead={lead}
                        onRequestAccess={() => setIsRequestAccessOpen(true)}
                        onSendOnboarding={() => setIsOnboardingFormOpen(true)}
                        onSendOffer={() => setIsSendOfferOpen(true)}
                        onCreateOffer={() => setIsCreateOfferOpen(true)}
                        onMarkAccessReceived={() => {
                          updateLead(lead.id, { 
                            access_received_at: new Date().toISOString(),
                            stage: 'access_received' as LeadStage 
                          });
                          toast.success('🔑 Přístupy byly přijaty!');
                        }}
                        onMarkContractSent={() => {
                          updateLead(lead.id, { contract_sent_at: new Date().toISOString() });
                          toast.success('✉️ Smlouva byla označena jako odeslaná');
                        }}
                        onMarkContractSigned={() => {
                          updateLead(lead.id, { contract_signed_at: new Date().toISOString() });
                          toast.success('✅ Smlouva byla podepsána!');
                        }}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      <ConvertLeadDialog
        lead={lead}
        open={isConvertOpen}
        onOpenChange={setIsConvertOpen}
        onSuccess={() => {
          setIsConvertOpen(false);
          onOpenChange(false);
        }}
      />

      <LeadHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        history={history}
        leadName={lead.company_name}
      />

      <AddLeadServiceDialog
        open={isAddServiceOpen}
        onOpenChange={setIsAddServiceOpen}
        services={services}
        onSubmit={handleAddService}
      />

      <RequestAccessDialog
        open={isRequestAccessOpen}
        onOpenChange={setIsRequestAccessOpen}
        contactName={lead.contact_name}
        contactEmail={lead.contact_email}
        companyName={lead.company_name}
        leadId={lead.id}
        onSent={(platforms, emailData) => {
          updateLead(lead.id, {
            access_request_sent_at: new Date().toISOString(),
            access_request_platforms: platforms,
            stage: 'waiting_access' as LeadStage,
          });
          if (emailData) {
            addNote(lead.id, emailData.body, 'email_sent', null, emailData.subject, emailData.recipients);
          }
        }}
      />

      <SendOnboardingFormDialog
        open={isOnboardingFormOpen}
        onOpenChange={setIsOnboardingFormOpen}
        lead={lead}
        onSent={(formUrl, emailData) => {
          updateLead(lead.id, {
            onboarding_form_sent_at: new Date().toISOString(),
            onboarding_form_url: formUrl,
          });
          if (emailData) {
            addNote(lead.id, emailData.body, 'email_sent', null, emailData.subject, emailData.recipients);
          }
        }}
      />

      <SendOfferDialog
        open={isSendOfferOpen}
        onOpenChange={setIsSendOfferOpen}
        lead={lead}
        onSent={(ownerId, emailData) => {
          updateLead(lead.id, {
            offer_sent_at: new Date().toISOString(),
            offer_sent_by_id: ownerId,
            stage: 'offer_sent' as LeadStage,
          });
          if (emailData) {
            addNote(lead.id, emailData.body, 'email_sent', null, emailData.subject, emailData.recipients);
          }
        }}
      />

      <CreateOfferDialog
        open={isCreateOfferOpen}
        onOpenChange={setIsCreateOfferOpen}
        lead={lead}
        onSuccess={(token, offerUrl) => {
          setSharedOfferUrl(offerUrl);
          updateLead(lead.id, {
            offer_url: offerUrl,
            offer_created_at: new Date().toISOString(),
          });
        }}
      />

      <ConfirmStageTransitionDialog
        pendingTransition={pendingTransition}
        open={showTransitionDialog}
        onOpenChange={setShowTransitionDialog}
        onConfirm={handleConfirmTransition}
        onSkip={handleSkipTransition}
        isConfirming={isConfirming}
      />
    </>
  );
}
