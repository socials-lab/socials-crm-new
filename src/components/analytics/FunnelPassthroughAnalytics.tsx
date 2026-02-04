import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, TrendingUp, BarChart3 } from 'lucide-react';
import { useLeadTransitions } from '@/hooks/useLeadTransitions';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function FunnelPassthroughAnalytics() {
  const { getSummary, isLoading, stageLabels } = useLeadTransitions();
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Načítám data...</div>
        </CardContent>
      </Card>
    );
  }

  const summary = getSummary();
  const { conversionRates, overallConversion, totalTransitions, monthlyTrend } = summary;

  if (totalTransitions === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Funnel Průchodnost
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Zatím nejsou žádné potvrzené přechody.</p>
            <p className="text-xs mt-2">
              Při přesouvání leadů mezi fázemi potvrďte přechod pro analytiku.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Funnel Průchodnost (potvrzené přechody)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Conversion Rates */}
          <div className="space-y-3">
            {conversionRates.map((rate, index) => (
              <div key={`${rate.fromStage}-${rate.toStage}`} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{rate.fromLabel}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{rate.toLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">{rate.rate.toFixed(0)}%</span>
                    <span className="text-xs text-muted-foreground">
                      ({rate.count}/{rate.total})
                    </span>
                  </div>
                </div>
                <Progress value={rate.rate} className="h-2" />
              </div>
            ))}
          </div>

          {/* Overall Conversion */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium">Celková konverze</span>
                <Badge variant="outline" className="text-xs">
                  Nový lead → Won
                </Badge>
              </div>
              <span className="text-xl font-bold text-primary">
                {overallConversion.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      {monthlyTrend.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              Trend konverze (Nový lead → Won)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Konverze']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    name="Konverze"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">% konverze (Nový lead → Won)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="text-xs text-muted-foreground text-center">
        Celkem {totalTransitions} potvrzených přechodů
      </div>
    </div>
  );
}
