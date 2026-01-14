import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bell,
  CalendarDays,
  Handshake,
  FileText,
  Plus,
  RefreshCcw,
  ShieldCheck,
  UserCog,
  Users as UsersIcon,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  defaultAdminPreferences,
  defaultScheduleConfig,
  storage,
  uid,
  type AdminInsurance,
  type AdminPreferences,
  type AdminScheduleConfig,
  type AdminUser,
  type Role,
  type Patient,
  type Appointment,
  type JournalEntry,
} from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

const DAY_OPTIONS = [
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
] as const;

const TIMEZONE_OPTIONS = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
  { value: "America/Recife", label: "Recife (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
] as const;

const MOOD_LABELS: Record<JournalEntry["mood"], string> = {
  muito_bem: "Muito bem",
  bem: "Bem",
  neutro: "Neutro",
  desafiador: "Desafiador",
  dificil: "Difícil",
};

const clonePreferences = (pref: AdminPreferences): AdminPreferences => ({
  ...pref,
  notifications: { ...pref.notifications },
  scheduling: { ...pref.scheduling },
});

const cloneSchedule = (config: AdminScheduleConfig): AdminScheduleConfig => ({
  ...config,
  availableDays: [...config.availableDays],
});

const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  credential: "",
  bio: "",
  timezone: "America/Sao_Paulo",
};

const emptyPassword = { current: "", next: "", confirm: "" };

// User form for adding new users - now uses Supabase Auth
type NewUserForm = {
  name: string;
  email: string;
  password: string;
  role: "psychologist" | "admin";
};

const emptyUserForm: NewUserForm = {
  name: "",
  email: "",
  password: "",
  role: "psychologist",
};

const emptyInsuranceForm = { name: "", code: "", coverage: "", notes: "" };

const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const Configuracoes = () => {
  const { user, updateUser } = useAdminAuth();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({ ...emptyProfile });
  const [passwordForm, setPasswordForm] = useState({ ...emptyPassword });
  const [prefs, setPrefs] = useState<AdminPreferences>(() => clonePreferences(defaultAdminPreferences));
  const [initialPrefs, setInitialPrefs] = useState<AdminPreferences>(() => clonePreferences(defaultAdminPreferences));

  const [scheduleConfig, setScheduleConfig] = useState<AdminScheduleConfig>(() => cloneSchedule(defaultScheduleConfig));
  const [initialSchedule, setInitialSchedule] = useState<AdminScheduleConfig>(() => cloneSchedule(defaultScheduleConfig));

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userForm, setUserForm] = useState<NewUserForm>({ ...emptyUserForm });

  const [insurances, setInsurances] = useState<AdminInsurance[]>([]);
  const [insuranceForm, setInsuranceForm] = useState({ ...emptyInsuranceForm });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        credential: user.credential ?? "",
        bio: user.bio ?? "",
        timezone: user.timezone ?? "America/Sao_Paulo",
      });
    } else {
      setProfileForm({ ...emptyProfile });
    }
  }, [user]);

  useEffect(() => {
    const storedPrefs = storage.getAdminPreferences();
    const copy = clonePreferences(storedPrefs);
    setPrefs(copy);
    setInitialPrefs(copy);

    const schedule = storage.getScheduleConfig();
    const scheduleCopy = cloneSchedule(schedule);
    setScheduleConfig(scheduleCopy);
    setInitialSchedule(scheduleCopy);

    setUsers(storage.getUsers());
    setInsurances(storage.getInsuranceProviders());
    setPatients(storage.getPatients());
    setAppointments(storage.getAppointments());
    setJournals(storage.getJournalEntries());
  }, []);

  const profileDirty = useMemo(() => {
    if (!user) return false;
    return (
      user.name !== profileForm.name.trim() ||
      user.email !== profileForm.email.trim() ||
      (user.phone ?? "") !== profileForm.phone.trim() ||
      (user.credential ?? "") !== profileForm.credential.trim() ||
      (user.bio ?? "") !== profileForm.bio.trim() ||
      (user.timezone ?? "America/Sao_Paulo") !== profileForm.timezone
    );
  }, [profileForm, user]);

  const preferencesDirty = useMemo(() => JSON.stringify(prefs) !== JSON.stringify(initialPrefs), [prefs, initialPrefs]);
  const scheduleDirty = useMemo(() => JSON.stringify(scheduleConfig) !== JSON.stringify(initialSchedule), [scheduleConfig, initialSchedule]);

  const chartSummaries = useMemo(() => {
    return patients
      .map((patient) => {
        const relatedAppointments = appointments
          .filter((appt) => appt.patientId === patient.id)
          .sort((a, b) => new Date(b.dateTime || 0).getTime() - new Date(a.dateTime || 0).getTime());
        const relatedJournals = journals
          .filter((entry) => entry.patientId === patient.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const lastAppointment = relatedAppointments[0] || null;
        const lastJournal = relatedJournals[0] || null;
        const nextAppointment = relatedAppointments.find((appt) => new Date(appt.dateTime).getTime() >= Date.now()) || null;

        return {
          patient,
          totalAppointments: relatedAppointments.length,
          totalNotes: relatedJournals.length,
          lastAppointment,
          nextAppointment,
          lastJournal,
        };
      })
      .sort((a, b) => a.patient.name.localeCompare(b.patient.name));
  }, [patients, appointments, journals]);

  const totalChartNotes = useMemo(
    () => chartSummaries.reduce((sum, chart) => sum + chart.totalNotes, 0),
    [chartSummaries]
  );

  const resetPreferences = () => {
    const next = clonePreferences(defaultAdminPreferences);
    storage.saveAdminPreferences(next);
    setPrefs(next);
    setInitialPrefs(next);
    toast({ title: "Preferências restauradas", description: "Voltamos às preferências padrão do painel." });
  };

  const resetSchedule = () => {
    const next = cloneSchedule(defaultScheduleConfig);
    storage.saveScheduleConfig(next);
    setScheduleConfig(next);
    setInitialSchedule(next);
    toast({ title: "Agenda restaurada", description: "Horários e dias retomados ao padrão." });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const name = profileForm.name.trim();
    const email = profileForm.email.trim();

    if (!name || !email) {
      toast({ title: "Campos obrigatórios", description: "Informe nome e e-mail válidos.", variant: "destructive" });
      return;
    }

    const allUsers = storage.getUsers();
    const emailTaken = allUsers.some((u) => u.email === email && u.id !== user.id);
    if (emailTaken) {
      toast({ title: "E-mail em uso", description: "Já existe um usuário com este endereço de e-mail.", variant: "destructive" });
      return;
    }

    setSavingProfile(true);
    await updateUser({
      name,
      phone: profileForm.phone.trim(),
      credential: profileForm.credential.trim(),
      bio: profileForm.bio.trim(),
      timezone: profileForm.timezone,
    });
    setProfileForm({
      name,
      email: profileForm.email, // Keep email display only
      phone: profileForm.phone.trim(),
      credential: profileForm.credential.trim(),
      bio: profileForm.bio.trim(),
      timezone: profileForm.timezone,
    });
    setSavingProfile(false);
    setUsers(storage.getUsers());
    toast({ title: "Perfil atualizado", description: "Suas informações foram atualizadas." });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { current, next, confirm } = passwordForm;
    if (!current || !next || !confirm) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos de senha.", variant: "destructive" });
      return;
    }

    if (next.length < 6) {
      toast({ title: "Senha fraca", description: "Utilize pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    if (next !== confirm) {
      toast({ title: "Confirmação inválida", description: "A nova senha e a confirmação precisam ser iguais.", variant: "destructive" });
      return;
    }

    setSavingPassword(true);
    try {
      // Use Supabase Auth to update password
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) {
        toast({ title: "Erro ao atualizar senha", description: error.message, variant: "destructive" });
      } else {
        setPasswordForm({ ...emptyPassword });
        toast({ title: "Senha atualizada", description: "Use a nova senha no próximo acesso." });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Erro desconhecido", variant: "destructive" });
    }
    setSavingPassword(false);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    const copy = clonePreferences(prefs);
    storage.saveAdminPreferences(copy);
    setInitialPrefs(copy);
    setSavingPrefs(false);
    toast({ title: "Preferências salvas", description: "Aplicamos suas preferências neste navegador." });
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSchedule(true);
    const copy = cloneSchedule(scheduleConfig);
    storage.saveScheduleConfig(copy);
    setInitialSchedule(copy);
    setSavingSchedule(false);
    toast({ title: "Agenda salva", description: "Disponibilidades atualizadas para novos agendamentos." });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast({ title: "Preencha os campos do usuário", variant: "destructive" });
      return;
    }

    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userForm.email,
        password: userForm.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) {
        toast({ title: "Erro ao criar usuário", description: authError.message, variant: "destructive" });
        return;
      }

      if (authData.user) {
        // Create profile
        await supabase.from("admin_profiles").insert({
          user_id: authData.user.id,
          name: userForm.name,
        });

        toast({ 
          title: "Profissional adicionado", 
          description: `${userForm.name} foi criado. Atribua permissões via banco de dados (user_roles).` 
        });
        setUserForm({ ...emptyUserForm });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Erro desconhecido", variant: "destructive" });
    }
  };

  const handleRemoveUser = (id: string) => {
    if (user?.id === id) {
      toast({ title: "Não é possível remover este usuário", description: "Faça login com outra conta para remover este acesso.", variant: "destructive" });
      return;
    }
    const nextUsers = users.filter((u) => u.id !== id);
    storage.saveUsers(nextUsers);
    setUsers(nextUsers);
    toast({ title: "Usuário removido" });
  };

  const handleAddInsurance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insuranceForm.name.trim()) {
      toast({ title: "Informe o nome do convênio", variant: "destructive" });
      return;
    }
    const provider: AdminInsurance = {
      id: uid(),
      name: insuranceForm.name.trim(),
      code: insuranceForm.code.trim() || undefined,
      coverage: insuranceForm.coverage.trim() || undefined,
      notes: insuranceForm.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    const nextProviders = [provider, ...insurances];
    storage.saveInsuranceProviders(nextProviders);
    setInsurances(nextProviders);
    setInsuranceForm({ ...emptyInsuranceForm });
    toast({ title: "Convênio cadastrado", description: `${provider.name} adicionado à lista.` });
  };

  const handleRemoveInsurance = (id: string) => {
    const nextProviders = insurances.filter((item) => item.id !== id);
    storage.saveInsuranceProviders(nextProviders);
    setInsurances(nextProviders);
    toast({ title: "Convênio removido" });
  };

  const psychologistsCount = useMemo(
    () => users.filter((u) => u.roles.includes("psychologist")).length,
    [users]
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-light">Configurações</h1>
        <p className="text-muted-foreground">Personalize o painel, equipe e rotinas administrativas.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
              <TabsTrigger value="charts">Prontuários</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="schedule">Agenda</TabsTrigger>
              <TabsTrigger value="insurance">Convênios</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card className="card-glass">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">Preferências gerais</CardTitle>
                  </div>
                  <CardDescription>Tema, idioma e notificações aplicados somente neste navegador.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSavePreferences} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label>Tema do painel</Label>
                        <Select
                          value={prefs.theme}
                          onValueChange={(value: AdminPreferences["theme"]) =>
                            setPrefs((prev) => ({ ...prev, theme: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha o tema" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">Automático (sistema)</SelectItem>
                            <SelectItem value="light">Claro</SelectItem>
                            <SelectItem value="dark">Escuro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Idioma</Label>
                        <Select
                          value={prefs.language}
                          onValueChange={(value: AdminPreferences["language"]) =>
                            setPrefs((prev) => ({ ...prev, language: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha o idioma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                            <SelectItem value="en-US">Inglês</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator className="bg-border/60" />

                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">Notificações por e-mail</p>
                          <p className="text-sm text-muted-foreground">Alertas de novos pacientes, pagamentos e lembretes.</p>
                        </div>
                        <Switch
                          checked={prefs.notifications.email}
                          onCheckedChange={(checked) =>
                            setPrefs((prev) => ({
                              ...prev,
                              notifications: { ...prev.notifications, email: checked },
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">Notificações push</p>
                          <p className="text-sm text-muted-foreground">Mensagens rápidas dentro do painel administrativo.</p>
                        </div>
                        <Switch
                          checked={prefs.notifications.push}
                          onCheckedChange={(checked) =>
                            setPrefs((prev) => ({
                              ...prev,
                              notifications: { ...prev.notifications, push: checked },
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">SMS emergencial</p>
                          <p className="text-sm text-muted-foreground">Requer integração externa; recomendamos uso apenas em plantões críticos.</p>
                        </div>
                        <Switch
                          checked={prefs.notifications.sms}
                          onCheckedChange={(checked) =>
                            setPrefs((prev) => ({
                              ...prev,
                              notifications: { ...prev.notifications, sms: checked },
                            }))
                          }
                        />
                      </div>
                    </div>

                    <Separator className="bg-border/60" />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label>Visão padrão da agenda</Label>
                        <Select
                          value={prefs.scheduling.defaultView}
                          onValueChange={(value: AdminPreferences["scheduling"]["defaultView"]) =>
                            setPrefs((prev) => ({
                              ...prev,
                              scheduling: { ...prev.scheduling, defaultView: value },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Visão padrão" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="day">Dia</SelectItem>
                            <SelectItem value="week">Semana</SelectItem>
                            <SelectItem value="month">Mês</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Semana inicia em</Label>
                        <Select
                          value={prefs.scheduling.weekStartsOn}
                          onValueChange={(value: AdminPreferences["scheduling"]["weekStartsOn"]) =>
                            setPrefs((prev) => ({
                              ...prev,
                              scheduling: { ...prev.scheduling, weekStartsOn: value },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Início da semana" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monday">Segunda-feira</SelectItem>
                            <SelectItem value="sunday">Domingo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Button type="button" variant="ghost" className="gap-2" onClick={resetPreferences}>
                        <RefreshCcw className="w-4 h-4" />
                        Restaurar padrões
                      </Button>
                      <Button type="submit" className="btn-futuristic" disabled={!preferencesDirty || savingPrefs}>
                        {savingPrefs ? "Salvando..." : "Salvar preferências"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              <Card className="card-glass">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">Perfil profissional</CardTitle>
                  </div>
                  <CardDescription>Atualize dados pessoais exibidos em equipes e relatórios.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="profile-name">Nome completo</Label>
                        <Input
                          id="profile-name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Seu nome"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="profile-email">E-mail</Label>
                        <Input
                          id="profile-email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="voce@exemplo.com"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="profile-phone">Telefone</Label>
                        <Input
                          id="profile-phone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="profile-credential">Registro profissional / CRP</Label>
                        <Input
                          id="profile-credential"
                          value={profileForm.credential}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, credential: e.target.value }))}
                          placeholder="CRP 00/00000"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="profile-timezone">Fuso horário principal</Label>
                      <Select
                        value={profileForm.timezone}
                        onValueChange={(value) => setProfileForm((prev) => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger id="profile-timezone">
                          <SelectValue placeholder="Selecione o fuso" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="profile-bio">Mini bio</Label>
                      <Textarea
                        id="profile-bio"
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                        placeholder="Conte, em poucas linhas, seu foco clínico e abordagens."
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button type="submit" disabled={!profileDirty || savingProfile} className="btn-futuristic">
                        {savingProfile ? "Salvando..." : "Salvar alterações"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="card-glass">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">Segurança</CardTitle>
                  </div>
                  <CardDescription>Troque sua senha periodicamente e mantenha o painel protegido.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="security-current">Senha atual</Label>
                        <Input
                          id="security-current"
                          type="password"
                          value={passwordForm.current}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, current: e.target.value }))}
                          placeholder="••••••"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="security-new">Nova senha</Label>
                        <Input
                          id="security-new"
                          type="password"
                          value={passwordForm.next}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, next: e.target.value }))}
                          placeholder="mín. 6 caracteres"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="security-confirm">Confirmar nova senha</Label>
                        <Input
                          id="security-confirm"
                          type="password"
                          value={passwordForm.confirm}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))}
                          placeholder="repita a senha"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={savingPassword || !passwordForm.current || !passwordForm.next || !passwordForm.confirm}
                      >
                        {savingPassword ? "Atualizando..." : "Atualizar senha"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts">
              <Card className="card-glass">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">Prontuários</CardTitle>
                  </div>
                  <CardDescription>Visão consolidada dos prontuários clínicos armazenados localmente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {chartSummaries.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum prontuário encontrado. Cadastre pacientes e registre sessões para visualizá-los aqui.
                    </p>
                  )}
                  {chartSummaries.map((chart) => {
                    const status = chart.patient.status === "inactive" ? "Inativo" : "Ativo";
                    const moodLabel = chart.lastJournal ? MOOD_LABELS[chart.lastJournal.mood] : null;
                    return (
                      <div
                        key={chart.patient.id}
                        className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-3"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground text-lg">{chart.patient.name}</span>
                              <Badge variant={chart.patient.status === "inactive" ? "outline" : "secondary"} className="capitalize">
                                {status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-x-2">
                              {chart.patient.email && <span>{chart.patient.email}</span>}
                              {chart.patient.phone && <span>• {chart.patient.phone}</span>}
                              {chart.patient.profession && <span>• {chart.patient.profession}</span>}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild className="inline-flex items-center gap-2">
                            <Link to={`/admin/pacientes/${chart.patient.id}`}>Abrir prontuário</Link>
                          </Button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-3 text-sm text-muted-foreground">
                          <div className="flex flex-col gap-1">
                            <span className="uppercase text-xs tracking-wide">Último atendimento</span>
                            <span className="text-foreground">
                              {chart.lastAppointment ? formatDateTime(chart.lastAppointment.dateTime) : "Sem atendimentos registrados"}
                            </span>
                            {chart.nextAppointment && (
                              <span className="text-xs">Próximo: {formatDateTime(chart.nextAppointment.dateTime)}</span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="uppercase text-xs tracking-wide">Evoluções registradas</span>
                            <span className="text-foreground">{chart.totalNotes} anotação(ões)</span>
                            {moodLabel && (
                              <span className="text-xs">
                                Última evolução: {moodLabel} • {formatDateTime(chart.lastJournal?.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="uppercase text-xs tracking-wide">Histórico</span>
                            <span className="text-foreground">
                              {chart.totalAppointments} consulta(s) • {chart.patient.createdAt ? formatDateTime(chart.patient.createdAt) : "Cadastro recente"}
                            </span>
                            {chart.patient.notes && (
                              <span className="text-xs truncate">Nota inicial: {chart.patient.notes}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <div className="space-y-6">
                <Card className="card-glass">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-5 h-5 text-primary" />
                      <CardTitle className="text-xl">Equipe</CardTitle>
                    </div>
                    <CardDescription>Cadastre novos acessos ou ajuste permissões existentes.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddUser} className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="users-name">Nome</Label>
                        <Input
                          id="users-name"
                          value={userForm.name || ""}
                          onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="users-email">E-mail</Label>
                        <Input
                          id="users-email"
                          type="email"
                          value={userForm.email || ""}
                          onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="users-password">Senha temporária</Label>
                        <Input
                          id="users-password"
                          type="password"
                          value={userForm.password || ""}
                          onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                          placeholder="defina uma senha inicial"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="users-role">Permissão</Label>
                        <Select
                          value={userForm.role}
                          onValueChange={(value) => setUserForm((prev) => ({ ...prev, role: value as "psychologist" | "admin" }))}
                        >
                          <SelectTrigger id="users-role">
                            <SelectValue placeholder="Selecione a permissão" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="psychologist">Psicólogo</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2 flex justify-end">
                        <Button type="submit" className="btn-futuristic inline-flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Adicionar profissional
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="card-glass">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Profissionais com acesso</CardTitle>
                    <CardDescription>Lista atualizada com permissões e e-mails associados.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {users.length === 0 && <p className="text-sm text-muted-foreground">Nenhum profissional cadastrado no momento.</p>}
                    {users.map((u) => (
                      <div key={u.id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/60 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-semibold text-foreground">{u.name}</div>
                          <div className="text-sm text-muted-foreground">{u.email}</div>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs">
                            {u.roles.map((role) => (
                              <Badge key={role} variant="secondary" className="capitalize">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="inline-flex items-center gap-2" onClick={() => handleRemoveUser(u.id)}>
                          <Trash2 className="w-4 h-4" />
                          Remover
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="schedule">
              <Card className="card-glass">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">Agenda e disponibilidade</CardTitle>
                  </div>
                  <CardDescription>Defina horários padrão para abertura de sessões e bloqueios automáticos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveSchedule} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label>Início do expediente</Label>
                        <Input
                          type="time"
                          value={scheduleConfig.startHour}
                          onChange={(e) => setScheduleConfig((prev) => ({ ...prev, startHour: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Término do expediente</Label>
                        <Input
                          type="time"
                          value={scheduleConfig.endHour}
                          onChange={(e) => setScheduleConfig((prev) => ({ ...prev, endHour: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Início da pausa</Label>
                        <Input
                          type="time"
                          value={scheduleConfig.breakStart || ""}
                          onChange={(e) => setScheduleConfig((prev) => ({ ...prev, breakStart: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Término da pausa</Label>
                        <Input
                          type="time"
                          value={scheduleConfig.breakEnd || ""}
                          onChange={(e) => setScheduleConfig((prev) => ({ ...prev, breakEnd: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label>Duração padrão da sessão (min)</Label>
                        <Input
                          type="number"
                          min={15}
                          step={5}
                          value={scheduleConfig.slotDuration}
                          onChange={(e) =>
                            setScheduleConfig((prev) => ({
                              ...prev,
                              slotDuration: Math.max(15, Number(e.target.value) || 0),
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Pausa entre sessões (min)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={5}
                          value={scheduleConfig.gapBetweenAppointments}
                          onChange={(e) =>
                            setScheduleConfig((prev) => ({
                              ...prev,
                              gapBetweenAppointments: Math.max(0, Number(e.target.value) || 0),
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                      <div>
                        <p className="font-medium">Permitir agendamento online</p>
                        <p className="text-sm text-muted-foreground">Disponibiliza slots para autoagendamento no portal do paciente.</p>
                      </div>
                      <Switch
                        checked={scheduleConfig.allowOnlineBooking}
                        onCheckedChange={(checked) => setScheduleConfig((prev) => ({ ...prev, allowOnlineBooking: checked }))}
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <Label>Dias com atendimento</Label>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                        {DAY_OPTIONS.map((day) => {
                          const checked = scheduleConfig.availableDays.includes(day.value);
                          return (
                            <label key={day.value} className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 p-2 text-sm">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(state) => {
                                  setScheduleConfig((prev) => {
                                    const nextDays = new Set(prev.availableDays);
                                    if (state === true) {
                                      nextDays.add(day.value);
                                    } else {
                                      nextDays.delete(day.value);
                                    }
                                    const ordered = DAY_OPTIONS.map((opt) => opt.value).filter((value) => nextDays.has(value));
                                    return { ...prev, availableDays: ordered };
                                  });
                                }}
                              />
                              {day.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="schedule-notes">Observações internas</Label>
                      <Textarea
                        id="schedule-notes"
                        value={scheduleConfig.notes || ""}
                        onChange={(e) => setScheduleConfig((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Registre combinações especiais, bloqueios recorrentes ou avisos para a equipe."
                        rows={4}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Button type="button" variant="ghost" className="gap-2" onClick={resetSchedule}>
                        <RefreshCcw className="w-4 h-4" />
                        Restaurar agenda padrão
                      </Button>
                      <Button type="submit" className="btn-futuristic" disabled={!scheduleDirty || savingSchedule}>
                        {savingSchedule ? "Salvando..." : "Salvar agenda"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insurance">
              <div className="space-y-6">
                <Card className="card-glass">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Handshake className="w-5 h-5 text-primary" />
                      <CardTitle className="text-xl">Convênios e parcerias</CardTitle>
                    </div>
                    <CardDescription>Registre os convênios aceitos para facilitar o faturamento.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddInsurance} className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="insurance-name">Nome do convênio</Label>
                        <Input
                          id="insurance-name"
                          value={insuranceForm.name}
                          onChange={(e) => setInsuranceForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Plano Vida Saudável"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="insurance-code">Código interno</Label>
                        <Input
                          id="insurance-code"
                          value={insuranceForm.code}
                          onChange={(e) => setInsuranceForm((prev) => ({ ...prev, code: e.target.value }))}
                          placeholder="OPCIONAL-001"
                        />
                      </div>
                      <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="insurance-coverage">Cobertura</Label>
                          <Input
                            id="insurance-coverage"
                            value={insuranceForm.coverage}
                            onChange={(e) => setInsuranceForm((prev) => ({ ...prev, coverage: e.target.value }))}
                            placeholder="Sessões individuais, avaliação inicial..."
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="insurance-notes">Observações</Label>
                          <Input
                            id="insurance-notes"
                            value={insuranceForm.notes}
                            onChange={(e) => setInsuranceForm((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Ex: renovação anual, consultas até 50 min"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2 flex justify-end">
                        <Button type="submit" className="btn-futuristic inline-flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Cadastrar convênio
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="card-glass">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Convênios ativos</CardTitle>
                    <CardDescription>Gerencie contratos vigentes e suas particularidades.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {insurances.length === 0 && <p className="text-sm text-muted-foreground">Nenhum convênio cadastrado. Cadastre os principais planos aceitos.</p>}
                    {insurances.map((provider) => (
                      <div key={provider.id} className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-foreground">{provider.name}</div>
                            {provider.code && <div className="text-xs text-muted-foreground">Código: {provider.code}</div>}
                          </div>
                          <Button variant="outline" size="sm" className="inline-flex items-center gap-2" onClick={() => handleRemoveInsurance(provider.id)}>
                            <Trash2 className="w-4 h-4" />
                            Remover
                          </Button>
                        </div>
                        {provider.coverage && <p className="text-sm text-muted-foreground">Cobertura: {provider.coverage}</p>}
                        {provider.notes && <p className="text-sm text-muted-foreground">Observações: {provider.notes}</p>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="card-glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Resumo da conta</CardTitle>
              <CardDescription>Dados armazenados somente no seu navegador para fins de demonstração.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="text-base font-medium text-foreground">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="text-base font-medium text-foreground">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acessos</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user?.roles.map((role) => (
                    <Badge key={role} variant="secondary" className="capitalize">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fuso horário</p>
                <p className="text-base font-medium text-foreground">
                  {TIMEZONE_OPTIONS.find((tz) => tz.value === (user?.timezone ?? "America/Sao_Paulo"))?.label || "Brasília (GMT-3)"}
                </p>
              </div>
              <div className="rounded-2xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground space-y-2">
                <p>Este painel guarda dados fictícios em <strong>localStorage</strong>. Limpe o cache do navegador para reiniciar o ambiente.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">Agenda rápida</CardTitle>
              </div>
              <CardDescription>Resumo das disponibilidades publicadas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dias ativos</span>
                <span className="font-medium">
                  {scheduleConfig.availableDays.length > 0
                    ? scheduleConfig.availableDays
                        .map((day) => DAY_OPTIONS.find((opt) => opt.value === day)?.label)
                        .filter(Boolean)
                        .join(", ")
                    : "Nenhum"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Jornada</span>
                <span className="font-medium">
                  {scheduleConfig.startHour} - {scheduleConfig.endHour}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sessões</span>
                <span className="font-medium">
                  {scheduleConfig.slotDuration} min + {scheduleConfig.gapBetweenAppointments} min intervalo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Agendamento online</span>
                <span className="font-medium">
                  {scheduleConfig.allowOnlineBooking ? "Ativo" : "Desativado"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">Equipe & convênios</CardTitle>
              </div>
              <CardDescription>Visão rápida das capacidades clínicas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Profissionais totais</span>
                <span className="font-medium">{users.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Psychologists</span>
                <span className="font-medium">{psychologistsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Prontuários ativos</span>
                <span className="font-medium">{patients.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Evoluções registradas</span>
                <span className="font-medium">{totalChartNotes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Convênios cadastrados</span>
                <span className="font-medium">{insurances.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Configuracoes;
