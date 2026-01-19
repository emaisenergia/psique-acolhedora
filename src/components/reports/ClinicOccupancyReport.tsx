import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, getHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, TrendingUp, Clock, DollarSign, BarChart3, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useClinics, type Clinic } from "@/hooks/useClinics";
import { useAppointments } from "@/hooks/useAppointments";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";

const PERIOD_OPTIONS = [
  { value: "current", label: "Mês Atual" },
  { value: "last", label: "Mês Anterior" },
  { value: "last3", label: "Últimos 3 Meses" },
  { value: "last6", label: "Últimos 6 Meses" },
];

const DEFAULT_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"
];

interface ClinicMetrics {
  clinicId: string;
  clinicName: string;
  color: string;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  revenue: number;
  occupancyRate: number;
  avgSessionValue: number;
  popularHours: { hour: number; count: number }[];
}

export function ClinicOccupancyReport() {
  const { clinics } = useClinics();
  const { appointments } = useAppointments();
  const { transactions } = useFinancialTransactions();
  const [period, setPeriod] = useState("current");

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "last":
        return {
          startDate: startOfMonth(subMonths(now, 1)),
          endDate: endOfMonth(subMonths(now, 1)),
        };
      case "last3":
        return {
          startDate: startOfMonth(subMonths(now, 2)),
          endDate: endOfMonth(now),
        };
      case "last6":
        return {
          startDate: startOfMonth(subMonths(now, 5)),
          endDate: endOfMonth(now),
        };
      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
        };
    }
  }, [period]);

  const clinicMetrics = useMemo((): ClinicMetrics[] => {
    const activeClinics = clinics.filter(c => c.status === 'active');
    
    // Add "Sem Clínica" for appointments without clinic
    const allClinics = [
      ...activeClinics,
      { id: 'none', name: 'Sem Clínica', color: '#9ca3af' } as Clinic & { color: string }
    ];

    return allClinics.map((clinic, index) => {
      // Filter appointments for this clinic and period
      const clinicAppointments = appointments.filter(appt => {
        if (!appt.date_time) return false;
        const apptDate = parseISO(appt.date_time);
        const inPeriod = apptDate >= startDate && apptDate <= endDate;
        const isSession = appt.appointment_type === 'session' || !appt.appointment_type;
        
        if (clinic.id === 'none') {
          return inPeriod && isSession && !appt.clinic_id;
        }
        return inPeriod && isSession && appt.clinic_id === clinic.id;
      });

      const totalSessions = clinicAppointments.length;
      const completedSessions = clinicAppointments.filter(a => a.status === 'done').length;
      const cancelledSessions = clinicAppointments.filter(a => a.status === 'cancelled').length;

      // Calculate revenue for this clinic
      const clinicRevenue = transactions
        .filter(t => {
          const tDate = parseISO(t.transaction_date);
          const inPeriod = tDate >= startDate && tDate <= endDate;
          // Match by clinic name since transactions use clinic name string
          if (clinic.id === 'none') {
            return inPeriod && t.type === 'revenue' && !t.clinic;
          }
          return inPeriod && t.type === 'revenue' && t.clinic === clinic.name;
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Calculate popular hours
      const hourCounts: Record<number, number> = {};
      clinicAppointments.forEach(appt => {
        if (appt.date_time) {
          const hour = getHours(parseISO(appt.date_time));
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });

      const popularHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate occupancy rate (completed / total non-cancelled)
      const validSessions = totalSessions - cancelledSessions;
      const occupancyRate = validSessions > 0 
        ? Math.round((completedSessions / validSessions) * 100) 
        : 0;

      return {
        clinicId: clinic.id,
        clinicName: clinic.name,
        color: (clinic as Clinic & { color?: string }).color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        totalSessions,
        completedSessions,
        cancelledSessions,
        revenue: clinicRevenue,
        occupancyRate,
        avgSessionValue: completedSessions > 0 ? clinicRevenue / completedSessions : 0,
        popularHours,
      };
    }).filter(m => m.totalSessions > 0 || m.revenue > 0);
  }, [clinics, appointments, transactions, startDate, endDate]);

  const totalMetrics = useMemo(() => {
    return {
      totalSessions: clinicMetrics.reduce((sum, m) => sum + m.totalSessions, 0),
      completedSessions: clinicMetrics.reduce((sum, m) => sum + m.completedSessions, 0),
      totalRevenue: clinicMetrics.reduce((sum, m) => sum + m.revenue, 0),
      avgOccupancy: clinicMetrics.length > 0
        ? Math.round(clinicMetrics.reduce((sum, m) => sum + m.occupancyRate, 0) / clinicMetrics.length)
        : 0,
    };
  }, [clinicMetrics]);

  const hourlyData = useMemo(() => {
    const allHours: Record<number, number> = {};
    clinicMetrics.forEach(clinic => {
      clinic.popularHours.forEach(h => {
        allHours[h.hour] = (allHours[h.hour] || 0) + h.count;
      });
    });

    return Object.entries(allHours)
      .map(([hour, count]) => ({
        hour: `${hour}:00`,
        sessões: count,
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  }, [clinicMetrics]);

  const revenueChartData = useMemo(() => {
    return clinicMetrics.map(m => ({
      name: m.clinicName,
      value: m.revenue,
      color: m.color,
    }));
  }, [clinicMetrics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Relatório de Ocupação por Clínica
          </h2>
          <p className="text-muted-foreground">
            Análise de desempenho e ocupação por local de atendimento
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sessões</p>
                <p className="text-2xl font-bold">{totalMetrics.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-full">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Realizadas</p>
                <p className="text-2xl font-bold">{totalMetrics.completedSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-full">
                <BarChart3 className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ocupação Média</p>
                <p className="text-2xl font-bold">{totalMetrics.avgOccupancy}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalMetrics.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clinic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clinicMetrics.map((clinic) => (
          <Card key={clinic.clinicId} className="relative overflow-hidden">
            <div 
              className="absolute top-0 left-0 w-1 h-full" 
              style={{ backgroundColor: clinic.color }}
            />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: clinic.color }}
                  />
                  {clinic.clinicName}
                </span>
                <Badge 
                  variant={clinic.occupancyRate >= 70 ? "default" : clinic.occupancyRate >= 40 ? "secondary" : "outline"}
                >
                  {clinic.occupancyRate}% ocupação
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sessões realizadas</span>
                  <span className="font-medium">{clinic.completedSessions} / {clinic.totalSessions}</span>
                </div>
                <Progress value={clinic.occupancyRate} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Receita</p>
                  <p className="font-semibold text-lg">{formatCurrency(clinic.revenue)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ticket Médio</p>
                  <p className="font-semibold text-lg">{formatCurrency(clinic.avgSessionValue)}</p>
                </div>
              </div>

              {clinic.popularHours.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Horários Populares</p>
                  <div className="flex flex-wrap gap-1">
                    {clinic.popularHours.slice(0, 3).map((h) => (
                      <Badge key={h.hour} variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {h.hour}:00 ({h.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horários Mais Procurados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sessões" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Clinic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Receita por Clínica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={revenueChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {revenueChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {clinicMetrics.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum dado de ocupação disponível para o período selecionado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
