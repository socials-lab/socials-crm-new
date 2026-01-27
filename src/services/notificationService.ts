import { supabase } from '@/integrations/supabase/client';
import type { NotificationType, EntityType } from '@/types/notifications';

interface CreateNotificationParams {
  recipientColleagueId?: string;
  recipientUserId?: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: EntityType;
  entityId?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates a notification for a single user
 * Note: The notifications table must exist in Supabase for this to work
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    let userId = params.recipientUserId;
    
    // If we have a colleague ID but no user ID, look up the profile_id
    if (!userId && params.recipientColleagueId) {
      const { data: colleague } = await supabase
        .from('colleagues')
        .select('profile_id')
        .eq('id', params.recipientColleagueId)
        .maybeSingle();
      
      userId = colleague?.profile_id || undefined;
    }
    
    // If we still don't have a user ID, we can't create a notification
    if (!userId) {
      console.log('No user_id found for notification recipient');
      return false;
    }
    
    // Use 'as any' because the notifications table is not yet in the generated types
    const { error } = await (supabase.from('notifications' as any) as any).insert({
      user_id: userId,
      type: params.type,
      title: params.title,
      message: params.message,
      entity_type: params.entityType,
      entity_id: params.entityId,
      link: params.link,
      metadata: params.metadata || {},
    });
    
    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return false;
  }
}

/**
 * Creates notifications for all team members assigned to an engagement
 * Optionally excludes a specific user (e.g., the one who triggered the action)
 */
export async function notifyEngagementTeam(
  engagementId: string,
  excludeUserId: string | null,
  notification: Omit<CreateNotificationParams, 'recipientUserId' | 'recipientColleagueId'>
): Promise<number> {
  try {
    // Get all assigned colleagues with their profile_ids
    const { data: assignments, error: fetchError } = await supabase
      .from('engagement_assignments')
      .select('colleague_id, colleagues(profile_id)')
      .eq('engagement_id', engagementId);
    
    if (fetchError || !assignments) {
      console.error('Error fetching engagement assignments:', fetchError);
      return 0;
    }
    
    // Filter out colleagues without profile_id and the excluded user
    const notifications = assignments
      .filter((a: any) => {
        const profileId = a.colleagues?.profile_id;
        return profileId && profileId !== excludeUserId;
      })
      .map((a: any) => ({
        user_id: a.colleagues.profile_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        entity_type: notification.entityType,
        entity_id: notification.entityId,
        link: notification.link,
        metadata: notification.metadata || {},
      }));
    
    if (notifications.length === 0) {
      return 0;
    }
    
    // Use 'as any' because the notifications table is not yet in the generated types
    const { error } = await (supabase.from('notifications' as any) as any).insert(notifications);
    
    if (error) {
      console.error('Error creating team notifications:', error);
      return 0;
    }
    
    return notifications.length;
  } catch (error) {
    console.error('Error in notifyEngagementTeam:', error);
    return 0;
  }
}

/**
 * Notifies the owner of a lead about an event
 */
export async function notifyLeadOwner(
  leadId: string,
  notification: Omit<CreateNotificationParams, 'recipientUserId' | 'recipientColleagueId' | 'entityType' | 'entityId'>
): Promise<boolean> {
  try {
    // Get the lead's owner_id (which is a colleague_id)
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('owner_id, colleagues(profile_id)')
      .eq('id', leadId)
      .maybeSingle();
    
    if (fetchError || !lead?.owner_id) {
      console.log('Lead has no owner:', fetchError);
      return false;
    }
    
    const ownerProfileId = (lead as any).colleagues?.profile_id;
    
    if (!ownerProfileId) {
      console.log('Lead owner has no profile_id');
      return false;
    }
    
    return createNotification({
      recipientUserId: ownerProfileId,
      entityType: 'lead',
      entityId: leadId,
      ...notification,
    });
  } catch (error) {
    console.error('Error in notifyLeadOwner:', error);
    return false;
  }
}

/**
 * Notifies the colleague assigned to extra work
 */
export async function notifyExtraWorkColleague(
  extraWorkId: string,
  colleagueId: string,
  notification: Omit<CreateNotificationParams, 'recipientUserId' | 'recipientColleagueId' | 'entityType' | 'entityId'>
): Promise<boolean> {
  return createNotification({
    recipientColleagueId: colleagueId,
    entityType: 'extra_work',
    entityId: extraWorkId,
    ...notification,
  });
}

/**
 * Notifies all admins about an event
 */
export async function notifyAdmins(
  notification: Omit<CreateNotificationParams, 'recipientUserId' | 'recipientColleagueId'>
): Promise<number> {
  try {
    // Get all admin users
    const { data: adminRoles, error: fetchError } = await supabase
      .from('user_roles')
      .select('user_id')
      .or('role.eq.admin,is_super_admin.eq.true');
    
    if (fetchError || !adminRoles) {
      console.error('Error fetching admin roles:', fetchError);
      return 0;
    }
    
    const notifications = adminRoles.map(role => ({
      user_id: role.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      entity_type: notification.entityType,
      entity_id: notification.entityId,
      link: notification.link,
      metadata: notification.metadata || {},
    }));
    
    if (notifications.length === 0) {
      return 0;
    }
    
    // Use 'as any' because the notifications table is not yet in the generated types
    const { error } = await (supabase.from('notifications' as any) as any).insert(notifications);
    
    if (error) {
      console.error('Error creating admin notifications:', error);
      return 0;
    }
    
    return notifications.length;
  } catch (error) {
    console.error('Error in notifyAdmins:', error);
    return 0;
  }
}
