export type FeedbackCategory = 
  | 'process'
  | 'service'
  | 'communication'
  | 'system'
  | 'other';

export type FeedbackStatus = 
  | 'new'
  | 'in_review'
  | 'accepted'
  | 'rejected'
  | 'implemented';

export interface FeedbackIdea {
  id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  author_id: string;
  created_at: string;
  updated_at: string;
  status: FeedbackStatus;
}

export interface FeedbackVote {
  id: string;
  idea_id: string;
  colleague_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
}

export const FEEDBACK_CATEGORY_CONFIG: Record<FeedbackCategory, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  process: {
    label: 'Procesy',
    icon: '⚙️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
  },
  service: {
    label: 'Služby',
    icon: '🎯',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
  },
  communication: {
    label: 'Komunikace',
    icon: '💬',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
  },
  system: {
    label: 'Systém',
    icon: '💻',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
  },
  other: {
    label: 'Ostatní',
    icon: '📝',
    color: 'text-gray-600',
    bgColor: 'bg-gray-500/10',
  },
};

export const FEEDBACK_STATUS_CONFIG: Record<FeedbackStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  new: {
    label: 'Nový',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
  },
  in_review: {
    label: 'V hodnocení',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
  },
  accepted: {
    label: 'Přijato',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
  },
  rejected: {
    label: 'Zamítnuto',
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
  },
  implemented: {
    label: 'Implementováno',
    color: 'text-violet-600',
    bgColor: 'bg-violet-500/10',
  },
};
