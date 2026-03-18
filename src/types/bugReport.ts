export type BugReportType = "bug" | "feature";
export type BugReportStatus = "open" | "in_progress" | "resolved";

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
