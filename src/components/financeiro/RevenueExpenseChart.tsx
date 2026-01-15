import { useMemo } from "react";
import { format, subMonths, parseISO } from "date-fns";
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
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { FinancialTransaction } from "@/hooks/useFinancialTransactions";

interface RevenueExpenseChartProps {
  transactions: FinancialTransaction[];
  appointments: Array<{
    date_time: string;
    status: string;
    payment_value?: number | null;
  }>;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const RevenueExpenseChart = ({ transactions, appointments }: RevenueExpenseChartProps) => {
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { month: string; revenue: number; expenses: number; profit: number }>();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = format(date, "yyyy-MM");
      const label = format(date, "MMM/yy", { locale: ptBR });
      monthMap.set(key, { month: label, revenue: 0, expenses: 0, profit: 0 });
    }
    
    // Add revenue from completed appointments
    appointments.filter(a => a.status === "done").forEach(apt => {
      if (!apt.date_time) return;
      const date = parseISO(apt.date_time);
      const key = format(date, "yyyy-MM");
      if (monthMap.has(key)) {
        const existing = monthMap.get(key)!;
        existing.revenue += apt.payment_value || 0;
      }
    });
    
    // Add revenue and expenses from transactions
    transactions.forEach(t => {
      const date = parseISO(t.transaction_date);
      const key = format(date, "yyyy-MM");
      if (monthMap.has(key)) {
        const existing = monthMap.get(key)!;
        if (t.type === "revenue") {
          existing.revenue += t.amount;
        } else {
          existing.expenses += t.amount;
        }
      }
    });
    
    // Calculate profit
    monthMap.forEach((value) => {
      value.profit = value.revenue - value.expenses;
    });
    
    return Array.from(monthMap.values());
  }, [transactions, appointments]);

  const totals = useMemo(() => {
    return monthlyData.reduce(
      (acc, month) => ({
        revenue: acc.revenue + month.revenue,
        expenses: acc.expenses + month.expenses,
        profit: acc.profit + month.profit,
      }),
      { revenue: 0, expenses: 0, profit: 0 }
    );
  }, [monthlyData]);

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            {totals.profit >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            Receitas vs Despesas (6 meses)
          </span>
          <div className="flex gap-4 text-sm font-normal">
            <span className="text-green-500">
              Receitas: {currencyFormatter.format(totals.revenue)}
            </span>
            <span className="text-red-500">
              Despesas: {currencyFormatter.format(totals.expenses)}
            </span>
            <span className={totals.profit >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
              Lucro: {currencyFormatter.format(totals.profit)}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                currencyFormatter.format(value),
                name === "revenue" ? "Receitas" : name === "expenses" ? "Despesas" : "Lucro"
              ]}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend 
              formatter={(value) => 
                value === "revenue" ? "Receitas" : value === "expenses" ? "Despesas" : "Lucro"
              }
            />
            <Bar 
              dataKey="revenue" 
              fill="hsl(142, 76%, 36%)" 
              radius={[4, 4, 0, 0]} 
              name="revenue"
            />
            <Bar 
              dataKey="expenses" 
              fill="hsl(0, 84%, 60%)" 
              radius={[4, 4, 0, 0]} 
              name="expenses"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
