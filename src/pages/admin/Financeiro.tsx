import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppointments } from "@/hooks/useAppointments";
import { useInsurances } from "@/hooks/useInsurances";
import { useSessionPackages } from "@/hooks/useSessionPackages";
import { usePatients } from "@/hooks/usePatients";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";
import TransactionFormDialog from "@/components/financeiro/TransactionFormDialog";
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
  Legend,
  LineChart,
  Line
} from "recharts";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Package, 
  Building2,
  Calendar,
  FileText,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2
} from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

const Financeiro = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const { appointments } = useAppointments();
  const { insurances } = useInsurances();
  const { packages } = useSessionPackages();
  const { transactions, deleteTransaction } = useFinancialTransactions();
  const { patients } = usePatients();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [defaultTransactionType, setDefaultTransactionType] = useState<"revenue" | "expense">("revenue");

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case "current":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last":
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case "last3":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "last6":
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case "year":
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [selectedPeriod]);

  // Filter appointments within date range
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      if (!apt.date_time) return false;
      const aptDate = parseISO(apt.date_time);
      return isWithinInterval(aptDate, { start: dateRange.start, end: dateRange.end });
    });
  }, [appointments, dateRange]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const completedAppointments = filteredAppointments.filter(a => a.status === "done");
    const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.payment_value || 0), 0);
    const packageRevenue = completedAppointments.filter(a => a.payment_type === "package").reduce((sum, apt) => sum + (apt.payment_value || 0), 0);
    const singleSessionRevenue = completedAppointments.filter(a => a.payment_type !== "package").reduce((sum, apt) => sum + (apt.payment_value || 0), 0);
    
    return {
      totalRevenue,
      completedSessions: completedAppointments.length,
      packageRevenue,
      singleSessionRevenue,
      averageSessionValue: completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0,
    };
  }, [filteredAppointments]);

  // Revenue by insurance
  const revenueByInsurance = useMemo(() => {
    const completedAppointments = filteredAppointments.filter(a => a.status === "done");
    const insuranceMap = new Map<string, { name: string; revenue: number; sessions: number }>();
    
    // Add "Particular" category
    insuranceMap.set("particular", { name: "Particular", revenue: 0, sessions: 0 });
    
    completedAppointments.forEach(apt => {
      const patient = patients.find(p => p.id === apt.patient_id);
      const insuranceId = patient?.insurance_id;
      
      if (insuranceId) {
        const insurance = insurances.find(i => i.id === insuranceId);
        const existing = insuranceMap.get(insuranceId) || { name: insurance?.name || "Convênio", revenue: 0, sessions: 0 };
        existing.revenue += apt.payment_value || 0;
        existing.sessions += 1;
        insuranceMap.set(insuranceId, existing);
      } else {
        const existing = insuranceMap.get("particular")!;
        existing.revenue += apt.payment_value || 0;
        existing.sessions += 1;
      }
    });
    
    return Array.from(insuranceMap.values()).filter(i => i.sessions > 0);
  }, [filteredAppointments, patients, insurances]);

  // Package usage data
  const packageUsageData = useMemo(() => {
    return packages.map(pkg => {
      const patient = patients.find(p => p.id === pkg.patient_id);
      const usagePercent = pkg.total_sessions > 0 ? (pkg.used_sessions / pkg.total_sessions) * 100 : 0;
      return {
        id: pkg.id,
        name: pkg.name,
        patientName: patient?.name || "Paciente",
        totalSessions: pkg.total_sessions,
        usedSessions: pkg.used_sessions,
        remaining: pkg.total_sessions - pkg.used_sessions,
        usagePercent: Math.round(usagePercent),
        price: pkg.price,
        status: pkg.status,
      };
    });
  }, [packages, patients]);

  // Sessions by month (for trend chart)
  const sessionsByMonth = useMemo(() => {
    const monthMap = new Map<string, { month: string; sessions: number; revenue: number }>();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = format(date, "yyyy-MM");
      const label = format(date, "MMM", { locale: ptBR });
      monthMap.set(key, { month: label, sessions: 0, revenue: 0 });
    }
    
    appointments.filter(a => a.status === "done").forEach(apt => {
      if (!apt.date_time) return;
      const date = parseISO(apt.date_time);
      const key = format(date, "yyyy-MM");
      if (monthMap.has(key)) {
        const existing = monthMap.get(key)!;
        existing.sessions += 1;
        existing.revenue += apt.payment_value || 0;
      }
    });
    
    return Array.from(monthMap.values());
  }, [appointments]);

  // Payment type distribution
  const paymentTypeData = useMemo(() => {
    const completed = filteredAppointments.filter(a => a.status === "done");
    const packageCount = completed.filter(a => a.payment_type === "package").length;
    const singleCount = completed.length - packageCount;
    
    return [
      { name: "Avulso", value: singleCount, revenue: kpis.singleSessionRevenue },
      { name: "Pacote", value: packageCount, revenue: kpis.packageRevenue },
    ].filter(d => d.value > 0);
  }, [filteredAppointments, kpis]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-light">Financeiro</h1>
            <p className="text-muted-foreground">Relatórios e controle financeiro</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDefaultTransactionType("expense");
                setShowTransactionForm(true);
              }}
              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
            >
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              Despesa
            </Button>
            <Button
              onClick={() => {
                setDefaultTransactionType("revenue");
                setShowTransactionForm(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Receita
            </Button>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Mês atual</SelectItem>
                <SelectItem value="last">Mês anterior</SelectItem>
                <SelectItem value="last3">Últimos 3 meses</SelectItem>
                <SelectItem value="last6">Últimos 6 meses</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{currencyFormatter.format(kpis.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {format(dateRange.start, "dd/MM", { locale: ptBR })} - {format(dateRange.end, "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessões Realizadas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.completedSessions}</div>
              <p className="text-xs text-muted-foreground">
                Média: {currencyFormatter.format(kpis.averageSessionValue)}/sessão
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita de Pacotes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currencyFormatter.format(kpis.packageRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {packages.filter(p => p.status === "active").length} pacotes ativos
              </p>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Avulsa</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currencyFormatter.format(kpis.singleSessionRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Sessões individuais
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different reports */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="transactions">Lançamentos</TabsTrigger>
            <TabsTrigger value="insurance">Por Convênio</TabsTrigger>
            <TabsTrigger value="packages">Pacotes</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue Trend */}
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Tendência de Faturamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={sessionsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip 
                        formatter={(value: number) => currencyFormatter.format(value)}
                        labelFormatter={(label) => `Mês: ${label}`}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                        name="Faturamento"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Payment Type Distribution */}
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Distribuição por Tipo de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={paymentTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentTypeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value} sessões (${currencyFormatter.format(props.payload.revenue)})`,
                          name
                        ]}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Sessions by Month Bar Chart */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Sessões por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sessionsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Sessões" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insurance Tab */}
          <TabsContent value="insurance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Faturamento por Convênio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueByInsurance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                      <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                      <Tooltip 
                        formatter={(value: number) => currencyFormatter.format(value)}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Faturamento" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Detalhamento por Convênio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Convênio</TableHead>
                        <TableHead className="text-right">Sessões</TableHead>
                        <TableHead className="text-right">Faturamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueByInsurance.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">{item.sessions}</TableCell>
                          <TableCell className="text-right">{currencyFormatter.format(item.revenue)}</TableCell>
                        </TableRow>
                      ))}
                      {revenueByInsurance.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nenhuma sessão realizada no período
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-4">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Status dos Pacotes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pacote</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead className="text-center">Utilizadas</TableHead>
                      <TableHead className="text-center">Restantes</TableHead>
                      <TableHead className="text-center">Uso</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packageUsageData.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.name}</TableCell>
                        <TableCell>{pkg.patientName}</TableCell>
                        <TableCell className="text-center">{pkg.usedSessions}</TableCell>
                        <TableCell className="text-center">{pkg.remaining}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all" 
                                style={{ width: `${pkg.usagePercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10">{pkg.usagePercent}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{currencyFormatter.format(pkg.price)}</TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={pkg.status === "active" ? "default" : pkg.status === "exhausted" ? "secondary" : "outline"}
                          >
                            {pkg.status === "active" ? "Ativo" : pkg.status === "exhausted" ? "Esgotado" : "Expirado"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {packageUsageData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhum pacote cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Sessões Realizadas no Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Tipo Pagamento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments
                      .filter(a => a.status === "done")
                      .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
                      .map((apt) => {
                        const patient = patients.find(p => p.id === apt.patient_id);
                        return (
                          <TableRow key={apt.id}>
                            <TableCell>
                              {format(parseISO(apt.date_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="font-medium">{patient?.name || "Paciente"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {apt.mode === "online" ? "Online" : "Presencial"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {apt.payment_type === "package" ? "Pacote" : "Avulso"}
                            </TableCell>
                            <TableCell className="text-right">
                              {currencyFormatter.format(apt.payment_value || 0)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="default">Realizada</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {filteredAppointments.filter(a => a.status === "done").length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhuma sessão realizada no período
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Lançamentos Financeiros
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDefaultTransactionType("expense");
                        setShowTransactionForm(true);
                      }}
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Despesa
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setDefaultTransactionType("revenue");
                        setShowTransactionForm(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Receita
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Paciente/Categoria</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions
                      .filter(t => {
                        const tDate = parseISO(t.transaction_date);
                        return isWithinInterval(tDate, { start: dateRange.start, end: dateRange.end });
                      })
                      .map((t) => {
                        const patient = t.patient_id ? patients.find(p => p.id === t.patient_id) : null;
                        return (
                          <TableRow key={t.id}>
                            <TableCell>
                              {format(parseISO(t.transaction_date), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={t.type === "revenue" ? "default" : "destructive"}
                                className={t.type === "revenue" ? "bg-green-600" : ""}
                              >
                                {t.type === "revenue" ? (
                                  <><ArrowUpCircle className="h-3 w-3 mr-1" /> Receita</>
                                ) : (
                                  <><ArrowDownCircle className="h-3 w-3 mr-1" /> Despesa</>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {t.description || "-"}
                            </TableCell>
                            <TableCell>
                              {t.type === "revenue" ? (
                                patient?.name || t.clinic || "-"
                              ) : (
                                t.category || "-"
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{t.payment_method || "-"}</Badge>
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${t.type === "revenue" ? "text-green-600" : "text-red-500"}`}>
                              {t.type === "expense" ? "-" : "+"}{currencyFormatter.format(t.amount)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteTransaction(t.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {transactions.filter(t => {
                      const tDate = parseISO(t.transaction_date);
                      return isWithinInterval(tDate, { start: dateRange.start, end: dateRange.end });
                    }).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nenhum lançamento no período selecionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Transaction Form Dialog */}
        <TransactionFormDialog
          open={showTransactionForm}
          onOpenChange={setShowTransactionForm}
          defaultType={defaultTransactionType}
        />
      </div>
    </AdminLayout>
  );
};

export default Financeiro;
