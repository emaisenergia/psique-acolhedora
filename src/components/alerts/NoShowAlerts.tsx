import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronRight, Phone, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { subDays } from "date-fns";
import type { PatientRow } from "@/hooks/usePatients";

interface Appointment {
  id: string;
  patient_id: string | null;
  status: string;
  date_time: string;
}

interface NoShowAlertsProps {
  appointments: Appointment[];
  patients: PatientRow[];
  maxAlerts?: number;
}

interface PatientNoShowStats {
  patient: PatientRow;
  noShowCount: number;
  totalAppointments: number;
  noShowRate: number;
  lastNoShow: string | null;
}

export const NoShowAlerts = ({ appointments, patients, maxAlerts = 5 }: NoShowAlertsProps) => {
  const noShowStats = useMemo(() => {
    const horizon = subDays(new Date(), 90);
    
    // Group appointments by patient in the last 90 days
    const patientStats = new Map<string, { noShows: number; total: number; lastNoShow: string | null }>();
    
    appointments.forEach((appt) => {
      if (!appt.patient_id) return;
      const apptDate = new Date(appt.date_time);
      if (apptDate < horizon) return;
      
      const stats = patientStats.get(appt.patient_id) || { noShows: 0, total: 0, lastNoShow: null };
      
      if (appt.status !== "cancelled") {
        stats.total++;
      }
      
      // Consider "no_show" status or similar patterns
      if (appt.status === "no_show" || appt.status === "noshow" || appt.status === "faltou") {
        stats.noShows++;
        if (!stats.lastNoShow || new Date(appt.date_time) > new Date(stats.lastNoShow)) {
          stats.lastNoShow = appt.date_time;
        }
      }
      
      patientStats.set(appt.patient_id, stats);
    });
    
    // Calculate no-show rate and filter patients with > 30% rate
    const patientsWithHighNoShow: PatientNoShowStats[] = [];
    
    patientStats.forEach((stats, patientId) => {
      if (stats.total < 3) return; // Need at least 3 appointments to be meaningful
      
      const noShowRate = (stats.noShows / stats.total) * 100;
      if (noShowRate >= 30) {
        const patient = patients.find((p) => p.id === patientId);
        if (patient && patient.status === "active") {
          patientsWithHighNoShow.push({
            patient,
            noShowCount: stats.noShows,
            totalAppointments: stats.total,
            noShowRate,
            lastNoShow: stats.lastNoShow,
          });
        }
      }
    });
    
    // Sort by no-show rate descending
    return patientsWithHighNoShow.sort((a, b) => b.noShowRate - a.noShowRate);
  }, [appointments, patients]);

  if (noShowStats.length === 0) {
    return null;
  }

  return (
    <Card className="card-glass border-rose-200/50 bg-gradient-to-br from-rose-50/30 to-red-50/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-red-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Pacientes com Faltas Frequentes</h2>
              <p className="text-xs text-muted-foreground">Taxa de faltas acima de 30% nos últimos 90 dias</p>
            </div>
          </div>
          <Badge variant="destructive" className="text-xs">
            {noShowStats.length} alerta{noShowStats.length > 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="space-y-2">
          {noShowStats.slice(0, maxAlerts).map((stat) => (
            <div
              key={stat.patient.id}
              className="flex items-center justify-between p-3 rounded-lg bg-card/80 border border-rose-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-red-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  {stat.patient.name?.charAt(0) || "P"}
                </div>
                <div>
                  <div className="font-medium text-sm">{stat.patient.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="text-rose-600 font-medium">
                      {stat.noShowCount}/{stat.totalAppointments} faltas ({Math.round(stat.noShowRate)}%)
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {stat.patient.phone && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => {
                      const phone = stat.patient.phone?.replace(/\D/g, "");
                      window.open(`https://wa.me/55${phone}`, "_blank");
                    }}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                )}
                <Link to={`/admin/paciente/${stat.patient.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span className="text-xs">Ver perfil</span>
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {noShowStats.length > maxAlerts && (
          <div className="mt-3 text-center">
            <span className="text-xs text-muted-foreground">
              E mais {noShowStats.length - maxAlerts} paciente(s) com faltas frequentes
            </span>
          </div>
        )}

        <div className="mt-4 p-3 rounded-lg bg-rose-50/50 border border-rose-100">
          <p className="text-xs text-rose-700">
            💡 <strong>Dica:</strong> Considere entrar em contato com estes pacientes para entender as dificuldades e 
            reavaliar horários ou modalidade de atendimento (presencial/online).
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
