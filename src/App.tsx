import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import BlogList from "./pages/BlogList";
import BlogPost from "./pages/BlogPost";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import NotFound from "./pages/NotFound";
import { AdminAuthProvider, ProtectedRoute } from "@/context/AdminAuth";
import { PatientAuthProvider, PatientProtectedRoute } from "@/context/PatientAuth";
import PortalLogin from "@/pages/patient/PortalLogin";
import PortalHome from "@/pages/patient/PortalHome";
import PortalSessions from "@/pages/patient/PortalSessions";
import PortalActivities from "@/pages/patient/PortalActivities";
import PortalNotes from "@/pages/patient/PortalNotes";
import PortalMessages from "@/pages/patient/PortalMessages";
import PortalTreatmentPlan from "@/pages/patient/PortalTreatmentPlan";
import PortalMaterials from "@/pages/patient/PortalMaterials";
import PortalSettings from "@/pages/patient/PortalSettings";
import Login from "@/pages/admin/Login";
import Dashboard from "@/pages/admin/Dashboard";
import Patients from "@/pages/admin/Patients";
import Appointments from "@/pages/admin/Appointments";
import BlogAdmin from "@/pages/admin/BlogAdmin";
import Users from "@/pages/admin/Users";
import PatientProfile from "@/pages/admin/PatientProfile";
import Financeiro from "@/pages/admin/Financeiro";
import AgentesIA from "@/pages/admin/AgentesIA";
import Arquivos from "@/pages/admin/Arquivos";
import Prontuarios from "@/pages/admin/Prontuarios";
import Configuracoes from "@/pages/admin/Configuracoes";
import TarefasCasa from "@/pages/admin/TarefasCasa";
import ConfirmAppointment from "@/pages/appointment/ConfirmAppointment";
import CancelAppointment from "@/pages/appointment/CancelAppointment";
import RescheduleAppointment from "@/pages/appointment/RescheduleAppointment";
import ReminderHistory from "@/pages/admin/ReminderHistory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="equanimite-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AdminAuthProvider>
          <PatientAuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
              <Route path="/termos-de-uso" element={<TermsOfUse />} />
              {/* Patient Portal */}
              <Route path="/portal" element={<PortalLogin />} />
              <Route path="/portal/app" element={<PatientProtectedRoute><PortalHome /></PatientProtectedRoute>} />
              <Route path="/portal/sessoes" element={<PatientProtectedRoute><PortalSessions /></PatientProtectedRoute>} />
              <Route path="/portal/plano" element={<PatientProtectedRoute><PortalTreatmentPlan /></PatientProtectedRoute>} />
              <Route path="/portal/atividades" element={<PatientProtectedRoute><PortalActivities /></PatientProtectedRoute>} />
              <Route path="/portal/anotacoes" element={<PatientProtectedRoute><PortalNotes /></PatientProtectedRoute>} />
              <Route path="/portal/mensagens" element={<PatientProtectedRoute><PortalMessages /></PatientProtectedRoute>} />
              <Route path="/portal/materiais" element={<PatientProtectedRoute><PortalMaterials /></PatientProtectedRoute>} />
              <Route path="/portal/configuracoes" element={<PatientProtectedRoute><PortalSettings /></PatientProtectedRoute>} />
              {/* Public Appointment Action Routes */}
              <Route path="/agendamento/confirmar" element={<ConfirmAppointment />} />
              <Route path="/agendamento/cancelar" element={<CancelAppointment />} />
              <Route path="/agendamento/reagendar" element={<RescheduleAppointment />} />
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/admin/pacientes" element={<ProtectedRoute roles={["psychologist","admin"]}><Patients /></ProtectedRoute>} />
              <Route path="/admin/pacientes/:id" element={<ProtectedRoute roles={["psychologist","admin"]}><PatientProfile /></ProtectedRoute>} />
              <Route path="/admin/agendamentos" element={<ProtectedRoute roles={["psychologist","admin"]}><Appointments /></ProtectedRoute>} />
              <Route path="/admin/tarefas-casa" element={<ProtectedRoute roles={["psychologist","admin"]}><TarefasCasa /></ProtectedRoute>} />
              <Route path="/admin/blog" element={<ProtectedRoute roles={["admin"]}><BlogAdmin /></ProtectedRoute>} />
              <Route path="/admin/profissionais" element={<ProtectedRoute roles={["admin"]}><Users /></ProtectedRoute>} />
              <Route path="/admin/financeiro" element={<ProtectedRoute roles={["psychologist","admin"]}><Financeiro /></ProtectedRoute>} />
              <Route path="/admin/agentes-ia" element={<ProtectedRoute><AgentesIA /></ProtectedRoute>} />
              <Route path="/admin/arquivos" element={<ProtectedRoute roles={["psychologist","admin"]}><Arquivos /></ProtectedRoute>} />
              <Route path="/admin/prontuarios" element={<ProtectedRoute roles={["psychologist","admin"]}><Prontuarios /></ProtectedRoute>} />
              <Route path="/admin/lembretes" element={<ProtectedRoute roles={["psychologist","admin"]}><ReminderHistory /></ProtectedRoute>} />
              <Route path="/admin/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PatientAuthProvider>
          </AdminAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
