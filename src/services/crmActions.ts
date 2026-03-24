import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CrmActionType = 'create_extra_work' | 'propose_modification' | 'add_note' | 'create_lead';

export interface CrmAction {
  action: CrmActionType;
  data: Record<string, any>;
}

const ACTION_LABELS: Record<CrmActionType, string> = {
  create_extra_work: '📝 Vytvořit vícepráci',
  propose_modification: '📋 Navrhnout změnu zakázky',
  add_note: '💬 Přidat poznámku',
  create_lead: '🎯 Vytvořit leada',
};

const ACTION_ICONS: Record<CrmActionType, string> = {
  create_extra_work: '📝',
  propose_modification: '📋',
  add_note: '💬',
  create_lead: '🎯',
};

export function getActionLabel(action: CrmActionType): string {
  return ACTION_LABELS[action] || action;
}

export function getActionIcon(action: CrmActionType): string {
  return ACTION_ICONS[action] || '⚡';
}

export function getActionSummary(action: CrmAction): string[] {
  const { data } = action;
  switch (action.action) {
    case 'create_extra_work':
      return [
        `Klient: ${data.client_name || '–'}`,
        `Popis: ${data.description || '–'}`,
        `Částka: ${data.amount ? `${Number(data.amount).toLocaleString('cs-CZ')} Kč` : '–'}`,
        ...(data.hours_worked ? [`Hodiny: ${data.hours_worked}h`] : []),
      ];
    case 'propose_modification':
      return [
        `Klient: ${data.client_name || '–'}`,
        `Zakázka: ${data.engagement_name || '–'}`,
        `Typ: ${data.modification_type || '–'}`,
        `Služba: ${data.service_name || '–'}`,
        ...(data.proposed_price ? [`Cena: ${Number(data.proposed_price).toLocaleString('cs-CZ')} Kč/měs`] : []),
      ];
    case 'add_note':
      return [
        `${data.entity_type === 'client' ? 'Klient' : 'Lead'}: ${data.entity_name || '–'}`,
        `Poznámka: ${data.note || '–'}`,
      ];
    case 'create_lead':
      return [
        `Firma: ${data.company_name || '–'}`,
        `Kontakt: ${data.contact_name || '–'}`,
        `Email: ${data.contact_email || '–'}`,
        ...(data.potential_service ? [`Služba: ${data.potential_service}`] : []),
        ...(data.ad_spend_monthly ? [`Ad spend: ${Number(data.ad_spend_monthly).toLocaleString('cs-CZ')} Kč/měs`] : []),
      ];
    default:
      return ['Neznámá akce'];
  }
}

export async function executeCrmAction(action: CrmAction): Promise<{ success: boolean; message: string; url?: string }> {
  try {
    switch (action.action) {
      case 'create_lead':
        return await executeCreateLead(action.data);
      case 'create_extra_work':
        return await executeCreateExtraWork(action.data);
      case 'add_note':
        return await executeAddNote(action.data);
      case 'propose_modification':
        return { success: true, message: 'Návrh změny připraven – otevři Návrhy změn v CRM pro dokončení.', url: '/modifications' };
      default:
        return { success: false, message: 'Neznámý typ akce' };
    }
  } catch (e: any) {
    console.error('CRM action error:', e);
    return { success: false, message: e.message || 'Chyba při provádění akce' };
  }
}

async function executeCreateLead(data: Record<string, any>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nepřihlášen');

  const { error } = await supabase.from('leads').insert({
    company_name: data.company_name || 'Nový lead',
    contact_name: data.contact_name || '',
    contact_email: data.contact_email || '',
    source: data.source || 'inbound',
    potential_service: data.potential_service || '',
    ad_spend_monthly: data.ad_spend_monthly || null,
    notes: data.notes ? [{ text: data.notes, created_at: new Date().toISOString(), author: 'Dandroid' }] : [],
    created_by: user.id,
    stage: 'new_lead',
  });
  if (error) throw error;
  return { success: true, message: `Lead "${data.company_name}" vytvořen ✅`, url: '/leads' };
}

async function executeCreateExtraWork(data: Record<string, any>) {
  // Find client by name
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .ilike('name', `%${data.client_name}%`)
    .limit(1);

  if (!clients || clients.length === 0) {
    return { success: false, message: `Klient "${data.client_name}" nenalezen. Zkontroluj název a zkus to znovu.` };
  }

  // Find a colleague (current user's colleague record)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nepřihlášen');

  const { data: colleagues } = await supabase
    .from('colleagues')
    .select('id')
    .eq('profile_id', user.id)
    .limit(1);

  const colleagueId = colleagues?.[0]?.id;
  if (!colleagueId) {
    return { success: false, message: 'Nepodařilo se najít tvůj profil kolegy. Zkontroluj přiřazení v Nastavení.' };
  }

  const now = new Date();
  const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { error } = await supabase.from('extra_works').insert({
    client_id: clients[0].id,
    colleague_id: colleagueId,
    name: data.description || 'Vícepráce',
    description: data.description || '',
    amount: data.amount || 0,
    hours_worked: data.hours_worked || null,
    hourly_rate: data.hourly_rate || 700,
    work_date: now.toISOString().split('T')[0],
    billing_period: billingPeriod,
    status: 'pending_approval',
  });
  if (error) throw error;
  return { success: true, message: `Vícepráce pro "${clients[0].name}" vytvořena ✅`, url: '/extra-work' };
}

async function executeAddNote(data: Record<string, any>) {
  const table = data.entity_type === 'lead' ? 'leads' : 'clients';
  const nameCol = data.entity_type === 'lead' ? 'company_name' : 'name';

  const { data: entities } = await supabase
    .from(table)
    .select(`id, ${nameCol}, pinned_notes`)
    .ilike(nameCol, `%${data.entity_name}%`)
    .limit(1);

  if (!entities || entities.length === 0) {
    return { success: false, message: `${data.entity_type === 'lead' ? 'Lead' : 'Klient'} "${data.entity_name}" nenalezen.` };
  }

  const entity = entities[0];
  const existingNotes = (entity as any).pinned_notes || '';
  const timestamp = new Date().toLocaleString('cs-CZ');
  const newNotes = `${existingNotes}\n\n🤖 Dandroid (${timestamp}):\n${data.note}`.trim();

  const { error } = await supabase
    .from(table)
    .update({ pinned_notes: newNotes })
    .eq('id', entity.id);

  if (error) throw error;
  const entityName = (entity as any)[nameCol];
  return {
    success: true,
    message: `Poznámka přidána k "${entityName}" ✅`,
    url: data.entity_type === 'lead' ? '/leads' : '/clients',
  };
}

/**
 * Parse dandroid-action blocks from AI response content.
 * Returns the text without action blocks + array of parsed actions.
 */
export function parseActionsFromContent(content: string): { text: string; actions: CrmAction[] } {
  const actionRegex = /```dandroid-action\n([\s\S]*?)```/g;
  const actions: CrmAction[] = [];
  let text = content;

  let match;
  while ((match = actionRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed.action && parsed.data) {
        actions.push(parsed as CrmAction);
      }
    } catch { /* skip malformed */ }
    text = text.replace(match[0], '').trim();
  }

  return { text, actions };
}
