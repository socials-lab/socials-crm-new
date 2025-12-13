import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/shared/KPICard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Building2, TrendingUp, UserPlus, UserMinus } from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import type { Client, Engagement } from '@/types/crm';

const monthNames = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

const yearOptions = [2023, 2024, 2025, 2026];

interface ActiveClientData {
  client: Client;
  engagements: Engagement[];
  totalMonthlyFee: number;
}

export function ClientHistory() {
  const { clients, engagements, getClientById } = useCRMData();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const getActiveClientsForMonth = (year: number, month: number): ActiveClientData[] => {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);

    const activeClientMap = new Map<string, ActiveClientData>();

    engagements.forEach(engagement => {
      const startDate = new Date(engagement.start_date);
      const endDate = engagement.end_date ? new Date(engagement.end_date) : null;

      const startedBeforeOrDuring = startDate <= periodEnd;
      const didntEndBeforePeriod = !endDate || endDate >= periodStart;
      const isActiveEngagement = engagement.status === 'active' || engagement.status === 'completed';

      if (startedBeforeOrDuring && didntEndBeforePeriod && isActiveEngagement) {
        const client = getClientById(engagement.client_id);
        if (client) {
          if (!activeClientMap.has(client.id)) {
            activeClientMap.set(client.id, {
              client,
              engagements: [],
              totalMonthlyFee: 0,
            });
          }
          const clientData = activeClientMap.get(client.id)!;
          clientData.engagements.push(engagement);
          clientData.totalMonthlyFee += engagement.monthly_fee;
        }
      }
    });

    return Array.from(activeClientMap.values()).sort((a, b) => b.totalMonthlyFee - a.totalMonthlyFee);
  };

  const getNewClientsForMonth = (year: number, month: number): Client[] => {
    return clients.filter(client => {
      if (!client.start_date) return false;
      const startDate = new Date(client.start_date);
      return startDate.getFullYear() === year && startDate.getMonth() + 1 === month;
    });
  };

  const getLostClientsForMonth = (year: number, month: number): Client[] => {
    return clients.filter(client => {
      if (!client.end_date) return false;
      const endDate = new Date(client.end_date);
      return endDate.getFullYear() === year && endDate.getMonth() + 1 === month;
    });
  };

  const getYearlyClientCounts = (year: number): { month: string; count: number }[] => {
    return monthNames.map((name, index) => {
      const activeClients = getActiveClientsForMonth(year, index + 1);
      return {
        month: name.substring(0, 3),
        count: activeClients.length,
      };
    });
  };

  const activeClients = getActiveClientsForMonth(selectedYear, selectedMonth);
  const newClients = getNewClientsForMonth(selectedYear, selectedMonth);
  const lostClients = getLostClientsForMonth(selectedYear, selectedMonth);
  const mrr = activeClients.reduce((sum, c) => sum + c.totalMonthlyFee, 0);
  const yearlyData = getYearlyClientCounts(selectedYear);

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rok:</span>
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Měsíc:</span>
          <Select 
            value={selectedMonth.toString()} 
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((name, i) => (
                <SelectItem key={i} value={(i + 1).toString()}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Aktivní klienti"
          value={activeClients.length}
          icon={Building2}
        />
        <KPICard
          title="MRR období"
          value={`${(mrr / 1000).toFixed(0)}K Kč`}
          icon={TrendingUp}
        />
        <KPICard
          title="Noví klienti"
          value={newClients.length}
          icon={UserPlus}
        />
        <KPICard
          title="Ztracení klienti"
          value={lostClients.length}
          icon={UserMinus}
        />
      </div>

      {/* Active Clients List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Aktivní klienti v {monthNames[selectedMonth - 1].toLowerCase()} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeClients.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              V tomto období nebyli žádní aktivní klienti.
            </p>
          ) : (
            <div className="space-y-3">
              {activeClients.map(({ client, engagements: clientEngagements, totalMonthlyFee }) => (
                <div 
                  key={client.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{client.brand_name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {clientEngagements.map(eng => {
                        return (
                          <span 
                            key={eng.id}
                            className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded"
                          >
                            {eng.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {totalMonthlyFee.toLocaleString()} Kč/měs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yearly Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Vývoj počtu klientů v roce {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  allowDecimals={false}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} klientů`, 'Počet']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
