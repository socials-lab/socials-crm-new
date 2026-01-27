import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

export type PeriodMode = 'month' | 'quarter' | 'ytd' | 'year' | 'last_year';

const PERIOD_MODE_LABELS: Record<PeriodMode, string> = {
  month: 'Měsíc',
  quarter: 'Kvartál',
  ytd: 'Year to Date',
  year: 'Celý rok',
  last_year: 'Minulý rok',
};

const MONTH_NAMES = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

interface PeriodSelectorProps {
  periodMode: PeriodMode;
  setPeriodMode: (mode: PeriodMode) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedQuarter: number;
  setSelectedQuarter: (quarter: number) => void;
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date;
}

export function PeriodSelector({
  periodMode,
  setPeriodMode,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedQuarter,
  setSelectedQuarter,
  periodLabel,
  periodStart,
  periodEnd,
}: PeriodSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToPreviousQuarter = () => {
    if (selectedQuarter === 1) {
      setSelectedQuarter(4);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedQuarter(selectedQuarter - 1);
    }
  };

  const goToNextQuarter = () => {
    if (selectedQuarter === 4) {
      setSelectedQuarter(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedQuarter(selectedQuarter + 1);
    }
  };

  const formatDateRange = () => {
    return `${format(periodStart, 'd.M.yyyy', { locale: cs })} - ${format(periodEnd, 'd.M.yyyy', { locale: cs })}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Period Mode Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Období:</span>
        <Select 
          value={periodMode} 
          onValueChange={(v) => setPeriodMode(v as PeriodMode)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background">
            {(Object.keys(PERIOD_MODE_LABELS) as PeriodMode[]).map(mode => (
              <SelectItem key={mode} value={mode}>
                {PERIOD_MODE_LABELS[mode]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Year Selector - shown for all modes except last_year */}
      {periodMode !== 'last_year' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rok:</span>
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Month Navigator - only for month mode */}
      {periodMode === 'month' && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-24 text-center">
            {MONTH_NAMES[selectedMonth - 1]}
          </span>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Quarter Navigator - only for quarter mode */}
      {periodMode === 'quarter' && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousQuarter}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select 
            value={selectedQuarter.toString()} 
            onValueChange={(v) => setSelectedQuarter(Number(v))}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="1">Q1</SelectItem>
              <SelectItem value="2">Q2</SelectItem>
              <SelectItem value="3">Q3</SelectItem>
              <SelectItem value="4">Q4</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={goToNextQuarter}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Period Range Display - for YTD, year, last_year */}
      {(periodMode === 'ytd' || periodMode === 'year' || periodMode === 'last_year') && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md">
          <span className="text-sm text-muted-foreground">
            {formatDateRange()}
          </span>
        </div>
      )}

      {/* Period Label Badge */}
      <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
        {periodLabel}
      </div>
    </div>
  );
}
