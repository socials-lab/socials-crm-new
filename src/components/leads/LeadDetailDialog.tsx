import { useState, useRef } from 'react';
import { 
  Building2, 
  Globe, 
  User, 
  Mail, 
  Phone, 
  ExternalLink, 
  Pencil, 
  TrendingUp,
  ArrowRightLeft,
  FileText,
  MapPin,
  Clock,
  Coins,
  Plus,
  Trash2,
  Package,
  CheckCircle2,
  Link2,
  Eye,
  Info
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { LeadCommunicationTimeline } from './LeadCommunicationTimeline';
import { LeadNotesTab } from './LeadNotesTab';
import type { Lead, LeadStage, LeadService, LeadNoteType } from '@/types/crm';
import type { PendingTransition } from '@/types/leadTransitions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LeadDetailDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (lead: Lead) => void;
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

export function LeadDetailDialog({ lead: leadProp, open, onOpenChange, onEdit }: LeadDetailDialogProps) {
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
  const isProcessingWarning = useRef(false);

  const lead = leadProp?.id ? getLeadById(leadProp.id) ?? leadProp : leadProp;

  if (!lead) return null;

  const owner = colleagues.find(c => c.id === lead.owner_id);
  const canConvert = !lead.converted_to_client_id && !['won', 'lost'].includes(lead.stage);
  const history = getLeadHistory(lead.id);

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

  const handleAddNote = (text: string, noteType: LeadNoteType, callDate: string | null) => {
    addNote(lead.id, text, noteType, callDate);
    toast.success('Poznámka byla přidána');
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

  const handleRemoveService = (serviceId: string) => {
    const currentServices = lead.potential_services || [];
    const updatedServices = currentServices.filter(s => s.id !== serviceId);
    const newEstimatedPrice = updatedServices.reduce((sum, s) => sum + s.price, 0);
    updateLead(lead.id, {
      potential_services: updatedServices,
      estimated_price: newEstimatedPrice,
    });
    toast.success('Služba byla odebrána z nabídky');
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

  const accessNotReceived = !lead.access_received_at;

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
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b flex-shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <DialogTitle className="text-xl font-semibold">{lead.company_name}</DialogTitle>
                <Badge variant="outline" className={cn("text-xs", STAGE_COLORS[lead.stage])}>
                  {STAGE_LABELS[lead.stage]}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span>IČO: {lead.ico}</span>
                {owner && <span>• {owner.full_name}</span>}
                {lead.estimated_price > 0 && (
                  <span>• {lead.estimated_price.toLocaleString()} {lead.currency}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={() => onEdit(lead)}>
                <Pencil className="h-4 w-4 mr-1" />
                Upravit
              </Button>
              {canConvert && (
                <Button size="sm" onClick={handleConvertClick}>
                  <ArrowRightLeft className="h-4 w-4 mr-1" />
                  Převést
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-6 mt-3 mb-0 w-fit">
              <TabsTrigger value="overview">Přehled</TabsTrigger>
              <TabsTrigger value="communication">Komunikace</TabsTrigger>
              <TabsTrigger value="offer">Nabídka</TabsTrigger>
              <TabsTrigger value="notes" className="gap-1">
                Poznámky
                {lead.notes.length > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-1">
                    {lead.notes.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ===== TAB: PŘEHLED ===== */}
            <TabsContent value="overview" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {/* Two column layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left column */}
                    <div className="space-y-5">
                      {/* Company Info */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          Firemní údaje
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-muted-foreground text-xs">IČO</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{lead.ico}</span>
                                <a
                                  href={`https://ares.gov.cz/ekonomicke-subjekty/res/${lead.ico}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  ARES
                                </a>
                              </div>
                            </div>
                            {lead.dic && (
                              <div>
                                <span className="text-muted-foreground text-xs">DIČ</span>
                                <p className="font-medium">{lead.dic}</p>
                              </div>
                            )}
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
                              <span className="text-muted-foreground text-xs">Jednatelé</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {lead.directors.map((d, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{d}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {lead.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {lead.website}
                              </a>
                            </div>
                          )}
                          {lead.industry && (
                            <p className="text-muted-foreground">Obor: {lead.industry}</p>
                          )}
                          {lead.ico && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                              <span>Obrat firmy:</span>
                              <a
                                href={`https://or.justice.cz/ias/ui/rejstrik-$firma?ico=${lead.ico}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                hledat na Justice.cz
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Contact */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Kontaktní osoba
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lead.contact_name}</span>
                            {lead.contact_position && (
                              <span className="text-muted-foreground">– {lead.contact_position}</span>
                            )}
                          </div>
                          {lead.contact_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <a href={`mailto:${lead.contact_email}`} className="text-primary hover:underline">
                                {lead.contact_email}
                              </a>
                            </div>
                          )}
                          {lead.contact_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <a href={`tel:${lead.contact_phone}`} className="text-primary hover:underline">
                                {lead.contact_phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-5">
                      {/* Sales info */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          Obchodní informace
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Stav leadu</label>
                            <Select value={lead.stage} onValueChange={handleStageChange}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STAGE_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <label className="text-xs text-muted-foreground">Odpovědná osoba</label>
                              <Select 
                                value={lead.owner_id} 
                                onValueChange={(id) => {
                                  updateLead(lead.id, { owner_id: id });
                                  toast.success('Majitel leadu byl změněn');
                                }}
                              >
                                <SelectTrigger className="mt-1 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background">
                                  {colleagues.filter(c => c.status === 'active').map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Zdroj</span>
                              <p className="font-medium text-sm mt-1">
                                {lead.source === 'other' && lead.source_custom 
                                  ? lead.source_custom 
                                  : SOURCE_LABELS[lead.source]}
                              </p>
                            </div>
                          </div>

                          {lead.ad_spend_monthly && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                              <Coins className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Měsíční investice:</span>
                              <span className="font-medium">{lead.ad_spend_monthly.toLocaleString()} Kč</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Billing */}
                      {(lead.billing_street || lead.billing_city || lead.billing_email) && (
                        <>
                          <Separator />
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              Fakturační údaje
                            </h4>
                            <div className="space-y-2 text-sm">
                              {(lead.billing_street || lead.billing_city) && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    {lead.billing_street && <p>{lead.billing_street}</p>}
                                    {(lead.billing_zip || lead.billing_city) && (
                                      <p>{[lead.billing_zip, lead.billing_city].filter(Boolean).join(' ')}</p>
                                    )}
                                    {lead.billing_country && <p>{lead.billing_country}</p>}
                                  </div>
                                </div>
                              )}
                              {lead.billing_email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <a href={`mailto:${lead.billing_email}`} className="text-primary hover:underline">
                                    {lead.billing_email}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Client message */}
                  {lead.client_message && (
                    <div className="p-3 rounded-lg border-l-4 border-primary/50 bg-muted/30">
                      <span className="text-xs text-muted-foreground block mb-1">Zpráva od klienta:</span>
                      <p className="text-sm italic">"{lead.client_message}"</p>
                    </div>
                  )}

                  {/* Summary */}
                  {lead.summary && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <span className="text-xs text-muted-foreground block mb-1">Shrnutí:</span>
                      <p className="text-sm">{lead.summary}</p>
                    </div>
                  )}

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
                  <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
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
            </TabsContent>

            {/* ===== TAB: KOMUNIKACE ===== */}
            <TabsContent value="communication" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-6">
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
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ===== TAB: NABÍDKA ===== */}
            <TabsContent value="offer" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {/* Services */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        Služby v nabídce
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddServiceOpen(true)}
                        disabled={accessNotReceived}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Přidat
                      </Button>
                    </div>

                    {accessNotReceived && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700">
                        <Info className="h-4 w-4 flex-shrink-0" />
                        Služby lze přidávat až po nasdílení přístupů klientem.
                      </div>
                    )}

                    <div className="space-y-2">
                      {lead.potential_services && lead.potential_services.length > 0 ? (
                        lead.potential_services.map((service) => (
                          <div key={service.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                            <div>
                              <p className="font-medium text-sm">{service.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {service.selected_tier && (
                                  <Badge variant="outline" className="text-xs">{service.selected_tier.toUpperCase()}</Badge>
                                )}
                                <span>{service.billing_type === 'monthly' ? 'měsíčně' : 'jednorázově'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{service.price.toLocaleString()} {service.currency}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveService(service.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg border-dashed">
                          Žádné služby v nabídce
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    {(() => {
                      const hasServices = lead.potential_services && lead.potential_services.length > 0;
                      const totalPrice = hasServices ? lead.potential_services.reduce((sum, s) => sum + s.price, 0) : 0;
                      return (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <span className="text-xs text-muted-foreground">Celková cena</span>
                          {hasServices ? (
                            <p className="text-lg font-semibold">
                              {totalPrice.toLocaleString()} {lead.currency}
                              {lead.offer_type === 'retainer' && <span className="text-sm font-normal">/měs</span>}
                            </p>
                          ) : (
                            <p className="text-lg text-muted-foreground italic">Není stanovena</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <Separator />

                  {/* Offer Link */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      Sdílená nabídka
                    </h4>
                    
                    {sharedOfferUrl || lead.offer_url ? (
                      <div className="space-y-2 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <a
                            href={sharedOfferUrl || lead.offer_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Otevřít nabídku
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7"
                            onClick={() => {
                              navigator.clipboard.writeText(sharedOfferUrl || lead.offer_url || '');
                              toast.success('Odkaz zkopírován');
                            }}
                          >
                            Kopírovat link
                          </Button>
                        </div>
                        {lead.offer_created_at && (
                          <p className="text-xs text-muted-foreground">
                            Vytvořeno: {new Date(lead.offer_created_at).toLocaleDateString('cs-CZ')}
                          </p>
                        )}
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setIsCreateOfferOpen(true)}>
                          Vytvořit novou nabídku
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => setIsCreateOfferOpen(true)}
                          disabled={(lead.potential_services?.length || 0) === 0}
                        >
                          <Link2 className="h-4 w-4 mr-2" />
                          Vytvořit sdílenou nabídku
                        </Button>
                        {(lead.potential_services?.length || 0) === 0 && (
                          <p className="text-xs text-muted-foreground text-center">
                            Nejprve přidejte služby do nabídky
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Offer sent status */}
                  {lead.offer_sent_at && (
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        Nabídka odeslána {new Date(lead.offer_sent_at).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ===== TAB: POZNÁMKY ===== */}
            <TabsContent value="notes" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <LeadNotesTab lead={lead} onAddNote={handleAddNote} />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
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
        onSent={(platforms) => {
          updateLead(lead.id, {
            access_request_sent_at: new Date().toISOString(),
            access_request_platforms: platforms,
            stage: 'waiting_access' as LeadStage,
          });
        }}
      />

      <SendOnboardingFormDialog
        open={isOnboardingFormOpen}
        onOpenChange={setIsOnboardingFormOpen}
        lead={lead}
        onSent={(formUrl) => {
          updateLead(lead.id, {
            onboarding_form_sent_at: new Date().toISOString(),
            onboarding_form_url: formUrl,
          });
        }}
      />

      <SendOfferDialog
        open={isSendOfferOpen}
        onOpenChange={setIsSendOfferOpen}
        lead={lead}
        onSent={(ownerId) => {
          updateLead(lead.id, {
            offer_sent_at: new Date().toISOString(),
            offer_sent_by_id: ownerId,
            stage: 'offer_sent' as LeadStage,
          });
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
