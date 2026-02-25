import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/context/AdminAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAppointments } from "@/hooks/useAppointments";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { GlobalSearch } from "@/components/admin/GlobalSearch";
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
  FileEdit,
  ClipboardList,
  Bell,
  AlertCircle,
  Search,
  Menu,
  X,
  Code2,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout, user, hasRole } = useAdminAuth();
  const navigate = useNavigate();
  const { appointments } = useAppointments();
  const { playNotificationSound } = useNotificationSound();
  const previousPendingCountRef = useRef<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Atalhos de teclado globais
  useKeyboardShortcuts();

  // Query para contar prontuários pendentes
  const { data: pendingNotesCount = 0 } = useQuery({
    queryKey: ['sidebar-pending-notes', appointments],
    queryFn: async () => {
      const agendamentosConcluidos = appointments.filter(a => a.status === 'done');
      if (agendamentosConcluidos.length === 0) return 0;

      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, appointment_id, detailed_notes, summary, clinical_observations')
        .in('appointment_id', agendamentosConcluidos.map(a => a.id));

      const sessoesMap = new Map(sessions?.map(s => [s.appointment_id, s]) || []);
      
      return agendamentosConcluidos.filter(appt => {
        const sessao = sessoesMap.get(appt.id);
        if (!sessao) return true;
        const temNotas = sessao.detailed_notes || sessao.summary || sessao.clinical_observations;
        return !temNotas;
      }).length;
    },
    enabled: appointments.length > 0,
    staleTime: 30000,
  });

  // Tocar som quando houver novos prontuários pendentes
  useEffect(() => {
    if (previousPendingCountRef.current !== null && pendingNotesCount > previousPendingCountRef.current) {
      playNotificationSound();
    }
    previousPendingCountRef.current = pendingNotesCount;
  }, [pendingNotesCount, playNotificationSound]);

  const doLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const baseItem =
    "group relative flex items-center gap-3 px-3 py-3 rounded-2xl border transition-all duration-300";
  const activeItem =
    "bg-primary/10 border-primary/20 shadow-soft text-foreground";
  const inactiveItem = "border-transparent hover:bg-muted/40";

  const navItems = (
    <>
      <NavLink
        to="/admin"
        end
        onClick={() => setMobileNavOpen(false)}
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
          onClick={() => setMobileNavOpen(false)}
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
          onClick={() => setMobileNavOpen(false)}
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

      {hasRole("psychologist", "admin") && (
        <NavLink
          to="/admin/tarefas-casa"
          onClick={() => setMobileNavOpen(false)}
          className={({ isActive }) => `${baseItem} ${isActive ? activeItem : inactiveItem} ${isActive ? 'active' : ''}`}
        >
          <ClipboardList className="w-5 h-5 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-semibold">Tarefas de Casa</span>
            <span className="text-xs text-muted-foreground">Templates e atividades</span>
          </div>
          <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary/90 opacity-0 group-[.active]:opacity-100" />
        </NavLink>
      )}

      <NavLink
        to="/admin/financeiro"
        onClick={() => setMobileNavOpen(false)}
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
        onClick={() => setMobileNavOpen(false)}
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
        onClick={() => setMobileNavOpen(false)}
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
        onClick={() => setMobileNavOpen(false)}
        className={({ isActive }) => `${baseItem} ${isActive ? activeItem : inactiveItem} ${isActive ? 'active' : ''}`}
      >
        <div className="relative">
          <FileText className="w-5 h-5 text-muted-foreground" />
          {pendingNotesCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-[10px] font-bold text-destructive-foreground rounded-full flex items-center justify-center animate-pulse">
              {pendingNotesCount > 9 ? '9+' : pendingNotesCount}
            </span>
          )}
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Prontuários</span>
            {pendingNotesCount > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-accent text-accent-foreground border-border">
                <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                {pendingNotesCount} pendente{pendingNotesCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">Prontuários psicológicos</span>
        </div>
        <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary/90 opacity-0 group-[.active]:opacity-100" />
      </NavLink>

      <NavLink
        to="/admin/lembretes"
        onClick={() => setMobileNavOpen(false)}
        className={({ isActive }) => `${baseItem} ${isActive ? activeItem : inactiveItem} ${isActive ? 'active' : ''}`}
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="font-semibold">Lembretes</span>
          <span className="text-xs text-muted-foreground">Histórico de notificações</span>
        </div>
        <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary/90 opacity-0 group-[.active]:opacity-100" />
      </NavLink>

      <NavLink
        to="/admin/configuracoes"
        onClick={() => setMobileNavOpen(false)}
        className={({ isActive }) => `${baseItem} ${isActive ? activeItem : inactiveItem} ${isActive ? 'active' : ''}`}
      >
        <Settings className="w-5 h-5 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="font-semibold">Configurações</span>
          <span className="text-xs text-muted-foreground">Preferências</span>
        </div>
        <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary/90 opacity-0 group-[.active]:opacity-100" />
      </NavLink>

      {hasRole("admin") && (
        <NavLink
          to="/admin/blog"
          onClick={() => setMobileNavOpen(false)}
          className={({ isActive }) => `${baseItem} ${isActive ? activeItem : inactiveItem} ${isActive ? 'active' : ''}`}
        >
          <FileEdit className="w-5 h-5 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-semibold">Blog</span>
            <span className="text-xs text-muted-foreground">Gerenciar artigos</span>
          </div>
          <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary/90 opacity-0 group-[.active]:opacity-100" />
        </NavLink>
      )}

      <div className="mt-2 pt-2 border-t border-border/30">
        <NavLink
          to="/admin/dev"
          onClick={() => setMobileNavOpen(false)}
          className={({ isActive }) => `${baseItem} ${isActive ? activeItem : inactiveItem} ${isActive ? 'active' : ''}`}
        >
          <Code2 className="w-5 h-5 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-semibold">DEV</span>
            <span className="text-xs text-muted-foreground">Central de desenvolvimento</span>
          </div>
          <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary/90 opacity-0 group-[.active]:opacity-100" />
        </NavLink>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 border-r border-border/50 p-4">
          <Link to="/admin" className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold">E</span>
            </div>
            <span className="font-display text-xl">Painel</span>
          </Link>

          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-2 mb-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors text-sm text-muted-foreground"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Buscar...</span>
            <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded border bg-background px-1.5 text-[10px]">
              ⌘K
            </kbd>
          </button>

          <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto scrollbar-none">
            {navItems}
          </nav>

          <div className="pt-4 border-t border-border/50">
            <div className="text-xs text-muted-foreground mb-2 px-1 truncate">{user?.name}</div>
            <Button variant="outline" className="w-full" onClick={doLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </aside>

        <main className="flex-1 min-h-screen">
          {/* Mobile Header */}
          <div className="md:hidden sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-4">
                  <Link to="/admin" className="flex items-center gap-2 mb-6" onClick={() => setMobileNavOpen(false)}>
                    <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-bold">E</span>
                    </div>
                    <span className="font-display text-xl">Painel</span>
                  </Link>
                  <nav className="flex flex-col gap-2">
                    {navItems}
                  </nav>
                  <div className="mt-6 pt-4 border-t border-border/50">
                    <Button variant="outline" className="w-full" onClick={doLogout}>
                      <LogOut className="w-4 h-4 mr-2" /> Sair
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <Link to="/admin" className="font-display">Painel</Link>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={doLogout}><LogOut className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};

export default AdminLayout;
