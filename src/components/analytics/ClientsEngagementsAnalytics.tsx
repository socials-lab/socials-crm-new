import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/shared/KPICard';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  Building2, 
  UserPlus, 
  UserMinus, 
  Percent,
  Briefcase,
  TrendingUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const TIER_COLORS: Record<string, string> = {
  'standard': 'hsl(var(--muted-foreground))',
  'gold': 'hsl(45, 100%, 50%)',
  'platinum': 'hsl(220, 20%, 65%)',
  'diamond': 'hsl(200, 100%, 60%)',
};

interface ClientEngagementsAnalyticsProps {
  year: number;
  month: number;
  activeClients: number;
  newClients: { id: string; name: string; startDate: string }[];
  lostClients: { id: string; name: string; endDate: string }[];
  churnRate: number;
  activeEngagements: number;
  totalInvoicing: number;
  invoicingChange: number;
  clientChange: number;
  clientTrend: { month: string; active: number; new: number; lost: number }[];
  topClientsByRevenue: { name: string; revenue: number }[];
  topClientsByMargin: { name: string; margin: number }[];
  clientsByTier: { tier: string; count: number }[];
}

export function ClientsEngagementsAnalytics({
  activeClients,
  newClients,
  lostClients,
  churnRate,
  activeEngagements,
  totalInvoicing,
  invoicingChange,
  clientChange,
  clientTrend,
  topClientsByRevenue,
  topClientsByMargin,
  clientsByTier,
}: ClientEngagementsAnalyticsProps) {
  const formatCurrency = (value: number) => `${(value / 1000).toFixed(0)}K`;
  
  return (
    <div className="space-y-6">
      {/* KPI Cards Row 1 - Clients */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Aktivní klienti"
          value={activeClients}
          icon={Building2}
          subtitle={
            <span className={cn(
              "flex items-center gap-1 text-xs",
              clientChange >= 0 ? "text-status-active" : "text-status-lost"
            )}>
              {clientChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(clientChange)} vs předchozí období
            </span>
          }
        />
        <KPICard
          title="Noví klienti"
          value={newClients.length}
          icon={UserPlus}
          subtitle="v období"
        />
        <KPICard
          title="Ztracení klienti"
          value={lostClients.length}
          icon={UserMinus}
          subtitle="v období"
        />
        <KPICard
          title="Churn rate"
          value={`${churnRate.toFixed(1)}%`}
          icon={Percent}
        />
      </div>

      {/* KPI Cards Row 2 - Engagements */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Aktivní zakázky"
          value={activeEngagements}
          icon={Briefcase}
        />
        <KPICard
          title="Celková fakturace"
          value={`${formatCurrency(totalInvoicing)} Kč`}
          icon={TrendingUp}
        />
        <KPICard
          title="Změna fakturace"
          value={`${invoicingChange >= 0 ? '+' : ''}${invoicingChange.toFixed(1)}%`}
          icon={invoicingChange >= 0 ? ArrowUp : ArrowDown}
          subtitle={
            <span className={cn(
              "text-xs",
              invoicingChange >= 0 ? "text-status-active" : "text-status-lost"
            )}>
              vs předchozí období
            </span>
          }
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Client Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Vývoj počtu klientů (12 měsíců)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={clientTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="active" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    name="Aktivní"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Clients by Tier */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Klienti podle tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientsByTier}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="tier"
                  >
                    {clientsByTier.map((entry) => (
                      <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] || COLORS[0]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} klientů`, 'Počet']}
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
              {clientsByTier.map((entry) => (
                <div key={entry.tier} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: TIER_COLORS[entry.tier] || COLORS[0] }}
                  />
                  <span className="text-xs text-muted-foreground capitalize">{entry.tier}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Clients by Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Top 10 klientů dle fakturace</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClientsByRevenue} layout="vertical">
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
                    formatter={(value: number) => [`${value.toLocaleString()} Kč`, 'Fakturace']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Clients by Margin */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Top 10 klientů dle marže</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClientsByMargin} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Marže']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="margin" fill="hsl(var(--status-active))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New and Lost Clients Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* New Clients */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-status-active" />
              Noví klienti v měsíci
            </CardTitle>
          </CardHeader>
          <CardContent>
            {newClients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                V tomto období nebyli získáni noví klienti
              </p>
            ) : (
              <div className="space-y-2">
                {newClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <p className="font-medium text-sm">{client.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {format(new Date(client.startDate), 'd. M.', { locale: cs })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lost Clients */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <UserMinus className="h-4 w-4 text-status-lost" />
              Ztracení klienti v měsíci
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lostClients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                V tomto období nebyli ztraceni žádní klienti 🎉
              </p>
            ) : (
              <div className="space-y-2">
                {lostClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <p className="font-medium text-sm">{client.name}</p>
                    <Badge variant="destructive" className="text-xs">
                      {format(new Date(client.endDate), 'd. M.', { locale: cs })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
