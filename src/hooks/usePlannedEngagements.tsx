import { useState, useEffect, useCallback } from 'react';

export interface PlannedEngagement {
  id: string;
  name: string;
  client_name: string;
  lead_id?: string;
  monthly_fee: number;
  start_date: string;
  assigned_colleague_ids: string[];
  notes: string;
  probability_percent: number;
  created_at: string;
}

const STORAGE_KEY = 'planned_engagements';

export function usePlannedEngagements() {
  const [plannedEngagements, setPlannedEngagements] = useState<PlannedEngagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPlannedEngagements(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading planned engagements:', error);
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever data changes
  const saveToStorage = useCallback((data: PlannedEngagement[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving planned engagements:', error);
    }
  }, []);

  const addPlannedEngagement = useCallback((engagement: Omit<PlannedEngagement, 'id' | 'created_at'>) => {
    const newEngagement: PlannedEngagement = {
      ...engagement,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    
    setPlannedEngagements(prev => {
      const updated = [...prev, newEngagement];
      saveToStorage(updated);
      return updated;
    });
    
    return newEngagement;
  }, [saveToStorage]);

  const updatePlannedEngagement = useCallback((id: string, updates: Partial<PlannedEngagement>) => {
    setPlannedEngagements(prev => {
      const updated = prev.map(e => 
        e.id === id ? { ...e, ...updates } : e
      );
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const deletePlannedEngagement = useCallback((id: string) => {
    setPlannedEngagements(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Get planned engagements for a specific month
  const getPlannedForMonth = useCallback((year: number, month: number) => {
    return plannedEngagements.filter(e => {
      const startDate = new Date(e.start_date);
      return startDate.getFullYear() === year && startDate.getMonth() + 1 === month;
    });
  }, [plannedEngagements]);

  // Get planned engagements starting from a specific date
  const getPlannedFromDate = useCallback((fromDate: Date) => {
    return plannedEngagements.filter(e => {
      const startDate = new Date(e.start_date);
      return startDate >= fromDate;
    });
  }, [plannedEngagements]);

  return {
    plannedEngagements,
    isLoading,
    addPlannedEngagement,
    updatePlannedEngagement,
    deletePlannedEngagement,
    getPlannedForMonth,
    getPlannedFromDate,
  };
}
