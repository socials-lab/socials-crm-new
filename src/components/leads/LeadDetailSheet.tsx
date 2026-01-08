import { useState, useRef, useMemo } from 'react';
import { 
  Building2, 
  Globe, 
  User, 
  Mail, 
  Phone, 
  ExternalLink, 
  Pencil, 
  MessageSquare,
  TrendingUp,
  ArrowRightLeft,
  FileText,
  MapPin,
  Clock,
  Loader2,
  Coins,
  Plus,
  Trash2,
  Package,
  KeyRound,
  ClipboardList,
  FileSignature,
  CheckCircle2,
  Send,
  Check,
  Link2,
  Eye
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { ConvertLeadDialog } from './ConvertLeadDialog';
import { LeadHistoryDialog } from './LeadHistoryDialog';
import { AddLeadServiceDialog } from './AddLeadServiceDialog';
import { RequestAccessDialog } from './RequestAccessDialog';
import { SendOnboardingFormDialog } from './SendOnboardingFormDialog';
import { SendOfferDialog } from './SendOfferDialog';
import { CreateOfferDialog } from './CreateOfferDialog';
import type { Lead, LeadStage, LeadService } from '@/types/crm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LeadDetailSheetProps {
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

const SOURCE_LABELS: Record<Lead['source'], string> = {
  referral: 'Doporučení',
  inbound: 'Inbound',
  cold_outreach: 'Cold outreach',
  event: 'Event/konference',
  linkedin: 'LinkedIn',
  website: 'Web',
  other: 'Jiný',
};

export function LeadDetailSheet({ lead, open, onOpenChange, onEdit }: LeadDetailSheetProps) {
  const { updateLeadStage, updateLead, addNote, getLeadHistory } = useLeadsData();
  const { colleagues, services } = useCRMData();
  const [noteText, setNoteText] = useState('');
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isRequestAccessOpen, setIsRequestAccessOpen] = useState(false);
  const [isOnboardingFormOpen, setIsOnboardingFormOpen] = useState(false);
  const [isSendOfferOpen, setIsSendOfferOpen] = useState(false);
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);
  const [sharedOfferUrl, setSharedOfferUrl] = useState<string | null>(null);
  const [showContractWarning, setShowContractWarning] = useState(false);
  const [showOnboardingWarning, setShowOnboardingWarning] = useState(false);
  const isProcessingWarning = useRef(false);

  if (!lead) return null;


  const owner = colleagues.find(c => c.id === lead.owner_id);
  const canConvert = !lead.converted_to_client_id && !['won', 'lost'].includes(lead.stage);
  const history = getLeadHistory(lead.id);
  const handleStageChange = (newStage: LeadStage) => {
    updateLeadStage(lead.id, newStage);
    toast.success('Stav leadu byl změněn');
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNote(lead.id, noteText.trim());
    setNoteText('');
    toast.success('Poznámka byla přidána');
  };

  const handleCreateOffer = async () => {
    if (!lead) return;
    setIsCreatingOffer(true);
    
    // Mock API call - simulate Notion integration
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const slug = lead.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const mockNotionUrl = `https://notion.so/socials/nabidka-${slug}-${Date.now()}`;
    
    updateLead(lead.id, {
      offer_url: mockNotionUrl,
      offer_created_at: new Date().toISOString(),
    });
    
    setIsCreatingOffer(false);
    toast.success('Nabídka byla vytvořena v Notion');
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

  // Handle convert button click - check warnings in sequence
  const handleConvertClick = () => {
    const hasOnboardingCompleted = lead.onboarding_form_completed_at !== null && lead.onboarding_form_completed_at !== undefined;
    const hasContract = lead.contract_url !== null && lead.contract_url !== undefined;
    
    if (!hasOnboardingCompleted) {
      // Step 1: Show onboarding warning first
      setShowOnboardingWarning(true);
    } else if (!hasContract) {
      // Step 2: Show contract warning
      setShowContractWarning(true);
    } else {
      // All OK, open convert dialog directly
      setIsConvertOpen(true);
    }
  };

  // Called after user confirms onboarding warning
  const handleOnboardingWarningConfirm = () => {
    if (isProcessingWarning.current) return;
    isProcessingWarning.current = true;
    
    const hasContract = lead.contract_url !== null && lead.contract_url !== undefined;
    // Use setTimeout to ensure the first dialog closes before opening the next
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
              Klient zatím nevyplnil onboarding formulář. Bez něj nebudete mít kompletní údaje o firmě a kontaktech.
              Opravdu chcete pokračovat s převodem na zakázku?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Zrušit
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleOnboardingWarningConfirm}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Ano, přesto pokračovat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contract Warning Dialog - shown AFTER onboarding warning */}
      <AlertDialog open={showContractWarning} onOpenChange={setShowContractWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚠️ Smlouva nebyla podepsána
            </AlertDialogTitle>
            <AlertDialogDescription>
              Pro tento lead zatím nebyla vytvořena nebo podepsána smlouva. 
              Opravdu chcete pokračovat s převodem na zakázku bez podepsané smlouvy?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Zrušit
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setTimeout(() => {
                  setIsConvertOpen(true);
                }, 100);
              }}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Ano, pokračovat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">{lead.company_name}</SheetTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsHistoryOpen(true)}>
                  <Clock className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(lead)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Upravit
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">IČO: {lead.ico}</p>
          </SheetHeader>


          <div className="mt-6 space-y-6">
            {/* Company Info Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Firemní údaje
              </h4>
              
              <div className="space-y-3 text-sm">
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

                {lead.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={lead.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {lead.website}
                    </a>
                  </div>
                )}
                {lead.industry && (
                  <p className="text-muted-foreground">Obor: {lead.industry}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Billing Address Section */}
            {(lead.billing_street || lead.billing_city || lead.billing_email) && (
              <>
                <div className="space-y-4">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Fakturační údaje
                  </h4>
                  
                  <div className="space-y-3 text-sm">
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
                        <a 
                          href={`mailto:${lead.billing_email}`}
                          className="text-primary hover:underline"
                        >
                          {lead.billing_email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Contact Section */}
            <div className="space-y-4">
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
                  <div className="flex items-center gap-2 ml-0">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <a 
                      href={`mailto:${lead.contact_email}`}
                      className="text-primary hover:underline"
                    >
                      {lead.contact_email}
                    </a>
                  </div>
                )}
                
                {lead.contact_phone && (
                  <div className="flex items-center gap-2 ml-0">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <a 
                      href={`tel:${lead.contact_phone}`}
                      className="text-primary hover:underline"
                    >
                      {lead.contact_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Sales Info Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Obchodní informace</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Stav leadu</label>
                  <Select value={lead.stage} onValueChange={handleStageChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STAGE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-xs text-muted-foreground">Odpovědná osoba</label>
                    <Select 
                      value={lead.owner_id} 
                      onValueChange={(newOwnerId) => {
                        updateLead(lead.id, { owner_id: newOwnerId });
                        toast.success('Majitel leadu byl změněn');
                      }}
                    >
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        {colleagues.filter(c => c.status === 'active').map((colleague) => (
                          <SelectItem key={colleague.id} value={colleague.id}>
                            {colleague.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Zdroj:</span>
                    <p className="font-medium">
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

                {lead.client_message && (
                  <div className="p-3 rounded-lg border-l-4 border-primary/50 bg-muted/30">
                    <span className="text-xs text-muted-foreground block mb-1">Zpráva od klienta:</span>
                    <p className="text-sm italic">"{lead.client_message}"</p>
                  </div>
                )}

              </div>
            </div>

            <Separator />

            {/* ========== STEP 1: SLUŽBY V NABÍDCE ========== */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                  📦 Služby v nabídce
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddServiceOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Přidat
                </Button>
              </div>
              
              {/* Services list */}
              <div className="space-y-2">
                {lead.potential_services && lead.potential_services.length > 0 ? (
                  lead.potential_services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-sm">{service.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {service.selected_tier && (
                              <Badge variant="outline" className="text-xs">
                                {service.selected_tier.toUpperCase()}
                              </Badge>
                            )}
                            <span>
                              {service.billing_type === 'monthly' ? 'měsíčně' : 'jednorázově'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {service.price.toLocaleString()} {service.currency}
                        </span>
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
                  <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg border-dashed">
                    Žádné služby v nabídce
                  </div>
                )}
              </div>

              {/* Total price */}
              {(() => {
                const hasServices = lead.potential_services && lead.potential_services.length > 0;
                const totalPrice = hasServices
                  ? lead.potential_services.reduce((sum, s) => sum + s.price, 0)
                  : 0;
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

            {/* ========== STEP 2: KOMUNIKACE S KLIENTEM ========== */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                💬 Komunikace s klientem
              </h4>
              
              {/* Access Request */}
              <div className={cn(
                "p-3 rounded-lg border",
                lead.access_request_sent_at ? "border-green-500/30 bg-green-500/5" : "bg-card"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Žádost o přístupy</p>
                        {lead.access_request_sent_at && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </div>
                      {lead.access_request_sent_at ? (
                        <div className="text-xs text-green-700">
                          ✓ Odesláno {new Date(lead.access_request_sent_at).toLocaleDateString('cs-CZ')}
                          {lead.access_request_platforms.length > 0 && (
                            <span className="block text-muted-foreground">{lead.access_request_platforms.join(', ')}</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Zatím neodesláno</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRequestAccessOpen(true)}
                  >
                    {lead.access_request_sent_at ? 'Znovu odeslat' : 'Odeslat'}
                  </Button>
                </div>
              </div>

              {/* Access Received */}
              {lead.access_request_sent_at && (
                <div className={cn(
                  "p-3 rounded-lg border",
                  lead.access_received_at 
                    ? "border-green-500/30 bg-green-500/5" 
                    : "border-amber-500/30 bg-amber-500/5"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lead.access_received_at ? '🔑' : '⏳'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {lead.access_received_at ? 'Přístupy nasdíleny' : 'Čekáme na přístupy'}
                          </p>
                          {lead.access_received_at && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        {lead.access_received_at ? (
                          <p className="text-xs text-green-700">
                            ✓ {new Date(lead.access_received_at).toLocaleDateString('cs-CZ', {
                              day: 'numeric',
                              month: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        ) : (
                          <p className="text-xs text-amber-600">Klient ještě nenasdílel</p>
                        )}
                      </div>
                    </div>
                    {!lead.access_received_at && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          updateLead(lead.id, { 
                            access_received_at: new Date().toISOString(),
                            stage: 'access_received' as LeadStage 
                          });
                          toast.success('🔑 Přístupy byly přijaty!');
                        }}
                      >
                        ✓ Přijato
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* ========== STEP 3: NABÍDKA ========== */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
                📄 Nabídka
              </h4>

              {/* Shared offer - NEW */}
              <div className={cn(
                "p-3 rounded-lg border",
                sharedOfferUrl || lead.offer_url ? "border-green-500/30 bg-green-500/5" : "bg-card"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Sdílená nabídka</span>
                  {(sharedOfferUrl || lead.offer_url) && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </div>
                
                {sharedOfferUrl || lead.offer_url ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setIsCreateOfferOpen(true)}
                    >
                      Vytvořit novou nabídku
                    </Button>
                  </div>
                ) : (
                  <>
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
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Nejprve přidejte služby do nabídky
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Send Offer */}
              <div className={cn(
                "p-3 rounded-lg border",
                lead.offer_sent_at ? "border-green-500/30 bg-green-500/5" : "bg-card"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Odeslání nabídky</p>
                        {lead.offer_sent_at && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </div>
                      {lead.offer_sent_at ? (
                        <p className="text-xs text-green-700">
                          ✓ Odesláno {new Date(lead.offer_sent_at).toLocaleDateString('cs-CZ', {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {lead.offer_sent_by_id && (
                            <span className="ml-1">
                              od {colleagues.find(c => c.id === lead.offer_sent_by_id)?.full_name}
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {lead.offer_url ? 'Připraveno k odeslání' : 'Nejprve vytvořte nabídku'}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant={lead.offer_sent_at ? "outline" : "default"}
                    size="sm"
                    onClick={() => setIsSendOfferOpen(true)}
                    disabled={!lead.offer_url}
                  >
                    {lead.offer_sent_at ? 'Znovu odeslat' : 'Odeslat'}
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* ========== STEP 4: ONBOARDING ========== */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
                📋 Onboarding
              </h4>
              
              {/* Onboarding Form */}
              <div className={cn(
                "p-3 rounded-lg border",
                lead.onboarding_form_completed_at 
                  ? "border-green-500/30 bg-green-500/5" 
                  : lead.onboarding_form_sent_at 
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "bg-card"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Onboarding formulář</p>
                        {lead.onboarding_form_completed_at && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </div>
                      {lead.onboarding_form_completed_at ? (
                        <p className="text-xs text-green-700">
                          ✓ Vyplněno {new Date(lead.onboarding_form_completed_at).toLocaleDateString('cs-CZ', { 
                            day: 'numeric', 
                            month: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      ) : lead.onboarding_form_sent_at ? (
                        <div className="text-xs">
                          <span className="text-amber-600">⏳ Čeká na vyplnění</span>
                          <span className="text-muted-foreground block">
                            Odesláno {new Date(lead.onboarding_form_sent_at).toLocaleDateString('cs-CZ')}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Zatím neodesláno</p>
                      )}
                    </div>
                  </div>
                  {!lead.onboarding_form_completed_at && (
                    <Button
                      variant={lead.onboarding_form_sent_at ? "outline" : "default"}
                      size="sm"
                      onClick={() => setIsOnboardingFormOpen(true)}
                    >
                      {lead.onboarding_form_sent_at ? 'Znovu odeslat' : 'Odeslat'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Contract Creation */}
              <div className={cn(
                "p-3 rounded-lg border",
                lead.contract_url ? "border-green-500/30 bg-green-500/5" : "bg-card"
              )}>
                <div className="flex items-center gap-2">
                  <FileSignature className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Smlouva vytvořena</p>
                      {lead.contract_url && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                    {lead.contract_url ? (
                      <div className="space-y-1">
                        <p className="text-xs text-green-700">
                          ✓ Vytvořeno {lead.contract_created_at && new Date(lead.contract_created_at).toLocaleDateString('cs-CZ', {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <a
                          href={lead.contract_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Otevřít smlouvu
                        </a>
                      </div>
                    ) : lead.onboarding_form_completed_at ? (
                      <p className="text-xs text-amber-600">⏳ Čeká na vytvoření</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Bude vytvořena po vyplnění formuláře</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contract Sending - shown after contract is created */}
              {lead.contract_url && (
                <div className={cn(
                  "p-3 rounded-lg border",
                  lead.contract_sent_at ? "border-green-500/30 bg-green-500/5" : "bg-card"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">Smlouva odeslána</p>
                          {lead.contract_sent_at && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        {lead.contract_sent_at ? (
                          <p className="text-xs text-green-700">
                            ✓ Odesláno {new Date(lead.contract_sent_at).toLocaleDateString('cs-CZ', {
                              day: 'numeric',
                              month: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Připraveno k odeslání</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={lead.contract_sent_at ? "outline" : "default"}
                      size="sm"
                      onClick={() => {
                        updateLead(lead.id, { 
                          contract_sent_at: new Date().toISOString()
                        });
                        toast.success('✉️ Smlouva byla označena jako odeslaná');
                      }}
                    >
                      {lead.contract_sent_at ? '↺ Znovu' : '✉️ Odesláno'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Contract Signed - shown after contract is sent */}
              {lead.contract_sent_at && (
                <div className={cn(
                  "p-3 rounded-lg border",
                  lead.contract_signed_at 
                    ? "border-green-500/30 bg-green-500/5" 
                    : "border-amber-500/30 bg-amber-500/5"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lead.contract_signed_at ? '✅' : '⏳'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {lead.contract_signed_at ? 'Smlouva podepsána' : 'Čekáme na podpis'}
                          </p>
                          {lead.contract_signed_at && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        {lead.contract_signed_at ? (
                          <p className="text-xs text-green-700">
                            ✓ Podepsáno {new Date(lead.contract_signed_at).toLocaleDateString('cs-CZ', {
                              day: 'numeric',
                              month: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        ) : (
                          <p className="text-xs text-amber-600">Klient ještě nepodepsal</p>
                        )}
                      </div>
                    </div>
                    {!lead.contract_signed_at && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          updateLead(lead.id, { 
                            contract_signed_at: new Date().toISOString()
                          });
                          toast.success('✅ Smlouva byla podepsána!');
                        }}
                      >
                        ✓ Podepsáno
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* ========== STEP 5: KONVERZE ========== */}
            {canConvert && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">5</span>
                  🎯 Konverze na zakázku
                </h4>
                
                {/* Status summary */}
                <div className="grid grid-cols-2 gap-2">
                  <div className={cn(
                    "p-2 rounded-lg border text-center text-xs",
                    lead.onboarding_form_completed_at 
                      ? "border-green-500/30 bg-green-500/5 text-green-700"
                      : "border-amber-500/30 bg-amber-500/5 text-amber-700"
                  )}>
                    {lead.onboarding_form_completed_at ? '✓ Formulář vyplněn' : '⚠️ Formulář nevyplněn'}
                  </div>
                  <div className={cn(
                    "p-2 rounded-lg border text-center text-xs",
                    lead.contract_signed_at 
                      ? "border-green-500/30 bg-green-500/5 text-green-700"
                      : "border-amber-500/30 bg-amber-500/5 text-amber-700"
                  )}>
                    {lead.contract_signed_at ? '✓ Smlouva podepsána' : '📝 Smlouva nepodepsána'}
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  variant="default"
                  size="lg"
                  onClick={handleConvertClick}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Převést na zakázku
                </Button>
              </div>
            )}

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

            <Separator />


            {/* Notes Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Poznámky / historie
              </h4>

              <div className="space-y-2">
                <Textarea
                  placeholder="Přidat poznámku..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                />
                <Button 
                  size="sm" 
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                >
                  Přidat poznámku
                </Button>
              </div>

              <div className="space-y-3">
                {lead.notes.map(note => (
                  <div key={note.id} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{note.author_name}</span>
                      <span>{new Date(note.created_at).toLocaleDateString('cs-CZ')}</span>
                    </div>
                    <p className="text-sm">{note.text}</p>
                  </div>
                ))}
                {lead.notes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Zatím žádné poznámky
                  </p>
                )}
              </div>
            </div>

            {/* Meta info */}
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
        </SheetContent>
      </Sheet>

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
    </>
  );
}
