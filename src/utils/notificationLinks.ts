import type { Notification } from '@/types/notifications';

const withQueryParam = (basePath: string, key: string, value: string) => {
  const encodedValue = encodeURIComponent(value);
  const separator = basePath.includes('?') ? '&' : '?';
  return `${basePath}${separator}${key}=${encodedValue}`;
};

export const resolveNotificationTargetLink = (notification: Notification) => {
  const { link, metadata, type } = notification;
  if (!link) return link;

  if (link === '/leads' && metadata?.lead_id) {
    return withQueryParam('/leads', 'openLead', metadata.lead_id);
  }

  if (link === '/clients' && metadata?.client_id) {
    return withQueryParam('/clients', 'highlight', metadata.client_id);
  }

  if (link === '/engagements' && metadata?.engagement_id) {
    return withQueryParam('/engagements', 'highlight', metadata.engagement_id);
  }

  if (link === '/feedback' && metadata?.idea_id) {
    return withQueryParam('/feedback', 'idea', metadata.idea_id);
  }

  if (link === '/colleagues' && metadata?.colleague_id) {
    return withQueryParam('/colleagues', 'highlight', metadata.colleague_id);
  }

  if (type === 'new_feedback_idea' && metadata?.idea_id) {
    return withQueryParam('/feedback', 'idea', metadata.idea_id);
  }

  if (type === 'colleague_birthday' && metadata?.colleague_id) {
    return withQueryParam('/colleagues', 'highlight', metadata.colleague_id);
  }

  return link;
};
