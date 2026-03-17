import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { BugReport, BugReportType, BugReportStatus } from '@/types/bugReport';
import { bugReportsMockData } from '@/data/bugReportsMockData';

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
  addReport: (input: AddReportInput) => void;
  updateStatus: (id: string, status: BugReportStatus) => void;
}

const BugReportsContext = createContext<BugReportsContextValue | null>(null);

export function BugReportsProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<BugReport[]>(bugReportsMockData);

  const unresolvedCount = useMemo(
    () => reports.filter(r => r.status === 'open' || r.status === 'in_progress').length,
    [reports]
  );

  const addReport = useCallback((input: AddReportInput) => {
    const newReport: BugReport = {
      id: crypto.randomUUID(),
      type: input.type,
      status: 'open',
      subject: input.subject,
      description: input.description,
      page_url: input.pageUrl,
      screenshot_url: input.screenshotDataUrl,
      reported_by: 'Aktuální uživatel',
      created_at: new Date().toISOString(),
    };
    setReports(prev => [newReport, ...prev]);
  }, []);

  const updateStatus = useCallback((id: string, status: BugReportStatus) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }, []);

  return (
    <BugReportsContext.Provider value={{ reports, unresolvedCount, addReport, updateStatus }}>
      {children}
    </BugReportsContext.Provider>
  );
}

export function useBugReports() {
  const ctx = useContext(BugReportsContext);
  if (!ctx) throw new Error('useBugReports must be used within BugReportsProvider');
  return ctx;
}
