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
import { isEngagementServiceActiveInPeriod } from '@/lib/engagementServiceLifecycle';

function requireCurrency(value: string | null | undefined, context: string): string {
  if (!value) {
    console.warn(`Missing currency for ${context}. Falling back to CZK.`, { context, value });
    return 'CZK';
  }
  return value;
}

function addToByCurrency(map: Map<string, number>, currency: string, amount: number) {
  map.set(currency, (map.get(currency) ?? 0) + amount);
}

function formatAmountsByCurrency(byCurrency: Map<string, number>) {
  if (byCurrency.size === 0) return '-';
  return Array.from(byCurrency.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amount]) =>
      new Intl.NumberFormat('cs-CZ', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
    )
    .join(' + ');
}

const Invoicing = () => {
  const { isSuperAdmin, role, canSeeFinancials } = useUserRole();

  // Only admin, management, or finance can access invoicing
  const canAccessInvoicing = isSuperAdmin || role === 'admin' || role === 'management' || role === 'finance' || canSeeFinancials;

  // Show access denied for users without financial permissions
  if (!canAccessInvoicing) {
    return (
      <div className="space-y-4 animate-fade-in p-4 md:space-y-6 md:p-6">
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

  // Calculate invoice KPIs for selected month, with amounts grouped by currency
  const invoiceKPIs = useMemo(() => {
    const periodStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const periodEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));
    const totalDays = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));

    const retainerByCurrency = new Map<string, number>();
    const extraWorkByCurrency = new Map<string, number>();
    const oneOffByCurrency = new Map<string, number>();
    const creativeBoostByCurrency = new Map<string, number>();

    const unbilledOneOffs = getUnbilledOneOffServices();
    unbilledOneOffs.forEach(s => addToByCurrency(oneOffByCurrency, requireCurrency(s.currency, `one-off service ${s.id}`), s.price));

    const readyExtraWorks = getExtraWorksReadyToInvoice(selectedYear, selectedMonth);
    readyExtraWorks.forEach(ew => addToByCurrency(extraWorkByCurrency, requireCurrency(ew.currency, `extra work ${ew.id}`), ew.amount));

    clientMonths
      .filter(cm => cm.year === selectedYear && cm.month === selectedMonth)
      .forEach(cm => {
        const clientOutputs = getClientOutputs(cm.clientId, selectedYear, selectedMonth);
        let totalCredits = 0;
        clientOutputs.forEach(output => {
          const credits = calculateOutputCredits(output.outputTypeId, output.normalCount, output.expressCount);
          totalCredits += credits.totalCredits;
        });
        const amount = totalCredits * cm.pricePerCredit;
        const eng = engagements.find(e => e.id === cm.engagementId);
        addToByCurrency(creativeBoostByCurrency, requireCurrency(eng?.currency, `engagement ${cm.engagementId}`), amount);
      });

    let retainerCount = 0;
    engagements
      .filter(e => e.status === 'active' && e.type === 'retainer')
      .forEach(engagement => {
        const engStartDate = parseISO(engagement.start_date);
        const engEndDate = engagement.end_date ? parseISO(engagement.end_date) : null;
        const startsBeforeEnd = isBefore(engStartDate, periodEnd) || engStartDate.getTime() === periodEnd.getTime();
        const endsAfterStart = !engEndDate || isAfter(engEndDate, periodStart) || engEndDate.getTime() === periodStart.getTime();

        if (startsBeforeEnd && endsAfterStart) {
          const effectiveStart = isAfter(engStartDate, periodStart) ? engStartDate : periodStart;
          const effectiveEnd = engEndDate && isBefore(engEndDate, periodEnd) ? engEndDate : periodEnd;
          const activeDays = Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const isProrated = activeDays < totalDays;

          const services = engagementServices.filter(
            (service) =>
              service.engagement_id === engagement.id &&
              service.billing_type === 'monthly' &&
              !service.creative_boost_max_credits &&
              isEngagementServiceActiveInPeriod(service, periodStart, periodEnd)
          );
          services.forEach(service => {
            const proratedAmount = isProrated ? Math.round((service.price / totalDays) * activeDays) : service.price;
            addToByCurrency(
              retainerByCurrency,
              requireCurrency(service.currency, `retainer service ${service.id}`),
              proratedAmount
            );
            retainerCount++;
          });
        }
      });

    const totalByCurrency = new Map<string, number>();
    [retainerByCurrency, extraWorkByCurrency, oneOffByCurrency, creativeBoostByCurrency].forEach(map => {
      map.forEach((amt, curr) => totalByCurrency.set(curr, (totalByCurrency.get(curr) ?? 0) + amt));
    });

    const creativeBoostCount = clientMonths.filter(
      cm => cm.year === selectedYear && cm.month === selectedMonth && cm.status === 'active'
    ).length;
    const totalItemCount = retainerCount + creativeBoostCount + readyExtraWorks.length + unbilledOneOffs.length;

    return {
      totalItemCount,
      unbilledOneOffCount: unbilledOneOffs.length,
      oneOffByCurrency,
      retainerCount,
      retainerByCurrency,
      creativeBoostCount,
      creativeBoostByCurrency,
      extraWorkCount: readyExtraWorks.length,
      extraWorkByCurrency,
      totalByCurrency,
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




  return (
    <div className="space-y-4 animate-fade-in p-4 md:space-y-6 md:p-6">
      <PageHeader
        title="🧾 Fakturace"
        titleAccent="měsíční"
        description="Správa měsíční fakturace a historie vydaných faktur"
      />

      {/* KPI Cards - responsive grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <KPICard
          title="Retainery"
          value={formatAmountsByCurrency(invoiceKPIs.retainerByCurrency)}
          subtitle={`${issuedStats.retainer.count}/${invoiceKPIs.retainerCount} vystaveno`}
          icon={CheckCircle}
        />
        <KPICard
          title="Vícepráce"
          value={formatAmountsByCurrency(invoiceKPIs.extraWorkByCurrency)}
          subtitle={`${issuedStats.extraWork.count}/${invoiceKPIs.extraWorkCount} vystaveno`}
          icon={Briefcase}
        />
        <KPICard
          title="Jednorázové"
          value={formatAmountsByCurrency(invoiceKPIs.oneOffByCurrency)}
          subtitle={`${issuedStats.oneOff.count}/${invoiceKPIs.unbilledOneOffCount} vystaveno`}
          icon={Package}
        />
        <KPICard
          title="Creative Boost"
          value={formatAmountsByCurrency(invoiceKPIs.creativeBoostByCurrency)}
          subtitle={`${issuedStats.creativeBoost.count}/${invoiceKPIs.creativeBoostCount} vystaveno`}
          icon={Palette}
        />
        <KPICard
          title="Celkem"
          value={formatAmountsByCurrency(invoiceKPIs.totalByCurrency)}
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
