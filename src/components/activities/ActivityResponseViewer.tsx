import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CheckCircle2, XCircle, MessageSquare, Printer, History, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ActivityField {
  id: string;
  type: "text" | "checkbox";
  label: string;
  required?: boolean;
}

export interface ResponseHistoryEntry {
  timestamp: string;
  responses: Record<string, string | boolean>;
}

interface ActivityResponseViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: {
    title: string;
    description?: string;
    fields?: ActivityField[];
    attachmentUrl?: string;
    attachmentName?: string;
    patientResponses?: Record<string, string | boolean>;
    responseHistory?: ResponseHistoryEntry[];
  };
  patientName?: string;
}

export const ActivityResponseViewer = ({
  open,
  onOpenChange,
  activity,
  patientName,
}: ActivityResponseViewerProps) => {
  const hasResponses = activity.patientResponses && Object.keys(activity.patientResponses).length > 0;
  const hasHistory = activity.responseHistory && activity.responseHistory.length > 0;

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const fieldsHtml = activity.fields?.map((field) => {
      const response = activity.patientResponses?.[field.id];
      let responseHtml = "";
      
      if (field.type === "checkbox") {
        responseHtml = response === true 
          ? '<span class="badge badge-yes">✓ Sim</span>'
          : '<span class="badge badge-no">✗ Não</span>';
      } else {
        responseHtml = `<div class="response-text">${(response as string) || '<em>Sem resposta</em>'}</div>`;
      }

      return `
        <div class="field">
          <div class="field-header">
            <span class="field-type">${field.type === "text" ? "TEXTO" : "CHECKBOX"}</span>
            ${field.required ? '<span class="required">Obrigatório</span>' : ''}
          </div>
          <div class="field-label">${field.label}</div>
          ${responseHtml}
        </div>
      `;
    }).join("") || "";

    const historyHtml = hasHistory ? `
      <div class="history-section">
        <h2>Histórico de Alterações</h2>
        ${activity.responseHistory!.map((entry, idx) => `
          <div class="history-entry">
            <div class="history-header">
              <strong>Versão ${activity.responseHistory!.length - idx}</strong>
              <span class="history-date">${format(new Date(entry.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
            <div class="history-responses">
              ${activity.fields?.map((field) => {
                const resp = entry.responses[field.id];
                return `<div class="history-field"><strong>${field.label}:</strong> ${
                  field.type === "checkbox" 
                    ? (resp === true ? "Sim" : "Não")
                    : (resp || "Sem resposta")
                }</div>`;
              }).join("") || ""}
            </div>
          </div>
        `).join("")}
      </div>
    ` : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Respostas - ${activity.title}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto; 
            line-height: 1.6;
            color: #1f2937;
          }
          .header { 
            border-bottom: 3px solid #7c3aed; 
            padding-bottom: 16px; 
            margin-bottom: 24px; 
          }
          h1 { 
            color: #7c3aed; 
            font-size: 24px; 
            margin-bottom: 8px;
          }
          .meta { 
            font-size: 14px; 
            color: #6b7280; 
          }
          .description { 
            background: #f9fafb; 
            border-left: 4px solid #7c3aed; 
            padding: 16px; 
            margin-bottom: 24px;
            border-radius: 0 8px 8px 0;
          }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
          }
          .status-responded {
            background: #d1fae5;
            color: #047857;
          }
          .status-pending {
            background: #fef3c7;
            color: #b45309;
          }
          .field {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            background: #fff;
          }
          .field-header {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
          }
          .field-type {
            font-size: 10px;
            font-weight: 600;
            color: #6b7280;
            background: #f3f4f6;
            padding: 2px 8px;
            border-radius: 4px;
          }
          .required {
            font-size: 10px;
            color: #dc2626;
          }
          .field-label {
            font-weight: 600;
            margin-bottom: 8px;
          }
          .response-text {
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            white-space: pre-wrap;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 500;
          }
          .badge-yes {
            background: #d1fae5;
            color: #047857;
          }
          .badge-no {
            background: #f1f5f9;
            color: #475569;
          }
          .history-section {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 2px solid #e5e7eb;
          }
          .history-section h2 {
            font-size: 16px;
            color: #374151;
            margin-bottom: 16px;
          }
          .history-entry {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
            background: #fafafa;
          }
          .history-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
          }
          .history-date {
            color: #6b7280;
          }
          .history-responses {
            font-size: 13px;
          }
          .history-field {
            margin-bottom: 4px;
          }
          .footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
          }
          @media print {
            body { padding: 20px; }
            .field { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${activity.title}</h1>
          <div class="meta">
            ${patientName ? `Paciente: ${patientName} | ` : ''}
            Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        </div>

        ${activity.description ? `<div class="description">${activity.description}</div>` : ''}

        <div class="section-title">
          Respostas do Paciente
          <span class="status-badge ${hasResponses ? 'status-responded' : 'status-pending'}">
            ${hasResponses ? '✓ Respondido' : 'Aguardando'}
          </span>
        </div>

        ${fieldsHtml || '<p style="color: #6b7280; text-align: center; padding: 24px;">Esta atividade não possui campos para preencher.</p>'}

        ${historyHtml}

        <div class="footer">
          Relatório gerado automaticamente pelo sistema
        </div>

        <script>setTimeout(() => window.print(), 100);</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {activity.title}
          </DialogTitle>
        </DialogHeader>

        {activity.description && (
          <div className="text-sm text-muted-foreground whitespace-pre-line border-l-2 border-primary/30 pl-3 py-1 bg-muted/30 rounded-r">
            {activity.description}
          </div>
        )}

        {activity.attachmentUrl && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <FileText className="w-5 h-5 text-primary" />
            <span className="flex-1 text-sm truncate">{activity.attachmentName || "Arquivo anexo"}</span>
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={activity.attachmentUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                <Download className="w-4 h-4" /> Baixar
              </a>
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Respostas do paciente
            </div>
            {hasResponses ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Respondido
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <XCircle className="w-3 h-3 mr-1" /> Aguardando respostas
              </Badge>
            )}
          </div>

          {!hasResponses && (!activity.fields || activity.fields.length === 0) && (
            <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
              Esta atividade não possui campos para preencher.
            </div>
          )}

          {!hasResponses && activity.fields && activity.fields.length > 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
              O paciente ainda não enviou respostas para esta atividade.
            </div>
          )}

          {hasResponses && activity.fields && (
            <div className="space-y-3">
              {activity.fields.map((field) => {
                const response = activity.patientResponses?.[field.id];
                
                return (
                  <div key={field.id} className="p-3 rounded-lg border border-border bg-background">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase px-2 py-0.5 rounded bg-muted">
                        {field.type === "text" ? "Texto" : "Checkbox"}
                      </span>
                      {field.required && (
                        <span className="text-xs text-destructive">Obrigatório</span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-foreground mb-2">
                      {field.label}
                    </div>
                    {field.type === "checkbox" ? (
                      <div className="flex items-center gap-2">
                        {response === true ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Sim
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 text-slate-700">
                            <XCircle className="w-3 h-3 mr-1" /> Não
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-line">
                        {response as string || <span className="text-muted-foreground italic">Sem resposta</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Response History */}
          {hasHistory && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                <History className="w-4 h-4" />
                Histórico de alterações ({activity.responseHistory!.length})
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activity.responseHistory!.map((entry, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border bg-muted/20 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium">
                        Versão {activity.responseHistory!.length - idx}
                      </span>
                      <span className="text-muted-foreground">
                        {format(new Date(entry.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {activity.fields?.slice(0, 2).map((field) => {
                        const resp = entry.responses[field.id];
                        return (
                          <div key={field.id} className="truncate">
                            <strong>{field.label}:</strong>{" "}
                            {field.type === "checkbox" 
                              ? (resp === true ? "Sim" : "Não")
                              : ((resp as string)?.substring(0, 50) || "Sem resposta")}
                            {field.type === "text" && (resp as string)?.length > 50 && "..."}
                          </div>
                        );
                      })}
                      {(activity.fields?.length || 0) > 2 && (
                        <div className="text-muted-foreground/60">
                          +{(activity.fields?.length || 0) - 2} campos...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-2">
            <Printer className="w-4 h-4" />
            Exportar PDF
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
