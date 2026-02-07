import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, RotateCcw, Calendar } from "lucide-react";

interface AppointmentMetricsCardProps {
  appointments: Array<{
    id: string;
    status: string;
    date_time: string;
    notes?: string | null;
  }>;
  monthPrefix: string;
  previousMonthPrefix: string;
}

const COLORS = {
  confirmed: "hsl(var(--chart-1))",
  done: "hsl(142.1 76.2% 36.3%)",
  cancelled: "hsl(0 84.2% 60.2%)",
  scheduled: "hsl(45.4 93.4% 47.5%)",
};

export const AppointmentMetricsCard = ({
  appointments,
  monthPrefix,
  previousMonthPrefix,
}: AppointmentMetricsCardProps) => {
  const metrics = useMemo(() => {
    const currentMonthAppts = appointments.filter((a) =>
      (a.date_time || "").startsWith(monthPrefix)
    );
    const prevMonthAppts = appointments.filter((a) =>
      (a.date_time || "").startsWith(previousMonthPrefix)
    );

    const total = currentMonthAppts.length;
    const confirmed = currentMonthAppts.filter(
      (a) => a.status === "confirmed" || a.status === "done"
    ).length;
    const cancelled = currentMonthAppts.filter((a) => a.status === "cancelled").length;
    const done = currentMonthAppts.filter((a) => a.status === "done").length;
    const scheduled = currentMonthAppts.filter((a) => a.status === "scheduled").length;
    const rescheduled = currentMonthAppts.filter(
      (a) => a.notes?.toLowerCase().includes("reagendad")
    ).length;

    const confirmationRate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : "0.0";
    const cancellationRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : "0.0";
    const rescheduleRate = total > 0 ? ((rescheduled / total) * 100).toFixed(1) : "0.0";
    const completionRate = total > 0 ? ((done / total) * 100).toFixed(1) : "0.0";

    const prevTotal = prevMonthAppts.length;
    const prevConfirmed = prevMonthAppts.filter(
      (a) => a.status === "confirmed" || a.status === "done"
    ).length;
    const prevCancelled = prevMonthAppts.filter((a) => a.status === "cancelled").length;

    const prevConfirmationRate = prevTotal > 0 ? (prevConfirmed / prevTotal) * 100 : 0;
    const prevCancellationRate = prevTotal > 0 ? (prevCancelled / prevTotal) * 100 : 0;

    const confirmationTrend = parseFloat(confirmationRate) - prevConfirmationRate;
    const cancellationTrend = parseFloat(cancellationRate) - prevCancellationRate;

    const chartData = [
      { name: "Realizadas", value: done, color: COLORS.done },
      { name: "Confirmadas", value: confirmed - done, color: COLORS.confirmed },
      { name: "Pendentes", value: scheduled, color: COLORS.scheduled },
      { name: "Canceladas", value: cancelled, color: COLORS.cancelled },
    ].filter((item) => item.value > 0);

    return {
      total, confirmed, cancelled, done, scheduled, rescheduled,
      confirmationRate, cancellationRate, rescheduleRate, completionRate,
      confirmationTrend, cancellationTrend, chartData,
    };
  }, [appointments, monthPrefix, previousMonthPrefix]);

  const TrendIndicator = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
    const isPositive = inverted ? value < 0 : value > 0;

    if (Math.abs(value) < 0.1) {
      return (
        <span className="flex items-center text-xs text-muted-foreground">
          <Minus className="h-3 w-3 mr-1" /> Estável
        </span>
      );
    }

    if (isPositive) {
      return (
        <span className="flex items-center text-xs text-emerald-600">
          <TrendingUp className="h-3 w-3 mr-1" /> +{Math.abs(value).toFixed(1)}%
        </span>
      );
    }

    return (
      <span className="flex items-center text-xs text-red-600">
        <TrendingDown className="h-3 w-3 mr-1" /> -{Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  return (
    <Card className="card-glass">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Métricas de Agendamentos</div>
            <div className="text-2xl font-semibold">{metrics.total} sessões</div>
          </div>
        </div>

        {/* Metrics Grid — matching Stat card inner style */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-muted/40">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Confirmação</span>
            </div>
            <div className="text-xl font-bold">{metrics.confirmationRate}%</div>
            <TrendIndicator value={metrics.confirmationTrend} />
          </div>

          <div className="p-3 rounded-xl bg-muted/40">
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Cancelamento</span>
            </div>
            <div className="text-xl font-bold">{metrics.cancellationRate}%</div>
            <TrendIndicator value={metrics.cancellationTrend} inverted />
          </div>

          <div className="p-3 rounded-xl bg-muted/40">
            <div className="flex items-center gap-1.5 mb-1">
              <RotateCcw className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Reagendamento</span>
            </div>
            <div className="text-xl font-bold">{metrics.rescheduleRate}%</div>
            <span className="text-xs text-muted-foreground">{metrics.rescheduled} sessões</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Conclusão</span>
            </div>
            <div className="text-xl font-bold">{metrics.completionRate}%</div>
            <span className="text-xs text-muted-foreground">{metrics.done} realizadas</span>
          </div>
        </div>

        {/* Chart */}
        {metrics.chartData.length > 0 ? (
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {metrics.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} sessões`, ""]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[160px] text-muted-foreground text-sm">
            Nenhum dado disponível
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-muted-foreground">
          {metrics.chartData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
