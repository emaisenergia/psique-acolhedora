import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Calendar, XCircle, Clock, Users } from "lucide-react";
import { format, subDays, startOfDay, parseISO, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { type AppointmentRow } from "@/hooks/useAppointments";

interface OccupancyMetricsCardProps {
  appointments: AppointmentRow[];
  workingHoursPerDay?: number;
  sessionDuration?: number;
}

type Period = "7" | "30" | "90";

export function OccupancyMetricsCard({ 
  appointments, 
  workingHoursPerDay = 8,
  sessionDuration = 50 
}: OccupancyMetricsCardProps) {
  const [period, setPeriod] = useState<Period>("30");
  
  const metrics = useMemo(() => {
    const now = new Date();
    const days = parseInt(period);
    const startDate = startOfDay(subDays(now, days));
    const dateRange = eachDayOfInterval({ start: startDate, end: now });
    
    const periodAppts = appointments.filter(a => {
      if (!a.date_time) return false;
      const date = parseISO(a.date_time);
      return date >= startDate && date <= now;
    });
    
    const slotsPerDay = Math.floor((workingHoursPerDay * 60) / sessionDuration);
    const totalPossibleSlots = dateRange.length * slotsPerDay;
    
    const done = periodAppts.filter(a => a.status === "done").length;
    const cancelled = periodAppts.filter(a => a.status === "cancelled").length;
    const totalBooked = periodAppts.filter(a => a.status !== "cancelled").length;
    
    const occupancyRate = totalPossibleSlots > 0 ? (totalBooked / totalPossibleSlots) * 100 : 0;
    const cancellationRate = (totalBooked + cancelled) > 0 ? (cancelled / (totalBooked + cancelled)) * 100 : 0;
    const completionRate = totalBooked > 0 ? (done / totalBooked) * 100 : 0;
    
    const weeks = days / 7;
    const avgSessionsPerWeek = weeks > 0 ? totalBooked / weeks : 0;
    
    const chartData = dateRange.map(day => {
      const dayAppts = periodAppts.filter(a => {
        if (!a.date_time) return false;
        return isSameDay(parseISO(a.date_time), day);
      });
      
      const dayBooked = dayAppts.filter(a => a.status !== "cancelled").length;
      const dayCancelled = dayAppts.filter(a => a.status === "cancelled").length;
      const dayOccupancy = slotsPerDay > 0 ? (dayBooked / slotsPerDay) * 100 : 0;
      
      return {
        date: format(day, "dd/MM", { locale: ptBR }),
        ocupacao: Math.round(dayOccupancy),
        cancelamentos: dayCancelled,
        sessoes: dayBooked,
      };
    });
    
    const prevStart = subDays(startDate, days);
    const prevAppts = appointments.filter(a => {
      if (!a.date_time) return false;
      const date = parseISO(a.date_time);
      return date >= prevStart && date < startDate;
    });
    
    const prevTotalBooked = prevAppts.filter(a => a.status !== "cancelled").length;
    const prevCancelled = prevAppts.filter(a => a.status === "cancelled").length;
    const prevOccupancy = totalPossibleSlots > 0 ? (prevTotalBooked / totalPossibleSlots) * 100 : 0;
    const prevCancellationRate = (prevTotalBooked + prevCancelled) > 0 
      ? (prevCancelled / (prevTotalBooked + prevCancelled)) * 100 
      : 0;
    
    return {
      occupancyRate,
      cancellationRate,
      completionRate,
      avgSessionsPerWeek,
      totalBooked,
      cancelled,
      chartData,
      occupancyTrend: occupancyRate - prevOccupancy,
      cancellationTrend: cancellationRate - prevCancellationRate,
    };
  }, [appointments, period, workingHoursPerDay, sessionDuration]);

  const TrendIndicator = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
    const isPositive = inverted ? value < 0 : value > 0;
    const isNegative = inverted ? value > 0 : value < 0;
    
    if (Math.abs(value) < 0.1) {
      return <span className="text-xs text-muted-foreground">Estável</span>;
    }
    
    return (
      <span className={`flex items-center gap-1 text-xs ${isPositive ? "text-emerald-600" : isNegative ? "text-red-600" : "text-muted-foreground"}`}>
        {value > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  return (
    <Card className="card-glass">
      <CardContent className="p-6">
        {/* Header — same pattern as Stat cards */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Métricas de Ocupação</div>
              <div className="text-2xl font-semibold">{metrics.occupancyRate.toFixed(1)}%</div>
            </div>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-muted/40">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3.5 h-3.5" /> Ocupação
            </div>
            <div className="text-xl font-bold">{metrics.occupancyRate.toFixed(1)}%</div>
            <TrendIndicator value={metrics.occupancyTrend} />
          </div>
          
          <div className="p-3 rounded-xl bg-muted/40">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <XCircle className="w-3.5 h-3.5" /> Cancelamentos
            </div>
            <div className="text-xl font-bold">{metrics.cancellationRate.toFixed(1)}%</div>
            <TrendIndicator value={metrics.cancellationTrend} inverted />
          </div>
          
          <div className="p-3 rounded-xl bg-muted/40">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Clock className="w-3.5 h-3.5" /> Conclusão
            </div>
            <div className="text-xl font-bold">{metrics.completionRate.toFixed(1)}%</div>
          </div>
          
          <div className="p-3 rounded-xl bg-muted/40">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Users className="w-3.5 h-3.5" /> Sessões/Semana
            </div>
            <div className="text-xl font-bold">{metrics.avgSessionsPerWeek.toFixed(1)}</div>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                interval={period === "7" ? 0 : period === "30" ? 4 : 13}
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line 
                type="monotone" 
                dataKey="ocupacao" 
                name="Ocupação (%)" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="sessoes" 
                name="Sessões" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="cancelamentos" 
                name="Cancelamentos" 
                stroke="hsl(0, 84%, 60%)" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Ocupação
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} /> Sessões
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(0, 84%, 60%)" }} /> Cancelamentos
          </div>
        </div>
        
        {/* Summary */}
        <div className="flex justify-between text-sm text-muted-foreground border-t border-border/50 pt-4 mt-4">
          <span>Total agendadas: <strong className="text-foreground">{metrics.totalBooked}</strong></span>
          <span>Cancelamentos: <strong className="text-foreground">{metrics.cancelled}</strong></span>
        </div>
      </CardContent>
    </Card>
  );
}
