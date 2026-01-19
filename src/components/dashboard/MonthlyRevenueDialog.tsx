import { Wallet, ChevronRight, TrendingUp, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatDetailDialog } from "./StatDetailDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  patient_id: string | null;
  date_time: string;
  status: string;
  payment_value?: number | null;
  payment_type?: string | null;
  service?: string | null;
}

interface MonthlyRevenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
  patientMap: Record<string, string>;
}

export function MonthlyRevenueDialog({
  open,
  onOpenChange,
  appointments,
  patientMap,
}: MonthlyRevenueDialogProps) {
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  
  const validAppointments = appointments.filter(a => a.status !== "cancelled");
  const paidAppointments = appointments.filter(a => a.status === "done");
  const pendingAppointments = appointments.filter(a => a.status !== "cancelled" && a.status !== "done");
  
  const totalRevenue = validAppointments.reduce((sum, a) => sum + (a.payment_value || 0), 0);
  const paidRevenue = paidAppointments.reduce((sum, a) => sum + (a.payment_value || 0), 0);
  const pendingRevenue = pendingAppointments.reduce((sum, a) => sum + (a.payment_value || 0), 0);
  const avgTicket = paidAppointments.length > 0 ? paidRevenue / paidAppointments.length : 0;

  return (
    <StatDetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Receita Mensal"
      description="Resumo financeiro do mês atual"
      icon={<Wallet className="w-5 h-5 text-primary-foreground" />}
      badge={
        <Badge variant="secondary" className="text-xs">
          {brl.format(totalRevenue)}
        </Badge>
      }
      footer={
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {paidAppointments.length} sessão(ões) concluída(s)
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/financeiro">
              Ver financeiro
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <div className="text-xs text-primary flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Receita Total
          </div>
          <div className="text-lg font-semibold">{brl.format(totalRevenue)}</div>
        </div>
        <div className="p-3 rounded-lg bg-muted">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            Ticket Médio
          </div>
          <div className="text-lg font-semibold">{brl.format(avgTicket)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="text-xs text-green-600 dark:text-green-400">Recebido</div>
          <div className="text-lg font-semibold">{brl.format(paidRevenue)}</div>
          <div className="text-xs text-muted-foreground">{paidAppointments.length} sessões</div>
        </div>
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="text-xs text-amber-600 dark:text-amber-400">A Receber</div>
          <div className="text-lg font-semibold">{brl.format(pendingRevenue)}</div>
          <div className="text-xs text-muted-foreground">{pendingAppointments.length} sessões</div>
        </div>
      </div>

      {/* Recent Paid Sessions */}
      <div className="text-sm font-medium mb-2">Sessões Recentes</div>
      {paidAppointments.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma sessão concluída este mês</p>
        </div>
      ) : (
        paidAppointments
          .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
          .slice(0, 5)
          .map((appt) => (
            <Link
              key={appt.id}
              to={`/admin/paciente/${appt.patient_id}`}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-sm font-medium">{patientMap[appt.patient_id || ""] || "Paciente"}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(appt.date_time), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    {appt.service && ` • ${appt.service}`}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                {appt.payment_value ? brl.format(appt.payment_value) : "—"}
              </div>
            </Link>
          ))
      )}
    </StatDetailDialog>
  );
}
