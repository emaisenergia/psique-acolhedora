import { useMemo } from "react";
import { format, parseISO, differenceInDays, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSessionPackages } from "@/hooks/useSessionPackages";
import { usePatients } from "@/hooks/usePatients";
import { AlertTriangle, Clock, Package, User } from "lucide-react";

interface PackageAlert {
  id: string;
  packageName: string;
  patientName: string;
  patientId: string;
  type: "expiring" | "low_sessions" | "expired";
  message: string;
  daysUntilExpiry?: number;
  remainingSessions?: number;
  severity: "warning" | "error";
}

interface PackageAlertsProps {
  showCard?: boolean;
  maxAlerts?: number;
}

const PackageAlerts = ({ showCard = true, maxAlerts }: PackageAlertsProps) => {
  const { packages } = useSessionPackages();
  const { patients } = usePatients();

  const alerts = useMemo(() => {
    const alertsList: PackageAlert[] = [];

    packages
      .filter(pkg => pkg.status === "active")
      .forEach(pkg => {
        const patient = patients.find(p => p.id === pkg.patient_id);
        const patientName = patient?.name || "Paciente";
        const remainingSessions = pkg.total_sessions - pkg.used_sessions;

        // Check for expired packages
        if (pkg.expiry_date) {
          const expiryDate = parseISO(pkg.expiry_date);
          
          if (isPast(expiryDate)) {
            alertsList.push({
              id: `${pkg.id}-expired`,
              packageName: pkg.name,
              patientName,
              patientId: pkg.patient_id,
              type: "expired",
              message: `Pacote expirado em ${format(expiryDate, "dd/MM/yyyy", { locale: ptBR })}`,
              severity: "error",
            });
            return; // Skip other checks for expired packages
          }

          const daysUntil = differenceInDays(expiryDate, new Date());
          
          // Alert if expiring within 14 days
          if (daysUntil <= 14 && daysUntil > 0) {
            alertsList.push({
              id: `${pkg.id}-expiring`,
              packageName: pkg.name,
              patientName,
              patientId: pkg.patient_id,
              type: "expiring",
              message: daysUntil === 1 
                ? "Expira amanhã!" 
                : `Expira em ${daysUntil} dias`,
              daysUntilExpiry: daysUntil,
              severity: daysUntil <= 7 ? "error" : "warning",
            });
          }
        }

        // Check for low remaining sessions (2 or less)
        if (remainingSessions <= 2 && remainingSessions > 0) {
          alertsList.push({
            id: `${pkg.id}-low`,
            packageName: pkg.name,
            patientName,
            patientId: pkg.patient_id,
            type: "low_sessions",
            message: remainingSessions === 1 
              ? "Apenas 1 sessão restante" 
              : `Apenas ${remainingSessions} sessões restantes`,
            remainingSessions,
            severity: remainingSessions === 1 ? "error" : "warning",
          });
        }
      });

    // Sort by severity (errors first) then by urgency
    return alertsList.sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === "error" ? -1 : 1;
      }
      // For expiring, sort by days
      if (a.type === "expiring" && b.type === "expiring") {
        return (a.daysUntilExpiry || 0) - (b.daysUntilExpiry || 0);
      }
      // For low sessions, sort by remaining
      if (a.type === "low_sessions" && b.type === "low_sessions") {
        return (a.remainingSessions || 0) - (b.remainingSessions || 0);
      }
      return 0;
    });
  }, [packages, patients]);

  const displayAlerts = maxAlerts ? alerts.slice(0, maxAlerts) : alerts;

  if (alerts.length === 0) {
    return null;
  }

  const content = (
    <div className="space-y-3">
      {displayAlerts.map((alert) => (
        <Alert 
          key={alert.id} 
          variant={alert.severity === "error" ? "destructive" : "default"}
          className={alert.severity === "warning" ? "border-yellow-500/50 bg-yellow-500/10" : ""}
        >
          <div className="flex items-start gap-3">
            {alert.type === "expired" && <AlertTriangle className="h-4 w-4 mt-0.5" />}
            {alert.type === "expiring" && <Clock className="h-4 w-4 mt-0.5" />}
            {alert.type === "low_sessions" && <Package className="h-4 w-4 mt-0.5" />}
            
            <div className="flex-1 space-y-1">
              <AlertTitle className="flex items-center gap-2 text-sm">
                <span className="font-medium">{alert.packageName}</span>
                <Badge variant="outline" className="text-xs font-normal">
                  <User className="h-3 w-3 mr-1" />
                  {alert.patientName}
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-sm">
                {alert.message}
              </AlertDescription>
            </div>

            <Badge 
              variant={alert.severity === "error" ? "destructive" : "secondary"}
              className="shrink-0"
            >
              {alert.type === "expired" && "Expirado"}
              {alert.type === "expiring" && "Expirando"}
              {alert.type === "low_sessions" && "Poucas sessões"}
            </Badge>
          </div>
        </Alert>
      ))}
      
      {maxAlerts && alerts.length > maxAlerts && (
        <p className="text-xs text-muted-foreground text-center">
          +{alerts.length - maxAlerts} alertas adicionais
        </p>
      )}
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card className="card-glass border-yellow-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Alertas de Pacotes
          <Badge variant="secondary" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};

export default PackageAlerts;
