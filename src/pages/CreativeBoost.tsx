import { useState, useMemo, Component, type ReactNode, type ErrorInfo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientsOverview } from '@/components/creative-boost/ClientsOverview';
import { OutputTypesConfig } from '@/components/creative-boost/OutputTypesConfig';
import { useUserRole } from '@/hooks/useUserRole';
import { format, addMonths } from 'date-fns';
import { cs } from 'date-fns/locale';

class CreativeBoostErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Creative Boost crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-destructive">
            Creative Boost — chyba při načítání
          </h2>
          <pre className="text-sm bg-muted p-4 rounded overflow-auto max-h-60">
            {this.state.error.message}
            {'\n'}
            {this.state.error.stack}
          </pre>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
            onClick={() => this.setState({ error: null })}
          >
            Zkusit znovu
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function CreativeBoostContent() {
  const { isSuperAdmin, role } = useUserRole();

  // Only admin/management can configure output types
  const canConfigureOutputTypes = isSuperAdmin || role === 'admin' || role === 'management';
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);

  const monthOptions = useMemo(() => {
    const today = new Date();
    const options = [];
    // Past 3 months + current + next 2 months
    for (let i = -3; i <= 2; i++) {
      const date = addMonths(today, i);
      options.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: format(date, 'LLLL yyyy', { locale: cs }),
      });
    }
    return options;
  }, []);

  const handlePeriodChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6">
      <PageHeader
        title="🎨 Creative Boost"
        titleAccent="kredity"
        description="Správa kreativních výstupů a čerpání kreditů. Karty se vytvářejí automaticky podle služeb v zakázkách."
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview">Přehled</TabsTrigger>
            {canConfigureOutputTypes && (
              <TabsTrigger value="output-types">Typy výstupů</TabsTrigger>
            )}
          </TabsList>

          <Select
            value={`${selectedYear}-${selectedMonth}`}
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {monthOptions.map((option) => (
                <SelectItem
                  key={`${option.year}-${option.month}`}
                  value={`${option.year}-${option.month}`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <ClientsOverview
            year={selectedYear}
            month={selectedMonth}
          />
        </TabsContent>

        {canConfigureOutputTypes && (
          <TabsContent value="output-types" className="space-y-6">
            <OutputTypesConfig />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

const CreativeBoost = () => {
  return (
    <CreativeBoostErrorBoundary>
      <CreativeBoostContent />
    </CreativeBoostErrorBoundary>
  );
};

export default CreativeBoost;