

## Redesign historie komunikace uchazecu

### Problem
Aktualni `ApplicantCommunicationTimeline` nezobrazuje texty emailu (pozvanky, odmitnuti, onboarding) -- pouze systemove udalosti bez obsahu. Chybi take datova struktura pro ukladani emailoveho obsahu do poznamek (subject, recipients, note_type).

### Co se zmeni

**1. Rozsireni datoveho modelu `ApplicantNote`** (`src/types/applicant.ts`)
- Pridani poli `note_type` (general, internal, email_sent, email_received), `subject`, `recipients` -- stejne jako `LeadNote`
- Novy typ `ApplicantNoteType`

**2. Uprava send funkci v `useApplicantsData.tsx`**
- `sendInterviewInvite`, `sendRejection`, `sendOnboarding` budou prijmat volitelny parametr s obsahem emailu (subject, message, recipients)
- Automaticky se vytvori poznamka typu `email_sent` s textem emailu do historie

**3. Uprava send dialogu** (SendInterviewInviteDialog, SendRejectionEmailDialog, SendApplicantOnboardingDialog)
- Pri odeslani predaji obsah emailu (subject, message body, recipients) do `addNote` / send funkce
- Stejne jako to funguje u leadu

**4. Redesign `ApplicantCommunicationTimeline`**
- Zkopirovani plneho designu z `LeadCommunicationTimeline`:
  - Podpora `subject`, `recipients`, `noteType` v TimelineEvent
  - Zobrazeni textu emailu v chat bublinach
  - Radek "Komu:" u sent emailu
  - Author name u vsech zprav
- Timeline bude uzsi (sjednoceni s leadem)

**5. Uprava `ApplicantDetailSheet`**
- Pravy sloupec bude uzsi -- pomer sloupcu zmenit z 50/50 na 55/45 nebo pouzit max-width

### Technicke detaily

**Soubory k uprave:**
- `src/types/applicant.ts` -- rozsireni `ApplicantNote` o `note_type`, `subject`, `recipients`
- `src/hooks/useApplicantsData.tsx` -- upravit `sendInterviewInvite`, `sendRejection`, `sendOnboarding` aby logovaly email obsah; upravit `addNote` pro podporu typu
- `src/components/recruitment/ApplicantCommunicationTimeline.tsx` -- prepis na plny design z `LeadCommunicationTimeline` vcetne zobrazeni emailovych textu
- `src/components/recruitment/SendInterviewInviteDialog.tsx` -- predat obsah emailu pri odeslani
- `src/components/recruitment/SendRejectionEmailDialog.tsx` -- predat obsah emailu pri odeslani
- `src/components/recruitment/SendApplicantOnboardingDialog.tsx` -- predat obsah emailu pri odeslani
- `src/components/recruitment/ApplicantDetailSheet.tsx` -- upravit layout sloupcu (uzsi pravy sloupec)

