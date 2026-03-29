import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  FileText, 
  Video, 
  Calendar,
  ExternalLink,
  MessageSquare,
  Send,
  UserPlus,
  ClipboardList,
  CheckCircle2,
  CreditCard,
  ArrowRightLeft,
  PhoneCall,
  UserX,
  Clock,
  DollarSign,
  ChevronDown,
  Building,
  MapPin,
  Cake,
  Hash,
  FileSignature,
} from 'lucide-react';
import { Globe, FileDown, Play, AlertTriangle, Link as LinkIcon, Sparkles } from 'lucide-react';
import { ScrollText } from 'lucide-react';
import { OffboardColleagueDialog } from '@/components/colleagues/OffboardColleagueDialog';
import type { Applicant, ApplicantStage, ApplicantSource } from '@/types/applicant';
import { APPLICANT_STAGE_CONFIG, APPLICANT_SOURCE_LABELS } from '@/types/applicant';

// Recruitment pipeline stages (before hired)
const RECRUITMENT_STAGES: ApplicantStage[] = ['new_applicant', 'invited_interview', 'interview_done', 'offer_sent'];

// Onboarding steps for hired candidates
const ONBOARDING_STEPS = [
  { value: 'buddy_meeting', label: 'Schůzka s buddym', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'academy', label: 'Akademie', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'clients_assigned', label: 'Přidělení klientů', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'fully_ready', label: '100 % Ready', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'terminated', label: 'Ukončeno', color: 'bg-red-100 text-red-800 border-red-200' },
] as const;

type OnboardingStepValue = typeof ONBOARDING_STEPS[number]['value'];

function getOnboardingStep(applicant: Applicant): OnboardingStepValue {
  if (applicant.onboarding_terminated) return 'terminated';
  if (applicant.fully_onboarded) return 'fully_ready';
  if (applicant.first_clients_assigned) return 'clients_assigned';
  if (applicant.academy_completed) return 'academy';
  if (applicant.buddy_meeting_done) return 'buddy_meeting';
  // Default: just hired, not started onboarding yet
  return 'buddy_meeting';
}

function getOnboardingStepConfig(step: OnboardingStepValue) {
  return ONBOARDING_STEPS.find(s => s.value === step)!;
}
import { useApplicantsData } from '@/hooks/useApplicantsData';
import { useCRMData } from '@/hooks/useCRMData';
import { SendApplicantOnboardingDialog } from './SendApplicantOnboardingDialog';
import { ConvertApplicantDialog } from './ConvertApplicantDialog';
import { SendInterviewInviteDialog } from './SendInterviewInviteDialog';
import { SendRejectionEmailDialog } from './SendRejectionEmailDialog';
import { SendContractRequestDialog } from './SendContractRequestDialog';
import { ApplicantCommunicationTimeline } from './ApplicantCommunicationTimeline';
import { InlineEditField } from '@/components/leads/InlineEditField';

interface ApplicantDetailSheetProps {
  applicant: Applicant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (applicant: Applicant) => void;
}

// Pipeline steps definition
const PIPELINE_STEPS = [
  { key: 'interview', label: 'Pohovor', icon: PhoneCall },
  { key: 'hired', label: 'Přijat', icon: CheckCircle2 },
  { key: 'onboarding', label: 'Onboarding', icon: ClipboardList },
  { key: 'contract', label: 'Smlouva', icon: FileSignature },
  { key: 'colleague', label: 'Kolega', icon: UserPlus },
] as const;

function getPipelineProgress(applicant: Applicant) {
  const steps = {
    interview: !!applicant.interview_invite_sent_at,
    hired: applicant.stage === 'hired' || !!applicant.converted_to_colleague_id,
    onboarding: !!applicant.onboarding_completed_at,
    contract: false, // manual step — no automation
    colleague: !!applicant.converted_to_colleague_id,
  };
  // Override contract step based on actual data
  steps.contract = !!applicant.contract_signed_at;

  let activeStep = 'interview';
  if (steps.interview) activeStep = 'hired';
  if (steps.hired) activeStep = 'onboarding';
  if (steps.onboarding) activeStep = 'contract';
  if (steps.contract) activeStep = 'colleague';
  if (steps.colleague) activeStep = 'colleague';

  return { steps, activeStep };
}

export function ApplicantDetailSheet({ 
  applicant, 
  open, 
  onOpenChange, 
  onEdit 
}: ApplicantDetailSheetProps) {
  const { updateApplicantStage, updateApplicant, addNote, sendInterviewInvite, sendRejection, sendOnboarding, refreshApplicantFromDB } = useApplicantsData();
  const { colleagues } = useCRMData();
  const [newNote, setNewNote] = useState('');
  const [isOnboardingDialogOpen, setIsOnboardingDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isInterviewInviteDialogOpen, setIsInterviewInviteDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [isContractRequestDialogOpen, setIsContractRequestDialogOpen] = useState(false);
  const [isOffboardDialogOpen, setIsOffboardDialogOpen] = useState(false);

  useEffect(() => {
    if (open && applicant?.id && applicant.stage === 'hired') {
      refreshApplicantFromDB(applicant.id);
    }
  }, [open, applicant?.id, applicant?.stage, refreshApplicantFromDB]);

  if (!applicant) return null;

  const isHired = applicant.stage === 'hired';
  const isBadFit = applicant.stage === 'bad_fit';
  const interviewInviteSent = !!applicant.interview_invite_sent_at;
  const rejectionSent = !!applicant.rejection_sent_at;
  const onboardingAlreadySent = !!applicant.onboarding_sent_at;
  const onboardingCompleted = !!applicant.onboarding_completed_at;
  const convertedToColleague = !!applicant.converted_to_colleague_id;
  const contractSent = !!applicant.contract_sent_at;
  const contractSigned = !!applicant.contract_signed_at;

  const stageConfig = APPLICANT_STAGE_CONFIG[applicant.stage];
  const currentOnboardingStep = isHired ? getOnboardingStep(applicant) : null;
  const currentOnboardingStepConfig = currentOnboardingStep ? getOnboardingStepConfig(currentOnboardingStep) : null;
  const owner = colleagues.find(c => c.id === applicant.owner_id);
  const linkedColleague = colleagues.find(c => c.id === applicant.converted_to_colleague_id);
  const { steps: pipelineSteps, activeStep } = getPipelineProgress(applicant);

  const handleStageChange = (newStage: string) => {
    updateApplicantStage(applicant.id, newStage as ApplicantStage);
  };

  const handleOnboardingStepChange = (step: string) => {
    const updates: Partial<Applicant> = {
      buddy_meeting_done: false,
      academy_completed: false,
      first_clients_assigned: false,
      fully_onboarded: false,
      onboarding_terminated: false,
      terminated_at: null,
    };

    switch (step) {
      case 'terminated':
        updates.onboarding_terminated = true;
        updates.terminated_at = new Date().toISOString();
        break;
      case 'fully_ready':
        updates.buddy_meeting_done = true;
        updates.academy_completed = true;
        updates.first_clients_assigned = true;
        updates.fully_onboarded = true;
        break;
      case 'clients_assigned':
        updates.buddy_meeting_done = true;
        updates.academy_completed = true;
        updates.first_clients_assigned = true;
        break;
      case 'academy':
        updates.buddy_meeting_done = true;
        updates.academy_completed = true;
        break;
      case 'buddy_meeting':
        updates.buddy_meeting_done = true;
        break;
    }

    updateApplicant(applicant.id, updates);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote(applicant.id, newNote.trim());
      setNewNote('');
    }
  };

  const handleSendInterviewInvite = (emailData: { subject: string; message: string; recipients: string[] }) => {
    sendInterviewInvite(applicant.id, emailData);
  };

  const handleSendRejection = (emailData: { subject: string; message: string; recipients: string[] }) => {
    sendRejection(applicant.id, emailData);
  };

  const handleSendOnboarding = () => {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        {/* Header with pipeline stepper */}
        <div className="px-6 pt-6 pb-0 space-y-4">
          {/* Top row: name + stage */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-xl flex items-center gap-3">
                  <InlineEditField
                    value={applicant.full_name}
                    onSave={(v) => updateApplicant(applicant.id, { full_name: v })}
                    displayClassName="text-xl font-semibold"
                  />
                  {isHired ? (
                    <Select value={currentOnboardingStep!} onValueChange={handleOnboardingStepChange}>
                      <SelectTrigger className={`w-auto h-7 text-xs px-2.5 gap-1.5 font-medium rounded-full border-0 ${currentOnboardingStepConfig!.color}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ONBOARDING_STEPS.map((step) => (
                          <SelectItem key={step.value} value={step.value}>
                            {step.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value={applicant.stage} onValueChange={handleStageChange}>
                      <SelectTrigger className={`w-auto h-7 text-xs px-2.5 gap-1.5 font-medium rounded-full border-0 ${stageConfig.color}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[...RECRUITMENT_STAGES, 'hired' as ApplicantStage, 'bad_fit' as ApplicantStage, 'withdrawn' as ApplicantStage, 'postponed' as ApplicantStage].map((key) => (
                          <SelectItem key={key} value={key}>
                            {APPLICANT_STAGE_CONFIG[key].title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </DialogTitle>
                <div className="flex items-center gap-3">
                  <InlineEditField
                    value={applicant.position}
                    onSave={(v) => updateApplicant(applicant.id, { position: v })}
                    displayClassName="text-muted-foreground text-sm"
                    emptyText="Přidej pozici..."
                  />
                  <Select
                    value={applicant.source}
                    onValueChange={(v) => updateApplicant(applicant.id, { source: v as ApplicantSource })}
                  >
                    <SelectTrigger className="h-6 w-auto text-xs gap-1 px-2 border-dashed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(APPLICANT_SOURCE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </DialogHeader>
            </div>
          </div>

          {/* Compact contact bar */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <a href={`mailto:${applicant.email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
              <Mail className="h-3 w-3" />
              {applicant.email}
            </a>
            {applicant.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {applicant.phone}
              </span>
            )}
            {applicant.hourly_rate != null && (
              <span className="flex items-center gap-1 font-medium text-foreground">
                <DollarSign className="h-3 w-3" />
                {applicant.hourly_rate} Kč/h
              </span>
            )}
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {owner?.full_name || 'Nepřiřazeno'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(applicant.created_at), 'd. M. yyyy', { locale: cs })}
            </span>
          </div>

          {/* Pipeline stepper */}
          {!isBadFit && (
            <div className="flex items-center gap-0 pb-4">
              {PIPELINE_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isDone = pipelineSteps[step.key as keyof typeof pipelineSteps];
                const isActive = activeStep === step.key && !isDone;
                const isPast = isDone;

                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <div
                        className={`
                          flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all
                          ${isPast 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : isActive 
                              ? 'border-primary bg-primary/10 text-primary' 
                              : 'border-border bg-muted text-muted-foreground'
                          }
                        `}
                      >
                        {isPast ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <span className={`text-[10px] font-medium text-center leading-tight ${
                        isPast ? 'text-primary' : isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < PIPELINE_STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-1 mt-[-16px] rounded-full ${
                        isPast ? 'bg-primary' : 'bg-border'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bad fit banner */}
          {isBadFit && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-2">
              <UserX className="h-4 w-4" />
              <span className="font-medium">Kandidát označen jako bad fit</span>
              {applicant.rejection_sent_at && (
                <span className="text-destructive/70 ml-1">
                  ({format(new Date(applicant.rejection_sent_at), 'd. M. yyyy', { locale: cs })})
                </span>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Main content: two columns */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_380px] divide-x">
          {/* LEFT COLUMN */}
          <ScrollArea className="h-[calc(92vh-200px)]">
            <div className="p-6 pb-12 space-y-6">

              {/* Onboarding data — always visible */}
              {/* Application data — Přihláška */}
              <div className="space-y-3">
                {/* Row 1: KONTAKT, ODKAZY, INFO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* KONTAKT */}
                  <Card className="border-border/60 bg-card shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Kontakt</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Jméno</p>
                          <p className="font-medium">{applicant.full_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pozice</p>
                          <p className="font-medium">{applicant.position}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">E-mail</p>
                          <a href={`mailto:${applicant.email}`} className="text-primary hover:underline text-sm truncate block">{applicant.email}</a>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Telefon</p>
                          {applicant.phone ? (
                            <a href={`tel:${applicant.phone}`} className="hover:underline text-sm">{applicant.phone}</a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ODKAZY */}
                  <Card className="border-border/60 bg-card shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Odkazy</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Loom video</p>
                          {applicant.video_url ? (
                            <a href={applicant.video_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                              {new URL(applicant.video_url).hostname}
                            </a>
                          ) : <span className="text-muted-foreground">—</span>}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Portfolio / osobní značka</p>
                          {applicant.portfolio_url ? (
                            <a href={applicant.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                              {new URL(applicant.portfolio_url).hostname}
                            </a>
                          ) : <span className="text-muted-foreground">—</span>}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">CV</p>
                          {applicant.cv_url ? (
                            <a href={applicant.cv_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                              {new URL(applicant.cv_url).hostname}
                            </a>
                          ) : <span className="text-muted-foreground">—</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* INFO */}
                  <Card className="border-border/60 bg-card shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Info</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Zdroj</p>
                          <p className="font-medium">{APPLICANT_SOURCE_LABELS[applicant.source]}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Datum</p>
                          <p className="font-medium">{format(new Date(applicant.created_at), 'd. M. yyyy HH:mm:ss', { locale: cs })}</p>
                        </div>
                        {applicant.social_links && (
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Sociální sítě</p>
                            <div className="space-y-0.5">
                              {applicant.social_links.split(/[,\n]/).map((link, i) => {
                                const trimmed = link.trim();
                                if (!trimmed) return null;
                                const isUrl = trimmed.startsWith('http');
                                return isUrl ? (
                                  <a key={i} href={trimmed} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline truncate">
                                    {(() => { try { return new URL(trimmed).hostname; } catch { return trimmed; } })()}
                                  </a>
                                ) : (
                                  <span key={i} className="block text-sm">{trimmed}</span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Row 2: MOTIVAČNÍ DOPIS, JAK VYUŽÍVÁ AI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card className="border-border/60 bg-card shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Motivační dopis</h4>
                      </div>
                      {applicant.cover_letter ? (
                        <p className="text-sm whitespace-pre-wrap">{applicant.cover_letter}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Nevyplněno</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 bg-card shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Jak využívá AI</h4>
                      </div>
                      {applicant.ai_usage ? (
                        <p className="text-sm whitespace-pre-wrap">{applicant.ai_usage}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Nevyplněno</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Row 3: OSOBNÍ ZNAČKA (if filled) */}
                {applicant.personal_brand && (
                  <Card className="border-border/60 bg-card shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Osobní značka</h4>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{applicant.personal_brand}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Údaje pro smlouvu — only show after onboarding form is completed */}
              {onboardingCompleted && (
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Údaje pro smlouvu
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Všechny údaje z onboarding formuláře kandidáta.
                      </p>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs whitespace-nowrap">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Vyplněno {format(new Date(applicant.onboarding_completed_at!), 'd. M.', { locale: cs })}
                    </Badge>
                  </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Personal */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Osobní údaje</p>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium">{applicant.full_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{applicant.position}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-primary">{applicant.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground">{applicant.personal_email || 'Osobní email nevyplněn'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{applicant.phone || 'Telefon nevyplněn'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Cake className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{applicant.birthday ? format(new Date(applicant.birthday), 'd. M. yyyy', { locale: cs }) : 'Datum narození nevyplněn'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Billing + Financial */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Fakturace & finance</p>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2">
                            <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium">{applicant.company_name || 'Firma nevyplněna'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>
                              IČO: {applicant.ico || 'nevyplněno'}
                              {applicant.dic ? ` · DIČ: ${applicant.dic}` : ' · DIČ: nevyplněno'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>
                              {applicant.billing_street && applicant.billing_zip && applicant.billing_city
                                ? `${applicant.billing_street}, ${applicant.billing_zip} ${applicant.billing_city}`
                                : 'Adresa nevyplněna'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-semibold text-primary">{applicant.hourly_rate ? `${applicant.hourly_rate} Kč/h` : 'Sazba nevyplněna'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{applicant.bank_account || 'Bankovní účet nevyplněn'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                </CardContent>
              </Card>
              )}

              {/* Action cards */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Akce</h3>
                
                <div className="grid grid-cols-1 gap-2">
                  {/* Interview invite */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md ${interviewInviteSent ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                        <PhoneCall className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Pozvánka na pohovor</p>
                        <p className="text-xs text-muted-foreground">
                          {interviewInviteSent
                            ? `Odesláno ${format(new Date(applicant.interview_invite_sent_at!), 'd. M. yyyy', { locale: cs })}`
                            : 'Zatím neodesláno'}
                        </p>
                      </div>
                    </div>
                    {interviewInviteSent ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Hotovo
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsInterviewInviteDialogOpen(true)}>
                          Znovu
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" className="h-8" onClick={() => setIsInterviewInviteDialogOpen(true)} disabled={isBadFit}>
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Odeslat
                      </Button>
                    )}
                  </div>

                  {/* Rejection */}
                  {!isHired && !convertedToColleague && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${rejectionSent ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'}`}>
                          <UserX className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Odmítnutí kandidáta</p>
                          <p className="text-xs text-muted-foreground">
                            {rejectionSent
                              ? `Odesláno ${format(new Date(applicant.rejection_sent_at!), 'd. M. yyyy', { locale: cs })}`
                              : 'Slušné odmítnutí emailem'}
                          </p>
                        </div>
                      </div>
                      {rejectionSent ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Odesláno
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsRejectionDialogOpen(true)}>
                            Znovu
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 text-destructive hover:text-destructive" onClick={() => setIsRejectionDialogOpen(true)}>
                          <UserX className="h-3.5 w-3.5 mr-1" />
                          Odmítnout
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Onboarding form send */}
                  {!isBadFit && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${onboardingCompleted ? 'bg-green-100 text-green-600' : onboardingAlreadySent ? 'bg-yellow-100 text-yellow-600' : 'bg-muted text-muted-foreground'}`}>
                          <ClipboardList className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Onboarding formulář</p>
                          <p className="text-xs text-muted-foreground">
                            {onboardingCompleted
                              ? `Vyplněno ${format(new Date(applicant.onboarding_completed_at!), 'd. M. yyyy', { locale: cs })}`
                              : onboardingAlreadySent
                                ? `Odesláno ${format(new Date(applicant.onboarding_sent_at!), 'd. M. yyyy', { locale: cs })}`
                                : 'Odeslat odkaz na vyplnění'}
                          </p>
                        </div>
                      </div>
                      {onboardingCompleted ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Vyplněno
                        </Badge>
                      ) : onboardingAlreadySent ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Čeká
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsOnboardingDialogOpen(true)}>
                            Znovu
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" className="h-8" onClick={() => setIsOnboardingDialogOpen(true)}>
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Odeslat
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Convert to colleague */}
                  {!isBadFit && (
                    <>
                    {/* Contract creation — generate email to Dana */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
                          <ScrollText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Tvorba smlouvy</p>
                          <p className="text-xs text-muted-foreground">
                            Odeslat souhrn pro přípravu smlouvy
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-8" onClick={() => setIsContractRequestDialogOpen(true)}>
                        <ScrollText className="h-3.5 w-3.5 mr-1" />
                        Vytvořit email
                      </Button>
                    </div>

                    {/* Contract sent */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${contractSent ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                          <FileSignature className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Odeslání smlouvy</p>
                          <p className="text-xs text-muted-foreground">
                            {contractSent
                              ? `Odesláno ${format(new Date(applicant.contract_sent_at!), 'd. M. yyyy', { locale: cs })}`
                              : 'Smlouva zatím nebyla odeslána'}
                          </p>
                        </div>
                      </div>
                      {contractSent ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Odesláno
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateApplicant(applicant.id, { contract_sent_at: null })}>
                            Zrušit
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8" onClick={() => updateApplicant(applicant.id, { contract_sent_at: new Date().toISOString() })}>
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Označit jako odesláno
                        </Button>
                      )}
                    </div>

                    {/* Contract signed */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${contractSigned ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Podpis smlouvy</p>
                          <p className="text-xs text-muted-foreground">
                            {contractSigned
                              ? `Podepsáno ${format(new Date(applicant.contract_signed_at!), 'd. M. yyyy', { locale: cs })}`
                              : 'Smlouva zatím nebyla podepsána'}
                          </p>
                        </div>
                      </div>
                      {contractSigned ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Podepsáno
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateApplicant(applicant.id, { contract_signed_at: null })}>
                            Zrušit
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8" onClick={() => updateApplicant(applicant.id, { contract_signed_at: new Date().toISOString() })}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Označit jako podepsáno
                        </Button>
                      )}
                    </div>

                    {/* Convert to colleague - hide completely if already converted */}
                    {!convertedToColleague && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
                          <UserPlus className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Převod na kolegu</p>
                          <p className="text-xs text-muted-foreground">
                            Vytvořit záznam v kolegové
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-8" onClick={() => setIsConvertDialogOpen(true)}>
                        <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                        Převést
                      </Button>
                    </div>
                    )}
                    {convertedToColleague && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-green-100 text-green-600">
                          <UserPlus className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Převedeno na kolegu</p>
                          <p className="text-xs text-muted-foreground">
                            {linkedColleague?.full_name}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Hotovo
                      </Badge>
                    </div>
                    )}

                    {/* Offboard from recruitment - for hired & converted candidates */}
                    {isHired && convertedToColleague && !applicant.onboarding_terminated && (
                      <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-destructive/10 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Ukončit zapracování</p>
                            <p className="text-xs text-muted-foreground">
                              Deaktivovat přístupy (Workspace, Slack, Freelo)
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="h-8" 
                          onClick={() => setIsOffboardDialogOpen(true)}
                        >
                          <UserX className="h-3.5 w-3.5 mr-1" />
                          Ukončit
                        </Button>
                      </div>
                    )}

                    {/* Terminated badge */}
                    {applicant.onboarding_terminated && (
                      <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-destructive/10 text-destructive">
                            <UserX className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Zapracování ukončeno</p>
                            <p className="text-xs text-muted-foreground">
                              {applicant.terminated_at 
                                ? format(new Date(applicant.terminated_at), 'd. M. yyyy', { locale: cs })
                                : 'Přístupy byly deaktivovány'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          Ukončeno
                        </Badge>
                      </div>
                    )}
                    </>
                  )}
                </div>
              </div>


            </div>
          </ScrollArea>

          {/* RIGHT COLUMN: Communication Timeline + Notes */}
          <ScrollArea className="h-[calc(92vh-200px)]">
            <div className="p-5 space-y-4">
              <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5" />
                Historie komunikace
              </h3>

              <ApplicantCommunicationTimeline applicant={applicant} />

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Přidat poznámku
                </h3>
                <div className="flex gap-2">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Přidat poznámku..."
                    className="min-h-[60px]"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>

      <SendInterviewInviteDialog
        applicant={applicant}
        open={isInterviewInviteDialogOpen}
        onOpenChange={setIsInterviewInviteDialogOpen}
        onSend={handleSendInterviewInvite}
      />
      <SendRejectionEmailDialog
        applicant={applicant}
        open={isRejectionDialogOpen}
        onOpenChange={setIsRejectionDialogOpen}
        onSend={handleSendRejection}
      />
      <SendApplicantOnboardingDialog
        applicant={applicant}
        open={isOnboardingDialogOpen}
        onOpenChange={setIsOnboardingDialogOpen}
        onSend={handleSendOnboarding}
      />
      <ConvertApplicantDialog
        applicant={applicant}
        open={isConvertDialogOpen}
        onOpenChange={setIsConvertDialogOpen}
      />
      <SendContractRequestDialog
        applicant={applicant}
        open={isContractRequestDialogOpen}
        onOpenChange={setIsContractRequestDialogOpen}
        onSend={() => {}}
      />
      {linkedColleague && (
        <OffboardColleagueDialog
          open={isOffboardDialogOpen}
          onOpenChange={setIsOffboardDialogOpen}
          colleague={linkedColleague as any}
          onOffboarded={() => {
            updateApplicant(applicant.id, {
              onboarding_terminated: true,
              terminated_at: new Date().toISOString(),
            });
            setIsOffboardDialogOpen(false);
          }}
        />
      )}
    </Dialog>
  );
}
