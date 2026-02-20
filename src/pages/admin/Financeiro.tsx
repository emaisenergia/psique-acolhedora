import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import TransactionFormDialog from "@/components/financeiro/TransactionFormDialog";
import { RevenueExpenseChart } from "@/components/financeiro/RevenueExpenseChart";
import { DelinquencyReport } from "@/components/financeiro/DelinquencyReport";
import { FinancialGoalsCard } from "@/components/financeiro/FinancialGoalsCard";
import { RecurringTransactionsManager } from "@/components/financeiro/RecurringTransactionsManager";
import { DateRangePicker } from "@/components/financeiro/DateRangePicker";
import { RevenueProjectionChart, WeekdayAnalysisChart, OccupancyRateCard, YearOverYearComparison } from "@/components/financeiro/AdvancedAnalytics";
import { exportTransactionsToExcel, exportSessionsToExcel, exportFinancialSummaryToExcel } from "@/lib/exportFinanceiro";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { DollarSign, TrendingUp, Package, Calendar, FileText, Plus, ArrowUpCircle, ArrowDownCircle, Trash2, Download, Search, Filter, AlertTriangle, RefreshCcw, CheckCircle2 } from "lucide-react";
import { useFinancialData } from "@/hooks/useFinancialData";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];
const EXPENSE_CATEGORIES = ["Aluguel", "Materiais", "Supervisão", "Cursos/Formação", "Marketing", "Software/Assinaturas", "Impostos", "Outros"];

const Financeiro = () => {
  const {
    selectedPeriod, setSelectedPeriod, setCustomDateRange,
    appointments, packages, transactions, patients,
    deleteTransaction, updateTransaction,
    filterType, setFilterType, filterCategory, setFilterCategory,
    filterPatient, setFilterPatient, searchTerm, setSearchTerm,
    patientMap, dateRange, handleCustomDateRange,
    filteredAppointments, kpis, revenueByInsurance,
    packageUsageData, sessionsByMonth, paymentTypeData,
    filteredTransactions, totalExpensesInRange,
  } = useFinancialData();

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [defaultTransactionType, setDefaultTransactionType] = useState<"revenue" | "expense">("revenue");

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
            <Button variant="outline" onClick={() => { setDefaultTransactionType("expense"); setShowTransactionForm(true); }} className="border-red-500/50 text-red-500 hover:bg-red-500/10"><ArrowDownCircle className="h-4 w-4 mr-2" />Despesa</Button>
            <Button onClick={() => { setDefaultTransactionType("revenue"); setShowTransactionForm(true); }} className="bg-green-600 hover:bg-green-700"><ArrowUpCircle className="h-4 w-4 mr-2" />Receita</Button>
            <Select value={selectedPeriod} onValueChange={(v) => { setSelectedPeriod(v); setCustomDateRange(null); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Selecione o período" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Mês atual</SelectItem>
                <SelectItem value="last">Mês anterior</SelectItem>
                <SelectItem value="last3">Últimos 3 meses</SelectItem>
                <SelectItem value="last6">Últimos 6 meses</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
                {selectedPeriod === "custom" && <SelectItem value="custom">Personalizado</SelectItem>}
              </SelectContent>
            </Select>
            <DateRangePicker dateRange={dateRange} onDateRangeChange={handleCustomDateRange} />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-glass"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Faturamento Total</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{currencyFormatter.format(kpis.totalRevenue)}</div><p className="text-xs text-muted-foreground">{format(dateRange.start, "dd/MM", { locale: ptBR })} - {format(dateRange.end, "dd/MM/yyyy", { locale: ptBR })}</p></CardContent></Card>
          <Card className="card-glass"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Sessões Realizadas</CardTitle><Calendar className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{kpis.completedSessions}</div><p className="text-xs text-muted-foreground">Média: {currencyFormatter.format(kpis.averageSessionValue)}/sessão</p></CardContent></Card>
          <Card className="card-glass"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Receita de Pacotes</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{currencyFormatter.format(kpis.packageRevenue)}</div><p className="text-xs text-muted-foreground">{packages.filter(p => p.status === "active").length} pacotes ativos</p></CardContent></Card>
          <Card className="card-glass"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Receita Avulsa</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{currencyFormatter.format(kpis.singleSessionRevenue)}</div><p className="text-xs text-muted-foreground">Sessões individuais</p></CardContent></Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
            <TabsTrigger value="transactions">Lançamentos</TabsTrigger>
            <TabsTrigger value="recurring"><RefreshCcw className="h-3 w-3 mr-1" />Recorrentes</TabsTrigger>
            <TabsTrigger value="delinquency" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Inadimplência</TabsTrigger>
            <TabsTrigger value="packages">Pacotes</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => exportFinancialSummaryToExcel({ period: `${format(dateRange.start, "dd/MM/yyyy")} - ${format(dateRange.end, "dd/MM/yyyy")}`, totalRevenue: kpis.totalRevenue, totalExpenses: totalExpensesInRange, netProfit: kpis.totalRevenue - totalExpensesInRange, completedSessions: kpis.completedSessions, averageSessionValue: kpis.averageSessionValue, revenueByInsurance, packageUsage: packageUsageData.map(p => ({ name: p.name, patientName: p.patientName, usedSessions: p.usedSessions, totalSessions: p.totalSessions, price: p.price })) })}>
                <Download className="h-4 w-4 mr-2" />Exportar Resumo Completo
              </Button>
            </div>
            <FinancialGoalsCard currentRevenue={kpis.totalRevenue} currentSessions={kpis.completedSessions} selectedDate={dateRange.start} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="card-glass">
                <CardHeader><CardTitle className="text-lg font-medium flex items-center gap-2"><TrendingUp className="h-5 w-5" />Tendência de Faturamento</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={sessionsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip formatter={(value: number) => currencyFormatter.format(value)} labelFormatter={(label) => `Mês: ${label}`} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} name="Faturamento" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="card-glass">
                <CardHeader><CardTitle className="text-lg font-medium flex items-center gap-2"><FileText className="h-5 w-5" />Distribuição por Tipo de Pagamento</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={paymentTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {paymentTypeData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string, props: any) => [`${value} sessões (${currencyFormatter.format(props.payload.revenue)})`, name]} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <RevenueExpenseChart transactions={transactions} appointments={appointments} />
            <Card className="card-glass">
              <CardHeader><CardTitle className="text-lg font-medium flex items-center gap-2"><Calendar className="h-5 w-5" />Sessões por Mês</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sessionsByMonth}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} /><Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Sessões" /></BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <OccupancyRateCard appointments={appointments} />
              <div className="lg:col-span-2"><WeekdayAnalysisChart appointments={appointments} /></div>
            </div>
            <RevenueProjectionChart appointments={appointments} />
            <YearOverYearComparison appointments={appointments} />
          </TabsContent>

          <TabsContent value="recurring" className="space-y-4"><RecurringTransactionsManager /></TabsContent>
          <TabsContent value="delinquency" className="space-y-4"><DelinquencyReport appointments={appointments} patients={patients} /></TabsContent>

          {/* Packages */}
          <TabsContent value="packages" className="space-y-4">
            <Card className="card-glass">
              <CardHeader><CardTitle className="text-lg font-medium flex items-center gap-2"><Package className="h-5 w-5" />Status dos Pacotes</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Pacote</TableHead><TableHead>Paciente</TableHead><TableHead className="text-center">Utilizadas</TableHead><TableHead className="text-center">Restantes</TableHead><TableHead className="text-center">Uso</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {packageUsageData.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.name}</TableCell>
                        <TableCell>{pkg.patientName}</TableCell>
                        <TableCell className="text-center">{pkg.usedSessions}</TableCell>
                        <TableCell className="text-center">{pkg.remaining}</TableCell>
                        <TableCell className="text-center"><div className="flex items-center gap-2"><div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pkg.usagePercent}%` }} /></div><span className="text-xs text-muted-foreground w-10">{pkg.usagePercent}%</span></div></TableCell>
                        <TableCell className="text-right">{currencyFormatter.format(pkg.price)}</TableCell>
                        <TableCell className="text-center"><Badge variant={pkg.status === "active" ? "default" : pkg.status === "exhausted" ? "secondary" : "outline"}>{pkg.status === "active" ? "Ativo" : pkg.status === "exhausted" ? "Esgotado" : "Expirado"}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {packageUsageData.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum pacote cadastrado</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions */}
          <TabsContent value="sessions" className="space-y-4">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2"><Calendar className="h-5 w-5" />Sessões Realizadas no Período</span>
                  <Button size="sm" variant="outline" onClick={() => exportSessionsToExcel(filteredAppointments.filter(a => a.status === "done"), patientMap, "sessoes")}><Download className="h-4 w-4 mr-1" />Exportar Excel</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Paciente</TableHead><TableHead>Modalidade</TableHead><TableHead>Tipo Pagamento</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredAppointments.filter(a => a.status === "done").sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()).map((apt) => {
                      const patient = patients.find(p => p.id === apt.patient_id);
                      return (
                        <TableRow key={apt.id}>
                          <TableCell>{format(parseISO(apt.date_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                          <TableCell className="font-medium">{patient?.name || "Paciente"}</TableCell>
                          <TableCell><Badge variant="outline">{apt.mode === "online" ? "Online" : "Presencial"}</Badge></TableCell>
                          <TableCell>{apt.payment_type === "package" ? "Pacote" : "Avulso"}</TableCell>
                          <TableCell className="text-right">{currencyFormatter.format(apt.payment_value || 0)}</TableCell>
                          <TableCell className="text-center"><Badge variant="default">Realizada</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredAppointments.filter(a => a.status === "done").length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma sessão realizada no período</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions" className="space-y-4">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2"><FileText className="h-5 w-5" />Lançamentos Financeiros</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => exportTransactionsToExcel(filteredTransactions, patientMap, "lancamentos")}><Download className="h-4 w-4 mr-1" />Excel</Button>
                    <Button size="sm" variant="outline" onClick={() => { setDefaultTransactionType("expense"); setShowTransactionForm(true); }} className="border-red-500/50 text-red-500 hover:bg-red-500/10"><Plus className="h-4 w-4 mr-1" />Despesa</Button>
                    <Button size="sm" onClick={() => { setDefaultTransactionType("revenue"); setShowTransactionForm(true); }} className="bg-green-600 hover:bg-green-700"><Plus className="h-4 w-4 mr-1" />Receita</Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Filtros:</span></div>
                  <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div>
                  <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="revenue">Receitas</SelectItem><SelectItem value="expense">Despesas</SelectItem></SelectContent></Select>
                  <Select value={filterCategory} onValueChange={setFilterCategory}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger><SelectContent><SelectItem value="all">Todas categorias</SelectItem>{EXPENSE_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select>
                  <Select value={filterPatient} onValueChange={setFilterPatient}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Paciente" /></SelectTrigger><SelectContent><SelectItem value="all">Todos pacientes</SelectItem>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                  {(filterType !== "all" || filterCategory !== "all" || filterPatient !== "all" || searchTerm) && <Button variant="ghost" size="sm" onClick={() => { setFilterType("all"); setFilterCategory("all"); setFilterPatient("all"); setSearchTerm(""); }}>Limpar filtros</Button>}
                </div>

                <Table>
                  <TableHeader><TableRow><TableHead className="w-10"><CheckCircle2 className="h-4 w-4" /></TableHead><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead><TableHead>Paciente/Categoria</TableHead><TableHead>Pagamento</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-center">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredTransactions.map((t) => {
                      const patient = t.patient_id ? patients.find(p => p.id === t.patient_id) : null;
                      return (
                        <TableRow key={t.id} className={t.is_confirmed ? "bg-green-500/5" : ""}>
                          <TableCell><Checkbox checked={t.is_confirmed} onCheckedChange={(checked) => updateTransaction(t.id, { is_confirmed: !!checked })} title="Marcar como confirmado no extrato bancário" /></TableCell>
                          <TableCell>{format(parseISO(t.transaction_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                          <TableCell><Badge variant={t.type === "revenue" ? "default" : "destructive"} className={t.type === "revenue" ? "bg-green-600" : ""}>{t.type === "revenue" ? <><ArrowUpCircle className="h-3 w-3 mr-1" /> Receita</> : <><ArrowDownCircle className="h-3 w-3 mr-1" /> Despesa</>}</Badge></TableCell>
                          <TableCell className="font-medium">{t.description || "-"}</TableCell>
                          <TableCell>{t.type === "revenue" ? (patient?.name || t.clinic || "-") : (t.category || "-")}</TableCell>
                          <TableCell><Badge variant="outline">{t.payment_method || "-"}</Badge></TableCell>
                          <TableCell className={`text-right font-semibold ${t.type === "revenue" ? "text-green-600" : "text-red-500"}`}>{t.type === "expense" ? "-" : "+"}{currencyFormatter.format(t.amount)}</TableCell>
                          <TableCell className="text-center"><Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredTransactions.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum lançamento encontrado</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <TransactionFormDialog open={showTransactionForm} onOpenChange={setShowTransactionForm} defaultType={defaultTransactionType} />
      </div>
    </AdminLayout>
  );
};

export default Financeiro;
