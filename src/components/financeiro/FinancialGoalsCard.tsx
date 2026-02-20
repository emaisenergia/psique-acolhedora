import { useState, useMemo } from "react";
import { format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, TrendingUp, Calendar, AlertTriangle, CheckCircle, Edit2 } from "lucide-react";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";

interface FinancialGoalsCardProps {
  currentRevenue: number;
  currentSessions: number;
  selectedDate: Date;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const FinancialGoalsCard = ({ currentRevenue, currentSessions, selectedDate }: FinancialGoalsCardProps) => {
  const { goals, getGoalForMonth, upsertGoal } = useFinancialGoals();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [revenueGoal, setRevenueGoal] = useState("");
  const [sessionsGoal, setSessionsGoal] = useState("");

  const currentGoal = useMemo(() => getGoalForMonth(selectedDate), [getGoalForMonth, selectedDate]);

  const revenueProgress = useMemo(() => {
    if (!currentGoal || currentGoal.revenue_goal === 0) return 0;
    return Math.min(100, (currentRevenue / currentGoal.revenue_goal) * 100);
  }, [currentRevenue, currentGoal]);

  const sessionsProgress = useMemo(() => {
    if (!currentGoal || currentGoal.sessions_goal === 0) return 0;
    return Math.min(100, (currentSessions / currentGoal.sessions_goal) * 100);
  }, [currentSessions, currentGoal]);

  const handleSaveGoal = async () => {
    const monthKey = format(startOfMonth(selectedDate), "yyyy-MM-dd");
    await upsertGoal({
      month: monthKey,
      revenue_goal: parseFloat(revenueGoal) || 0,
      sessions_goal: parseInt(sessionsGoal) || 0,
    });
    setIsDialogOpen(false);
    setRevenueGoal("");
    setSessionsGoal("");
  };

  const openEditDialog = () => {
    if (currentGoal) {
      setRevenueGoal(currentGoal.revenue_goal.toString());
      setSessionsGoal(currentGoal.sessions_goal.toString());
    }
    setIsDialogOpen(true);
  };

  const getStatusIcon = (progress: number) => {
    if (progress >= 100) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (progress >= 70) return <TrendingUp className="h-4 w-4 text-blue-500" />;
    if (progress >= 40) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 70) return "bg-blue-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="card-glass overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Metas do Mês - {format(selectedDate, "MMMM/yyyy", { locale: ptBR })}
          </span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={openEditDialog}>
                <Edit2 className="h-4 w-4 mr-1" />
                {currentGoal ? "Editar" : "Definir Meta"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Definir Metas - {format(selectedDate, "MMMM/yyyy", { locale: ptBR })}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Meta de Faturamento (R$)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 10000"
                    value={revenueGoal}
                    onChange={(e) => setRevenueGoal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta de Sessões</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 50"
                    value={sessionsGoal}
                    onChange={(e) => setSessionsGoal(e.target.value)}
                  />
                </div>
                <Button onClick={handleSaveGoal} className="w-full">
                  Salvar Meta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentGoal ? (
          <div className="space-y-6">
            {/* Revenue Goal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  {getStatusIcon(revenueProgress)}
                  Faturamento
                </span>
                <span className="text-sm text-muted-foreground">
                  {currencyFormatter.format(currentRevenue)} / {currencyFormatter.format(currentGoal.revenue_goal)}
                </span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                <div 
                  className={`h-full transition-all ${getProgressColor(revenueProgress)}`}
                  style={{ width: `${revenueProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {revenueProgress.toFixed(0)}% da meta
                {revenueProgress >= 100 && " ✨ Meta atingida!"}
              </p>
            </div>

            {/* Sessions Goal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  {getStatusIcon(sessionsProgress)}
                  Sessões
                </span>
                <span className="text-sm text-muted-foreground">
                  {currentSessions} / {currentGoal.sessions_goal}
                </span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                <div 
                  className={`h-full transition-all ${getProgressColor(sessionsProgress)}`}
                  style={{ width: `${sessionsProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {sessionsProgress.toFixed(0)}% da meta
                {sessionsProgress >= 100 && " ✨ Meta atingida!"}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma meta definida para este mês</p>
            <p className="text-sm">Clique em "Definir Meta" para começar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
