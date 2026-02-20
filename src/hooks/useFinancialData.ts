import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAppointments } from "@/hooks/useAppointments";
import { useInsurances } from "@/hooks/useInsurances";
import { useSessionPackages } from "@/hooks/useSessionPackages";
import { usePatients } from "@/hooks/usePatients";
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions";

export const useFinancialData = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const { appointments } = useAppointments();
  const { insurances } = useInsurances();
  const { packages } = useSessionPackages();
  const { transactions, deleteTransaction, updateTransaction } = useFinancialTransactions();
  const { patients } = usePatients();

  const [filterType, setFilterType] = useState<"all" | "revenue" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPatient, setFilterPatient] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const patientMap = useMemo(() => Object.fromEntries(patients.map((p) => [p.id, p.name])), [patients]);

  const dateRange = useMemo(() => {
    if (customDateRange) return customDateRange;
    const now = new Date();
    switch (selectedPeriod) {
      case "current": return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last": return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case "last3": return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "last6": return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case "year": return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
      default: return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [selectedPeriod, customDateRange]);

  const handleCustomDateRange = (range: { start: Date; end: Date }) => {
    setCustomDateRange(range);
    setSelectedPeriod("custom");
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (!apt.date_time) return false;
      return isWithinInterval(parseISO(apt.date_time), { start: dateRange.start, end: dateRange.end });
    });
  }, [appointments, dateRange]);

  const kpis = useMemo(() => {
    const completed = filteredAppointments.filter((a) => a.status === "done");
    const totalRevenue = completed.reduce((s, a) => s + (a.payment_value || 0), 0);
    const packageRevenue = completed.filter((a) => a.payment_type === "package").reduce((s, a) => s + (a.payment_value || 0), 0);
    const singleSessionRevenue = completed.filter((a) => a.payment_type !== "package").reduce((s, a) => s + (a.payment_value || 0), 0);
    return {
      totalRevenue,
      completedSessions: completed.length,
      packageRevenue,
      singleSessionRevenue,
      averageSessionValue: completed.length > 0 ? totalRevenue / completed.length : 0,
    };
  }, [filteredAppointments]);

  const revenueByInsurance = useMemo(() => {
    const completed = filteredAppointments.filter((a) => a.status === "done");
    const map = new Map<string, { name: string; revenue: number; sessions: number }>();
    map.set("particular", { name: "Particular", revenue: 0, sessions: 0 });
    completed.forEach((apt) => {
      const patient = patients.find((p) => p.id === apt.patient_id);
      const insuranceId = patient?.insurance_id;
      if (insuranceId) {
        const insurance = insurances.find((i) => i.id === insuranceId);
        const existing = map.get(insuranceId) || { name: insurance?.name || "Convênio", revenue: 0, sessions: 0 };
        existing.revenue += apt.payment_value || 0;
        existing.sessions += 1;
        map.set(insuranceId, existing);
      } else {
        const existing = map.get("particular")!;
        existing.revenue += apt.payment_value || 0;
        existing.sessions += 1;
      }
    });
    return Array.from(map.values()).filter((i) => i.sessions > 0);
  }, [filteredAppointments, patients, insurances]);

  const packageUsageData = useMemo(() => {
    return packages.map((pkg) => {
      const patient = patients.find((p) => p.id === pkg.patient_id);
      const usagePercent = pkg.total_sessions > 0 ? (pkg.used_sessions / pkg.total_sessions) * 100 : 0;
      return {
        id: pkg.id, name: pkg.name, patientName: patient?.name || "Paciente",
        totalSessions: pkg.total_sessions, usedSessions: pkg.used_sessions,
        remaining: pkg.total_sessions - pkg.used_sessions, usagePercent: Math.round(usagePercent),
        price: pkg.price, status: pkg.status,
      };
    });
  }, [packages, patients]);

  const sessionsByMonth = useMemo(() => {
    const monthMap = new Map<string, { month: string; sessions: number; revenue: number }>();
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      monthMap.set(format(date, "yyyy-MM"), { month: format(date, "MMM", { locale: ptBR }), sessions: 0, revenue: 0 });
    }
    appointments.filter((a) => a.status === "done").forEach((apt) => {
      if (!apt.date_time) return;
      const key = format(parseISO(apt.date_time), "yyyy-MM");
      if (monthMap.has(key)) {
        const existing = monthMap.get(key)!;
        existing.sessions += 1;
        existing.revenue += apt.payment_value || 0;
      }
    });
    return Array.from(monthMap.values());
  }, [appointments]);

  const paymentTypeData = useMemo(() => {
    const completed = filteredAppointments.filter((a) => a.status === "done");
    const packageCount = completed.filter((a) => a.payment_type === "package").length;
    const singleCount = completed.length - packageCount;
    return [
      { name: "Avulso", value: singleCount, revenue: kpis.singleSessionRevenue },
      { name: "Pacote", value: packageCount, revenue: kpis.packageRevenue },
    ].filter((d) => d.value > 0);
  }, [filteredAppointments, kpis]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = parseISO(t.transaction_date);
      const inDateRange = isWithinInterval(tDate, { start: dateRange.start, end: dateRange.end });
      const matchesType = filterType === "all" || t.type === filterType;
      const matchesCategory = filterCategory === "all" || t.category === filterCategory;
      const matchesPatient = filterPatient === "all" || t.patient_id === filterPatient;
      const matchesSearch = !searchTerm || t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || t.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      return inDateRange && matchesType && matchesCategory && matchesPatient && matchesSearch;
    });
  }, [transactions, dateRange, filterType, filterCategory, filterPatient, searchTerm]);

  const totalExpensesInRange = useMemo(() => {
    return transactions
      .filter((t) => {
        const tDate = parseISO(t.transaction_date);
        return t.type === "expense" && isWithinInterval(tDate, { start: dateRange.start, end: dateRange.end });
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, dateRange]);

  return {
    selectedPeriod, setSelectedPeriod, customDateRange, setCustomDateRange,
    appointments, insurances, packages, transactions, patients,
    deleteTransaction, updateTransaction,
    filterType, setFilterType, filterCategory, setFilterCategory,
    filterPatient, setFilterPatient, searchTerm, setSearchTerm,
    patientMap, dateRange, handleCustomDateRange,
    filteredAppointments, kpis, revenueByInsurance,
    packageUsageData, sessionsByMonth, paymentTypeData,
    filteredTransactions, totalExpensesInRange,
  };
};
