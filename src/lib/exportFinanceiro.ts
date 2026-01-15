import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import type { FinancialTransaction } from "@/hooks/useFinancialTransactions";
import type { AppointmentRow } from "@/hooks/useAppointments";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

interface PatientMap {
  [key: string]: string;
}

export const exportTransactionsToExcel = (
  transactions: FinancialTransaction[],
  patients: PatientMap,
  filename: string = "lancamentos"
) => {
  const data = transactions.map((t) => ({
    Data: format(new Date(t.transaction_date), "dd/MM/yyyy", { locale: ptBR }),
    Tipo: t.type === "revenue" ? "Receita" : "Despesa",
    Descrição: t.description || "-",
    "Paciente/Categoria": t.type === "revenue" 
      ? (t.patient_id ? patients[t.patient_id] || "-" : t.clinic || "-")
      : (t.category || "-"),
    "Forma de Pagamento": t.payment_method || "-",
    Valor: t.amount,
    "Valor Formatado": currencyFormatter.format(t.amount),
    Observações: t.notes || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");

  // Auto-size columns
  const colWidths = [
    { wch: 12 }, // Data
    { wch: 10 }, // Tipo
    { wch: 30 }, // Descrição
    { wch: 25 }, // Paciente/Categoria
    { wch: 18 }, // Forma de Pagamento
    { wch: 12 }, // Valor
    { wch: 15 }, // Valor Formatado
    { wch: 30 }, // Observações
  ];
  ws["!cols"] = colWidths;

  XLSX.writeFile(wb, `${filename}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};

export const exportSessionsToExcel = (
  appointments: AppointmentRow[],
  patients: PatientMap,
  filename: string = "sessoes"
) => {
  const data = appointments.map((apt) => ({
    Data: format(new Date(apt.date_time), "dd/MM/yyyy HH:mm", { locale: ptBR }),
    Paciente: patients[apt.patient_id] || "-",
    Modalidade: apt.mode === "online" ? "Online" : "Presencial",
    "Tipo Pagamento": apt.payment_type === "package" ? "Pacote" : "Avulso",
    Valor: apt.payment_value || 0,
    "Valor Formatado": currencyFormatter.format(apt.payment_value || 0),
    Status: apt.status === "done" ? "Realizada" : apt.status === "cancelled" ? "Cancelada" : "Agendada",
    Serviço: apt.service || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sessões");

  const colWidths = [
    { wch: 18 }, // Data
    { wch: 25 }, // Paciente
    { wch: 12 }, // Modalidade
    { wch: 15 }, // Tipo Pagamento
    { wch: 12 }, // Valor
    { wch: 15 }, // Valor Formatado
    { wch: 12 }, // Status
    { wch: 20 }, // Serviço
  ];
  ws["!cols"] = colWidths;

  XLSX.writeFile(wb, `${filename}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};

export const exportFinancialSummaryToExcel = (
  data: {
    period: string;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    completedSessions: number;
    averageSessionValue: number;
    revenueByInsurance: { name: string; revenue: number; sessions: number }[];
    packageUsage: { name: string; patientName: string; usedSessions: number; totalSessions: number; price: number }[];
  },
  filename: string = "resumo_financeiro"
) => {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["Resumo Financeiro", ""],
    ["Período", data.period],
    ["", ""],
    ["Faturamento Total", currencyFormatter.format(data.totalRevenue)],
    ["Total de Despesas", currencyFormatter.format(data.totalExpenses)],
    ["Lucro Líquido", currencyFormatter.format(data.netProfit)],
    ["", ""],
    ["Sessões Realizadas", data.completedSessions.toString()],
    ["Valor Médio/Sessão", currencyFormatter.format(data.averageSessionValue)],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

  // Revenue by Insurance sheet
  if (data.revenueByInsurance.length > 0) {
    const insuranceData = data.revenueByInsurance.map((i) => ({
      Convênio: i.name,
      Sessões: i.sessions,
      Faturamento: currencyFormatter.format(i.revenue),
    }));
    const wsInsurance = XLSX.utils.json_to_sheet(insuranceData);
    wsInsurance["!cols"] = [{ wch: 25 }, { wch: 10 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsInsurance, "Por Convênio");
  }

  // Package Usage sheet
  if (data.packageUsage.length > 0) {
    const packageData = data.packageUsage.map((p) => ({
      Pacote: p.name,
      Paciente: p.patientName,
      "Sessões Utilizadas": p.usedSessions,
      "Total de Sessões": p.totalSessions,
      "Valor do Pacote": currencyFormatter.format(p.price),
    }));
    const wsPackages = XLSX.utils.json_to_sheet(packageData);
    wsPackages["!cols"] = [{ wch: 20 }, { wch: 25 }, { wch: 18 }, { wch: 16 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsPackages, "Pacotes");
  }

  XLSX.writeFile(wb, `${filename}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};

export const printReport = (title: string) => {
  // Create a print-friendly version
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor, permita pop-ups para imprimir o relatório.");
    return;
  }

  const content = document.querySelector("[data-print-content]");
  if (!content) {
    printWindow.close();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
        .text-right { text-align: right; }
        .text-green { color: #16a34a; }
        .text-red { color: #dc2626; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
      ${content.innerHTML}
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};
