import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/shared/KPICard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  Users, 
  DollarSign, 
  Briefcase,
  TrendingUp,
} from 'lucide-react';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const COST_MODEL_LABELS: Record<string, string> = {
  'hourly': 'Hodinová sazba',
  'fixed_monthly': 'Fixní měsíční',
  'percentage': 'Procento z revenue',
};

interface TeamCapacityAnalyticsProps {
  activeColleagues: number;
  totalTeamCost: number;
  avgCostPerEngagement: number;
  revenuePerColleague: number;
  colleagueWorkload: { name: string; assignments: number; revenue: number }[];
  costBreakdown: { costModel: string; amount: number; count: number }[];
  topRevenueGenerators: { name: string; revenue: number; engagements: number }[];
  freelancerVsEmployee: { type: string; count: number; cost: number }[];
}

export function TeamCapacityAnalytics({
  activeColleagues,
  totalTeamCost,
  avgCostPerEngagement,
  revenuePerColleague,
  colleagueWorkload,
  costBreakdown,
  topRevenueGenerators,
  freelancerVsEmployee,
}: TeamCapacityAnalyticsProps) {
  const formatCurrency = (value: number) => `${(value / 1000).toFixed(0)}K`;
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Aktivní kolegové"
          value={activeColleagues}
          icon={Users}
          subtitle="se statusem active"
        />
        <KPICard
          title="Celkové náklady na tým"
          value={`${formatCurrency(totalTeamCost)} Kč`}
          icon={DollarSign}
          subtitle="měsíční"
        />
        <KPICard
          title="Prům. náklady/zakázka"
          value={`${formatCurrency(avgCostPerEngagement)} Kč`}
          icon={Briefcase}
        />
        <KPICard
          title="Revenue/Kolega"
          value={`${formatCurrency(revenuePerColleague)} Kč`}
          icon={TrendingUp}
          subtitle="MRR / aktivní kolegové"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Colleague Workload */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Workload kolegů (počet přiřazení)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={colleagueWorkload} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'assignments') return [`${value} zakázek`, 'Přiřazení'];
                      if (name === 'revenue') return [`${value.toLocaleString()} Kč`, 'Revenue'];
                      return [value, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="assignments" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown by Model */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Struktura nákladů podle modelu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="costModel"
                  >
                    {costBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} Kč`, 'Náklady']}
                    labelFormatter={(label) => COST_MODEL_LABELS[label] || label}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {costBreakdown.map((entry, index) => (
                <div key={entry.costModel} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {COST_MODEL_LABELS[entry.costModel] || entry.costModel} ({entry.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Revenue Generators */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Top kolegové podle revenue zakázek</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRevenueGenerators} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') return [`${value.toLocaleString()} Kč`, 'Revenue'];
                      if (name === 'engagements') return [`${value}`, 'Zakázky'];
                      return [value, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--status-active))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Freelancer vs Employee */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Interní vs Freelanceři</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={freelancerVsEmployee}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="type" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar yAxisId="left" dataKey="count" fill="hsl(var(--chart-1))" name="Počet" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="cost" fill="hsl(var(--chart-2))" name="Náklady" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                <span className="text-xs text-muted-foreground">Počet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                <span className="text-xs text-muted-foreground">Náklady</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
