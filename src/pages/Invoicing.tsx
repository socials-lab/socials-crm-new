import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { FutureInvoicing, IssuedStats } from '@/components/invoicing/FutureInvoicing';
import { InvoiceHistory } from '@/components/invoicing/InvoiceHistory';
import { useCRMData } from '@/hooks/useCRMData';
import { useCreativeBoostData } from '@/hooks/useCreativeBoostData';
import { useUserRole } from '@/hooks/useUserRole';
import { format, startOfMonth, endOfMonth, parseISO, isAfter, isBefore, getDaysInMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { FileText, CheckCircle, Package, Briefcase, ChevronLeft, ChevronRight, Palette, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Invoicing = () => {
  const { isSuperAdmin, role, canSeeFinancials } = useUserRole();

  // Only admin, management, or finance can access invoicing
  const canAccessInvoicing = isSuperAdmin || role === 'admin' || role === 'management' || role === 'finance' || canSeeFinancials;

  // Show access denied for users without financial permissions
  if (!canAccessInvoicing) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
        <PageHeader
          title="🧾 Fakturace"
          titleAccent="měsíční"
          description="Správa měsíční fakturace a historie vydaných faktur"
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Přístup omezen</h3>
            <p className="text-muted-foreground max-w-md">
              Tato sekce je dostupná pouze pro uživatele s finančními oprávněními.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [issuedStats, setIssuedStats] = useState<IssuedStats>({
    totalCount: 0,
    totalAmount: 0,
    retainer: { count: 0, amount: 0 },
    extraWork: { count: 0, amount: 0 },
    oneOff: { count: 0, amount: 0 },
    creativeBoost: { count: 0, amount: 0 },
  });

  const { 
    engagements, 
    getExtraWorksReadyToInvoice, 
    getUnbilledOneOffServices,
    engagementServices,
  } = useCRMData();
  
  const {
    clientMonths,
    getClientOutputs,
    calculateOutputCredits,
  } = useCreativeBoostData();


  const monthLabel = format(new Date(selectedYear, selectedMonth - 1), 'LLLL yyyy', { locale: cs });
  const capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  // Calculate invoice KPIs for selected month
  const invoiceKPIs = useMemo(() => {
    const periodStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const periodEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));
    const totalDays = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));

    // Get unbilled one-off services
    const unbilledOneOffs = getUnbilledOneOffServices();
    const unbilledOneOffCount = unbilledOneOffs.length;
    const unbilledOneOffAmount = unbilledOneOffs.reduce((sum, s) => sum + s.price, 0);

    // Get extra works ready to invoice for this period
    const readyExtraWorks = getExtraWorksReadyToInvoice(selectedYear, selectedMonth);
    const extraWorkCount = readyExtraWorks.length;
    const extraWorkAmount = readyExtraWorks.reduce((sum, ew) => sum + ew.amount, 0);

    // Calculate Creative Boost amount for this period
    let creativeBoostAmount = 0;
    clientMonths
      .filter(cm => cm.year === selectedYear && cm.month === selectedMonth)
      .forEach(cm => {
        const clientOutputs = getClientOutputs(cm.clientId, selectedYear, selectedMonth);
        
        let totalCredits = 0;
        clientOutputs.forEach(output => {
          const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
          totalCredits += credits.totalCredits;
        });

        creativeBoostAmount += totalCredits * cm.pricePerCredit;
      });

    // Calculate retainer amount from individual engagement services (not engagement.monthly_fee)
    let retainerAmount = 0;
    let retainerCount = 0;
    
    engagements
      .filter(e => e.status === 'active' && e.type === 'retainer')
      .forEach(engagement => {
        const engStartDate = parseISO(engagement.start_date);
        const engEndDate = engagement.end_date ? parseISO(engagement.end_date) : null;

        const startsBeforeEnd = isBefore(engStartDate, periodEnd) || engStartDate.getTime() === periodEnd.getTime();
        const endsAfterStart = !engEndDate || isAfter(engEndDate, periodStart) || engEndDate.getTime() === periodStart.getTime();

        if (startsBeforeEnd && endsAfterStart) {
          // Calculate prorated days
          const effectiveStart = isAfter(engStartDate, periodStart) ? engStartDate : periodStart;
          const effectiveEnd = engEndDate && isBefore(engEndDate, periodEnd) ? engEndDate : periodEnd;
          const activeDays = Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const isProrated = activeDays < totalDays;

          // Sum up all non-Creative Boost services for this engagement
          const services = engagementServices.filter(
            es => es.engagement_id === engagement.id && es.is_active && es.billing_type === 'monthly' && !es.creative_boost_max_credits
          );

          services.forEach(service => {
            const proratedAmount = isProrated 
              ? Math.round((service.price / totalDays) * activeDays)
              : service.price;
            retainerAmount += proratedAmount;
            retainerCount++;
          });
        }
      });

      // Total expected invoice amount
      const totalAmount = retainerAmount + creativeBoostAmount + extraWorkAmount + unbilledOneOffAmount;
      // Count Creative Boost clients for this month
      const creativeBoostCount = clientMonths.filter(
        cm => cm.year === selectedYear && cm.month === selectedMonth && cm.status === 'active'
      ).length;

      const totalItemCount = retainerCount + creativeBoostCount + extraWorkCount + unbilledOneOffCount;

      return {
        // Total to invoice this month
        totalAmount,
        totalItemCount,
        // Unbilled one-offs waiting
        unbilledOneOffCount,
        unbilledOneOffAmount,
        // Retainers
        retainerAmount,
        retainerCount,
        // Creative Boost
        creativeBoostAmount,
        creativeBoostCount,
        // Extra works
        extraWorkCount,
        extraWorkAmount,
      };
  }, [selectedYear, selectedMonth, engagements, engagementServices, getExtraWorksReadyToInvoice, getUnbilledOneOffServices, calculateOutputCredits, clientMonths, getClientOutputs]);

  // Reset issued stats when month changes
  const handleMonthChange = (newYear: number, newMonth: number) => {
    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    setIssuedStats({
      totalCount: 0,
      totalAmount: 0,
      retainer: { count: 0, amount: 0 },
      extraWork: { count: 0, amount: 0 },
      oneOff: { count: 0, amount: 0 },
      creativeBoost: { count: 0, amount: 0 },
    });
  };

  // Month navigation helpers
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      handleMonthChange(selectedYear - 1, 12);
    } else {
      handleMonthChange(selectedYear, selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      handleMonthChange(selectedYear + 1, 1);
    } else {
      handleMonthChange(selectedYear, selectedMonth + 1);
    }
  };



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
      <PageHeader
        title="🧾 Fakturace"
        titleAccent="měsíční"
        description="Správa měsíční fakturace a historie vydaných faktur"
      />

      {/* KPI Cards - responsive grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <KPICard
          title="Retainery"
          value={formatCurrency(invoiceKPIs.retainerAmount)}
          subtitle={`${issuedStats.retainer.count}/${invoiceKPIs.retainerCount} vystaveno`}
          icon={CheckCircle}
        />
        <KPICard
          title="Vícepráce"
          value={formatCurrency(invoiceKPIs.extraWorkAmount)}
          subtitle={`${issuedStats.extraWork.count}/${invoiceKPIs.extraWorkCount} vystaveno`}
          icon={Briefcase}
        />
        <KPICard
          title="Jednorázové"
          value={formatCurrency(invoiceKPIs.unbilledOneOffAmount)}
          subtitle={`${issuedStats.oneOff.count}/${invoiceKPIs.unbilledOneOffCount} vystaveno`}
          icon={Package}
        />
        <KPICard
          title="Creative Boost"
          value={formatCurrency(invoiceKPIs.creativeBoostAmount)}
          subtitle={`${issuedStats.creativeBoost.count}/${invoiceKPIs.creativeBoostCount} vystaveno`}
          icon={Palette}
        />
        <KPICard
          title="Celkem"
          value={formatCurrency(invoiceKPIs.totalAmount)}
          subtitle={`${issuedStats.totalCount}/${invoiceKPIs.totalItemCount} vystaveno`}
          icon={FileText}
          className="col-span-2 sm:col-span-3 lg:col-span-1"
        />
      </div>

      <Tabs defaultValue="future" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="future" className="flex-1 sm:flex-none">Budoucí</TabsTrigger>
            <TabsTrigger value="history" className="flex-1 sm:flex-none">Historie</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 justify-center sm:justify-end">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[100px] sm:min-w-[140px] text-center text-sm sm:text-base font-medium">{capitalizedMonthLabel}</div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="future" className="space-y-6">
          <FutureInvoicing year={selectedYear} month={selectedMonth} onIssuedStatsChange={setIssuedStats} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <InvoiceHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Invoicing;