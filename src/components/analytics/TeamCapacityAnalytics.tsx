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
} from 'recharts';
import {
  Users,
  DollarSign,
  UserCheck,
  Building2,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface TeamCapacityAnalyticsProps {
  activeColleagues: number;
  totalTeamCost: number;
  avgCostPerActiveColleague: number;
  costByPosition: { position: string; amount: number; colleagues: number }[];
  costByColleague: { colleagueId: string; name: string; position: string; cost: number; assignments: number }[];
}

export function TeamCapacityAnalytics({
  activeColleagues,
  totalTeamCost,
  avgCostPerActiveColleague,
  costByPosition,
  costByColleague,
}: TeamCapacityAnalyticsProps) {
  const formatCurrency = (value: number) => `${(value / 1000).toFixed(0)}K`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Aktivní kolegové"
          value={activeColleagues}
          icon={Users}
          subtitle="s výkazem v období"
        />
        <KPICard
          title="Celkové náklady"
          value={`${formatCurrency(totalTeamCost)} Kč`}
          icon={DollarSign}
          subtitle="součet za vybrané období"
        />
        <KPICard
          title="Průměr na aktivního kolegu"
          value={`${formatCurrency(avgCostPerActiveColleague)} Kč`}
          icon={UserCheck}
          subtitle="náklad na kolegu v období"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Struktura nákladů podle pozice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costByPosition} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis type="category" dataKey="position" width={130} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString('cs-CZ')} Kč`, 'Náklady']}
                    labelFormatter={(label) => {
                      const row = costByPosition.find((item) => item.position === label);
                      return row ? `${label} (${row.colleagues} kolegů)` : String(label);
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Rozdělení nákladů po kolezích</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kolega</TableHead>
                    <TableHead>Pozice</TableHead>
                    <TableHead className="text-right">Měsíce s výkazem</TableHead>
                    <TableHead className="text-right">Náklad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costByColleague.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Žádné náklady v tomto období.
                      </TableCell>
                    </TableRow>
                  ) : (
                    costByColleague.map((row) => (
                      <TableRow key={row.colleagueId}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            <Building2 className="h-3 w-3 mr-1" />
                            {row.position}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{row.assignments}</TableCell>
                        <TableCell className="text-right">{Math.round(row.cost).toLocaleString('cs-CZ')} Kč</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
