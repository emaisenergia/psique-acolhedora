import { useMemo } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Mail, Phone } from "lucide-react";
import * as XLSX from "xlsx";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface Appointment {
  id: string;
  patient_id: string;
  date_time: string;
  status: string;
  payment_value?: number | null;
  payment_type?: string | null;
}

interface DelinquencyReportProps {
  appointments: Appointment[];
  patients: Patient[];
}

interface DelinquentPatient {
  patient: Patient;
  pendingSessions: number;
  pendingAmount: number;
  oldestPendingDate: Date;
  daysPending: number;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const DelinquencyReport = ({ appointments, patients }: DelinquencyReportProps) => {
  const delinquentPatients = useMemo(() => {
    const patientPendingMap = new Map<string, DelinquentPatient>();
    
    // Find completed appointments without payment or marked as pending
    appointments
      .filter(apt => 
        apt.status === "done" && 
        (!apt.payment_value || apt.payment_value === 0) &&
        apt.payment_type !== "package" // Exclude package sessions (already paid)
      )
      .forEach(apt => {
        const patient = patients.find(p => p.id === apt.patient_id);
        if (!patient) return;
        
        const aptDate = parseISO(apt.date_time);
        const daysPending = differenceInDays(new Date(), aptDate);
        
        if (patientPendingMap.has(patient.id)) {
          const existing = patientPendingMap.get(patient.id)!;
          existing.pendingSessions += 1;
          existing.pendingAmount += 150; // Valor médio estimado por sessão
          if (aptDate < existing.oldestPendingDate) {
            existing.oldestPendingDate = aptDate;
            existing.daysPending = daysPending;
          }
        } else {
          patientPendingMap.set(patient.id, {
            patient,
            pendingSessions: 1,
            pendingAmount: 150, // Valor médio estimado
            oldestPendingDate: aptDate,
            daysPending,
          });
        }
      });
    
    return Array.from(patientPendingMap.values())
      .sort((a, b) => b.daysPending - a.daysPending);
  }, [appointments, patients]);

  const totalPending = useMemo(() => {
    return delinquentPatients.reduce((sum, dp) => sum + dp.pendingAmount, 0);
  }, [delinquentPatients]);

  const exportToExcel = () => {
    const data = delinquentPatients.map(dp => ({
      "Paciente": dp.patient.name,
      "E-mail": dp.patient.email,
      "Telefone": dp.patient.phone || "-",
      "Sessões Pendentes": dp.pendingSessions,
      "Valor Estimado": dp.pendingAmount,
      "Desde": format(dp.oldestPendingDate, "dd/MM/yyyy"),
      "Dias em Atraso": dp.daysPending,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inadimplência");
    XLSX.writeFile(wb, `inadimplencia_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const getSeverityBadge = (days: number) => {
    if (days > 60) {
      return <Badge variant="destructive">Crítico ({days} dias)</Badge>;
    } else if (days > 30) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">Alto ({days} dias)</Badge>;
    } else if (days > 15) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Médio ({days} dias)</Badge>;
    }
    return <Badge variant="secondary">{days} dias</Badge>;
  };

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Relatório de Inadimplência
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm font-normal text-muted-foreground">
              Total pendente: <strong className="text-destructive">{currencyFormatter.format(totalPending)}</strong>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={exportToExcel}
              disabled={delinquentPatients.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {delinquentPatients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma inadimplência encontrada</p>
            <p className="text-sm">Todos os pagamentos estão em dia.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-center">Sessões Pendentes</TableHead>
                <TableHead className="text-right">Valor Estimado</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delinquentPatients.map((dp) => (
                <TableRow key={dp.patient.id}>
                  <TableCell className="font-medium">{dp.patient.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <a 
                        href={`mailto:${dp.patient.email}`}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {dp.patient.email}
                      </a>
                      {dp.patient.phone && (
                        <a 
                          href={`tel:${dp.patient.phone}`}
                          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Phone className="h-3 w-3" />
                          {dp.patient.phone}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{dp.pendingSessions}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-destructive">
                    {currencyFormatter.format(dp.pendingAmount)}
                  </TableCell>
                  <TableCell>
                    {format(dp.oldestPendingDate, "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-center">
                    {getSeverityBadge(dp.daysPending)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {delinquentPatients.length > 0 && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> O valor estimado é calculado com base em um valor médio de sessão de R$ 150,00. 
              Ajuste conforme necessário para refletir os valores reais acordados com cada paciente.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
