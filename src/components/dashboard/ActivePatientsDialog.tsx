import { useMemo } from "react";
import { Users, ChevronRight, Calendar } from "lucide-react";
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
}

interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
}

interface ActivePatientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
  patients: Patient[];
}

export function ActivePatientsDialog({
  open,
  onOpenChange,
  appointments,
  patients,
}: ActivePatientsDialogProps) {
  const activePatientsData = useMemo(() => {
    const patientSessions = new Map<string, { count: number; lastDate: string }>();
    
    appointments
      .filter(a => a.status !== "cancelled" && a.patient_id)
      .forEach(a => {
        const existing = patientSessions.get(a.patient_id!) || { count: 0, lastDate: "" };
        patientSessions.set(a.patient_id!, {
          count: existing.count + 1,
          lastDate: !existing.lastDate || a.date_time > existing.lastDate ? a.date_time : existing.lastDate
        });
      });
    
    const patientMap = Object.fromEntries(patients.map(p => [p.id, p]));
    
    return Array.from(patientSessions.entries())
      .map(([id, data]) => ({
        id,
        patient: patientMap[id],
        ...data
      }))
      .filter(p => p.patient)
      .sort((a, b) => b.count - a.count);
  }, [appointments, patients]);

  return (
    <StatDetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Pacientes Ativos"
      description="Pacientes com sessões agendadas ou realizadas este mês"
      icon={<Users className="w-5 h-5 text-primary-foreground" />}
      badge={
        <Badge variant="secondary" className="text-xs">
          {activePatientsData.length}
        </Badge>
      }
      footer={
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {Math.min(10, activePatientsData.length)} de {activePatientsData.length} pacientes
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/pacientes">
              Ver todos
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      }
    >
      {activePatientsData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum paciente ativo este mês</p>
        </div>
      ) : (
        activePatientsData.slice(0, 10).map(({ id, patient, count, lastDate }) => (
          <Link
            key={id}
            to={`/admin/paciente/${id}`}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center text-primary-foreground font-semibold">
                {patient.name?.charAt(0) || "P"}
              </div>
              <div>
                <div className="font-medium">{patient.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {count} sessão(ões) • Última: {format(new Date(lastDate), "dd/MM", { locale: ptBR })}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        ))
      )}
    </StatDetailDialog>
  );
}
