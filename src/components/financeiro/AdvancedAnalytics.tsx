import { useMemo } from "react";
import { format, parseISO, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, CalendarDays, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Appointment {
  id: string;
  date_time: string;
  status: string;
  payment_value?: number | null;
  duration_minutes?: number;
}

interface AdvancedAnalyticsProps {
  appointments: Appointment[];
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const RevenueProjectionChart = ({ appointments }: AdvancedAnalyticsProps) => {
  const projectionData = useMemo(() => {
    const now = new Date();
    const data = [];
    
    // Calculate average monthly revenue from last 3 months
    let totalRevenue = 0;
    let monthsWithData = 0;
    
    for (let i = 3; i >= 1; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      
      const monthRevenue = appointments
        .filter(a => {
          if (!a.date_time || a.status !== "done") return false;
          const aptDate = parseISO(a.date_time);
          return aptDate >= monthStart && aptDate <= monthEnd;
        })
        .reduce((sum, a) => sum + (a.payment_value || 0), 0);
      
      if (monthRevenue > 0) {
        totalRevenue += monthRevenue;
        monthsWithData++;
      }
      
      data.push({
        month: format(monthStart, "MMM/yy", { locale: ptBR }),
        real: monthRevenue,
        projetado: null,
        type: "histórico",
      });
    }
    
    const avgMonthlyRevenue = monthsWithData > 0 ? totalRevenue / monthsWithData : 0;
    
    // Current month (partial real + projection)
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const currentMonthRevenue = appointments
      .filter(a => {
        if (!a.date_time || a.status !== "done") return false;
        const aptDate = parseISO(a.date_time);
        return aptDate >= currentMonthStart && aptDate <= currentMonthEnd;
      })
      .reduce((sum, a) => sum + (a.payment_value || 0), 0);
    
    // Future appointments this month
    const futureRevenue = appointments
      .filter(a => {
        if (!a.date_time || a.status === "cancelled") return false;
        const aptDate = parseISO(a.date_time);
        return aptDate > now && aptDate <= currentMonthEnd && a.status === "scheduled";
      })
      .reduce((sum, a) => sum + (a.payment_value || 150), 0);
    
    data.push({
      month: format(currentMonthStart, "MMM/yy", { locale: ptBR }),
      real: currentMonthRevenue,
      projetado: currentMonthRevenue + futureRevenue,
      type: "atual",
    });
    
    // Project next 2 months based on scheduled appointments + average
    for (let i = 1; i <= 2; i++) {
      const futureMonthStart = startOfMonth(addMonths(now, i));
      const futureMonthEnd = endOfMonth(addMonths(now, i));
      
      const scheduledRevenue = appointments
        .filter(a => {
          if (!a.date_time || a.status === "cancelled") return false;
          const aptDate = parseISO(a.date_time);
          return aptDate >= futureMonthStart && aptDate <= futureMonthEnd;
        })
        .reduce((sum, a) => sum + (a.payment_value || 150), 0);
      
      // Use max of scheduled or average
      const projectedRevenue = Math.max(scheduledRevenue, avgMonthlyRevenue * 0.8);
      
      data.push({
        month: format(futureMonthStart, "MMM/yy", { locale: ptBR }),
        real: null,
        projetado: projectedRevenue,
        type: "projeção",
      });
    }
    
    return data;
  }, [appointments]);

  const trend = useMemo(() => {
    const lastRealValue = projectionData.find(d => d.type === "atual")?.projetado || 0;
    const previousValue = projectionData[2]?.real || 0;
    if (previousValue === 0) return 0;
    return ((lastRealValue - previousValue) / previousValue) * 100;
  }, [projectionData]);

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Projeção de Faturamento
          </span>
          <span className={`text-sm flex items-center gap-1 ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
            {trend >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {Math.abs(trend).toFixed(1)}% vs mês anterior
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip 
              formatter={(value: number, name: string) => [
                currencyFormatter.format(value),
                name === "real" ? "Realizado" : "Projetado"
              ]}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            />
            <Legend formatter={(value) => value === "real" ? "Realizado" : "Projetado"} />
            <Area 
              type="monotone" 
              dataKey="real" 
              stroke="hsl(142, 76%, 36%)" 
              fill="hsl(142, 76%, 36%)"
              fillOpacity={0.3}
              name="real"
            />
            <Area 
              type="monotone" 
              dataKey="projetado" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeDasharray="5 5"
              name="projetado"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const WeekdayAnalysisChart = ({ appointments }: AdvancedAnalyticsProps) => {
  const weekdayData = useMemo(() => {
    const weekdayMap = WEEKDAYS.map((day, index) => ({
      day,
      sessions: 0,
      revenue: 0,
      index,
    }));
    
    appointments.filter(a => a.status === "done").forEach(apt => {
      if (!apt.date_time) return;
      const dayIndex = getDay(parseISO(apt.date_time));
      weekdayMap[dayIndex].sessions += 1;
      weekdayMap[dayIndex].revenue += apt.payment_value || 0;
    });
    
    return weekdayMap;
  }, [appointments]);

  const bestDay = useMemo(() => {
    return weekdayData.reduce((max, day) => day.revenue > max.revenue ? day : max, weekdayData[0]);
  }, [weekdayData]);

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Análise por Dia da Semana
          </span>
          <span className="text-sm text-muted-foreground">
            Melhor dia: <strong className="text-primary">{bestDay.day}</strong>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekdayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === "sessions" ? `${value} sessões` : currencyFormatter.format(value),
                name === "sessions" ? "Sessões" : "Faturamento"
              ]}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            />
            <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="sessions" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface OccupancyRateProps {
  appointments: Appointment[];
  workHoursPerDay?: number;
  workDaysPerWeek?: number;
}

export const OccupancyRateCard = ({ 
  appointments, 
  workHoursPerDay = 8, 
  workDaysPerWeek = 5 
}: OccupancyRateProps) => {
  const occupancyData = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    // Count work days in current month
    const allDays = eachDayOfInterval({ start: currentMonthStart, end: now });
    const workDays = allDays.filter(day => {
      const dayOfWeek = getDay(day);
      return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude weekends
    });
    
    // Available hours this month so far
    const availableHours = workDays.length * workHoursPerDay;
    const availableSlots = availableHours; // Assuming 1 hour per session
    
    // Completed sessions
    const completedSessions = appointments.filter(a => {
      if (!a.date_time || a.status !== "done") return false;
      const aptDate = parseISO(a.date_time);
      return aptDate >= currentMonthStart && aptDate <= now;
    }).length;
    
    // Calculate occupancy
    const occupancyRate = availableSlots > 0 ? (completedSessions / availableSlots) * 100 : 0;
    
    // Calculate for last month for comparison
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const lastMonthWorkDays = eachDayOfInterval({ start: lastMonthStart, end: lastMonthEnd })
      .filter(day => {
        const dayOfWeek = getDay(day);
        return dayOfWeek !== 0 && dayOfWeek !== 6;
      });
    const lastMonthSlots = lastMonthWorkDays.length * workHoursPerDay;
    const lastMonthSessions = appointments.filter(a => {
      if (!a.date_time || a.status !== "done") return false;
      const aptDate = parseISO(a.date_time);
      return aptDate >= lastMonthStart && aptDate <= lastMonthEnd;
    }).length;
    const lastMonthOccupancy = lastMonthSlots > 0 ? (lastMonthSessions / lastMonthSlots) * 100 : 0;
    
    return {
      occupancyRate: Math.min(100, occupancyRate),
      completedSessions,
      availableSlots,
      lastMonthOccupancy: Math.min(100, lastMonthOccupancy),
      trend: occupancyRate - lastMonthOccupancy,
    };
  }, [appointments, workHoursPerDay]);

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return "text-green-500";
    if (rate >= 60) return "text-blue-500";
    if (rate >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Taxa de Ocupação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-4xl font-bold ${getOccupancyColor(occupancyData.occupancyRate)}`}>
              {occupancyData.occupancyRate.toFixed(0)}%
            </div>
            <p className="text-sm text-muted-foreground">
              {occupancyData.completedSessions} de {occupancyData.availableSlots} slots utilizados
            </p>
          </div>
          <div className="text-right">
            <div className={`text-sm flex items-center gap-1 ${occupancyData.trend >= 0 ? "text-green-500" : "text-red-500"}`}>
              {occupancyData.trend >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(occupancyData.trend).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">vs mês anterior</p>
          </div>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
          <div 
            className={`h-full transition-all ${
              occupancyData.occupancyRate >= 80 ? "bg-green-500" :
              occupancyData.occupancyRate >= 60 ? "bg-blue-500" :
              occupancyData.occupancyRate >= 40 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${occupancyData.occupancyRate}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

interface YearOverYearProps {
  appointments: Appointment[];
}

export const YearOverYearComparison = ({ appointments }: YearOverYearProps) => {
  const comparisonData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const data = [];
    
    for (let month = 0; month < 12; month++) {
      const currentYearStart = new Date(currentYear, month, 1);
      const currentYearEnd = endOfMonth(currentYearStart);
      const lastYearStart = new Date(currentYear - 1, month, 1);
      const lastYearEnd = endOfMonth(lastYearStart);
      
      const currentYearRevenue = appointments
        .filter(a => {
          if (!a.date_time || a.status !== "done") return false;
          const aptDate = parseISO(a.date_time);
          return aptDate >= currentYearStart && aptDate <= currentYearEnd;
        })
        .reduce((sum, a) => sum + (a.payment_value || 0), 0);
      
      const lastYearRevenue = appointments
        .filter(a => {
          if (!a.date_time || a.status !== "done") return false;
          const aptDate = parseISO(a.date_time);
          return aptDate >= lastYearStart && aptDate <= lastYearEnd;
        })
        .reduce((sum, a) => sum + (a.payment_value || 0), 0);
      
      // Only include months up to current month for current year
      if (month <= now.getMonth() || lastYearRevenue > 0) {
        data.push({
          month: format(currentYearStart, "MMM", { locale: ptBR }),
          [currentYear]: month <= now.getMonth() ? currentYearRevenue : null,
          [currentYear - 1]: lastYearRevenue || null,
        });
      }
    }
    
    return data;
  }, [appointments]);

  const currentYear = new Date().getFullYear();

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Comparativo Ano a Ano
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip 
              formatter={(value: number) => currencyFormatter.format(value)}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={currentYear} 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
              name={String(currentYear)}
            />
            <Line 
              type="monotone" 
              dataKey={currentYear - 1} 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: 'hsl(var(--muted-foreground))' }}
              name={String(currentYear - 1)}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
