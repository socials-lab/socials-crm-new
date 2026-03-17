export type BugReportType = 'bug' | 'feature';
export type BugReportStatus = 'open' | 'in_progress' | 'resolved';

export interface BugReport {
  id: string;
  type: BugReportType;
  status: BugReportStatus;
  subject: string;
  description: string;
  page_url: string;
  screenshot_url: string | null;
  reported_by: string;
  created_at: string;
}

export const BUG_REPORT_TYPE_CONFIG: Record<BugReportType, { label: string }> = {
  bug: { label: 'Bug Report' },
  feature: { label: 'Feature Request' },
};

export const BUG_REPORT_STATUS_CONFIG: Record<BugReportStatus, { label: string }> = {
  open: { label: 'Otevřené' },
  in_progress: { label: 'V řešení' },
  resolved: { label: 'Vyřešené' },
};
