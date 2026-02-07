import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePatientAuth } from "@/context/PatientAuth";
import {
  Shield,
  Calendar,
  BookOpen,
  FileText,
  MessageSquare,
  ClipboardList,
  FolderOpen,
  Settings,
  LogOut,
  UserCircle,
} from "lucide-react";

const tabs = [
  { path: "/portal/app", label: "Visão Geral", icon: Shield },
  { path: "/portal/sessoes", label: "Sessões", icon: Calendar },
  { path: "/portal/atividades", label: "Atividades", icon: BookOpen },
  { path: "/portal/anotacoes", label: "Anotações", icon: FileText },
  { path: "/portal/mensagens", label: "Mensagens", icon: MessageSquare },
  { path: "/portal/plano", label: "Plano", icon: ClipboardList },
  { path: "/portal/materiais", label: "Materiais", icon: FolderOpen },
  { path: "/portal/configuracoes", label: "Configurações", icon: Settings },
];

const PortalLayout = ({ children }: { children: ReactNode }) => {
  const { logout, patient } = usePatientAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen section-gradient relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute -left-24 top-56 w-56 h-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-10 top-80 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />

      {/* Top bar */}
      <div className="bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border/60">
        <div className="container mx-auto px-4 max-w-6xl py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Equanimité Psychology</div>
                <div className="text-lg font-semibold">Portal do Paciente</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-primary" />
                </div>
                <span>{patient?.name || "Paciente"}</span>
              </div>
              <Button
                variant="outline"
                className="btn-outline-futuristic inline-flex items-center gap-2"
                onClick={() => { logout(); navigate("/portal"); }}
              >
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Tabs */}
        <div className="mt-4 border-b border-border/60">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary/20 border-primary/50 text-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="mt-6 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PortalLayout;
