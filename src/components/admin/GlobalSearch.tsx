import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, CalendarDays, FileText, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePatients } from "@/hooks/usePatients";
import { useAppointments } from "@/hooks/useAppointments";
import { format, parseISO } from "date-fns";

interface SearchResult {
  id: string;
  type: "patient" | "appointment";
  title: string;
  subtitle: string;
  url: string;
  icon: typeof User;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { patients } = usePatients();
  const { appointments } = useAppointments();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const patientMap = useMemo(
    () => Object.fromEntries(patients.map((p) => [p.id, p.name])),
    [patients]
  );

  const results = useMemo((): SearchResult[] => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    const items: SearchResult[] = [];

    // Search patients
    patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((p) => {
        items.push({
          id: p.id,
          type: "patient",
          title: p.name,
          subtitle: `${p.email}${p.phone ? ` • ${p.phone}` : ""} • ${p.status === "active" ? "Ativo" : "Inativo"}`,
          url: `/admin/pacientes/${p.id}`,
          icon: User,
        });
      });

    // Search appointments
    appointments
      .filter((a) => {
        const patientName = patientMap[a.patient_id || ""]?.toLowerCase() || "";
        const dateStr = a.date_time
          ? format(parseISO(a.date_time), "dd/MM/yyyy")
          : "";
        return (
          patientName.includes(q) ||
          dateStr.includes(q) ||
          a.service?.toLowerCase().includes(q) ||
          a.notes?.toLowerCase().includes(q)
        );
      })
      .slice(0, 5)
      .forEach((a) => {
        const patientName = patientMap[a.patient_id || ""] || "Paciente";
        const dateStr = a.date_time
          ? format(parseISO(a.date_time), "dd/MM/yyyy 'às' HH:mm")
          : "";
        items.push({
          id: a.id,
          type: "appointment",
          title: `${patientName} - ${dateStr}`,
          subtitle: `${a.service || "Sessão"} • ${a.mode || "presencial"} • ${a.status}`,
          url: `/admin/agendamentos`,
          icon: CalendarDays,
        });
      });

    return items;
  }, [query, patients, appointments, patientMap]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onOpenChange(false);
      navigate(result.url);
    },
    [navigate, onOpenChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  const typeLabel: Record<SearchResult["type"], string> = {
    patient: "Paciente",
    appointment: "Agendamento",
  };

  const typeColor: Record<SearchResult["type"], string> = {
    patient: "bg-primary/10 text-primary",
    appointment: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 border-b">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar pacientes, agendamentos..."
            className="border-0 shadow-none focus-visible:ring-0 h-12 text-base"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-muted px-2 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <ScrollArea className="max-h-[400px]">
          {query.length >= 2 && results.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado para "{query}"
            </div>
          )}

          {query.length < 2 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              {results.map((result) => {
                const Icon = result.icon;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{result.title}</span>
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${typeColor[result.type]}`}>
                          {typeLabel[result.type]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{result.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="px-4 py-2 border-t bg-muted/30 text-[11px] text-muted-foreground flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border bg-background text-[10px]">↵</kbd> selecionar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border bg-background text-[10px]">ESC</kbd> fechar
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
