import { useState, useRef, useEffect, useMemo } from 'react';
import { Loader2, ShieldCheck, ShieldAlert, ShieldX, FileSignature, CheckCircle2 } from 'lucide-react';
import {
  Building2,
  Globe,
  User,
  Users,
  Mail,
  Phone,
  ExternalLink,
  TrendingUp,
  MapPin,
  Clock,
  Coins,
  ChevronDown,
  MessageSquare,
  Lock,
  Plus,
  Send,
  Scale,
  Trash2,
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
import { useAresLookup } from '@/hooks/useAresLookup';
import { useDigiSign } from '@/hooks/useDigiSign';
import { ConvertLeadDialog } from './ConvertLeadDialog';
import { LeadHistoryDialog } from './LeadHistoryDialog';
import { AddLeadServiceDialog } from './AddLeadServiceDialog';
import { RequestAccessDialog } from './RequestAccessDialog';
import { SendMeetingRequestDialog } from './SendMeetingRequestDialog';
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
  const { updateLeadStage, updateLead, deleteLead, addNote, getLeadHistory, getLeadById } = useLeadsData();
  const { colleagues, services } = useCRMData();
  const { confirmTransition, isConfirming } = useLeadTransitions();
  const { lookupCompany, isLoading: isLoadingAres } = useAresLookup();
  const { createContract, isLoading: isCreatingContract } = useDigiSign();
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isRequestAccessOpen, setIsRequestAccessOpen] = useState(false);
  const [isMeetingRequestOpen, setIsMeetingRequestOpen] = useState(false);
  const [isOnboardingFormOpen, setIsOnboardingFormOpen] = useState(false);
  const [isSendOfferOpen, setIsSendOfferOpen] = useState(false);
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);
  const [sharedOfferUrl, setSharedOfferUrl] = useState<string | null>(null);
  const [showContractWarning, setShowContractWarning] = useState(false);
  const [showOnboardingWarning, setShowOnboardingWarning] = useState(false);
  const [isContractConfirmOpen, setIsContractConfirmOpen] = useState(false);
  const [isManualSignConfirmOpen, setIsManualSignConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingLead, setIsDeletingLead] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  // Inline note form state
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<LeadNoteType>('general');
  const [callDate, setCallDate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [pendingIcoChange, setPendingIcoChange] = useState<string | null>(null);
  const isProcessingWarning = useRef(false);

  const lead = leadProp?.id ? getLeadById(leadProp.id) ?? leadProp : leadProp;

  // Contract readiness validation
  const contractReadiness = useMemo(() => {
    const leadServices = lead?.potential_services || [];
    const signatories = lead?.onboarding_signatories || [];

    const monthlyFromServices = leadServices
      .filter((s: LeadService) => s.billing_type === 'monthly')
      .reduce((sum: number, s: LeadService) => sum + (s.price || 0), 0);

    const oneOffFromServices = leadServices
      .filter((s: LeadService) => s.billing_type === 'one_off')
      .reduce((sum: number, s: LeadService) => sum + (s.price || 0), 0);

    // estimated_price is synced from latest active offer total in useLeadsData,
    // so prefer it to keep DigiSign preview aligned with discounted offer totals.
    const estimatedTotal = Number(lead?.estimated_price || 0);
    const monthlyFromEstimated = estimatedTotal > 0
      ? Math.max(estimatedTotal - oneOffFromServices, 0)
      : 0;

    const monthlyFee = monthlyFromEstimated > 0 ? monthlyFromEstimated : monthlyFromServices;

    const allSignatoriesHavePhone = signatories.length > 0 && signatories.every((s: { phone?: string }) => s.phone && s.phone.trim() !== '');
    const allSignatoriesHaveEmail = signatories.length > 0 && signatories.every((s: { email?: string }) => s.email && s.email.trim() !== '');

    return {
      hasServices: leadServices.length > 0,
      hasMonthlyFee: monthlyFee > 0,
      hasSignatories: signatories.length > 0,
      allSignatoriesHavePhone,
      allSignatoriesHaveEmail,
      monthlyFee,
      isReady: leadServices.length > 0 && monthlyFee > 0 && signatories.length > 0 && allSignatoriesHavePhone && allSignatoriesHaveEmail,
    };
  }, [lead?.potential_services, lead?.onboarding_signatories, lead?.estimated_price]);

  // VAT reliability check
  // Policy: no automatic background refresh.
  // We only check when there is no stored result yet.
  const shouldCheckVatReliability = !!lead?.dic && !lead?.vat_payer_status;
  const { data: vatData, isLoading: isLoadingVat } = useVatReliability(
    shouldCheckVatReliability ? lead?.dic : null
  );

  const lastVatPersistAttemptRef = useRef<string | null>(null);

  // Persist first retrieved status + retrieval timestamp (without periodic refreshes)
  useEffect(() => {
    if (!lead?.id || !vatData?.status) return;

    if (vatData.status !== 'reliable' && vatData.status !== 'unreliable' && vatData.status !== 'not_found') {
      return;
    }

    if (lead.vat_payer_status === vatData.status && lead.vat_payer_checked_at) return;

    const persistKey = `${lead.id}:${vatData.status}`;
    if (lastVatPersistAttemptRef.current === persistKey) return;
    lastVatPersistAttemptRef.current = persistKey;

    updateLead(lead.id, {
      vat_payer_status: vatData.status,
      vat_payer_checked_at: new Date().toISOString(),
    } as Partial<Lead>).catch((error) => {
      console.error('Failed to persist VAT status/timestamp:', {
        leadId: lead.id,
        status: vatData.status,
        error,
      });
    });
  }, [lead?.id, lead?.vat_payer_status, lead?.vat_payer_checked_at, updateLead, vatData?.status]);

  if (!lead) return null;

  const owner = colleagues.find(c => c.id === lead.owner_id);
  const canConvert = !lead.converted_to_client_id && !['won', 'lost'].includes(lead.stage);
  const history = getLeadHistory(lead.id);
  const isNewLead = lead.stage === 'new_lead';

  const resolvedVatStatus =
    vatData?.status === 'reliable' || vatData?.status === 'unreliable' || vatData?.status === 'not_found'
      ? vatData.status
      : lead.vat_payer_status;

  const handleStageChange = async (newStage: LeadStage) => {
    const fromStage = lead.stage;
    try {
      await updateLeadStage(lead.id, newStage);
      toast.success('Stav leadu byl změněn');
      setPendingTransition({
        leadId: lead.id,
        leadName: lead.company_name,
        fromStage,
        toStage: newStage,
        leadValue: lead.estimated_price || 0,
      });
      setShowTransitionDialog(true);
    } catch (error) {
      console.error('Failed to update lead stage:', error);
      toast.error('Nepodařilo se změnit stav leadu');
    }
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

  const handleInlineNoteSubmit = async () => {
    if (!noteText.trim()) return;
    try {
      // Parse recipients for email types
      const recipientsList = emailRecipients.trim()
        ? emailRecipients.split(',').map(r => r.trim()).filter(Boolean)
        : null;

      await addNote(
        lead.id,
        noteText.trim(),
        noteType,
        noteType === 'call' && callDate ? callDate : null,
        (noteType === 'email_sent' || noteType === 'email_received') && emailSubject ? emailSubject : null,
        recipientsList
      );

      const noteTypeLabel = noteType === 'call' ? 'Hovor' : noteType === 'internal' ? 'Interní poznámka' : noteType === 'email_sent' ? 'E-mail' : noteType === 'email_received' ? 'E-mail' : 'Poznámka';
      const isFeminine = noteType === 'internal' || noteType === 'general';
      toast.success(`${noteTypeLabel} ${isFeminine ? 'byla přidána' : 'byl přidán'}`);
      setNoteText('');
      setNoteType('general');
      setCallDate('');
      setEmailSubject('');
      setEmailRecipients('');
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error('Nepodařilo se přidat poznámku');
    }
  };

  const handleAddService = async (service: LeadService) => {
    const currentServices = lead.potential_services || [];
    const updatedServices = [...currentServices, service];
    const newEstimatedPrice = updatedServices.reduce((sum, s) => sum + s.price, 0);
    try {
      await updateLead(lead.id, {
        potential_services: updatedServices,
        estimated_price: newEstimatedPrice,
      });
      toast.success('Služba byla přidána do nabídky');
    } catch (error) {
      console.error('Failed to add service:', error);
      toast.error('Nepodařilo se přidat službu');
    }
  };

  const handleRemoveService = async (index: number) => {
    const currentServices = [...(lead.potential_services || [])];
    currentServices.splice(index, 1);
    const newEstimatedPrice = currentServices.reduce((sum, s) => sum + s.price, 0);
    try {
      await updateLead(lead.id, {
        potential_services: currentServices,
        estimated_price: newEstimatedPrice,
      });
      toast.success('Služba byla odebrána');
    } catch (error) {
      console.error('Failed to remove service:', error);
      toast.error('Nepodařilo se odebrat službu');
    }
  };

  const handleUpdateLead = async (updates: Partial<Lead>) => {
    try {
      await updateLead(lead.id, updates);
      toast.success('Uloženo');
    } catch (error) {
      console.error('Failed to update lead:', error);
      toast.error('Nepodařilo se uložit změny');
    }
  };

  const handleDeleteLead = async () => {
    if (lead.converted_to_client_id || lead.converted_to_engagement_id) {
      toast.error('Smazání není dostupné: lead už byl převeden na zakázku');
      setIsDeleteConfirmOpen(false);
      return;
    }

    setIsDeletingLead(true);
    try {
      await deleteLead(lead.id);
      toast.success('Lead byl smazán');
      setIsDeleteConfirmOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete lead:', error);
      toast.error('Nepodařilo se smazat lead');
    } finally {
      setIsDeletingLead(false);
    }
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

  const handleIcoChange = async (newIco: string) => {
    const cleanIco = newIco.replace(/\s/g, '');
    if (cleanIco.length === 8 && /^\d{8}$/.test(cleanIco)) {
      // If IČO already exists and is different, ask for confirmation
      if (lead.ico && lead.ico !== newIco && lead.ico.replace(/\s/g, '') !== cleanIco) {
        setPendingIcoChange(newIco);
        return;
      }
      // First time or same IČO - fetch ARES directly
      const data = await lookupCompany(cleanIco);
      const updates: Partial<Lead> = { ico: newIco };
      if (data) {
        if (data.street) updates.billing_street = data.street;
        if (data.city) updates.billing_city = data.city;
        if (data.zip) updates.billing_zip = data.zip;
        if (data.companyName && !lead.company_name) updates.company_name = data.companyName;
        if (data.dic) updates.dic = data.dic;
        if (data.legalForm) (updates as Record<string, unknown>).legal_form = data.legalForm;
        if (data.foundedDate) (updates as Record<string, unknown>).founded_date = data.foundedDate;
        if (data.nace) (updates as Record<string, unknown>).ares_nace = data.nace;
        if (data.directors?.length) (updates as Record<string, unknown>).directors = data.directors;
        if (data.spisovaZnacka) updates.court_registration = data.spisovaZnacka;
      }
      await handleUpdateLead(updates);
      if (data) {
        toast.success('IČO uloženo, údaje doplněny z ARES');
      } else {
        toast.error('IČO uloženo, ale subjekt nebyl nalezen v ARES');
      }
    } else {
      await handleUpdateLead({ ico: newIco });
    }
  };

  const handleConfirmIcoChange = async () => {
    if (!pendingIcoChange) return;
    const newIco = pendingIcoChange;
    setPendingIcoChange(null);
    const data = await lookupCompany(newIco.replace(/\s/g, ''));
    const updates: Partial<Lead> = { ico: newIco };
    if (data) {
      if (data.street) updates.billing_street = data.street;
      if (data.city) updates.billing_city = data.city;
      if (data.zip) updates.billing_zip = data.zip;
      if (data.companyName) updates.company_name = data.companyName;
      if (data.dic) updates.dic = data.dic;
      if (data.legalForm) (updates as Record<string, unknown>).legal_form = data.legalForm;
      if (data.foundedDate) (updates as Record<string, unknown>).founded_date = data.foundedDate;
      if (data.nace) (updates as Record<string, unknown>).ares_nace = data.nace;
      if (data.directors?.length) (updates as Record<string, unknown>).directors = data.directors;
      if (data.spisovaZnacka) updates.court_registration = data.spisovaZnacka;
    }
    await handleUpdateLead(updates);
    if (data) {
      toast.success('IČO uloženo, údaje doplněny z ARES');
    } else {
      toast.error('IČO uloženo, ale subjekt nebyl nalezen v ARES');
    }
  };

  return (
    <>
      {/* Onboarding Form Warning Dialog */}
      <AlertDialog open={showOnboardingWarning} onOpenChange={setShowOnboardingWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              Onboarding formulář nebyl vyplněn
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
              Smlouva nebyla podepsána
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
              Změna IČO
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
              onClick={handleConfirmIcoChange}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Ano, přepsat údaje
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contract Creation Confirmation Dialog */}
      <AlertDialog open={isContractConfirmOpen} onOpenChange={setIsContractConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Vytvořit smlouvu v DigiSign
            </AlertDialogTitle>
            <AlertDialogDescription>
              Smlouva bude vytvořena s následujícími parametry:
              <br /><br />
              <strong>Měsíční poplatek:</strong> {contractReadiness.monthlyFee.toLocaleString('cs-CZ')} Kč
              <br />
              <strong>Služby:</strong> {lead.potential_services?.length || 0}
              <br />
              <strong>Podpisující osoby:</strong> {lead.onboarding_signatories?.length || 0}
              <br /><br />
              Po vytvoření smlouvy bude automaticky odeslán e-mail k podpisu všem podpisujícím osobám.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const result = await createContract(lead.id);
                // Hook already shows toast.error on failure, toast.success on success
                if (result) {
                  setIsContractConfirmOpen(false);
                }
              }}
              disabled={isCreatingContract}
            >
              {isCreatingContract ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vytvářím...
                </>
              ) : (
                'Vytvořit smlouvu'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manual Sign Confirmation Dialog */}
      <AlertDialog open={isManualSignConfirmOpen} onOpenChange={setIsManualSignConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              Ručně potvrdit podpis smlouvy
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tímto potvrdíte, že smlouva byla podepsána mimo systém DigiSign (např. fyzicky na papíře).
              <br /><br />
              Opravdu chcete označit smlouvu jako podepsanou?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await updateLead(lead.id, { contract_signed_at: new Date().toISOString() });
                  toast.success('Smlouva byla označena jako podepsaná');
                  setIsManualSignConfirmOpen(false);
                } catch (error) {
                  console.error('Failed to mark contract as signed:', error);
                  toast.error('Nepodařilo se uložit změny');
                }
              }}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Ano, potvrdit podpis
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Lead Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete smazat lead <strong>{lead.company_name}</strong>? Tato akce je nevratná.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingLead}>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              disabled={isDeletingLead}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingLead ? 'Mazání...' : 'Smazat lead'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          aria-describedby={undefined}
          className={cn(
            'flex w-full max-w-5xl flex-col gap-0 p-0',
            'h-[90dvh] max-h-[90dvh]',
            'max-lg:inset-0 max-lg:left-0 max-lg:top-0 max-lg:h-[100dvh] max-lg:max-h-[100dvh] max-lg:w-full max-lg:max-w-none max-lg:translate-x-0 max-lg:translate-y-0 max-lg:rounded-none',
          )}
        >
          {/* Header */}
          <div className="flex flex-shrink-0 flex-col gap-3 border-b p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6 sm:pb-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <DialogTitle className="text-lg font-semibold sm:text-xl">
                  <InlineEditField
                    value={lead.company_name}
                    onSave={(v) => handleUpdateLead({ company_name: v })}
                    placeholder="Název firmy"
                    displayClassName="text-lg font-semibold sm:text-xl break-normal"
                  />
                </DialogTitle>
                <Badge variant="outline" className={cn('shrink-0 text-xs', STAGE_COLORS[lead.stage])}>
                  {STAGE_LABELS[lead.stage]}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                {lead.ico && <span className="break-all">IČO: {lead.ico}</span>}
                {owner && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="min-w-0 break-words">{owner.full_name}</span>
                  </>
                )}
                <span className="hidden sm:inline">•</span>
                <InlineEditField
                  value={lead.estimated_price}
                  onSave={(v) => handleUpdateLead({ estimated_price: Number(v) || 0 })}
                  type="number"
                  suffix={lead.currency}
                  placeholder="Cena"
                  emptyText="Zadat cenu"
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-destructive hover:text-destructive max-sm:w-full sm:self-start"
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Smazat lead
            </Button>
          </div>

          {/* Desktop: side-by-side. Mobile: stacked full width (fixed w-[380px] was starving the main column). */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            {/* Left column: Flow + Info */}
            <ScrollArea className="min-h-0 min-w-0 border-b max-lg:h-[52dvh] max-lg:flex-none lg:flex-1 lg:border-b-0 lg:border-r">
              <div className="space-y-6 p-4 sm:p-6">
                {/* Stage selector */}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  <label className="whitespace-nowrap text-xs text-muted-foreground">Stav:</label>
                  <Select value={lead.stage} onValueChange={handleStageChange}>
                    <SelectTrigger className="h-8 w-full min-w-0 sm:w-auto sm:max-w-[220px]">
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
                    onValueChange={(id) => handleUpdateLead({ owner_id: id })}
                  >
                    <SelectTrigger className="h-8 w-full min-w-0 sm:w-auto sm:max-w-[240px]">
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
                    onSendMeetingRequest={() => setIsMeetingRequestOpen(true)}
                    onRequestAccess={() => setIsRequestAccessOpen(true)}
                    onMarkAccessReceived={async () => {
                      try {
                        await updateLead(lead.id, {
                          access_received_at: new Date().toISOString(),
                          stage: 'access_received' as LeadStage
                        });
                        toast.success('Přístupy byly přijaty!');
                      } catch (error) {
                        toast.error('Nepodařilo se uložit změny');
                      }
                    }}
                    onAddService={() => setIsAddServiceOpen(true)}
                    onCreateOffer={() => setIsCreateOfferOpen(true)}
                    onSendOffer={() => setIsSendOfferOpen(true)}
                    onSendOnboarding={() => setIsOnboardingFormOpen(true)}
                    onCreateContract={() => setIsContractConfirmOpen(true)}
                    isCreatingContract={isCreatingContract}
                    onMarkContractSent={async () => {
                      try {
                        await updateLead(lead.id, { contract_sent_at: new Date().toISOString() });
                        toast.success('Smlouva byla označena jako odeslaná');
                      } catch (error) {
                        toast.error('Nepodařilo se uložit změny');
                      }
                    }}
                    onMarkContractSigned={async () => {
                      try {
                        await updateLead(lead.id, { contract_signed_at: new Date().toISOString() });
                        toast.success('Smlouva byla podepsána!');
                      } catch (error) {
                        toast.error('Nepodařilo se uložit změny');
                      }
                    }}
                    onConvert={handleConvertClick}
                    onRemoveService={handleRemoveService}
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
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <span className="text-muted-foreground text-xs">IČO</span>
                          <div className="flex items-center gap-2">
                            <InlineEditField
                              value={lead.ico}
                              onSave={handleIcoChange}
                              placeholder="Zadat IČO"
                              displayClassName="font-medium"
                            />
                            {isLoadingAres && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            {lead.ico && (
                              <a
                                href={`https://www.hlidacstatu.cz/subjekt/${lead.ico}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Hlídač státu
                              </a>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">DIČ</span>
                          <InlineEditField
                            value={lead.dic}
                            onSave={(v) => handleUpdateLead({ dic: v })}
                            placeholder="Zadat DIČ"
                            displayClassName="font-medium"
                          />
                        </div>
                      </div>
                      {/* VAT Payer Reliability Badge */}
                      {lead.dic && (
                        <div className="mt-1">
                          {shouldCheckVatReliability && isLoadingVat ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Ověřuji spolehlivost plátce DPH…
                            </div>
                          ) : resolvedVatStatus === 'reliable' ? (
                            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Spolehlivý plátce DPH
                            </Badge>
                          ) : resolvedVatStatus === 'unreliable' ? (
                            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium flex items-center gap-2">
                              <ShieldAlert className="h-4 w-4" />
                              NESPOLEHLIVÝ PLÁTCE DPH
                            </div>
                          ) : resolvedVatStatus === 'not_found' ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <ShieldX className="h-3 w-3" />
                              Není plátce DPH
                            </span>
                          ) : vatData?.status === 'error' ? (
                            <span className="text-xs text-amber-700 flex items-center gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              Ověření plátce DPH se nepodařilo{vatData.requestId ? ` (ID: ${vatData.requestId.slice(0, 8)})` : ''}
                            </span>
                          ) : null}

                          {lead.vat_payer_checked_at && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Naposledy ověřeno: {new Date(lead.vat_payer_checked_at).toLocaleString('cs-CZ')}
                            </p>
                          )}
                        </div>
                      )}
                      {lead.legal_form && (
                        <p className="text-muted-foreground">Právní forma: <span className="font-medium text-foreground">{lead.legal_form}</span></p>
                      )}
                      {lead.founded_date && (
                        <p className="text-muted-foreground">Datum vzniku: <span className="font-medium text-foreground">{new Date(lead.founded_date).toLocaleDateString('cs-CZ')}</span></p>
                      )}
                      {lead.ares_nace && (
                        <p className="text-muted-foreground">CZ-NACE: <span className="font-medium text-foreground">{lead.ares_nace}</span></p>
                      )}
                      {lead.court_registration && (
                        <p className="text-muted-foreground flex items-center gap-1.5">
                          <Scale className="h-3.5 w-3.5" />
                          Spisová značka: <span className="font-medium text-foreground">{lead.court_registration}</span>
                        </p>
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
                            onSave={(v) => handleUpdateLead({ website: v })}
                            type="url"
                            placeholder="Zadat web"
                          />
                        </div>
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
                            onSave={(v) => handleUpdateLead({ billing_street: v })}
                            placeholder="Ulice"
                            emptyText="Zadat ulici"
                          />
                          <div className="flex items-center gap-2">
                            <InlineEditField
                              value={lead.billing_zip}
                              onSave={(v) => handleUpdateLead({ billing_zip: v })}
                              placeholder="PSČ"
                              emptyText="PSČ"
                            />
                            <InlineEditField
                              value={lead.billing_city}
                              onSave={(v) => handleUpdateLead({ billing_city: v })}
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
                          onSave={(v) => handleUpdateLead({ contact_name: v })}
                          placeholder="Jméno kontaktu"
                          displayClassName="font-medium"
                        />
                        <span className="text-muted-foreground">–</span>
                        <InlineEditField
                          value={lead.contact_position}
                          onSave={(v) => handleUpdateLead({ contact_position: v })}
                          placeholder="Pozice"
                          emptyText="Zadat pozici"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <InlineEditField
                          value={lead.contact_email}
                          onSave={(v) => handleUpdateLead({ contact_email: v })}
                          placeholder="E-mail"
                          emptyText="Zadat e-mail"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <InlineEditField
                          value={lead.contact_phone}
                          onSave={(v) => handleUpdateLead({ contact_phone: v })}
                          placeholder="Telefon"
                          emptyText="Zadat telefon"
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Collapsible: Signatories (for contract) */}
                {lead.onboarding_form_completed_at && (
                  <Collapsible defaultOpen={!lead.contract_url}>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Podpisující osoby</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
                        {lead.onboarding_signatories?.length || 0}
                      </Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-6 pt-3">
                      <div className="space-y-3">
                        {(lead.onboarding_signatories || []).map((signatory: { name: string; position?: string; email: string; phone?: string }, index: number) => (
                          <div key={index} className="space-y-2 rounded-lg border bg-card p-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <InlineEditField
                                  value={signatory.name}
                                  onSave={async (v) => {
                                    const updated = [...(lead.onboarding_signatories || [])];
                                    updated[index] = { ...updated[index], name: v };
                                    await handleUpdateLead({ onboarding_signatories: updated } as Partial<Lead>);
                                  }}
                                  placeholder="Jméno"
                                  displayClassName="font-medium text-sm"
                                />
                                <span className="text-muted-foreground text-xs">–</span>
                                <InlineEditField
                                  value={signatory.position}
                                  onSave={async (v) => {
                                    const updated = [...(lead.onboarding_signatories || [])];
                                    updated[index] = { ...updated[index], position: v };
                                    await handleUpdateLead({ onboarding_signatories: updated } as Partial<Lead>);
                                  }}
                                  placeholder="Pozice"
                                  emptyText="Zadat pozici"
                                  displayClassName="text-xs"
                                />
                              </div>
                              {(lead.onboarding_signatories?.length || 0) > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={async () => {
                                    const updated = [...(lead.onboarding_signatories || [])];
                                    updated.splice(index, 1);
                                    await handleUpdateLead({ onboarding_signatories: updated } as Partial<Lead>);
                                    toast.success('Podpisující osoba byla odebrána');
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <InlineEditField
                                  value={signatory.email}
                                  onSave={async (v) => {
                                    const updated = [...(lead.onboarding_signatories || [])];
                                    updated[index] = { ...updated[index], email: v };
                                    await handleUpdateLead({ onboarding_signatories: updated } as Partial<Lead>);
                                  }}
                                  placeholder="E-mail"
                                  emptyText="Zadat e-mail"
                                  displayClassName="text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <InlineEditField
                                  value={signatory.phone}
                                  onSave={async (v) => {
                                    const updated = [...(lead.onboarding_signatories || [])];
                                    updated[index] = { ...updated[index], phone: v };
                                    await handleUpdateLead({ onboarding_signatories: updated } as Partial<Lead>);
                                  }}
                                  placeholder="Telefon"
                                  emptyText="Zadat telefon"
                                  displayClassName="text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={async () => {
                            const updated = [...(lead.onboarding_signatories || []), {
                              name: '',
                              position: '',
                              email: '',
                              phone: '',
                            }];
                            await handleUpdateLead({ onboarding_signatories: updated } as Partial<Lead>);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Přidat podpisující osobu
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Collapsible: Sales info */}
                <Collapsible defaultOpen={isNewLead}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Obchodní info</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 pt-3">
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <span className="text-xs text-muted-foreground">Zdroj</span>
                          <InlineEditField
                            value={lead.source}
                            onSave={(v) => handleUpdateLead({ source: v as Lead['source'] })}
                            type="select"
                            options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
                          />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Pravděpodobnost</span>
                          <InlineEditField
                            value={lead.probability_percent}
                            onSave={(v) => handleUpdateLead({ probability_percent: Number(v) || 0 })}
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
                          onSave={(v) => handleUpdateLead({ ad_spend_monthly: Number(v) || 0 })}
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
                          onSave={(v) => handleUpdateLead({ client_message: v })}
                          type="textarea"
                          placeholder="Zadat zprávu od klienta..."
                          emptyText="Klikni pro přidání zprávy"
                        />
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <span className="text-xs text-muted-foreground block mb-1">Shrnutí:</span>
                        <InlineEditField
                          value={lead.summary}
                          onSave={(v) => handleUpdateLead({ summary: v })}
                          type="textarea"
                          placeholder="Zadat shrnutí..."
                          emptyText="Klikni pro přidání shrnutí"
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Conversion status */}
                {lead.converted_to_client_id && (
                  <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                    <p className="text-sm text-emerald-700 font-medium">
                      Lead byl převeden na zakázku
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
            <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col lg:h-auto lg:max-h-none lg:w-[380px] lg:max-w-[380px] lg:flex-none">
              <ScrollArea className="min-h-0 flex-1 lg:min-h-0">
                <div className="space-y-4 p-4 sm:p-5">
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
                        {(lead.notes?.length || 0) + (lead.meeting_request_sent_at ? 1 : 0) + (lead.access_request_sent_at ? 1 : 0) + (lead.offer_sent_at ? 1 : 0)} událostí
                      </Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <LeadCommunicationTimeline
                        lead={lead}
                        onRequestAccess={() => setIsRequestAccessOpen(true)}
                        onSendOnboarding={() => setIsOnboardingFormOpen(true)}
                        onSendOffer={() => setIsSendOfferOpen(true)}
                        onCreateOffer={() => setIsCreateOfferOpen(true)}
                        onMarkAccessReceived={async () => {
                          try {
                            await updateLead(lead.id, {
                              access_received_at: new Date().toISOString(),
                              stage: 'access_received' as LeadStage
                            });
                            toast.success('Přístupy byly přijaty!');
                          } catch (error) {
                            toast.error('Nepodařilo se uložit změny');
                          }
                        }}
                        onMarkContractSent={async () => {
                          try {
                            await updateLead(lead.id, { contract_sent_at: new Date().toISOString() });
                            toast.success('Smlouva byla označena jako odeslaná');
                          } catch (error) {
                            toast.error('Nepodařilo se uložit změny');
                          }
                        }}
                        onMarkContractSigned={async () => {
                          try {
                            await updateLead(lead.id, { contract_signed_at: new Date().toISOString() });
                            toast.success('Smlouva byla podepsána!');
                          } catch (error) {
                            toast.error('Nepodařilo se uložit změny');
                          }
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
        onSent={async (platforms) => {
          try {
            await updateLead(lead.id, {
              access_request_sent_at: new Date().toISOString(),
              access_request_platforms: platforms,
              stage: 'waiting_access' as LeadStage,
            });
          } catch (error) {
            toast.error('Nepodařilo se uložit změny');
          }
        }}
      />

      <SendMeetingRequestDialog
        open={isMeetingRequestOpen}
        onOpenChange={setIsMeetingRequestOpen}
        contactName={lead.contact_name}
        contactEmail={lead.contact_email}
        companyName={lead.company_name}
        leadId={lead.id}
        onSent={async () => {
          try {
            await updateLead(lead.id, {
              meeting_request_sent_at: new Date().toISOString(),
            });
          } catch (error) {
            toast.error('Nepodařilo se uložit změnu');
          }
        }}
      />

      <SendOnboardingFormDialog
        open={isOnboardingFormOpen}
        onOpenChange={setIsOnboardingFormOpen}
        lead={lead}
        onSent={async (formUrl) => {
          try {
            await updateLead(lead.id, {
              onboarding_form_sent_at: new Date().toISOString(),
              onboarding_form_url: formUrl,
            });
          } catch (error) {
            toast.error('Nepodařilo se uložit změny');
          }
        }}
      />

      <SendOfferDialog
        open={isSendOfferOpen}
        onOpenChange={setIsSendOfferOpen}
        lead={lead}
        onSent={async (ownerId) => {
          try {
            await updateLead(lead.id, {
              offer_sent_at: new Date().toISOString(),
              offer_sent_by_id: ownerId,
              stage: 'offer_sent' as LeadStage,
            });
          } catch (error) {
            toast.error('Nepodařilo se uložit změny');
          }
        }}
      />

      <CreateOfferDialog
        open={isCreateOfferOpen}
        onOpenChange={setIsCreateOfferOpen}
        lead={lead}
        onSuccess={async (token, offerUrl) => {
          setSharedOfferUrl(offerUrl);
          try {
            await updateLead(lead.id, {
              offer_url: offerUrl,
              offer_created_at: new Date().toISOString(),
            });
          } catch (error) {
            toast.error('Nepodařilo se uložit změny');
          }
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
