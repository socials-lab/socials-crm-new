import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import type { BugReport, BugReportStatus, BugReportType } from "@/types/bugReport";

type BugReportsRow = Database["public"]["Tables"]["bug_reports"]["Row"];

interface AddReportInput {
  type: BugReportType;
  subject: string;
  description: string;
  pageUrl: string;
  screenshotDataUrl: string | null;
}

interface BugReportsContextValue {
  reports: BugReport[];
  unresolvedCount: number;
  isLoading: boolean;
  addReport: (input: AddReportInput) => Promise<BugReport>;
  updateStatus: (id: string, status: BugReportStatus) => Promise<void>;
}

interface BugReportEnvironment {
  report_type: BugReportType;
  reported_by: string;
}

const BugReportsContext = createContext<BugReportsContextValue | null>(null);

function parseEnvironment(environment: Json, reportId: string): BugReportEnvironment {
  if (!environment || typeof environment !== "object" || Array.isArray(environment)) {
    throw new Error(`Invalid environment payload for bug report ${reportId}`);
  }

  const reportType = environment.report_type;
  const reportedBy = environment.reported_by;

  if (reportType !== "bug" && reportType !== "feature") {
    throw new Error(`Invalid report type in environment for bug report ${reportId}`);
  }
  if (typeof reportedBy !== "string" || !reportedBy.trim()) {
    throw new Error(`Missing reported_by in environment for bug report ${reportId}`);
  }

  return {
    report_type: reportType,
    reported_by: reportedBy,
  };
}

function parseStatus(status: string | null, reportId: string): BugReportStatus {
  if (status !== "open" && status !== "in_progress" && status !== "resolved") {
    throw new Error(`Unsupported status '${status}' for bug report ${reportId}`);
  }
  return status;
}

function transformBugReport(row: BugReportsRow): BugReport {
  if (!row.id) throw new Error("Bug report id is missing");
  if (typeof row.title !== "string" || !row.title.trim()) {
    throw new Error(`Bug report ${row.id} has missing title`);
  }
  if (typeof row.url !== "string" || !row.url.trim()) {
    throw new Error(`Bug report ${row.id} has missing url`);
  }
  if (typeof row.created_at !== "string" || !row.created_at.trim()) {
    throw new Error(`Bug report ${row.id} has missing created_at`);
  }

  const environment = parseEnvironment(row.environment, row.id);
  const status = parseStatus(row.status, row.id);

  return {
    id: row.id,
    type: environment.report_type,
    status,
    subject: row.title,
    description: row.description ?? "",
    page_url: row.url,
    screenshot_url: row.screenshot_url,
    reported_by: environment.reported_by,
    created_at: row.created_at,
  };
}

export function BugReportsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["bug_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bug_reports")
        .select("*")
        .eq("app_name", "socials-crm")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map(transformBugReport);
    },
  });

  const unresolvedCount = useMemo(() => {
    return reports.filter((report) => report.status === "open" || report.status === "in_progress").length;
  }, [reports]);

  const addReportMutation = useMutation({
    mutationFn: async (input: AddReportInput) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user?.id) throw new Error("Cannot resolve authenticated reporter identity");

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (profileError) throw profileError;

      const reporter = profileData?.email ?? userData.user.id;
      if (!reporter) {
        throw new Error("Cannot resolve authenticated reporter identity");
      }

      const { data, error } = await supabase
        .from("bug_reports")
        .insert({
          title: input.subject,
          description: input.description,
          app_name: "socials-crm",
          url: input.pageUrl,
          screenshot_url: input.screenshotDataUrl,
          status: "open",
          environment: {
            report_type: input.type,
            reported_by: reporter,
          },
        })
        .select("*")
        .single();

      if (error) throw error;
      return transformBugReport(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bug_reports"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BugReportStatus }) => {
      const { data, error } = await supabase
        .from("bug_reports")
        .update({ status })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      return transformBugReport(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bug_reports"] });
    },
  });

  const addReport = useCallback(async (input: AddReportInput): Promise<BugReport> => {
    return addReportMutation.mutateAsync(input);
  }, [addReportMutation]);

  const updateStatus = useCallback(async (id: string, status: BugReportStatus): Promise<void> => {
    await updateStatusMutation.mutateAsync({ id, status });
  }, [updateStatusMutation]);

  const value = useMemo(
    () => ({
      reports,
      unresolvedCount,
      isLoading,
      addReport,
      updateStatus,
    }),
    [reports, unresolvedCount, isLoading, addReport, updateStatus]
  );

  return (
    <BugReportsContext.Provider value={value}>
      {children}
    </BugReportsContext.Provider>
  );
}

export function useBugReports() {
  const context = useContext(BugReportsContext);
  if (!context) {
    throw new Error("useBugReports must be used within BugReportsProvider");
  }
  return context;
}
