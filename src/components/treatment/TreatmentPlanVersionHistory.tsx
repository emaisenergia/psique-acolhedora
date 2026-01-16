import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, RotateCcw, GitCompare, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TreatmentPlanVersion, useTreatmentPlanVersions } from "@/hooks/useTreatmentPlanVersions";
import type { TreatmentPlan } from "@/hooks/useTreatmentPlan";
import { toast } from "sonner";

interface TreatmentPlanVersionHistoryProps {
  treatmentPlanId: string | undefined;
  currentPlan: TreatmentPlan | null;
  onRestoreVersion: (snapshot: TreatmentPlan) => Promise<void>;
}

export function TreatmentPlanVersionHistory({
  treatmentPlanId,
  currentPlan,
  onRestoreVersion,
}: TreatmentPlanVersionHistoryProps) {
  const { versions, loading, compareVersions } = useTreatmentPlanVersions(treatmentPlanId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<TreatmentPlanVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<TreatmentPlanVersion | null>(null);
  const [restoring, setRestoring] = useState(false);

  if (!treatmentPlanId || versions.length === 0) {
    return null;
  }

  const handleViewVersion = (version: TreatmentPlanVersion) => {
    setSelectedVersion(version);
    setViewDialogOpen(true);
  };

  const handleCompare = (version: TreatmentPlanVersion) => {
    setSelectedVersion(version);
    // Compare with most recent version or current plan
    const latestVersion = versions[0];
    if (latestVersion && latestVersion.id !== version.id) {
      setCompareVersion(latestVersion);
    } else if (versions.length > 1) {
      setCompareVersion(versions[1]);
    }
    setCompareDialogOpen(true);
  };

  const handleRestore = async (version: TreatmentPlanVersion) => {
    if (!window.confirm(`Deseja restaurar a versão ${version.version_number}? O plano atual será substituído.`)) {
      return;
    }

    setRestoring(true);
    try {
      await onRestoreVersion(version.snapshot);
      toast.success(`Versão ${version.version_number} restaurada com sucesso!`);
    } catch (error) {
      console.error("Error restoring version:", error);
      toast.error("Erro ao restaurar versão");
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMM yyyy 'às' HH:mm", { locale: ptBR });
  };

  const differences = selectedVersion && compareVersion 
    ? compareVersions(compareVersion, selectedVersion)
    : [];

  const renderSnapshotDetails = (snapshot: TreatmentPlan) => (
    <div className="space-y-4 text-sm">
      <div>
        <span className="font-medium">Status:</span>{" "}
        <Badge variant="outline">{snapshot.current_status}</Badge>
      </div>
      <div>
        <span className="font-medium">Progresso:</span> {snapshot.current_progress}%
      </div>
      <div>
        <span className="font-medium">Sessões estimadas:</span> {snapshot.estimated_sessions}
      </div>
      {snapshot.objectives.length > 0 && (
        <div>
          <span className="font-medium">Objetivos ({snapshot.objectives.length}):</span>
          <ul className="list-disc list-inside mt-1 text-muted-foreground">
            {snapshot.objectives.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </div>
      )}
      {snapshot.short_term_goals.length > 0 && (
        <div>
          <span className="font-medium">Metas curto prazo ({snapshot.short_term_goals.length}):</span>
          <ul className="list-disc list-inside mt-1 text-muted-foreground">
            {snapshot.short_term_goals.map((goal, i) => (
              <li key={i}>{goal}</li>
            ))}
          </ul>
        </div>
      )}
      {snapshot.long_term_goals.length > 0 && (
        <div>
          <span className="font-medium">Metas longo prazo ({snapshot.long_term_goals.length}):</span>
          <ul className="list-disc list-inside mt-1 text-muted-foreground">
            {snapshot.long_term_goals.map((goal, i) => (
              <li key={i}>{goal}</li>
            ))}
          </ul>
        </div>
      )}
      {snapshot.improvements.length > 0 && (
        <div>
          <span className="font-medium">Melhoras registradas:</span> {snapshot.improvements.length}
        </div>
      )}
      {snapshot.notes && (
        <div>
          <span className="font-medium">Observações:</span>
          <p className="text-muted-foreground mt-1">{snapshot.notes}</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card className="border-dashed">
        <CardHeader className="py-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Histórico de versões ({versions.length})
              </CardTitle>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                            v{version.version_number}
                          </Badge>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Mais recente
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(version.created_at)}
                        </p>
                        {version.change_summary && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {version.change_summary}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewVersion(version)}
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {versions.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleCompare(version)}
                            title="Comparar"
                          >
                            <GitCompare className="w-4 h-4" />
                          </Button>
                        )}
                        {index > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleRestore(version)}
                            disabled={restoring}
                            title="Restaurar"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        )}
      </Card>

      {/* View Version Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Versão {selectedVersion?.version_number}
            </DialogTitle>
            <DialogDescription>
              {selectedVersion && formatDate(selectedVersion.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedVersion && renderSnapshotDetails(selectedVersion.snapshot)}
        </DialogContent>
      </Dialog>

      {/* Compare Versions Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="w-5 h-5" />
              Comparação de versões
            </DialogTitle>
            <DialogDescription>
              {compareVersion && selectedVersion && (
                <>v{compareVersion.version_number} → v{selectedVersion.version_number}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {differences.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma diferença encontrada entre as versões.
            </p>
          ) : (
            <div className="space-y-3">
              {differences.map((diff, i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <p className="font-medium text-sm">{diff.field}</p>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    {diff.old && (
                      <div className="p-2 rounded bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300">
                        <span className="text-xs uppercase font-medium">Anterior:</span>
                        <p className="mt-1">{String(diff.old)}</p>
                      </div>
                    )}
                    {diff.new && (
                      <div className="p-2 rounded bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300">
                        <span className="text-xs uppercase font-medium">Novo:</span>
                        <p className="mt-1">{String(diff.new)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
