import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";

// Critical path: landing page loaded eagerly
import Index from "./pages/Index";

// Lazy-loaded routes (code-split)
const BlogList = lazy(() => import("./pages/BlogList"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin routes
const Login = lazy(() => import("@/pages/admin/Login"));
const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Patients = lazy(() => import("@/pages/admin/Patients"));
const Appointments = lazy(() => import("@/pages/admin/Appointments"));
const BlogAdmin = lazy(() => import("@/pages/admin/BlogAdmin"));
const Users = lazy(() => import("@/pages/admin/Users"));
const PatientProfile = lazy(() => import("@/pages/admin/PatientProfile"));
const Financeiro = lazy(() => import("@/pages/admin/Financeiro"));
const AgentesIA = lazy(() => import("@/pages/admin/AgentesIA"));
const Arquivos = lazy(() => import("@/pages/admin/Arquivos"));
const Prontuarios = lazy(() => import("@/pages/admin/Prontuarios"));
const Configuracoes = lazy(() => import("@/pages/admin/Configuracoes"));
const TarefasCasa = lazy(() => import("@/pages/admin/TarefasCasa"));
const ReminderHistory = lazy(() => import("@/pages/admin/ReminderHistory"));

// Patient portal routes
const PortalLogin = lazy(() => import("@/pages/patient/PortalLogin"));
const PortalHome = lazy(() => import("@/pages/patient/PortalHome"));
const PortalSessions = lazy(() => import("@/pages/patient/PortalSessions"));
const PortalActivities = lazy(() => import("@/pages/patient/PortalActivities"));
const PortalNotes = lazy(() => import("@/pages/patient/PortalNotes"));
const PortalMessages = lazy(() => import("@/pages/patient/PortalMessages"));
const PortalTreatmentPlan = lazy(() => import("@/pages/patient/PortalTreatmentPlan"));
const PortalMaterials = lazy(() => import("@/pages/patient/PortalMaterials"));
const PortalSettings = lazy(() => import("@/pages/patient/PortalSettings"));

// Appointment action routes
const ConfirmAppointment = lazy(() => import("@/pages/appointment/ConfirmAppointment"));
const CancelAppointment = lazy(() => import("@/pages/appointment/CancelAppointment"));
const RescheduleAppointment = lazy(() => import("@/pages/appointment/RescheduleAppointment"));

// Auth providers loaded eagerly (needed for route protection)
import { AdminAuthProvider, ProtectedRoute } from "@/context/AdminAuth";
import { PatientAuthProvider, PatientProtectedRoute } from "@/context/PatientAuth";

const queryClient = new QueryClient();

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="equanimite-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <BrowserRouter>
            <AdminAuthProvider>
            <PatientAuthProvider>
              <Suspense fallback={<PageLoader />}>
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
              </Suspense>
            </PatientAuthProvider>
            </AdminAuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
