import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2, ShieldCheck, ShieldAlert, ShieldX, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
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
  Scale,
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
import { SendMeetingRequestDialog } from './SendMeetingRequestDialog';
import { SendOnboardingFormDialog } from './SendOnboardingFormDialog';
import { SendContractDialog } from './SendContractDialog';
import { SendOfferDialog } from './SendOfferDialog';
import { CreateOfferDialog } from './CreateOfferDialog';
import { ConfirmStageTransitionDialog } from './ConfirmStageTransitionDialog';
import { LeadFlowStepper } from './LeadFlowStepper';
import { LeadCommunicationTimeline } from './LeadCommunicationTimeline';
import { InlineEditField } from './InlineEditField';
import { CompanyFinancials } from './CompanyFinancials';
import type { Lead, LeadStage, LeadService, LeadNoteType } from '@/types/crm';
import { LeadEnrichmentSection, LeadSummaryBar, LeadScoreBadges } from './LeadEnrichmentSection';
import type { PendingTransition } from '@/types/leadTransitions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { fetchAresData } from '@/utils/aresUtils';
import { useVatReliability } from '@/hooks/useVatReliability';

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
  const [isMeetingRequestOpen, setIsMeetingRequestOpen] = useState(false);
  const [isOnboardingFormOpen, setIsOnboardingFormOpen] = useState(false);
  const [isSendOfferOpen, setIsSendOfferOpen] = useState(false);
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);
  const [sharedOfferUrl, setSharedOfferUrl] = useState<string | null>(null);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
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
  const [pendingIcoChange, setPendingIcoChange] = useState<string | null>(null);
  const isProcessingWarning = useRef(false);

  const lead = leadProp?.id ? getLeadById(leadProp.id) ?? leadProp : leadProp;
  
  // VAT reliability check
  const { data: vatData, isLoading: isLoadingVat } = useVatReliability(lead?.dic);

  // Auto-save VAT status when fetched
  useEffect(() => {
    if (vatData?.vatStatus && lead?.id && vatData.vatStatus !== lead.vat_payer_status) {
      updateLead(lead.id, { vat_payer_status: vatData.vatStatus } as any);
    }
  }, [vatData?.vatStatus, lead?.id]);

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

      {/* IČO Change Confirmation Dialog */}
      <AlertDialog open={!!pendingIcoChange} onOpenChange={(open) => { if (!open) setPendingIcoChange(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚠️ Změna IČO
            </AlertDialogTitle>
            <AlertDialogDescription>
              Chystáte se změnit IČO z <strong>{lead.ico}</strong> na <strong>{pendingIcoChange}</strong>.
              Tím se přepíší všechny firemní údaje (název, DIČ, sídlo, jednatelé atd.) daty z ARES.
              <br /><br />
              Opravdu chcete pokračovat?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingIcoChange(null)}>Zrušit</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                const newIco = pendingIcoChange!;
                setPendingIcoChange(null);
                setIsLoadingAres(true);
                const data = await fetchAresData(newIco.replace(/\s/g, ''));
                const updates: Partial<Lead> = { ico: newIco };
                if (data) {
                  if (data.street) updates.billing_street = data.street;
                  if (data.city) updates.billing_city = data.city;
                  if (data.zip) updates.billing_zip = data.zip;
                  if (data.companyName) updates.company_name = data.companyName;
                  if (data.dic) updates.dic = data.dic;
                  if (data.legalForm) (updates as any).legal_form = data.legalForm;
                  if (data.foundedDate) (updates as any).founded_date = data.foundedDate;
                  if (data.nace) (updates as any).ares_nace = data.nace;
                  if (data.directors?.length) (updates as any).directors = data.directors;
                  if (data.spisovaZnacka) updates.court_registration = data.spisovaZnacka;
                }
                updateLead(lead.id, updates);
                if (data) {
                  toast.success('IČO uloženo, údaje doplněny z ARES');
                } else {
                  toast.error('IČO uloženo, ale subjekt nebyl nalezen v ARES');
                }
                setIsLoadingAres(false);
              }}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Ano, přepsat údaje
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 gap-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b flex-shrink-0">
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
                <LeadScoreBadges lead={lead} />
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                {lead.ico && <span>IČO: {lead.ico}</span>}
                {owner && <span>• {owner.full_name}</span>}
              </div>
            </div>
          </div>

          {/* Single scrollable content area */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-5">

              {/* === SUMMARY BAR === */}
              <LeadSummaryBar lead={lead} />

              {/* === THREE INFO CARDS === */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* FIRMA Card */}
                <div className="p-4 rounded-lg border bg-card space-y-3">
                  <h4 className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                    <Building2 className="h-3.5 w-3.5" />
                    Firma
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{lead.company_name}</span>
                      {lead.ico && (
                        <a href={`https://or.justice.cz/ias/ui/rejstrik-firma.vysledky?ico=${lead.ico}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline">📋 Rejstřík</a>
                      )}
                      {(lead.is_vat_payer || lead.vat_payer_status === 'reliable') && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                          ✅ DPH
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <span className="text-muted-foreground text-xs">IČO</span>
                        <div className="flex items-center gap-2">
                          <InlineEditField
                            value={lead.ico}
                            onSave={async (v) => {
                              const cleanIco = v.replace(/\s/g, '');
                              if (cleanIco.length === 8 && /^\d{8}$/.test(cleanIco)) {
                                if (lead.ico && lead.ico !== v && lead.ico.replace(/\s/g, '') !== cleanIco) {
                                  setPendingIcoChange(v);
                                  return;
                                }
                                setIsLoadingAres(true);
                                const data = await fetchAresData(cleanIco);
                                const updates: Partial<Lead> = { ico: v };
                                if (data) {
                                  if (data.street) updates.billing_street = data.street;
                                  if (data.city) updates.billing_city = data.city;
                                  if (data.zip) updates.billing_zip = data.zip;
                                  if (data.companyName && !lead.company_name) updates.company_name = data.companyName;
                                  if (data.dic) updates.dic = data.dic;
                                  if (data.legalForm) (updates as any).legal_form = data.legalForm;
                                  if (data.foundedDate) (updates as any).founded_date = data.foundedDate;
                                  if (data.nace) (updates as any).ares_nace = data.nace;
                                  if (data.directors?.length) (updates as any).directors = data.directors;
                                  if (data.spisovaZnacka) updates.court_registration = data.spisovaZnacka;
                                }
                                updateLead(lead.id, updates);
                                toast.success(data ? 'IČO uloženo, údaje doplněny z ARES' : 'IČO uloženo, ale subjekt nebyl nalezen v ARES');
                                setIsLoadingAres(false);
                              } else {
                                updateLead(lead.id, { ico: v });
                                toast.success('IČO uloženo');
                              }
                            }}
                            placeholder="Zadat IČO"
                            displayClassName="font-medium"
                          />
                          {isLoadingAres && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Adresa</span>
                        <p className="font-medium text-sm">
                          {lead.company_address || [lead.billing_street, lead.billing_city, lead.billing_zip].filter(Boolean).join(', ') || '–'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">E-shop</span>
                        <p className="font-medium">{lead.is_ecommerce !== null && lead.is_ecommerce !== undefined ? (lead.is_ecommerce ? 'Ano' : 'Ne') : '–'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Kredibilita</span>
                        <p className="font-medium">{lead.credibility_score !== null && lead.credibility_score !== undefined ? lead.credibility_score : '–'}</p>
                      </div>
                    </div>
                    {/* Social */}
                    {(lead.facebook_url || lead.instagram_url) && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t">
                        {lead.facebook_url && (
                          <div>
                            <span className="text-xs text-muted-foreground">Facebook</span>
                            <a href={lead.facebook_url.startsWith('http') ? lead.facebook_url : `https://facebook.com/${lead.facebook_url}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline block truncate">
                              {lead.facebook_url.replace(/https?:\/\/(www\.)?facebook\.com\/?/, '')}
                            </a>
                          </div>
                        )}
                        {lead.instagram_url && (
                          <div>
                            <span className="text-xs text-muted-foreground">Instagram</span>
                            <a href={lead.instagram_url.startsWith('http') ? lead.instagram_url : `https://instagram.com/${lead.instagram_url}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline block truncate">
                              {lead.instagram_url.replace(/https?:\/\/(www\.)?instagram\.com\/?/, '')}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {lead.ico && <CompanyFinancials ico={lead.ico} />}
                  </div>
                </div>

                {/* WEB & TRACKING Card */}
                <div className="p-4 rounded-lg border bg-card space-y-3">
                  <h4 className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                    <Globe className="h-3.5 w-3.5" />
                    Web & Tracking
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <span className="text-muted-foreground text-xs">Typ webu</span>
                        <p className="font-medium">{lead.is_ecommerce ? 'E-shop' : lead.business_type || '–'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Platforma</span>
                        <p className="font-medium">{lead.enrichment_platform || '–'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Vyspělost</span>
                        <p className="font-medium">{lead.marketing_maturity || '–'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Web</span>
                        <div className="flex items-center gap-1">
                          <InlineEditField
                            value={lead.website}
                            onSave={(v) => { updateLead(lead.id, { website: v }); toast.success('Uloženo'); }}
                            type="url"
                            placeholder="Zadat web"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Tracking badges */}
                    {(lead.has_ga4 !== null || lead.has_gtm !== null || lead.has_meta_pixel !== null || lead.has_google_ads !== null) && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                        {[
                          { value: lead.has_gtm, label: 'GTM' },
                          { value: lead.has_meta_pixel, label: 'Meta Pixel' },
                          { value: lead.has_google_ads, label: 'Google Ads' },
                          { value: lead.has_ga4, label: 'GA4' },
                        ].filter(b => b.value !== null && b.value !== undefined).map(b => (
                          <div key={b.label} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{b.label}</span>
                            <div className={cn(
                              "h-5 w-5 rounded flex items-center justify-center",
                              b.value ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                            )}>
                              {b.value ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* MARKETING Card */}
                <div className="p-4 rounded-lg border bg-card space-y-3">
                  <h4 className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Marketing
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <span className="text-muted-foreground text-xs">Kanály</span>
                        <p className="font-medium">{lead.enrichment_services_needed || '–'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Kdo řeší reklamu</span>
                        <p className="font-medium">{lead.marketing_experience || '–'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Grafický tým</span>
                        <p className="font-medium">{lead.has_creative_team || '–'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Ad spend</span>
                        <p className="font-medium">
                          {lead.enrichment_ad_spend_range || (lead.ad_spend_monthly ? `${lead.ad_spend_monthly.toLocaleString('cs-CZ')} Kč` : '–')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Zdroj</span>
                        <InlineEditField
                          value={lead.source || 'inbound'}
                          onSave={(v) => { updateLead(lead.id, { source: v as Lead['source'] }); toast.success('Uloženo'); }}
                          type="select"
                          options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
                        />
                      </div>
                    </div>
                    {lead.pain_point && (
                      <div className="p-2.5 rounded-lg border-l-4 border-red-400 bg-red-500/5">
                        <span className="text-xs text-muted-foreground block mb-0.5">🎯 Pain point</span>
                        <p className="text-sm font-medium">{lead.pain_point}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BOOKING / MEETING SECTION */}
              {(lead.booking_datetime || lead.booking_meet_link || lead.booking_status) && (
                <div className="p-4 rounded-lg border bg-card flex items-center gap-6 flex-wrap">
                  <h4 className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                    📅 Schůzka
                  </h4>
                  {lead.booking_datetime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                        ✓ {new Date(lead.booking_datetime).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Badge>
                    </div>
                  )}
                  {lead.booking_status && (
                    <div className="text-sm">
                      <span className="text-muted-foreground text-xs mr-1">Stav:</span>
                      <span className="font-medium">{lead.booking_status}</span>
                    </div>
                  )}
                  {lead.booking_meet_link && (
                    <a href={lead.booking_meet_link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                      🎥 Google Meet
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}
              {lead.company_research && (
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Research firmy (Perplexity)</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    <div className="p-4 rounded-lg border bg-card text-sm leading-relaxed whitespace-pre-wrap">
                      {lead.company_research}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Conversion status */}
              {lead.converted_to_client_id && (
                <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                  <p className="text-sm text-emerald-700 font-medium">✓ Lead byl převeden na zakázku</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lead.converted_at && new Date(lead.converted_at).toLocaleDateString('cs-CZ')}
                  </p>
                </div>
              )}

              <Separator />

              {/* === BOTTOM: Workflow + Notes in 2 columns === */}
              <div className="grid grid-cols-2 gap-5">
                {/* Left: Stage + Flow Stepper */}
                <div className="space-y-4">
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
                      onValueChange={(id) => { updateLead(lead.id, { owner_id: id }); toast.success('Majitel leadu byl změněn'); }}
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

                  <h4 className="text-sm font-medium text-muted-foreground">Proces odbavení</h4>
                  <LeadFlowStepper
                    lead={lead}
                    onSendMeetingRequest={() => setIsMeetingRequestOpen(true)}
                    onQuickConfirmMeetingSent={() => {
                      updateLead(lead.id, { meeting_request_sent_at: new Date().toISOString() });
                      toast.success('✓ Žádost o schůzku označena jako odeslaná');
                    }}
                    onRequestAccess={() => setIsRequestAccessOpen(true)}
                    onQuickConfirmAccessSent={() => {
                      updateLead(lead.id, { access_request_sent_at: new Date().toISOString(), stage: 'waiting_access' as LeadStage });
                      toast.success('✓ Žádost o přístupy označena jako odeslaná');
                    }}
                    onMarkAccessReceived={() => {
                      updateLead(lead.id, { access_received_at: new Date().toISOString(), stage: 'access_received' as LeadStage });
                      toast.success('🔑 Přístupy byly přijaty!');
                    }}
                    onAddService={() => setIsAddServiceOpen(true)}
                    onCreateOffer={() => setIsCreateOfferOpen(true)}
                    onSendOffer={() => setIsSendOfferOpen(true)}
                    onSendOnboarding={() => setIsOnboardingFormOpen(true)}
                    onSendContract={() => setIsContractDialogOpen(true)}
                    onMarkContractSent={() => { updateLead(lead.id, { contract_sent_at: new Date().toISOString() }); toast.success('✉️ Smlouva odeslaná'); }}
                    onMarkContractSigned={() => { updateLead(lead.id, { contract_signed_at: new Date().toISOString() }); toast.success('✅ Smlouva podepsána!'); }}
                    onConvert={handleConvertClick}
                    onRemoveService={(index) => {
                      const currentServices = [...(lead.potential_services || [])];
                      currentServices.splice(index, 1);
                      const newEstimatedPrice = currentServices.reduce((sum, s) => sum + s.price, 0);
                      updateLead(lead.id, { potential_services: currentServices, estimated_price: newEstimatedPrice });
                      toast.success('Služba odebrána');
                    }}
                  />
                </div>

                {/* Right: Notes + Timeline */}
                <div className="space-y-4">
                  {/* Inline note form */}
                  <div className="space-y-2 p-3 rounded-lg border bg-card">
                    <div className="flex gap-1 flex-wrap">
                      {([
                        { type: 'general' as const, icon: <MessageSquare className="h-3 w-3" />, label: 'Poznámka' },
                        { type: 'call' as const, icon: <Phone className="h-3 w-3" />, label: 'Hovor' },
                        { type: 'email_sent' as const, icon: <Send className="h-3 w-3" />, label: 'Odeslaný' },
                        { type: 'email_received' as const, icon: <Mail className="h-3 w-3" />, label: 'Přijatý' },
                        { type: 'internal' as const, icon: <Lock className="h-3 w-3" />, label: 'Interní' },
                      ]).map(({ type, icon, label }) => (
                        <Button key={type} variant={noteType === type ? 'default' : 'outline'} size="sm" className="gap-1 text-xs h-7" onClick={() => setNoteType(type)}>
                          {icon} {label}
                        </Button>
                      ))}
                    </div>
                    {noteType === 'call' && (
                      <Input type="datetime-local" value={callDate} onChange={(e) => setCallDate(e.target.value)} className="h-8 text-xs" />
                    )}
                    {(noteType === 'email_sent' || noteType === 'email_received') && (
                      <>
                        <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="h-8 text-xs" placeholder="Předmět" />
                        <Input value={emailRecipients} onChange={(e) => setEmailRecipients(e.target.value)} className="h-8 text-xs" placeholder={noteType === 'email_sent' ? 'Příjemci' : 'Od koho'} />
                      </>
                    )}
                    <Textarea
                      placeholder={noteType === 'call' ? 'Co bylo probíráno...' : noteType === 'internal' ? 'Interní poznámka...' : 'Přidat poznámku...'}
                      value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} className="text-sm min-h-[60px]"
                    />
                    <Button size="sm" className="h-7 text-xs" onClick={handleInlineNoteSubmit} disabled={!noteText.trim()}>
                      <Plus className="h-3 w-3 mr-1" /> Přidat
                    </Button>
                  </div>

                  {/* Timeline */}
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
                          updateLead(lead.id, { access_received_at: new Date().toISOString(), stage: 'access_received' as LeadStage });
                          toast.success('🔑 Přístupy byly přijaty!');
                        }}
                        onMarkContractSent={() => { updateLead(lead.id, { contract_sent_at: new Date().toISOString() }); toast.success('✉️ Smlouva odeslaná'); }}
                        onMarkContractSigned={() => { updateLead(lead.id, { contract_signed_at: new Date().toISOString() }); toast.success('✅ Smlouva podepsána!'); }}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>

              {/* Meta */}
              <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Vytvořeno: {new Date(lead.created_at).toLocaleDateString('cs-CZ')}</span>
                  <span>•</span>
                  <span>Aktualizace: {new Date(lead.updated_at).toLocaleDateString('cs-CZ')}</span>
                </div>
              </div>
            </div>
          </ScrollArea>
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

      <SendMeetingRequestDialog
        open={isMeetingRequestOpen}
        onOpenChange={setIsMeetingRequestOpen}
        contactName={lead.contact_name}
        contactEmail={lead.contact_email}
        companyName={lead.company_name}
        leadId={lead.id}
        onSent={(emailData) => {
          updateLead(lead.id, {
            meeting_request_sent_at: new Date().toISOString(),
          });
          if (emailData) {
            addNote(lead.id, emailData.body, 'email_sent', null, emailData.subject, emailData.recipients);
          }
        }}
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
        onSuccess={(token, offerUrl, syncData) => {
          setSharedOfferUrl(offerUrl);
          const updateData: Partial<Lead> = {
            offer_url: offerUrl,
            offer_created_at: new Date().toISOString(),
          };
          // Sync services from offer back to lead's potential_services
          if (syncData?.services) {
            const syncedServices: LeadService[] = syncData.services.map(s => {
              const catalogService = services.find(cs => cs.id === s.service_id);
              const isCB = catalogService?.code === 'CREATIVE_BOOST';
              return {
                id: s.id,
                service_id: s.service_id,
                name: s.name,
                selected_tier: s.selected_tier,
                price: isCB && syncData.cbCredits && syncData.cbPricePerCredit
                  ? syncData.cbCredits * syncData.cbPricePerCredit
                  : s.price,
                currency: s.currency,
                billing_type: s.billing_type,
                intro_discount_percent: syncData.introDiscountPercent && s.billing_type === 'monthly'
                  ? syncData.introDiscountPercent : null,
                intro_discount_months: syncData.introDiscountMonths && s.billing_type === 'monthly'
                  ? syncData.introDiscountMonths : null,
                creative_boost_credits: isCB ? syncData.cbCredits || null : null,
                creative_boost_price_per_credit: isCB ? syncData.cbPricePerCredit || null : null,
              };
            });
            updateData.potential_services = syncedServices;
            updateData.estimated_price = syncedServices.reduce((sum, s) => sum + s.price, 0);
          }
          updateLead(lead.id, updateData);
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

      <SendContractDialog
        open={isContractDialogOpen}
        onOpenChange={setIsContractDialogOpen}
        lead={lead}
        onSend={(data) => {
          updateLead(lead.id, {
            contract_url: data.contract_url,
            digisign_envelope_id: data.digisign_envelope_id,
            digisign_document_url: data.digisign_document_url,
            contract_sent_at: data.contract_sent_at,
          });
          toast.success('📄 Smlouva připravena a odeslána via DigiSign');
        }}
      />
    </>
  );
}
