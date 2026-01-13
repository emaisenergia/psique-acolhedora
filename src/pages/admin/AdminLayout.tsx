import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/context/AdminAuth";
import {
  CalendarDays,
  Users,
  LayoutDashboard,
  LogOut,
  Wallet,
  Sparkles,
  Folder,
  FileText,
  Settings,
} from "lucide-react";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout, user, hasRole } = useAdminAuth();
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const baseItem =
    "group relative flex items-center gap-3 px-3 py-3 rounded-2xl border transition-all duration-300";
  const activeItem =
    "bg-primary/10 border-primary/20 shadow-soft text-foreground";
  const inactiveItem = "border-transparent hover:bg-muted/40";

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="hidden md:block w-64 h-screen sticky top-0 border-r border-border/50 p-4">
          <Link to="/admin" className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold">E</span>
            </div>
            <span className="font-display text-xl">Painel</span>
          </Link>

          <nav className="flex flex-col gap-2">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => `${baseItem} ${isActive ? activeItem : inactiveItem} ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-semibold">Painel</span>
                <span className="text-xs text-muted-foreground">Visão geral</span>
              </div>
              <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary/90 opacity-0 group-[.active]:opacity-100" />
            </NavLink>

            {hasRole("psychologist", "admin") && (
              <NavLink
                to="/admin/pacientes"
                className={({ isActive }) => `${baseItem} ${isActive ? activeItem : inactiveItem} ${isActive ? 'active' : ''}`}
              >
                <Users className="w-5 h-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-semibold">Pacientes</span>
                  <span className="text-xs text-muted-foreground">Gerenciar pacientes</span>
                </div>
                <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary/90 opacity-0 group-[.active]:opacity-100" />
              </NavLink>
            )}

            {hasRole("psychologist", "admin") && (
              <NavLink
                to="/admin/agendamentos"
                className={({ isActive }) => `${baseItem} ${isActive ? activeItem : inactiveItem} ${isActive ? 'active' : ''}`}
              >
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-semibold">Agenda</span>
                  <span className="text-xs text-muted-foreground">Agendamentos</span>
                </div>
                <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary/90 opacity-0 group-[.active]:opacity-100" />
              </NavLink>
            )}

            <NavLink
              to="/admin/financeiro"
              className={({ isActive }) => `${baseItem} ${isActive ? activeItem : inactiveItem} ${isActive ? 'active' : ''}`}
            >
              <Wallet className="w-5 h-5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-semibold">Financeiro</span>
                <span className="text-xs text-muted-foreground">Controle financeiro</span>
              </div>
              <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary/90 opacity-0 group-[.active]:opacity-100" />
            </NavLink>

            <NavLink
              to="/admin/agentes-ia"
              className={({ isActive }) => `${baseItem} ${isActive ? activeItem : inactiveItem} ${isActive ? 'active' : ''}`}
            >
              <Sparkles className="w-5 h-5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-semibold">Agentes IA</span>
                <span className="text-xs text-muted-foreground">Assistentes inteligentes</span>
              </div>
              <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary/90 opacity-0 group-[.active]:opacity-100" />
            </NavLink>

            <NavLink
              to="/admin/arquivos"
              className={({ isActive }) => `${baseItem} ${isActive ? activeItem : inactiveItem} ${isActive ? 'active' : ''}`}
            >
              <Folder className="w-5 h-5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-semibold">Arquivos</span>
                <span className="text-xs text-muted-foreground">Documentos</span>
              </div>
              <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary/90 opacity-0 group-[.active]:opacity-100" />
            </NavLink>

            <NavLink
              to="/admin/prontuarios"
              className={({ isActive }) => `${baseItem} ${isActive ? activeItem : inactiveItem} ${isActive ? 'active' : ''}`}
            >
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-semibold">Prontuários</span>
                <span className="text-xs text-muted-foreground">Prontuários psicológicos</span>
              </div>
              <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary/90 opacity-0 group-[.active]:opacity-100" />
            </NavLink>

            <NavLink
              to="/admin/configuracoes"
              className={({ isActive }) => `${baseItem} ${isActive ? activeItem : inactiveItem} ${isActive ? 'active' : ''}`}
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-semibold">Configurações</span>
                <span className="text-xs text-muted-foreground">Preferências</span>
              </div>
              <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary/90 opacity-0 group-[.active]:opacity-100" />
            </NavLink>
          </nav>

          <div className="mt-auto pt-6">
            <Button variant="outline" className="w-full" onClick={doLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </aside>

        <main className="flex-1 min-h-screen">
          <div className="md:hidden sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur p-3 flex items-center justify-between">
            <Link to="/admin" className="font-display">Painel</Link>
            <div className="flex items-center gap-2">
              {user && <span className="text-xs text-muted-foreground">{user.name}</span>}
              <Button variant="outline" size="sm" onClick={doLogout}><LogOut className="w-4 h-4 mr-2"/>Sair</Button>
            </div>
          </div>
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
