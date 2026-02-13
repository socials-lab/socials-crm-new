

## Redesign detailu uchazeče + Historie komunikace

### Co se změní

**1. Změna layoutu z bočního sheetu na centrovaný dialog**
- Aktuální `ApplicantDetailSheet` používá `Sheet` (boční panel vpravo)
- Změníme na `Dialog` s `DialogContent` centrovaným uprostřed obrazovky (max-w-4xl)
- Dvousloupcový layout podobný Lead Detail Sheetu:
  - **Levý sloupec**: Workflow kroky (komunikace, onboarding) + kontakt/detaily
  - **Pravý sloupec**: Historie komunikace (timeline) + poznámky

**2. Nová komponenta: ApplicantCommunicationTimeline**
- Chat-bubble rozhraní stejné jako `LeadCommunicationTimeline`
- Události generované z dat uchazeče:
  - Vytvoření uchazeče (`created_at`) -- system event
  - Pozvánka na pohovor odeslána (`interview_invite_sent_at`) -- sent
  - Odmítnutí odesláno (`rejection_sent_at`) -- sent
  - Onboarding formulář odeslán (`onboarding_sent_at`) -- sent
  - Onboarding vyplněn (`onboarding_completed_at`) -- received
  - Převod na kolegu (`converted_to_colleague_id`) -- system
  - Poznámky z pole `notes[]` -- internal (amber styl)
- Seskupení podle data, chat bubliny (sent = vpravo, received = vlevo, system = uprostřed, internal = amber uprostřed)

### Technické detaily

**Soubory k vytvoření:**
- `src/components/recruitment/ApplicantCommunicationTimeline.tsx` -- nová komponenta, vzor z `LeadCommunicationTimeline`

**Soubory k úpravě:**
- `src/components/recruitment/ApplicantDetailSheet.tsx`:
  - Přejmenovat na dialog-based komponentu (zachová název souboru pro kompatibilitu)
  - `Sheet` nahradit `Dialog`, `SheetContent` nahradit `DialogContent`
  - Rozdělit obsah do dvou sloupců (grid cols-2)
  - Levý sloupec: workflow kroky (Step 1 komunikace, Step 2 onboarding), kontakt, detaily, přílohy
  - Pravý sloupec: `ApplicantCommunicationTimeline` nahoře, pod tím inline poznámkový formulář
  - Motivační dopis přesunout do levého sloupce nebo kolapsovatelné sekce

**Bez změn v:**
- `src/pages/Recruitment.tsx` -- props rozhraní zůstává stejné (open, onOpenChange, applicant, onEdit)

