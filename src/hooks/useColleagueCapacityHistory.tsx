import { useState, useCallback } from 'react';
import type { ColleagueCapacityRecord } from '@/types/crm';

// Local storage key for capacity history
const STORAGE_KEY = 'colleague-capacity-history';

function getStoredHistory(): ColleagueCapacityRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: ColleagueCapacityRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function useColleagueCapacityHistory(colleagueId: string | null) {
  const [allHistory, setAllHistory] = useState<ColleagueCapacityRecord[]>(getStoredHistory);

  const history = colleagueId 
    ? allHistory
        .filter(h => h.colleague_id === colleagueId)
        .sort((a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime())
    : [];

  const addHistoryRecord = useCallback((record: {
    colleague_id: string;
    capacity_hours: number;
    previous_capacity_hours: number | null;
    effective_from: string;
    reason: string;
  }) => {
    const newRecord: ColleagueCapacityRecord = {
      id: crypto.randomUUID(),
      ...record,
      changed_by: null,
      created_at: new Date().toISOString(),
    };

    const updated = [newRecord, ...allHistory];
    setAllHistory(updated);
    saveHistory(updated);
    return newRecord;
  }, [allHistory]);

  return {
    history,
    isLoading: false,
    error: null,
    addHistoryRecord: { mutate: addHistoryRecord, isPending: false },
  };
}
