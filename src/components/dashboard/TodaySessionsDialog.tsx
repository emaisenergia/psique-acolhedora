import { CalendarDays, Clock, User, MapPin, Video, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatDetailDialog } from "./StatDetailDialog";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  patient_id: string | null;
  date_time: string;
  status: string;
  service?: string | null;
  mode?: string | null;
  payment_value?: number | null;
}

interface TodaySessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
  patientMap: Record<string, string>;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Agendado", variant: "outline" },
  confirmed: { label: "Confirmado", variant: "default" },
  done: { label: "Concluído", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  rescheduled: { label: "Remarcado", variant: "outline" },
};

export function TodaySessionsDialog({
  open,
  onOpenChange,
  appointments,
  patientMap,
}: TodaySessionsDialogProps) {
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  
  const validAppointments = appointments.filter(a => a.status !== "cancelled");
  const totalValue = validAppointments.reduce((sum, a) => sum + (a.payment_value || 0), 0);

  return (
    <StatDetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sessões de Hoje"
      description={`${appointments.length} sessão(ões) programada(s) para hoje`}
      icon={<CalendarDays className="w-5 h-5 text-primary-foreground" />}
      badge={
        <Badge variant="secondary" className="text-xs">
          {validAppointments.length} ativa(s)
        </Badge>
      }
      footer={
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Total previsto: <span className="font-semibold text-foreground">{brl.format(totalValue)}</span>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/agendamentos">
              Ver agenda completa
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      }
    >
      {appointments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma sessão programada para hoje</p>
        </div>
      ) : (
        appointments.map((appt) => {
          const status = statusConfig[appt.status] || { label: appt.status, variant: "outline" as const };
          const time = new Date(appt.date_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          
          return (
            <Link
              key={appt.id}
              to={`/admin/paciente/${appt.patient_id}`}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg transition-colors",
                "bg-muted/40 hover:bg-muted/60",
                appt.status === "cancelled" && "opacity-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center text-primary-foreground font-semibold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {patientMap[appt.patient_id || ""] || "Paciente"}
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{time}</span>
                    {appt.service && <span>• {appt.service}</span>}
                    {appt.mode && (
                      <span className="flex items-center gap-1">
                        • {appt.mode === "online" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        {appt.mode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {appt.payment_value ? brl.format(appt.payment_value) : "—"}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>
            </Link>
          );
        })
      )}
    </StatDetailDialog>
  );
}
