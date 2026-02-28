import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientsOverview } from '@/components/creative-boost/ClientsOverview';
import { OutputTypesConfig } from '@/components/creative-boost/OutputTypesConfig';
import { useUserRole } from '@/hooks/useUserRole';
import { format, addMonths } from 'date-fns';
import { cs } from 'date-fns/locale';

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
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="🎨 Creative Boost"
        titleAccent="kredity"
        description="Správa kreativních výstupů a čerpání kreditů. Karty se vytvářejí automaticky podle služeb v zakázkách."
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="overview">Přehled</TabsTrigger>
            {canConfigureOutputTypes && (
              <TabsTrigger value="output-types">Typy výstupů</TabsTrigger>
            )}
          </TabsList>

          <Select
            value={`${selectedYear}-${selectedMonth}`}
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger className="w-[200px]">
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
  return <CreativeBoostContent />;
};

export default CreativeBoost;