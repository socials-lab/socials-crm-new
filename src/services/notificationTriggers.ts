import { createNotification, notifyAdmins, notifyLeadOwner, notifyEngagementTeam, notifyExtraWorkColleague } from './notificationService';

/**
 * Klíčové CRM události, které generují notifikace:
 * 
 * LEADS:
 * - Nový lead vytvořen → admini
 * - Onboarding formulář vyplněn → owner leadu + admini
 * - Klient nasdílel přístupy → owner leadu
 * - Nabídka odeslána → admini
 * - Nabídka zobrazena klientem → owner leadu
 * - Smlouva podepsána → owner leadu + admini
 * - Lead převeden na zakázku → admini
 * - Lead ztracen/bad fit → admini
 * 
 * ENGAGEMENTS:
 * - Nový kolega přiřazen → kolega
 * - Nová služba přidána → tým zakázky
 * 
 * EXTRA WORK:
 * - Nová vícepráce vytvořena → admini
 * - Vícepráce schválena → kolega
 * - Vícepráce připravena k fakturaci → admini
 * 
 * MODIFICATION REQUESTS:
 * - Nový návrh změny → admini
 * - Návrh interně schválen → navrhovatel
 * - Klient schválil změnu → admini + tým zakázky
 */

// ===== LEADS =====

export async function notifyNewLead(leadId: string, companyName: string) {
  await notifyAdmins({
    type: 'new_lead',
    title: '🎯 Nový lead',
    message: `Nový lead: ${companyName}`,
    entityType: 'lead',
    entityId: leadId,
    link: '/leads',
    metadata: { company_name: companyName },
  });
}

export async function notifyFormCompleted(leadId: string, companyName: string) {
  await Promise.all([
    notifyLeadOwner(leadId, {
      type: 'form_completed',
      title: '📋 Formulář vyplněn',
      message: `${companyName} vyplnil onboarding formulář.`,
      link: '/leads',
      metadata: { company_name: companyName },
    }),
    notifyAdmins({
      type: 'form_completed',
      title: '📋 Formulář vyplněn',
      message: `${companyName} vyplnil onboarding formulář.`,
      entityType: 'lead',
      entityId: leadId,
      link: '/leads',
      metadata: { company_name: companyName },
    }),
  ]);
}

export async function notifyAccessGranted(leadId: string, companyName: string, platforms: string[]) {
  await notifyLeadOwner(leadId, {
    type: 'access_granted',
    title: '🔑 Přístupy nasdíleny',
    message: `${companyName} nasdílel přístupy${platforms.length > 0 ? `: ${platforms.join(', ')}` : ''}.`,
    link: '/leads',
    metadata: { company_name: companyName, platforms },
  });
}

export async function notifyOfferSent(leadId: string, companyName: string) {
  await notifyAdmins({
    type: 'offer_sent',
    title: '📤 Nabídka odeslána',
    message: `Nabídka pro ${companyName} byla odeslána.`,
    entityType: 'lead',
    entityId: leadId,
    link: '/leads',
    metadata: { company_name: companyName },
  });
}

export async function notifyOfferViewed(leadId: string, companyName: string) {
  await notifyLeadOwner(leadId, {
    type: 'offer_viewed',
    title: '👁️ Nabídka zobrazena',
    message: `${companyName} si prohlédl/a nabídku.`,
    link: '/leads',
    metadata: { company_name: companyName },
  });
}

export async function notifyContractSigned(leadId: string, companyName: string) {
  await Promise.all([
    notifyLeadOwner(leadId, {
      type: 'contract_signed',
      title: '✍️ Smlouva podepsána',
      message: `${companyName} podepsal smlouvu o spolupráci!`,
      link: '/leads',
      metadata: { company_name: companyName },
    }),
    notifyAdmins({
      type: 'contract_signed',
      title: '✍️ Smlouva podepsána',
      message: `${companyName} podepsal smlouvu o spolupráci!`,
      entityType: 'lead',
      entityId: leadId,
      link: '/leads',
      metadata: { company_name: companyName },
    }),
  ]);
}

export async function notifyLeadConverted(leadId: string, companyName: string, engagementId: string) {
  await notifyAdmins({
    type: 'lead_converted',
    title: '🎉 Lead převeden na zakázku',
    message: `${companyName} byl úspěšně převeden na aktivního klienta.`,
    entityType: 'engagement',
    entityId: engagementId,
    link: '/engagements',
    metadata: { company_name: companyName, lead_id: leadId },
  });
}

export async function notifyLeadLost(leadId: string, companyName: string, reason?: string) {
  await notifyAdmins({
    type: 'new_lead', // reuse type
    title: '❌ Lead ztracen',
    message: `${companyName} byl označen jako prohraný${reason ? `: ${reason}` : ''}.`,
    entityType: 'lead',
    entityId: leadId,
    link: '/leads',
    metadata: { company_name: companyName, reason },
  });
}

// ===== ENGAGEMENTS =====

export async function notifyEngagementAssigned(
  engagementId: string, 
  engagementName: string, 
  colleagueId: string,
  colleagueName: string
) {
  await createNotification({
    recipientColleagueId: colleagueId,
    type: 'engagement_assigned',
    title: '👤 Nové přiřazení',
    message: `Byli jste přiřazeni k zakázce ${engagementName}.`,
    entityType: 'engagement',
    entityId: engagementId,
    link: '/engagements',
    metadata: { engagement_name: engagementName, colleague_name: colleagueName },
  });
}

export async function notifyEngagementServiceAdded(
  engagementId: string,
  engagementName: string,
  serviceName: string,
  excludeUserId: string | null
) {
  await notifyEngagementTeam(engagementId, excludeUserId, {
    type: 'engagement_service_added',
    title: '➕ Nová služba',
    message: `Do zakázky ${engagementName} byla přidána služba: ${serviceName}.`,
    entityType: 'engagement',
    entityId: engagementId,
    link: '/engagements',
    metadata: { engagement_name: engagementName, service_name: serviceName },
  });
}

// ===== EXTRA WORK =====

export async function notifyExtraWorkCreated(
  extraWorkId: string, 
  name: string, 
  clientName: string,
  amount: number
) {
  await notifyAdmins({
    type: 'extra_work_ready_to_invoice', // reuse
    title: '📝 Nová vícepráce',
    message: `Nová vícepráce "${name}" pro ${clientName} (${amount.toLocaleString('cs-CZ')} CZK).`,
    entityType: 'extra_work',
    entityId: extraWorkId,
    link: '/extra-work',
    metadata: { name, client_name: clientName, amount },
  });
}

export async function notifyExtraWorkApproved(
  extraWorkId: string,
  name: string,
  colleagueId: string
) {
  await notifyExtraWorkColleague(extraWorkId, colleagueId, {
    type: 'extra_work_approved',
    title: '✅ Vícepráce schválena',
    message: `Vaše vícepráce "${name}" byla schválena.`,
    link: '/extra-work',
    metadata: { name },
  });
}

export async function notifyExtraWorkReadyToInvoice(extraWorkId: string, name: string, clientName: string) {
  await notifyAdmins({
    type: 'extra_work_ready_to_invoice',
    title: '💰 Vícepráce k fakturaci',
    message: `Vícepráce "${name}" pro ${clientName} je připravena k fakturaci.`,
    entityType: 'extra_work',
    entityId: extraWorkId,
    link: '/extra-work',
    metadata: { name, client_name: clientName },
  });
}

// ===== MODIFICATION REQUESTS =====

export async function notifyModificationCreated(
  engagementName: string,
  requestType: string,
  details: string
) {
  await notifyAdmins({
    type: 'modification_approved', // reuse
    title: '📋 Nový návrh změny',
    message: `Nový návrh změny pro ${engagementName}: ${details}`,
    entityType: 'modification',
    link: '/modifications',
    metadata: { engagement_name: engagementName, request_type: requestType },
  });
}

export async function notifyModificationApproved(
  requestedByUserId: string,
  engagementName: string
) {
  await createNotification({
    recipientUserId: requestedByUserId,
    type: 'modification_approved',
    title: '✅ Návrh změny schválen',
    message: `Váš návrh změny pro ${engagementName} byl interně schválen.`,
    entityType: 'modification',
    link: '/modifications',
    metadata: { engagement_name: engagementName },
  });
}

export async function notifyClientApprovedModification(
  engagementId: string,
  engagementName: string,
  clientName: string
) {
  await Promise.all([
    notifyAdmins({
      type: 'client_approved_modification',
      title: '✅ Klient schválil změnu',
      message: `${clientName} schválil úpravu zakázky ${engagementName}.`,
      entityType: 'modification',
      entityId: engagementId,
      link: '/modifications',
      metadata: { engagement_name: engagementName, client_name: clientName },
    }),
    notifyEngagementTeam(engagementId, null, {
      type: 'client_approved_modification',
      title: '✅ Klient schválil změnu',
      message: `${clientName} schválil úpravu zakázky ${engagementName}.`,
      entityType: 'modification',
      entityId: engagementId,
      link: '/modifications',
      metadata: { engagement_name: engagementName, client_name: clientName },
    }),
  ]);
}

// ===== RECRUITMENT =====

export async function notifyApplicantOnboardingCompleted(
  applicantId: string,
  applicantName: string,
  position: string,
  contractSummary: Record<string, unknown>
) {
  const rateText = contractSummary.hourly_rate ? `, sazba: ${contractSummary.hourly_rate} Kč/h` : '';
  await notifyAdmins({
    type: 'applicant_onboarding_completed',
    title: '📋 Onboarding vyplněn – připravte smlouvu',
    message: `${applicantName} vyplnil onboarding formulář. Připravte smlouvu – pozice: ${position}${rateText}`,
    entityType: 'applicant',
    entityId: applicantId,
    link: '/recruitment',
    metadata: contractSummary,
  });
}

// ===== INVOICING =====

export async function notifyInvoiceIssued(
  invoiceNumber: string,
  clientName: string,
  amount: number
) {
  await notifyAdmins({
    type: 'extra_work_ready_to_invoice',
    title: '🧾 Faktura vystavena',
    message: `Faktura ${invoiceNumber} pro ${clientName} (${amount.toLocaleString('cs-CZ')} CZK).`,
    entityType: 'engagement',
    link: '/invoicing',
    metadata: { invoice_number: invoiceNumber, client_name: clientName, amount },
  });
}
