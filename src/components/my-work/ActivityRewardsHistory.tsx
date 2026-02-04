import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, Clock, Banknote, Trash2, FileText, Copy, Check, 
  Megaphone, Building2, Info 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { toast } from 'sonner';
import type { ActivityReward, ActivityCategory } from '@/hooks/useActivityRewards';
import { CATEGORY_LABELS } from '@/hooks/useActivityRewards';

interface ActivityRewardsHistoryProps {
  rewards: ActivityReward[];
  currentMonthTotal: number;
  getRewardsByMonth: (year: number, month: number) => ActivityReward[];
  getRewardsByCategory: (year: number, month: number) => { marketing: ActivityReward[]; overhead: ActivityReward[] };
  getMonthlyTotals: () => { year: number; month: number; total: number; count: number }[];
  onAddClick: () => void;
  onDelete: (rewardId: string) => void;
}

const MONTHS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

function RewardCard({ 
  reward, 
  onDelete,
  onCopy 
}: { 
  reward: ActivityReward; 
  onDelete: () => void;
  onCopy: (text: string) => void;
}) {
  const CategoryIcon = reward.category === 'marketing' ? Megaphone : Building2;
  
  return (
    <div className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <p className="text-sm font-medium truncate">{reward.invoice_item_name}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              onClick={() => onCopy(reward.invoice_item_name)}
              title="Kopírovat název položky"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {format(parseISO(reward.activity_date), 'd. M. yyyy', { locale: cs })}
            </span>
            <Badge variant="outline" className="text-xs">
              {reward.billing_type === 'hourly' ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {reward.hours}h × {reward.hourly_rate?.toLocaleString('cs-CZ')} Kč
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Banknote className="h-3 w-3" />
                  Fixní
                </span>
              )}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm whitespace-nowrap">
            {reward.amount.toLocaleString('cs-CZ')} Kč
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CategorySection({ 
  category, 
  rewards, 
  onDelete,
  onCopy
}: { 
  category: ActivityCategory; 
  rewards: ActivityReward[]; 
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
}) {
  if (rewards.length === 0) return null;
  
  const CategoryIcon = category === 'marketing' ? Megaphone : Building2;
  const total = rewards.reduce((sum, r) => sum + r.amount, 0);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CategoryIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{CATEGORY_LABELS[category]}</span>
          <Badge variant="secondary" className="text-xs">
            {rewards.length} {rewards.length === 1 ? 'položka' : rewards.length < 5 ? 'položky' : 'položek'}
          </Badge>
        </div>
        <span className="text-sm font-semibold">{total.toLocaleString('cs-CZ')} Kč</span>
      </div>
      <div className="space-y-2 pl-6">
        {rewards.map((reward) => (
          <RewardCard 
            key={reward.id} 
            reward={reward} 
            onDelete={() => onDelete(reward.id)}
            onCopy={onCopy}
          />
        ))}
      </div>
    </div>
  );
}

export function ActivityRewardsHistory({
  rewards,
  currentMonthTotal,
  getRewardsByMonth,
  getRewardsByCategory,
  getMonthlyTotals,
  onAddClick,
  onDelete,
}: ActivityRewardsHistoryProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const monthlyTotals = getMonthlyTotals();
  const categorizedRewards = getRewardsByCategory(selectedYear, selectedMonth);
  const filteredRewards = getRewardsByMonth(selectedYear, selectedMonth);

  // Get available years from rewards
  const availableYears = useMemo(() => {
    const years = new Set(rewards.map(r => parseISO(r.activity_date).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [rewards]);

  const selectedMonthTotal = filteredRewards.reduce((sum, r) => sum + r.amount, 0);
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      toast.success('Zkopírováno do schránky');
      setTimeout(() => setCopiedText(null), 2000);
    } catch {
      toast.error('Nepodařilo se zkopírovat');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Fakturace – interní práce
          </CardTitle>
          <Button size="sm" onClick={onAddClick} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Přidat
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SOP Info - Updated */}
        <Alert className="bg-muted/50 border-muted">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Pouze interní práce</strong> – klientská práce se fakturuje automaticky přes zakázky.<br/>
            Položky musí začínat: <strong>Marketing –</strong> nebo <strong>Režijní služby –</strong>
          </AlertDescription>
        </Alert>

        {/* Month/Year filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Co fakturovat za</span>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month total */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isCurrentMonth ? 'Tento měsíc celkem' : `${MONTHS[selectedMonth - 1]} ${selectedYear}`}
            </span>
            <span className="text-lg font-semibold text-primary">
              {selectedMonthTotal.toLocaleString('cs-CZ')} Kč
            </span>
          </div>
        </div>

        {/* Categorized rewards list */}
        <div className="space-y-4 max-h-[350px] overflow-y-auto">
          {filteredRewards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Žádné položky k fakturaci v tomto měsíci
            </p>
          ) : (
            <>
              <CategorySection 
                category="marketing" 
                rewards={categorizedRewards.marketing} 
                onDelete={onDelete}
                onCopy={handleCopy}
              />
              <CategorySection 
                category="overhead" 
                rewards={categorizedRewards.overhead} 
                onDelete={onDelete}
                onCopy={handleCopy}
              />
            </>
          )}
        </div>

        {/* Monthly totals summary */}
        {monthlyTotals.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Historie po měsících</p>
            <div className="grid grid-cols-2 gap-2">
              {monthlyTotals.slice(0, 6).map((mt) => (
                <button
                  key={`${mt.year}-${mt.month}`}
                  className="text-xs p-2 rounded bg-muted/50 flex justify-between hover:bg-muted transition-colors text-left"
                  onClick={() => {
                    setSelectedYear(mt.year);
                    setSelectedMonth(mt.month);
                  }}
                >
                  <span className="text-muted-foreground">
                    {MONTHS[mt.month - 1].slice(0, 3)} {mt.year}
                  </span>
                  <span className="font-medium">{mt.total.toLocaleString('cs-CZ')} Kč</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
