import { useState, useCallback } from 'react';
import type { RecurringInvoiceItem } from '@/types/crm';

const STORAGE_KEY = 'crm_recurring_invoice_items';

function loadItems(): RecurringInvoiceItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: RecurringInvoiceItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useRecurringInvoiceItems() {
  const [items, setItems] = useState<RecurringInvoiceItem[]>(loadItems);

  const addRecurringItem = useCallback((item: Omit<RecurringInvoiceItem, 'id' | 'created_at' | 'is_active'>) => {
    const newItem: RecurringInvoiceItem = {
      ...item,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setItems(prev => {
      const updated = [...prev, newItem];
      saveItems(updated);
      return updated;
    });
    return newItem;
  }, []);

  const removeRecurringItem = useCallback((id: string) => {
    setItems(prev => {
      const updated = prev.filter(i => i.id !== id);
      saveItems(updated);
      return updated;
    });
  }, []);

  const deactivateRecurringItem = useCallback((id: string, endYear: number, endMonth: number) => {
    setItems(prev => {
      const updated = prev.map(i => 
        i.id === id ? { ...i, is_active: false, end_year: endYear, end_month: endMonth } : i
      );
      saveItems(updated);
      return updated;
    });
  }, []);

  /** Get recurring items applicable for a given year/month */
  const getRecurringItemsForMonth = useCallback((year: number, month: number): RecurringInvoiceItem[] => {
    return items.filter(item => {
      // Check start
      const afterStart = year > item.start_year || (year === item.start_year && month >= item.start_month);
      if (!afterStart) return false;
      // Check end
      if (item.end_year !== null && item.end_month !== null) {
        const beforeEnd = year < item.end_year || (year === item.end_year && month <= item.end_month);
        if (!beforeEnd) return false;
      }
      return true;
    });
  }, [items]);

  return {
    recurringItems: items,
    addRecurringItem,
    removeRecurringItem,
    deactivateRecurringItem,
    getRecurringItemsForMonth,
  };
}
