import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, Calendar, RotateCcw } from "lucide-react";

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
    // Current month appointments
    const currentMonthAppts = appointments.filter((a) =>
      (a.date_time || "").startsWith(monthPrefix)
    );

    // Previous month appointments
    const prevMonthAppts = appointments.filter((a) =>
      (a.date_time || "").startsWith(previousMonthPrefix)
    );

    // Current month stats
    const total = currentMonthAppts.length;
    const confirmed = currentMonthAppts.filter(
      (a) => a.status === "confirmed" || a.status === "done"
    ).length;
    const cancelled = currentMonthAppts.filter((a) => a.status === "cancelled").length;
    const done = currentMonthAppts.filter((a) => a.status === "done").length;
    const scheduled = currentMonthAppts.filter((a) => a.status === "scheduled").length;

    // Rescheduled detection (based on notes containing "Reagendado" or "reagendado")
    const rescheduled = currentMonthAppts.filter(
      (a) => a.notes?.toLowerCase().includes("reagendad")
    ).length;

    // Calculate rates
    const confirmationRate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : "0.0";
    const cancellationRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : "0.0";
    const rescheduleRate = total > 0 ? ((rescheduled / total) * 100).toFixed(1) : "0.0";
    const completionRate = total > 0 ? ((done / total) * 100).toFixed(1) : "0.0";

    // Previous month stats for comparison
    const prevTotal = prevMonthAppts.length;
    const prevConfirmed = prevMonthAppts.filter(
      (a) => a.status === "confirmed" || a.status === "done"
    ).length;
    const prevCancelled = prevMonthAppts.filter((a) => a.status === "cancelled").length;

    const prevConfirmationRate = prevTotal > 0 ? (prevConfirmed / prevTotal) * 100 : 0;
    const prevCancellationRate = prevTotal > 0 ? (prevCancelled / prevTotal) * 100 : 0;

    const confirmationTrend = parseFloat(confirmationRate) - prevConfirmationRate;
    const cancellationTrend = parseFloat(cancellationRate) - prevCancellationRate;

    // Chart data
    const chartData = [
      { name: "Realizadas", value: done, color: COLORS.done },
      { name: "Confirmadas", value: confirmed - done, color: COLORS.confirmed },
      { name: "Pendentes", value: scheduled, color: COLORS.scheduled },
      { name: "Canceladas", value: cancelled, color: COLORS.cancelled },
    ].filter((item) => item.value > 0);

    return {
      total,
      confirmed,
      cancelled,
      done,
      scheduled,
      rescheduled,
      confirmationRate,
      cancellationRate,
      rescheduleRate,
      completionRate,
      confirmationTrend,
      cancellationTrend,
      chartData,
    };
  }, [appointments, monthPrefix, previousMonthPrefix]);

  const TrendIndicator = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
    const isPositive = inverted ? value < 0 : value > 0;
    const isNegative = inverted ? value > 0 : value < 0;

    if (Math.abs(value) < 0.1) {
      return (
        <span className="flex items-center text-xs text-muted-foreground">
          <Minus className="h-3 w-3 mr-1" />
          Estável
        </span>
      );
    }

    if (isPositive) {
      return (
        <span className="flex items-center text-xs text-emerald-600">
          <TrendingUp className="h-3 w-3 mr-1" />
          +{Math.abs(value).toFixed(1)}%
        </span>
      );
    }

    return (
      <span className="flex items-center text-xs text-red-600">
        <TrendingDown className="h-3 w-3 mr-1" />
        -{Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  return (
    <Card className="card-glass">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          📊 Métricas de Agendamentos
        </CardTitle>
        <p className="text-xs text-muted-foreground">Desempenho do mês atual</p>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-700 dark:text-emerald-400">Confirmação</span>
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {metrics.confirmationRate}%
            </div>
            <TrendIndicator value={metrics.confirmationTrend} />
          </div>

          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-700 dark:text-red-400">Cancelamento</span>
            </div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {metrics.cancellationRate}%
            </div>
            <TrendIndicator value={metrics.cancellationTrend} inverted />
          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-700 dark:text-blue-400">Reagendamento</span>
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {metrics.rescheduleRate}%
            </div>
            <span className="text-xs text-muted-foreground">{metrics.rescheduled} sessões</span>
          </div>

          <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs text-primary">Conclusão</span>
            </div>
            <div className="text-2xl font-bold text-primary">{metrics.completionRate}%</div>
            <span className="text-xs text-muted-foreground">{metrics.done} realizadas</span>
          </div>
        </div>

        {/* Chart */}
        {metrics.chartData.length > 0 ? (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
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
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
            Nenhum dado disponível para exibição
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Total no mês: <strong>{metrics.total}</strong> agendamentos
          </span>
          <span className="text-xs text-muted-foreground">vs mês anterior</span>
        </div>
      </CardContent>
    </Card>
  );
};
