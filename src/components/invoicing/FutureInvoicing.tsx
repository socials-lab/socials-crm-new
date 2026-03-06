import { useState, useMemo, useEffect } from 'react';
import { useCRMData } from '@/hooks/useCRMData';
import { EngagementInvoiceCard } from './EngagementInvoiceCard';
import { IssueInvoicesDialog } from './IssueInvoicesDialog';
import { AddInvoiceDialog } from './AddInvoiceDialog';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Save, Send, FileText, AlertTriangle, Plus, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { InvoiceLineItem, MonthlyEngagementInvoice } from '@/types/crm';
import { getDaysInMonth, parseISO, startOfMonth, endOfMonth, format, isAfter, isBefore } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { isEngagementServiceActiveInPeriod } from '@/lib/engagementServiceLifecycle';

export interface IssuedStats {
  totalCount: number;
  totalAmount: number;
  retainer: { count: number; amount: number };
  extraWork: { count: number; amount: number };
  oneOff: { count: number; amount: number };
  creativeBoost: { count: number; amount: number };
}

interface FutureInvoicingProps {
  year: number;
  month: number;
  onIssuedStatsChange?: (stats: IssuedStats) => void;
}

function requireCurrency(value: string | null | undefined, context: string): string {
  if (!value) {
    throw new Error(`Missing currency for ${context}`);
  }
  return value;
}

function requireSingleCurrency(items: InvoiceLineItem[], context: string): string {
  if (items.length === 0) {
    throw new Error(`Missing line items for ${context}`);
  }
  const firstCurrency = requireCurrency(items[0].currency, `${context} line item ${items[0].id}`);
  const mixed = items.find(
    (item) => requireCurrency(item.currency, `${context} line item ${item.id}`) !== firstCurrency,
  );
  if (mixed) {
    throw new Error(`Mixed currencies in ${context}`);
  }
  return firstCurrency;
}


export function FutureInvoicing({ year, month, onIssuedStatsChange }: FutureInvoicingProps) {
  const { clients, engagements, engagementServices, getClientById, getExtraWorksReadyToInvoice, markExtraWorkAsInvoiced, getUnbilledOneOffServices, issuedInvoices } = useCRMData();
  const { clientMonths, getClientOutputs, calculateOutputCredits } = useCreativeBoostData();
  const draftKey = `invoice-drafts-${year}-${month}`;
  const [invoices, setInvoices] = useState<MonthlyEngagementInvoice[]>(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [singleIssueInvoice, setSingleIssueInvoice] = useState<MonthlyEngagementInvoice | null>(null);
  const [showApprovalWarning, setShowApprovalWarning] = useState(false);
  const [showMixedCurrencyWarning, setShowMixedCurrencyWarning] = useState(false);
  const [issuedInvoiceIds, setIssuedInvoiceIds] = useState<Set<string>>(new Set());
  const [issuedInvoiceDeliveryByGeneratedId, setIssuedInvoiceDeliveryByGeneratedId] = useState<Map<string, boolean>>(new Map());
  const [savingDraft, setSavingDraft] = useState(false);

  // Clear draft state when year/month changes and reload from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      setInvoices(saved ? JSON.parse(saved) : []);
    } catch {
      setInvoices([]);
    }
  }, [draftKey]);

  // Auto-save drafts whenever invoices change (debounced)
  useEffect(() => {
    // Only auto-save if user has made edits (invoices.length > 0)
    if (invoices.length === 0) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(invoices));
      } catch (e) {
        console.error('Failed to auto-save invoice drafts:', e);
      }
    }, 500); // Debounce 500ms to avoid excessive writes

    return () => clearTimeout(timeoutId);
  }, [invoices, draftKey]);

  // Initialize issuedInvoiceIds based on actual issued invoices from database
  useEffect(() => {
    const alreadyIssuedIds = new Set<string>();
    const deliveryMap = new Map<string, boolean>();

    // Check which engagements already have issued invoices for this year/month
    issuedInvoices
      .filter(inv => inv.year === year && inv.month === month)
      .forEach(inv => {
        // The generated invoice ID format is `inv-{engagement_id}-{year}-{month}`
        const generatedId = `inv-${inv.engagement_id}-${year}-${month}`;
        alreadyIssuedIds.add(generatedId);
        deliveryMap.set(generatedId, !!inv.fakturoid_id);
      });

    setIssuedInvoiceIds(alreadyIssuedIds);
    setIssuedInvoiceDeliveryByGeneratedId(deliveryMap);
  }, [issuedInvoices, year, month]);

  // Generate invoices from engagements - ONE INVOICE PER ENGAGEMENT
  const generatedInvoices = useMemo(() => {
    const periodStart = startOfMonth(new Date(year, month - 1));
    const periodEnd = endOfMonth(new Date(year, month - 1));
    const totalDays = getDaysInMonth(new Date(year, month - 1));

    // Get Creative Boost data for the period (grouped by engagement)
    // Skip months that are already invoiced to prevent double-billing
    const creativeBoostData = new Map<string, { usedCredits: number; pricePerCredit: number; totalAmount: number; clientMonthId: string }>();

    clientMonths
      .filter(cm => cm.year === year && cm.month === month && !cm.invoiceId) // Skip already invoiced
      .forEach(cm => {
        const clientOutputs = getClientOutputs(cm.clientId, year, month);

        let totalCredits = 0;
        clientOutputs.forEach(output => {
          const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
          totalCredits += credits.totalCredits;
        });

        if (totalCredits > 0) {
          creativeBoostData.set(cm.engagementId, {
            usedCredits: totalCredits,
            pricePerCredit: cm.pricePerCredit,
            totalAmount: totalCredits * cm.pricePerCredit,
            clientMonthId: cm.id,
          });
        }
      });

    // Get Extra Works ready to invoice for this period
    const readyExtraWorks = getExtraWorksReadyToInvoice(year, month);
    const extraWorksByEngagement = new Map<string, typeof readyExtraWorks>();
    readyExtraWorks.forEach(ew => {
      if (ew.engagement_id) {
        const existing = extraWorksByEngagement.get(ew.engagement_id) || [];
        extraWorksByEngagement.set(ew.engagement_id, [...existing, ew]);
      }
    });

    // Get unbilled one-off services
    const unbilledOneOffs = getUnbilledOneOffServices();
    const oneOffsByEngagement = new Map<string, typeof unbilledOneOffs>();
    unbilledOneOffs.forEach(service => {
      if (service.engagement_id) {
        const existing = oneOffsByEngagement.get(service.engagement_id) || [];
        oneOffsByEngagement.set(service.engagement_id, [...existing, service]);
      }
    });

    // Create one invoice per engagement
    const newInvoices: MonthlyEngagementInvoice[] = [];

    engagements
      .filter(e => e.status === 'active' && e.type === 'retainer')
      .forEach(engagement => {
        const engStartDate = parseISO(engagement.start_date);
        const engEndDate = engagement.end_date ? parseISO(engagement.end_date) : null;

        // Check if engagement is active during this period
        const startsBeforeEnd = isBefore(engStartDate, periodEnd) || engStartDate.getTime() === periodEnd.getTime();
        const endsAfterStart = !engEndDate || isAfter(engEndDate, periodStart) || engEndDate.getTime() === periodStart.getTime();

        if (!startsBeforeEnd || !endsAfterStart) return;

        const lineItems: InvoiceLineItem[] = [];

        // Calculate active days in this period
        const effectiveStart = isAfter(engStartDate, periodStart) ? engStartDate : periodStart;
        const effectiveEnd = engEndDate && isBefore(engEndDate, periodEnd) ? engEndDate : periodEnd;
        
        const activeDays = Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Spolupráce začínající 1.-5. den měsíce = fakturovat plnou částku
        const startDayOfMonth = effectiveStart.getDate();
        const startsEarlyInMonth = startDayOfMonth <= 5;
        const endsAtPeriodEnd = effectiveEnd.getTime() === periodEnd.getTime();
        
        // Není poměrné pokud: aktivní všechny dny NEBO začíná 1.-5. den a nekončí předčasně
        const isProrated = activeDays < totalDays && !(startsEarlyInMonth && endsAtPeriodEnd);

        // Get engagement services for this engagement from useCRMData
        const services = engagementServices.filter(
          (service) =>
            service.engagement_id === engagement.id &&
            service.billing_type === 'monthly' &&
            isEngagementServiceActiveInPeriod(service, periodStart, periodEnd)
        );

        // Add line item for each non-Creative Boost service
        services
          .filter(es => !es.creative_boost_max_credits) // Non-CB services
          .forEach(service => {
            const proratedAmount = isProrated 
              ? Math.round((service.price / totalDays) * activeDays)
              : service.price;

            lineItems.push({
              id: `li-${service.id}-${year}-${month}`,
              invoice_id: `inv-${engagement.id}-${year}-${month}`,
              source: 'engagement' as const,
              engagement_id: engagement.id,
              extra_work_id: null,
              source_description: service.name,
              source_amount: service.price,
              period_start: format(effectiveStart, 'yyyy-MM-dd'),
              period_end: format(effectiveEnd, 'yyyy-MM-dd'),
              prorated_days: activeDays,
              total_days_in_month: totalDays,
              prorated_amount: proratedAmount,
              line_description: `${service.name} - ${format(periodStart, 'LLLL yyyy', { locale: cs })}`,
              unit_price: proratedAmount,
              quantity: 1,
              adjustment_amount: 0,
              adjustment_reason: '',
              final_amount: proratedAmount,
              is_approved: false,
              note: '',
              hours: null,
              hourly_rate: null,
              currency: requireCurrency(service.currency, `service ${service.id}`),
              is_reverse_charge: false,
            });
          });

        // Add Creative Boost line item if applicable for this engagement
        const cbData = creativeBoostData.get(engagement.id);
        if (cbData) {
          lineItems.push({
            id: `li-cb-${engagement.id}-${year}-${month}`,
            invoice_id: `inv-${engagement.id}-${year}-${month}`,
            source: 'creative_boost' as const,
            engagement_id: engagement.id,
            extra_work_id: null,
            creative_boost_client_month_id: cbData.clientMonthId,
            source_description: `Creative Boost - ${cbData.usedCredits} kreditů × ${new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: requireCurrency(engagement.currency, `engagement ${engagement.id}`), minimumFractionDigits: 0 }).format(cbData.pricePerCredit)}`,
            source_amount: cbData.totalAmount,
            period_start: format(periodStart, 'yyyy-MM-dd'),
            period_end: format(periodEnd, 'yyyy-MM-dd'),
            prorated_days: totalDays,
            total_days_in_month: totalDays,
            prorated_amount: cbData.totalAmount,
            line_description: `Creative Boost - ${format(periodStart, 'LLLL yyyy', { locale: cs })} (${cbData.usedCredits} kreditů)`,
            unit_price: cbData.pricePerCredit,
            quantity: cbData.usedCredits,
            adjustment_amount: 0,
            adjustment_reason: '',
            final_amount: cbData.totalAmount,
            is_approved: false,
            note: '',
            hours: null,
            hourly_rate: null,
            currency: requireCurrency(engagement.currency, `engagement ${engagement.id}`),
            is_reverse_charge: false,
          });
          // Remove from map so it's not duplicated
          creativeBoostData.delete(engagement.id);
        }

        // Add Extra Work line items for this engagement
        const engagementExtraWorks = extraWorksByEngagement.get(engagement.id) || [];
        engagementExtraWorks.forEach(ew => {
          lineItems.push({
            id: `li-ew-${ew.id}-${year}-${month}`,
            invoice_id: `inv-${engagement.id}-${year}-${month}`,
            source: 'extra_work' as const,
            engagement_id: engagement.id,
            extra_work_id: ew.id,
            source_description: `Vícepráce: ${ew.name}`,
            source_amount: ew.amount,
            period_start: format(periodStart, 'yyyy-MM-dd'),
            period_end: format(periodEnd, 'yyyy-MM-dd'),
            prorated_days: totalDays,
            total_days_in_month: totalDays,
            prorated_amount: ew.amount,
            line_description: `Vícepráce: ${ew.name} (${format(parseISO(ew.work_date), 'd.M.yyyy')})`,
            unit_price: ew.amount,
            quantity: 1,
            adjustment_amount: 0,
            adjustment_reason: '',
            final_amount: ew.amount,
            is_approved: false,
            note: '',
            hours: ew.hours_worked,
            hourly_rate: ew.hourly_rate,
            currency: requireCurrency(ew.currency, `extra work ${ew.id}`),
            is_reverse_charge: false,
          });
        });

        // Add One-off service line items for this engagement
        const engagementOneOffs = oneOffsByEngagement.get(engagement.id) || [];
        engagementOneOffs.forEach(service => {
          lineItems.push({
            id: `li-oneoff-${service.id}-${year}-${month}`,
            invoice_id: `inv-${engagement.id}-${year}-${month}`,
            source: 'one_off' as const,
            engagement_id: engagement.id,
            extra_work_id: null,
            engagement_service_id: service.id, // FIX: Track which service this line item came from
            source_description: `Jednorázová položka: ${service.name}`,
            source_amount: service.price,
            period_start: format(periodStart, 'yyyy-MM-dd'),
            period_end: format(periodEnd, 'yyyy-MM-dd'),
            prorated_days: totalDays,
            total_days_in_month: totalDays,
            prorated_amount: service.price,
            line_description: `Jednorázová položka: ${service.name}`,
            unit_price: service.price,
            quantity: 1,
            adjustment_amount: 0,
            adjustment_reason: '',
            final_amount: service.price,
            is_approved: false,
            note: '',
            hours: null,
            hourly_rate: null,
            currency: requireCurrency(service.currency, `service ${service.id}`),
            is_reverse_charge: false,
          });
        });

        if (lineItems.length === 0) return;

        const subtotal = lineItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
        const totalAdjustments = lineItems.reduce((sum, item) => sum + item.adjustment_amount, 0);

        const invoiceCurrency = requireSingleCurrency(lineItems, `generated invoice ${engagement.id} ${year}-${month}`);
        newInvoices.push({
          id: `inv-${engagement.id}-${year}-${month}`,
          engagement_id: engagement.id,
          engagement_name: engagement.name,
          client_id: engagement.client_id,
          year,
          month,
          line_items: lineItems,
          subtotal,
          total_adjustments: totalAdjustments,
          total_amount: subtotal + totalAdjustments,
          currency: invoiceCurrency,
          status: 'draft',
          issued_at: null,
          webhook_sent_at: null,
          notes: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });

    return newInvoices;
  }, [year, month, engagements, getUnbilledOneOffServices, engagementServices, getExtraWorksReadyToInvoice, clientMonths, getClientOutputs, calculateOutputCredits]);

  // Merge generated invoices with any saved changes
  const currentInvoices = useMemo(() => {
    if (invoices.length > 0) {
      return invoices;
    }
    return generatedInvoices;
  }, [invoices, generatedInvoices]);

  const handleUpdateLineItem = (invoiceId: string, lineItemId: string, updates: Partial<InvoiceLineItem>) => {
    setInvoices(prev => {
      const base = prev.length > 0 ? prev : generatedInvoices;
      return base.map(invoice => {
        if (invoice.id !== invoiceId) return invoice;
        
        const updatedItems = invoice.line_items.map(item => {
          if (item.id !== lineItemId) return item;
          
          const updated = { ...item, ...updates };
          // Recalculate final amount
          updated.final_amount = (updated.unit_price * updated.quantity) + updated.adjustment_amount;
          return updated;
        });

        const subtotal = updatedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        const totalAdjustments = updatedItems.reduce((sum, item) => sum + item.adjustment_amount, 0);

        return {
          ...invoice,
          line_items: updatedItems,
          subtotal,
          total_adjustments: totalAdjustments,
          total_amount: subtotal + totalAdjustments,
          updated_at: new Date().toISOString(),
        };
      });
    });
  };

  const handleAddManualItem = (invoiceId: string) => {
    const base = invoices.length > 0 ? invoices : generatedInvoices;
    const invoice = base.find(inv => inv.id === invoiceId);
    if (!invoice?.currency) {
      throw new Error(`Missing invoice currency for invoice ${invoiceId}`);
    }
    const parentCurrency = invoice.currency;

    const newItem: InvoiceLineItem = {
      id: `li-manual-${Date.now()}`,
      invoice_id: invoiceId,
      source: 'manual',
      engagement_id: null,
      extra_work_id: null,
      source_description: '',
      source_amount: 0,
      period_start: format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd'),
      period_end: format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd'),
      prorated_days: getDaysInMonth(new Date(year, month - 1)),
      total_days_in_month: getDaysInMonth(new Date(year, month - 1)),
      prorated_amount: 0,
      line_description: 'Nová položka',
      unit_price: 0,
      quantity: 1,
      adjustment_amount: 0,
      adjustment_reason: '',
      final_amount: 0,
      is_approved: false,
      note: '',
      hours: null,
      hourly_rate: null,
      currency: parentCurrency,
      is_reverse_charge: false,
    };

    setInvoices(prev => {
      const baseInner = prev.length > 0 ? prev : generatedInvoices;
      return baseInner.map(inv => {
        if (inv.id !== invoiceId) return inv;
        return {
          ...inv,
          line_items: [...inv.line_items, newItem],
          updated_at: new Date().toISOString(),
        };
      });
    });
  };

  const handleRemoveLineItem = (invoiceId: string, lineItemId: string) => {
    setInvoices(prev => {
      const base = prev.length > 0 ? prev : generatedInvoices;
      return base.map(invoice => {
        if (invoice.id !== invoiceId) return invoice;
        
        const updatedItems = invoice.line_items.filter(item => item.id !== lineItemId);
        const subtotal = updatedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        const totalAdjustments = updatedItems.reduce((sum, item) => sum + item.adjustment_amount, 0);

        return {
          ...invoice,
          line_items: updatedItems,
          subtotal,
          total_adjustments: totalAdjustments,
          total_amount: subtotal + totalAdjustments,
          updated_at: new Date().toISOString(),
        };
      });
    });
  };

  const handleSave = () => {
    setSavingDraft(true);
    try {
      const dataToSave = invoices.length > 0 ? invoices : generatedInvoices;
      const jsonData = JSON.stringify(dataToSave);
      localStorage.setItem(draftKey, jsonData);

      // Verify the save worked by reading it back
      const verified = localStorage.getItem(draftKey);
      if (verified !== jsonData) {
        throw new Error('Verification failed - saved data does not match');
      }

      toast.success('Koncept uložen', {
        description: 'Změny byly uloženy. Pro finální uložení do systému vystavte faktury.',
      });
    } catch (e) {
      console.error('Failed to save invoice draft:', e);
      toast.error('Chyba při ukládání', {
        description: 'Nepodařilo se uložit úpravy. Zkontrolujte, zda máte povolené cookies a localStorage.',
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey);
    setInvoices([]);
    toast.success('Koncept zahozen', {
      description: 'Úpravy byly zahozeny a data byla obnovena z aktuálních zakázek.',
    });
  };

  const handleDuplicateLineItem = (invoiceId: string, lineItemId: string) => {
    setInvoices(prev => {
      const base = prev.length > 0 ? prev : generatedInvoices;
      return base.map(invoice => {
        if (invoice.id !== invoiceId) return invoice;
        
        const itemToDuplicate = invoice.line_items.find(item => item.id === lineItemId);
        if (!itemToDuplicate) return invoice;

        const duplicatedItem: InvoiceLineItem = {
          ...itemToDuplicate,
          id: `li-dup-${Date.now()}`,
          source: 'manual',
          line_description: `${itemToDuplicate.line_description} (kopie)`,
          is_approved: false,
        };

        const itemIndex = invoice.line_items.findIndex(item => item.id === lineItemId);
        const updatedItems = [
          ...invoice.line_items.slice(0, itemIndex + 1),
          duplicatedItem,
          ...invoice.line_items.slice(itemIndex + 1),
        ];

        const subtotal = updatedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        const totalAdjustments = updatedItems.reduce((sum, item) => sum + item.adjustment_amount, 0);

        return {
          ...invoice,
          line_items: updatedItems,
          subtotal,
          total_adjustments: totalAdjustments,
          total_amount: subtotal + totalAdjustments,
          updated_at: new Date().toISOString(),
        };
      });
    });

    toast.success('Položka duplikována', {
      description: 'Kopie položky byla přidána.',
    });
  };

  const handleAddNewInvoice = (engagementId: string, itemData: {
    description: string;
    amount: number;
    hours: number | null;
    hourly_rate: number | null;
    currency: string;
    is_reverse_charge: boolean;
  }) => {
    const periodStart = startOfMonth(new Date(year, month - 1));
    const periodEnd = endOfMonth(new Date(year, month - 1));
    const totalDays = getDaysInMonth(new Date(year, month - 1));
    const engagement = engagements.find(e => e.id === engagementId);
    if (!engagement?.currency) {
      throw new Error(`Missing engagement currency for ${engagementId}`);
    }
    const effectiveCurrency = engagement.currency;

    const base = invoices.length > 0 ? invoices : generatedInvoices;
    const existingInvoice = base.find(inv => inv.engagement_id === engagementId);
    const itemCurrency = existingInvoice
      ? requireCurrency(existingInvoice.currency, `invoice ${existingInvoice.id}`)
      : effectiveCurrency;
    const submittedCurrency = requireCurrency(itemData.currency, `manual item for engagement ${engagementId}`);
    if (submittedCurrency !== itemCurrency) {
      throw new Error(`Manual item currency (${submittedCurrency}) must match invoice currency (${itemCurrency})`);
    }

    const newItem: InvoiceLineItem = {
      id: `li-manual-${Date.now()}`,
      invoice_id: `inv-${engagementId}-${year}-${month}`,
      source: 'manual',
      engagement_id: engagementId,
      extra_work_id: null,
      source_description: itemData.description,
      source_amount: itemData.amount,
      period_start: format(periodStart, 'yyyy-MM-dd'),
      period_end: format(periodEnd, 'yyyy-MM-dd'),
      prorated_days: totalDays,
      total_days_in_month: totalDays,
      prorated_amount: itemData.amount,
      line_description: itemData.description,
      unit_price: itemData.amount,
      quantity: 1,
      adjustment_amount: 0,
      adjustment_reason: '',
      final_amount: itemData.amount,
      is_approved: false,
      note: '',
      hours: itemData.hours,
      hourly_rate: itemData.hourly_rate,
      currency: submittedCurrency,
      is_reverse_charge: itemData.is_reverse_charge,
    };

    setInvoices(prev => {
      const baseInner = prev.length > 0 ? prev : generatedInvoices;
      const existingInvoice = baseInner.find(inv => inv.engagement_id === engagementId);

      if (existingInvoice) {
        // Add to existing invoice
        return baseInner.map(invoice => {
          if (invoice.id !== existingInvoice.id) return invoice;
          
          const updatedItems = [...invoice.line_items, newItem];
          const subtotal = updatedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
          const totalAdjustments = updatedItems.reduce((sum, item) => sum + item.adjustment_amount, 0);

          return {
            ...invoice,
            line_items: updatedItems,
            subtotal,
            total_adjustments: totalAdjustments,
            total_amount: subtotal + totalAdjustments,
            updated_at: new Date().toISOString(),
          };
        });
      } else {
        // Create new invoice for engagement
        const eng = engagements.find(e => e.id === engagementId);
        if (!eng) return baseInner;

        const newInvoice: MonthlyEngagementInvoice = {
          id: `inv-${engagementId}-${year}-${month}`,
          engagement_id: engagementId,
          engagement_name: eng.name,
          client_id: eng.client_id,
          year,
          month,
          line_items: [newItem],
          subtotal: itemData.amount,
          total_adjustments: 0,
          total_amount: itemData.amount,
          currency: itemCurrency,
          status: 'draft',
          issued_at: null,
          webhook_sent_at: null,
          notes: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return [...baseInner, newInvoice];
      }
    });

    toast.success('Položka přidána', {
      description: 'Nová fakturační položka byla vytvořena.',
    });
  };

  const handleDuplicateInvoice = (invoice: MonthlyEngagementInvoice) => {
    const duplicatedInvoice: MonthlyEngagementInvoice = {
      ...invoice,
      id: `inv-dup-${Date.now()}`,
      line_items: invoice.line_items.map(item => ({
        ...item,
        id: `li-dup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        line_description: `${item.line_description} (kopie)`,
        is_approved: false,
      })),
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setInvoices(prev => {
      const base = prev.length > 0 ? prev : generatedInvoices;
      return [...base, duplicatedInvoice];
    });

    toast.success('Faktura duplikována', {
      description: 'Kopie faktury se všemi položkami byla vytvořena.',
    });
  };

  const handleRemoveInvoice = (invoice: MonthlyEngagementInvoice) => {
    setInvoices(prev => {
      const base = prev.length > 0 ? prev : generatedInvoices;
      return base.filter(inv => inv.id !== invoice.id);
    });

    // Remove from selection if selected
    setSelectedInvoiceIds(prev => {
      const next = new Set(prev);
      next.delete(invoice.id);
      return next;
    });

    toast.success('Faktura odstraněna', {
      description: `Faktura "${invoice.engagement_name}" byla odstraněna.`,
    });
  };

  const totalAmount = currentInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalItems = currentInvoices.reduce((sum, inv) => sum + inv.line_items.length, 0);

  // Helper to format amounts grouped by currency
  const formatAmountsByCurrency = (invoiceList: MonthlyEngagementInvoice[]) => {
    const byCurrency = new Map<string, number>();
    invoiceList.forEach(inv => {
      const curr = requireCurrency(inv.currency, `invoice ${inv.id}`);
      byCurrency.set(curr, (byCurrency.get(curr) || 0) + inv.total_amount);
    });

    return Array.from(byCurrency.entries())
      .map(([currency, amount]) =>
        new Intl.NumberFormat('cs-CZ', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount)
      )
      .join(' + ');
  };

  // Calculate issued statistics
  const issuedInvoicesInPeriod = currentInvoices.filter(inv => issuedInvoiceIds.has(inv.id));
  const issuedAmount = issuedInvoicesInPeriod.reduce((sum, inv) => sum + inv.total_amount, 0);
  const pendingInvoices = currentInvoices.filter(inv => !issuedInvoiceIds.has(inv.id));

  // Helper to check if invoice is fully approved
  const isInvoiceApproved = (invoice: MonthlyEngagementInvoice) => 
    invoice.line_items.every(item => item.is_approved);

  // Get approved invoices that can be selected
  const approvedInvoices = currentInvoices.filter(isInvoiceApproved);
  const allApprovedSelected = approvedInvoices.length > 0 && 
    approvedInvoices.every(inv => selectedInvoiceIds.has(inv.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds(new Set(approvedInvoices.map(inv => inv.id)));
    } else {
      setSelectedInvoiceIds(new Set());
    }
  };

  const handleInvoiceSelection = (invoiceId: string, selected: boolean) => {
    setSelectedInvoiceIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(invoiceId);
      } else {
        next.delete(invoiceId);
      }
      return next;
    });
  };

  const handleApproveAllItems = (invoiceId: string) => {
    const base = invoices.length > 0 ? invoices : generatedInvoices;
    const invoice = base.find(inv => inv.id === invoiceId);
    if (invoice) {
      invoice.line_items.forEach(item => {
        if (!item.is_approved) {
          handleUpdateLineItem(invoiceId, item.id, { is_approved: true });
        }
      });
    }
  };

  const handleIssueSingleInvoice = (invoice: MonthlyEngagementInvoice) => {
    setSingleIssueInvoice(invoice);
    setIsIssueDialogOpen(true);
  };

  const handleCloseIssueDialog = (open: boolean) => {
    setIsIssueDialogOpen(open);
    if (!open) {
      setSingleIssueInvoice(null);
    }
  };

  const selectedInvoices = currentInvoices.filter(inv => selectedInvoiceIds.has(inv.id));
  const selectedTotal = selectedInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  
  // Check for unapproved selected invoices
  const unapprovedSelectedInvoices = selectedInvoices.filter(inv => !isInvoiceApproved(inv));
  const hasUnapprovedSelected = unapprovedSelectedInvoices.length > 0;
  
  // Invoices to issue - either single or selected multiple
  const invoicesToIssue = singleIssueInvoice ? [singleIssueInvoice] : selectedInvoices;

  // Check if any invoice has mixed line-item currencies (must match invoice.currency)
  const hasMixedCurrency = (inv: MonthlyEngagementInvoice) => {
    const invCurrency = requireCurrency(inv.currency, `invoice ${inv.id}`);
    return inv.line_items.some(item => requireCurrency(item.currency, `line item ${item.id}`) !== invCurrency);
  };
  const hasMixedCurrencyInSelected = invoicesToIssue.some(hasMixedCurrency);

  // Helper to calculate detailed issued stats by category
  const calculateIssuedStats = (issuedIds: Set<string>): IssuedStats => {
    const issuedInvs = currentInvoices.filter(inv => issuedIds.has(inv.id));
    
    let retainerCount = 0, retainerAmount = 0;
    let extraWorkCount = 0, extraWorkAmount = 0;
    let creativeBoostCount = 0, creativeBoostAmount = 0;
    let oneOffCount = 0, oneOffAmount = 0;
    
    issuedInvs.forEach(inv => {
      inv.line_items.forEach(item => {
        switch (item.source) {
          case 'engagement':
            retainerCount++;
            retainerAmount += item.final_amount;
            break;
          case 'extra_work':
            extraWorkCount++;
            extraWorkAmount += item.final_amount;
            break;
          case 'creative_boost':
            creativeBoostCount++;
            creativeBoostAmount += item.final_amount;
            break;
          case 'one_off':
          case 'manual':
            oneOffCount++;
            oneOffAmount += item.final_amount;
            break;
        }
      });
    });

    return {
      totalCount: issuedInvs.length,
      totalAmount: issuedInvs.reduce((sum, inv) => sum + inv.total_amount, 0),
      retainer: { count: retainerCount, amount: retainerAmount },
      extraWork: { count: extraWorkCount, amount: extraWorkAmount },
      oneOff: { count: oneOffCount, amount: oneOffAmount },
      creativeBoost: { count: creativeBoostCount, amount: creativeBoostAmount },
    };
  };

  const handleIssueSuccess = (invoiceIds: string[]) => {
    setIssuedInvoiceIds(prev => {
      const next = new Set(prev);
      invoiceIds.forEach(id => next.add(id));

      // Calculate detailed stats and notify parent
      onIssuedStatsChange?.(calculateIssuedStats(next));

      return next;
    });
    // Clear selection for issued invoices
    setSelectedInvoiceIds(prev => {
      const next = new Set(prev);
      invoiceIds.forEach(id => next.delete(id));
      return next;
    });
    // Clear draft from localStorage since invoices were issued
    localStorage.removeItem(draftKey);
    setInvoices([]);
  };

  const handleReissueInvoice = (invoice: MonthlyEngagementInvoice) => {
    // Remove from issued list
    setIssuedInvoiceIds(prev => {
      const next = new Set(prev);
      next.delete(invoice.id);
      
      // Calculate detailed stats and notify parent
      onIssuedStatsChange?.(calculateIssuedStats(next));
      
      return next;
    });
    toast.success('Faktura připravena k opětovnému vystavení', {
      description: `Faktura "${invoice.engagement_name}" je připravena k opětovnému vystavení.`,
    });
  };

  const handleIssueClick = () => {
    if (hasUnapprovedSelected) {
      setShowApprovalWarning(true);
    } else if (hasMixedCurrencyInSelected) {
      setShowMixedCurrencyWarning(true);
    } else {
      setIsIssueDialogOpen(true);
    }
  };

  if (currentInvoices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Žádné zakázky k fakturaci</h3>
          <p className="text-muted-foreground">
            Pro vybrané období nejsou žádné aktivní zakázky s měsíčním poplatkem.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 px-1">
      {/* Selection header with issued stats */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allApprovedSelected}
            disabled={approvedInvoices.length === 0}
            onCheckedChange={handleSelectAll}
          />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-sm text-muted-foreground">
              {selectedInvoiceIds.size > 0 
                ? `Vybráno ${selectedInvoiceIds.size} z ${currentInvoices.length} faktur`
                : `${approvedInvoices.length} z ${currentInvoices.length} faktur připraveno k vystavení`
              }
            </span>
            {issuedInvoiceIds.size > 0 && (
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {issuedInvoiceIds.size}/{currentInvoices.length} vystaveno ({formatAmountsByCurrency(issuedInvoicesInPeriod)})
              </span>
            )}
          </div>
        </div>
        {selectedInvoiceIds.size > 0 && (
          <span className="text-sm font-medium">
            Celkem: {formatAmountsByCurrency(selectedInvoices)}
          </span>
        )}
      </div>

      {/* Engagement invoice cards */}
      <div className="space-y-4">
        {currentInvoices.map(invoice => (
          <EngagementInvoiceCard
            key={invoice.id}
            invoice={invoice}
            onUpdateLineItem={(lineItemId, updates) => handleUpdateLineItem(invoice.id, lineItemId, updates)}
            onAddManualItem={() => handleAddManualItem(invoice.id)}
            onRemoveLineItem={(lineItemId) => handleRemoveLineItem(invoice.id, lineItemId)}
            onDuplicateLineItem={(lineItemId) => handleDuplicateLineItem(invoice.id, lineItemId)}
            isSelected={selectedInvoiceIds.has(invoice.id)}
            onSelectionChange={(selected) => handleInvoiceSelection(invoice.id, selected)}
            onIssueInvoice={handleIssueSingleInvoice}
            onReissueInvoice={handleReissueInvoice}
            onDuplicateInvoice={handleDuplicateInvoice}
            onRemoveInvoice={handleRemoveInvoice}
            isIssued={issuedInvoiceIds.has(invoice.id)}
            isDeliveredToFakturoid={issuedInvoiceDeliveryByGeneratedId.get(invoice.id) ?? false}
            onApproveAllItems={handleApproveAllItems}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-4">
        <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Přidat novou fakturu
        </Button>
        {invoices.length > 0 && (
          <Button variant="ghost" onClick={handleDiscardDraft}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Zahodit úpravy
          </Button>
        )}
        <Button variant="outline" onClick={handleSave} disabled={savingDraft}>
          {savingDraft ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Uložit úpravy
        </Button>
        <Button 
          onClick={handleIssueClick}
          disabled={selectedInvoiceIds.size === 0}
        >
          <Send className="h-4 w-4 mr-2" />
          Vystavit faktury ({selectedInvoiceIds.size})
        </Button>
      </div>

      <AddInvoiceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddNewInvoice}
        existingEngagementIds={currentInvoices.map(inv => inv.engagement_id)}
      />

      <IssueInvoicesDialog
        open={isIssueDialogOpen}
        onOpenChange={handleCloseIssueDialog}
        invoices={invoicesToIssue}
        year={year}
        month={month}
        onIssueSuccess={handleIssueSuccess}
      />

      <AlertDialog open={showApprovalWarning} onOpenChange={setShowApprovalWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Nelze vystavit faktury</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              {unapprovedSelectedInvoices.length === 1 
                ? "Vybraná faktura obsahuje neschválené položky."
                : `${unapprovedSelectedInvoices.length} vybraných faktur obsahuje neschválené položky.`
              }
              <br /><br />
              Před vystavením musíte nejprve schválit všechny položky na faktuře.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowApprovalWarning(false)}>
              Rozumím
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showMixedCurrencyWarning} onOpenChange={setShowMixedCurrencyWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Smíšené měny</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Některé faktury obsahují položky s různými měnami. Každá faktura musí mít všechny položky ve stejné měně jako je měna faktury.
              <br /><br />
              Sjednoťte měnu položek nebo upravte měnu faktury před vystavením.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowMixedCurrencyWarning(false)}>
              Rozumím
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
