import { createNotification, notifyAdmins, notifyLeadOwner, notifyEngagementTeam, notifyExtraWorkColleague } from './notificationService';

/**
 * CRM notification triggers — called from hooks when key events happen.
 * All functions are non-blocking (fire-and-forget with try/catch).
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

export async function notifyAccessGranted(leadId: string, companyName: string, platforms: string[] = []) {
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
    title: '👀 Nabídka zobrazena',
    message: `${companyName} si prohlédl nabídku.`,
    link: '/leads',
    metadata: { company_name: companyName },
  });
}

export async function notifyContractSigned(leadId: string, companyName: string) {
  await Promise.all([
    notifyLeadOwner(leadId, {
      type: 'contract_signed',
      title: '✅ Smlouva podepsána',
      message: `${companyName} podepsal smlouvu.`,
      link: '/leads',
      metadata: { company_name: companyName },
    }),
    notifyAdmins({
      type: 'contract_signed',
      title: '✅ Smlouva podepsána',
      message: `${companyName} podepsal smlouvu.`,
      entityType: 'lead',
      entityId: leadId,
      link: '/leads',
      metadata: { company_name: companyName },
    }),
  ]);
}

export async function notifyLeadConverted(leadId: string, companyName: string, engagementId?: string) {
  await notifyAdmins({
    type: 'lead_converted',
    title: '🎉 Lead převeden',
    message: `${companyName} převeden na zakázku.`,
    entityType: 'lead',
    entityId: leadId,
    link: engagementId ? `/engagements?highlight=${engagementId}` : '/leads',
    metadata: { company_name: companyName, engagement_id: engagementId },
  });
}

export async function notifyLeadLost(leadId: string, companyName: string, reason?: string) {
  await notifyAdmins({
    type: 'lead_lost',
    title: '❌ Lead ztracen',
    message: `${companyName} byl ztracen${reason ? `: ${reason}` : ''}.`,
    entityType: 'lead',
    entityId: leadId,
    link: '/leads',
    metadata: { company_name: companyName, reason },
  });
}

// ===== ENGAGEMENTS =====

export async function notifyEngagementAssigned(engagementId: string, engagementName: string, colleagueId: string, colleagueName: string) {
  await createNotification({
    recipientColleagueId: colleagueId,
    type: 'engagement_assigned',
    title: '📁 Přiřazen k zakázce',
    message: `Byl jsi přiřazen k zakázce ${engagementName}.`,
    entityType: 'engagement',
    entityId: engagementId,
    link: `/engagements?highlight=${engagementId}`,
    metadata: { engagement_name: engagementName, colleague_name: colleagueName },
  });
}

export async function notifyEngagementServiceAdded(engagementId: string, engagementName: string, serviceName: string, excludeUserId?: string) {
  await notifyEngagementTeam(engagementId, excludeUserId || undefined, {
    type: 'engagement_service_added',
    title: '➕ Nová služba',
    message: `${serviceName} přidána k ${engagementName}.`,
    link: `/engagements?highlight=${engagementId}`,
    metadata: { engagement_name: engagementName, service_name: serviceName },
  });
}

// ===== EXTRA WORK =====

export async function notifyExtraWorkCreated(extraWorkId: string, name: string, clientName: string, amount: number) {
  await notifyAdmins({
    type: 'extra_work_created',
    title: '🔧 Nová vícepráce',
    message: `${name} pro ${clientName} (${amount.toLocaleString('cs-CZ')} Kč).`,
    entityType: 'extra_work',
    entityId: extraWorkId,
    link: '/extra-work',
    metadata: { name, client_name: clientName, amount },
  });
}

export async function notifyExtraWorkApproved(extraWorkId: string, name: string, colleagueId: string) {
  await createNotification({
    recipientColleagueId: colleagueId,
    type: 'extra_work_approved',
    title: '✅ Vícepráce schválena',
    message: `Vícepráce "${name}" byla schválena.`,
    entityType: 'extra_work',
    entityId: extraWorkId,
    link: '/extra-work',
    metadata: { name },
  });
}

export async function notifyExtraWorkReadyToInvoice(extraWorkId: string, name: string, clientName: string) {
  await notifyAdmins({
    type: 'extra_work_ready_to_invoice',
    title: '💰 Vícepráce k fakturaci',
    message: `${name} pro ${clientName} připravena k fakturaci.`,
    entityType: 'extra_work',
    entityId: extraWorkId,
    link: '/extra-work',
    metadata: { name, client_name: clientName },
  });
}

// ===== MODIFICATIONS =====

export async function notifyModificationCreated(engagementName: string, requestType: string, details?: string) {
  await notifyAdmins({
    type: 'modification_approved',
    title: '✏️ Nový návrh změny',
    message: `${requestType} pro ${engagementName}${details ? `: ${details}` : ''}.`,
    entityType: 'modification',
    link: '/modifications',
    metadata: { engagement_name: engagementName, request_type: requestType },
  });
}

export async function notifyModificationApproved(requestedByUserId: string, engagementName: string) {
  await createNotification({
    recipientUserId: requestedByUserId,
    type: 'modification_approved',
    title: '✅ Návrh schválen',
    message: `Váš návrh změny pro ${engagementName} byl schválen.`,
    entityType: 'modification',
    link: '/modifications',
    metadata: { engagement_name: engagementName },
  });
}

export async function notifyClientApprovedModification(engagementId: string, engagementName: string, clientName: string) {
  await Promise.all([
    notifyAdmins({
      type: 'client_approved_modification',
      title: '🤝 Klient schválil změnu',
      message: `${clientName} schválil změnu u ${engagementName}.`,
      entityType: 'modification',
      link: '/modifications',
      metadata: { engagement_name: engagementName, client_name: clientName },
    }),
    notifyEngagementTeam(engagementId, undefined, {
      type: 'client_approved_modification',
      title: '🤝 Klient schválil změnu',
      message: `${clientName} schválil změnu u ${engagementName}.`,
      link: `/engagements?highlight=${engagementId}`,
      metadata: { engagement_name: engagementName, client_name: clientName },
    }),
  ]);
}

// ===== INVOICING =====

export async function notifyInvoiceIssued(invoiceNumber: string, clientName: string, amount: number) {
  await notifyAdmins({
    type: 'invoice_issued',
    title: '🧾 Faktura vystavena',
    message: `${invoiceNumber} pro ${clientName} (${amount.toLocaleString('cs-CZ')} Kč).`,
    entityType: 'engagement',
    link: '/invoicing',
    metadata: { invoice_number: invoiceNumber, client_name: clientName, amount },
  });
}

// ===== APPLICANTS =====

export async function notifyApplicantOnboardingCompleted(applicantId: string, applicantName: string, position: string) {
  await notifyAdmins({
    type: 'applicant_onboarding_completed',
    title: '🎓 Onboarding dokončen',
    message: `${applicantName} (${position}) dokončil onboarding.`,
    entityType: 'applicant',
    entityId: applicantId,
    link: '/recruitment',
    metadata: { applicant_name: applicantName, position },
  });
}
