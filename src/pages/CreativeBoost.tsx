import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientsOverview } from '@/components/creative-boost/ClientsOverview';
import { OutputTypesConfig } from '@/components/creative-boost/OutputTypesConfig';
import { format, addMonths } from 'date-fns';
import { cs } from 'date-fns/locale';

function CreativeBoostContent() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = -3; i <= 2; i++) {
      const date = addMonths(currentDate, i);
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

      <div className="flex items-center justify-between">
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Přehled</TabsTrigger>
              <TabsTrigger value="output-types">Typy výstupů</TabsTrigger>
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

          <TabsContent value="overview">
            <ClientsOverview
              year={selectedYear}
              month={selectedMonth}
            />
          </TabsContent>

          <TabsContent value="output-types">
            <OutputTypesConfig />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const CreativeBoost = () => {
  return <CreativeBoostContent />;
};

export default CreativeBoost;