import { CheckCircle2, ChevronRight, FileText, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatDetailDialog } from "./StatDetailDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  patient_id: string | null;
  date_time: string;
  status: string;
  payment_value?: number | null;
  service?: string | null;
}

interface PendingSession {
  appointmentId: string;
  patientId: string | null;
  patientName: string;
  dateTime: string;
  sessionId?: string;
}

interface CompletedSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
  patientMap: Record<string, string>;
  pendingSessions?: PendingSession[];
}

export function CompletedSessionsDialog({
  open,
  onOpenChange,
  appointments,
  patientMap,
  pendingSessions = [],
}: CompletedSessionsDialogProps) {
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  
  const completedAppointments = appointments.filter(a => a.status === "done");
  const totalValue = completedAppointments.reduce((sum, a) => sum + (a.payment_value || 0), 0);
  
  // Check which appointments have pending notes
  const pendingIds = new Set(pendingSessions.map(p => p.appointmentId));

  return (
    <StatDetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sessões Concluídas"
      description="Sessões realizadas este mês"
      icon={<CheckCircle2 className="w-5 h-5 text-primary-foreground" />}
      badge={
        <Badge variant="secondary" className="text-xs">
          {completedAppointments.length}
        </Badge>
      }
      footer={
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{brl.format(totalValue)}</span>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/prontuarios">
              Ver prontuários
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      }
    >
      {pendingSessions.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {pendingSessions.length} sessão(ões) sem anotações
            </span>
          </div>
        </div>
      )}

      {completedAppointments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma sessão concluída este mês</p>
        </div>
      ) : (
        completedAppointments
          .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
          .slice(0, 10)
          .map((appt) => {
            const hasPendingNotes = pendingIds.has(appt.id);
            
            return (
              <Link
                key={appt.id}
                to={`/admin/paciente/${appt.patient_id}?tab=sessoes&appointment=${appt.id}`}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg transition-colors",
                  hasPendingNotes 
                    ? "bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30" 
                    : "bg-muted/40 hover:bg-muted/60"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    hasPendingNotes ? "bg-amber-500/20" : "bg-green-500/20"
                  )}>
                    {hasPendingNotes ? (
                      <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium flex items-center gap-2">
                      {patientMap[appt.patient_id || ""] || "Paciente"}
                      {hasPendingNotes && (
                        <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400 border-amber-500/50">
                          Sem anotações
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(appt.date_time), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      {appt.service && ` • ${appt.service}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {appt.payment_value ? brl.format(appt.payment_value) : "—"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })
      )}
    </StatDetailDialog>
  );
}
