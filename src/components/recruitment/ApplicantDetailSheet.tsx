import { useState } from 'react';
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
  Edit,
  MessageSquare,
  Send,
  UserPlus,
  ClipboardList,
  CheckCircle2,
  Building,
  CreditCard,
  ArrowRightLeft,
  PhoneCall,
  UserX,
  Clock,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import type { Applicant, ApplicantStage } from '@/types/applicant';
import { APPLICANT_STAGE_CONFIG, APPLICANT_SOURCE_LABELS } from '@/types/applicant';
import { useApplicantsData } from '@/hooks/useApplicantsData';
import { useCRMData } from '@/hooks/useCRMData';
import { SendApplicantOnboardingDialog } from './SendApplicantOnboardingDialog';
import { ConvertApplicantDialog } from './ConvertApplicantDialog';
import { SendInterviewInviteDialog } from './SendInterviewInviteDialog';
import { SendRejectionEmailDialog } from './SendRejectionEmailDialog';
import { ApplicantCommunicationTimeline } from './ApplicantCommunicationTimeline';

interface ApplicantDetailSheetProps {
  applicant: Applicant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (applicant: Applicant) => void;
}

export function ApplicantDetailSheet({ 
  applicant, 
  open, 
  onOpenChange, 
  onEdit 
}: ApplicantDetailSheetProps) {
  const { updateApplicantStage, addNote, sendInterviewInvite, sendRejection, sendOnboarding } = useApplicantsData();
  const { colleagues } = useCRMData();
  const [newNote, setNewNote] = useState('');
  const [isOnboardingDialogOpen, setIsOnboardingDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isInterviewInviteDialogOpen, setIsInterviewInviteDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);

  if (!applicant) return null;

  const isHired = applicant.stage === 'hired';
  const isRejected = applicant.stage === 'rejected';
  const interviewInviteSent = !!applicant.interview_invite_sent_at;
  const rejectionSent = !!applicant.rejection_sent_at;
  const onboardingAlreadySent = !!applicant.onboarding_sent_at;
  const onboardingCompleted = !!applicant.onboarding_completed_at;
  const convertedToColleague = !!applicant.converted_to_colleague_id;

  const stageConfig = APPLICANT_STAGE_CONFIG[applicant.stage];
  const owner = colleagues.find(c => c.id === applicant.owner_id);
  const linkedColleague = colleagues.find(c => c.id === applicant.converted_to_colleague_id);

  const handleStageChange = (newStage: string) => {
    updateApplicantStage(applicant.id, newStage as ApplicantStage);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote(applicant.id, newNote.trim());
      setNewNote('');
    }
  };

  const handleSendInterviewInvite = () => {
    sendInterviewInvite(applicant.id);
  };

  const handleSendRejection = () => {
    sendRejection(applicant.id);
  };

  const handleSendOnboarding = () => {
    sendOnboarding(applicant.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{applicant.full_name}</DialogTitle>
              <p className="text-muted-foreground">{applicant.position}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(applicant)}>
                <Edit className="h-4 w-4 mr-1" />
                Upravit
              </Button>
            </div>
          </div>

          {/* Stage selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Stav:</span>
            <Select value={applicant.stage} onValueChange={handleStageChange}>
              <SelectTrigger className={`w-48 ${stageConfig.color}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(APPLICANT_STAGE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <Separator />

        {/* Two-column layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-x">
          {/* LEFT COLUMN: Workflow + Contact + Details */}
          <ScrollArea className="h-[calc(90vh-160px)]">
            <div className="p-6 space-y-6">
              {/* STEP 1: Communication with applicant */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
                  Komunikace s uchazečem
                </h3>

                {/* Interview invite */}
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${interviewInviteSent ? 'bg-green-100 text-green-600' : 'bg-muted'}`}>
                          <PhoneCall className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Pozvánka na pohovor</p>
                          {interviewInviteSent ? (
                            <p className="text-xs text-muted-foreground">
                              Odesláno {format(new Date(applicant.interview_invite_sent_at!), 'd. M. yyyy', { locale: cs })}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Zatím neodesláno</p>
                          )}
                        </div>
                      </div>
                      {interviewInviteSent ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Odesláno
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setIsInterviewInviteDialogOpen(true)}
                          disabled={isRejected}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Odeslat
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Rejection email */}
                {!isHired && !convertedToColleague && (
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${rejectionSent ? 'bg-red-100 text-red-600' : 'bg-muted'}`}>
                            <UserX className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Odmítnutí kandidáta</p>
                            {rejectionSent ? (
                              <p className="text-xs text-muted-foreground">
                                Odesláno {format(new Date(applicant.rejection_sent_at!), 'd. M. yyyy', { locale: cs })}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">Slušné odmítnutí emailem</p>
                            )}
                          </div>
                        </div>
                        {rejectionSent ? (
                          <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Odesláno
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setIsRejectionDialogOpen(true)}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Odmítnout
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* STEP 2: Onboarding */}
              {!isRejected && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
                    Onboarding
                  </h3>

                  {/* Onboarding form */}
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${onboardingCompleted ? 'bg-green-100 text-green-600' : onboardingAlreadySent ? 'bg-yellow-100 text-yellow-600' : 'bg-muted'}`}>
                            <ClipboardList className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Onboarding formulář</p>
                            {onboardingCompleted ? (
                              <p className="text-xs text-muted-foreground">
                                Vyplněno {format(new Date(applicant.onboarding_completed_at!), 'd. M. yyyy', { locale: cs })}
                              </p>
                            ) : onboardingAlreadySent ? (
                              <p className="text-xs text-muted-foreground">
                                Odesláno {format(new Date(applicant.onboarding_sent_at!), 'd. M. yyyy', { locale: cs })}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">Odeslat odkaz na vyplnění údajů</p>
                            )}
                          </div>
                        </div>
                        {onboardingCompleted ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Vyplněno
                          </Badge>
                        ) : onboardingAlreadySent ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Čeká na vyplnění
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsOnboardingDialogOpen(true)}
                            >
                              Znovu
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setIsOnboardingDialogOpen(true)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Odeslat
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Colleague conversion */}
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${convertedToColleague ? 'bg-green-100 text-green-600' : 'bg-muted'}`}>
                            <UserPlus className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Převod na kolegu</p>
                            {convertedToColleague ? (
                              <p className="text-xs text-muted-foreground">
                                Vytvořen záznam: {linkedColleague?.full_name}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">Vytvořit záznam v kolegové</p>
                            )}
                          </div>
                        </div>
                        {convertedToColleague ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Převedeno
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsConvertDialogOpen(true)}
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-1" />
                            Převést ručně
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Company info if onboarding completed */}
                  {onboardingCompleted && applicant.ico && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Fakturační údaje
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">IČO:</span>
                            <span className="ml-1 font-medium">{applicant.ico}</span>
                          </div>
                          {applicant.company_name && (
                            <div>
                              <span className="text-muted-foreground">Firma:</span>
                              <span className="ml-1">{applicant.company_name}</span>
                            </div>
                          )}
                          {applicant.dic && (
                            <div>
                              <span className="text-muted-foreground">DIČ:</span>
                              <span className="ml-1">{applicant.dic}</span>
                            </div>
                          )}
                          {applicant.hourly_rate && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{applicant.hourly_rate} Kč/h</span>
                            </div>
                          )}
                          {applicant.billing_street && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Adresa:</span>
                              <span className="ml-1">
                                {applicant.billing_street}, {applicant.billing_zip} {applicant.billing_city}
                              </span>
                            </div>
                          )}
                          {applicant.bank_account && (
                            <div className="col-span-2 flex items-center gap-1">
                              <CreditCard className="h-3 w-3 text-muted-foreground" />
                              <span>{applicant.bank_account}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <Separator />

              {/* Contact info */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Kontakt
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${applicant.email}`} className="text-primary hover:underline">
                      {applicant.email}
                    </a>
                  </div>
                  {applicant.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${applicant.phone}`} className="text-primary hover:underline">
                        {applicant.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Detaily
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{applicant.position}</span>
                  </div>
                  {applicant.hourly_rate && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Hodinová sazba: <strong>{applicant.hourly_rate} Kč/h</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Odpovědný: {owner?.full_name || 'Nepřiřazeno'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Přidán: {format(new Date(applicant.created_at), 'd. MMMM yyyy', { locale: cs })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {APPLICANT_SOURCE_LABELS[applicant.source]}
                      {applicant.source_custom && ` - ${applicant.source_custom}`}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Přílohy
                </h3>
                <div className="flex gap-2">
                  {applicant.cv_url ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={applicant.cv_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-1" />
                        CV
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <FileText className="h-3 w-3 mr-1" />
                      Bez CV
                    </Badge>
                  )}
                  {applicant.video_url ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={applicant.video_url} target="_blank" rel="noopener noreferrer">
                        <Video className="h-4 w-4 mr-1" />
                        Video
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Video className="h-3 w-3 mr-1" />
                      Bez videa
                    </Badge>
                  )}
                </div>
              </div>

              {/* Cover letter - collapsible */}
              {applicant.cover_letter && (
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Motivační dopis
                    </h3>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="bg-muted/50 p-3 rounded-lg text-sm whitespace-pre-wrap mt-2">
                      {applicant.cover_letter}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </ScrollArea>

          {/* RIGHT COLUMN: Communication Timeline + Notes */}
          <ScrollArea className="h-[calc(90vh-160px)]">
            <div className="p-6 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Historie komunikace
              </h3>

              <ApplicantCommunicationTimeline applicant={applicant} />

              <Separator />

              {/* Add note inline */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
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

      {/* Interview Invite Dialog */}
      <SendInterviewInviteDialog
        applicant={applicant}
        open={isInterviewInviteDialogOpen}
        onOpenChange={setIsInterviewInviteDialogOpen}
        onSend={handleSendInterviewInvite}
      />

      {/* Rejection Email Dialog */}
      <SendRejectionEmailDialog
        applicant={applicant}
        open={isRejectionDialogOpen}
        onOpenChange={setIsRejectionDialogOpen}
        onSend={handleSendRejection}
      />

      {/* Onboarding Dialog */}
      <SendApplicantOnboardingDialog
        applicant={applicant}
        open={isOnboardingDialogOpen}
        onOpenChange={setIsOnboardingDialogOpen}
        onSend={handleSendOnboarding}
      />

      {/* Convert to Colleague Dialog */}
      <ConvertApplicantDialog
        applicant={applicant}
        open={isConvertDialogOpen}
        onOpenChange={setIsConvertDialogOpen}
      />
    </Dialog>
  );
}
