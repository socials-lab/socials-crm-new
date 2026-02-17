import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  link?: string;
}

interface NotifyAdminsParams {
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  link?: string;
}

/**
 * Create a notification for a specific user
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const { recipientUserId, type, title, message, entityType, entityId, link } = params;

  try {
    await supabase.from('notifications').insert({
      user_id: recipientUserId,
      type,
      title,
      message,
      link,
      metadata: {
        entity_type: entityType,
        entity_id: entityId,
      },
      read: false,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Send notification to all admin users
 */
export async function notifyAdmins(params: NotifyAdminsParams): Promise<void> {
  const { type, title, message, entityType, entityId, link } = params;

  try {
    // Get all admin/super_admin profiles
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'super_admin']);

    if (adminsError || !admins || admins.length === 0) {
      console.log('No admins found or error fetching admins');
      return;
    }

    // Create notifications for all admins
    const notifications = admins.map(admin => ({
      user_id: admin.id,
      type,
      title,
      message,
      link,
      metadata: {
        entity_type: entityType,
        entity_id: entityId,
      },
      read: false,
    }));

    await supabase.from('notifications').insert(notifications);
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
}
