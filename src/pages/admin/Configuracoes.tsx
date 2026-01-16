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
  Plus,
  RefreshCcw,
  ShieldCheck,
  UserCog,
  Users as UsersIcon,
  Trash2,
  Loader2,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAdminPreferences, type AdminPreferences } from "@/hooks/useAdminPreferences";
import { useToast } from "@/hooks/use-toast";
import { SessionPackagesManager } from "@/components/appointments/SessionPackagesManager";
import { InsurancesManager } from "@/components/appointments/InsurancesManager";

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

const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  credential: "",
  bio: "",
  timezone: "America/Sao_Paulo",
};

const emptyPassword = { current: "", next: "", confirm: "" };

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

const Configuracoes = () => {
  const { user, updateUser } = useAdminAuth();
  const { toast } = useToast();
  const { preferences, loading: prefsLoading, saving: prefsSaving, savePreferences, refreshPreferences } = useAdminPreferences();

  const [profileForm, setProfileForm] = useState({ ...emptyProfile });
  const [passwordForm, setPasswordForm] = useState({ ...emptyPassword });
  const [userForm, setUserForm] = useState<NewUserForm>({ ...emptyUserForm });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Local state for preferences form
  const [prefsForm, setPrefsForm] = useState<AdminPreferences>({
    email_notifications: true,
    session_reminders: true,
    reminder_hours_before: 24,
    default_session_duration: 50,
    session_interval: 10,
    available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    work_start_time: "07:00",
    work_end_time: "19:00",
    break_start_time: "12:00",
    break_end_time: "13:00",
    allow_online_booking: true,
    theme: "light",
    language: "pt-BR",
  });

  // Sync preferences from hook to form
  useEffect(() => {
    if (!prefsLoading) {
      setPrefsForm(preferences);
    }
  }, [preferences, prefsLoading]);

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

  const preferencesDirty = useMemo(() => {
    return JSON.stringify(prefsForm) !== JSON.stringify(preferences);
  }, [prefsForm, preferences]);

  const resetPreferences = async () => {
    const defaultPrefs: AdminPreferences = {
      email_notifications: true,
      session_reminders: true,
      reminder_hours_before: 24,
      default_session_duration: 50,
      session_interval: 10,
      available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      work_start_time: "07:00",
      work_end_time: "19:00",
      break_start_time: "12:00",
      break_end_time: "13:00",
      allow_online_booking: true,
      theme: "light",
      language: "pt-BR",
    };
    const success = await savePreferences(defaultPrefs);
    if (success) {
      setPrefsForm(defaultPrefs);
      toast({ title: "Preferências restauradas", description: "Voltamos às preferências padrão." });
    }
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

    setSavingProfile(true);
    await updateUser({
      name,
      phone: profileForm.phone.trim(),
      credential: profileForm.credential.trim(),
      bio: profileForm.bio.trim(),
      timezone: profileForm.timezone,
    });
    setSavingProfile(false);
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

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePreferences(prefsForm);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast({ title: "Preencha os campos do usuário", variant: "destructive" });
      return;
    }

    try {
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

  if (prefsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

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
              <TabsTrigger value="schedule">Agenda</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="insurance">Convênios</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card className="card-glass">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">Preferências gerais</CardTitle>
                  </div>
                  <CardDescription>Tema, idioma e notificações sincronizados na nuvem.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSavePreferences} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label>Tema do painel</Label>
                        <Select
                          value={prefsForm.theme}
                          onValueChange={(value) => setPrefsForm(prev => ({ ...prev, theme: value }))}
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
                          value={prefsForm.language}
                          onValueChange={(value) => setPrefsForm(prev => ({ ...prev, language: value }))}
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
                          checked={prefsForm.email_notifications}
                          onCheckedChange={(checked) => setPrefsForm(prev => ({ ...prev, email_notifications: checked }))}
                        />
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">Lembretes de sessão</p>
                          <p className="text-sm text-muted-foreground">Receber lembretes antes das sessões agendadas.</p>
                        </div>
                        <Switch
                          checked={prefsForm.session_reminders}
                          onCheckedChange={(checked) => setPrefsForm(prev => ({ ...prev, session_reminders: checked }))}
                        />
                      </div>
                      {prefsForm.session_reminders && (
                        <div className="flex flex-col gap-2 pl-4 border-l-2 border-primary/20">
                          <Label>Horas antes do lembrete</Label>
                          <Select
                            value={String(prefsForm.reminder_hours_before)}
                            onValueChange={(value) => setPrefsForm(prev => ({ ...prev, reminder_hours_before: Number(value) }))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 hora</SelectItem>
                              <SelectItem value="2">2 horas</SelectItem>
                              <SelectItem value="12">12 horas</SelectItem>
                              <SelectItem value="24">24 horas</SelectItem>
                              <SelectItem value="48">48 horas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Button type="button" variant="ghost" className="gap-2" onClick={resetPreferences}>
                        <RefreshCcw className="w-4 h-4" />
                        Restaurar padrões
                      </Button>
                      <Button type="submit" className="btn-futuristic" disabled={!preferencesDirty || prefsSaving}>
                        {prefsSaving ? "Salvando..." : "Salvar preferências"}
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
                          onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Seu nome"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="profile-email">E-mail</Label>
                        <Input
                          id="profile-email"
                          type="email"
                          value={profileForm.email}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">E-mail não pode ser alterado.</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="profile-phone">Telefone</Label>
                        <Input
                          id="profile-phone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="profile-credential">Registro profissional / CRP</Label>
                        <Input
                          id="profile-credential"
                          value={profileForm.credential}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, credential: e.target.value }))}
                          placeholder="CRP 00/00000"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="profile-timezone">Fuso horário principal</Label>
                      <Select
                        value={profileForm.timezone}
                        onValueChange={(value) => setProfileForm(prev => ({ ...prev, timezone: value }))}
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
                        onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
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
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                          placeholder="••••••"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="security-new">Nova senha</Label>
                        <Input
                          id="security-new"
                          type="password"
                          value={passwordForm.next}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, next: e.target.value }))}
                          placeholder="mín. 6 caracteres"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="security-confirm">Confirmar nova senha</Label>
                        <Input
                          id="security-confirm"
                          type="password"
                          value={passwordForm.confirm}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
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

            <TabsContent value="schedule">
              <Card className="card-glass">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">Agenda e disponibilidade</CardTitle>
                  </div>
                  <CardDescription>Defina horários padrão para abertura de sessões.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSavePreferences} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label>Início do expediente</Label>
                        <Input
                          type="time"
                          value={prefsForm.work_start_time}
                          onChange={(e) => setPrefsForm(prev => ({ ...prev, work_start_time: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Término do expediente</Label>
                        <Input
                          type="time"
                          value={prefsForm.work_end_time}
                          onChange={(e) => setPrefsForm(prev => ({ ...prev, work_end_time: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label>Início do almoço/intervalo</Label>
                        <Input
                          type="time"
                          value={prefsForm.break_start_time}
                          onChange={(e) => setPrefsForm(prev => ({ ...prev, break_start_time: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Fim do almoço/intervalo</Label>
                        <Input
                          type="time"
                          value={prefsForm.break_end_time}
                          onChange={(e) => setPrefsForm(prev => ({ ...prev, break_end_time: e.target.value }))}
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
                          value={prefsForm.default_session_duration}
                          onChange={(e) =>
                            setPrefsForm(prev => ({
                              ...prev,
                              default_session_duration: Math.max(15, Number(e.target.value) || 50),
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Intervalo entre sessões (min)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={5}
                          value={prefsForm.session_interval}
                          onChange={(e) =>
                            setPrefsForm(prev => ({
                              ...prev,
                              session_interval: Math.max(0, Number(e.target.value) || 0),
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Label>Dias com atendimento</Label>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                        {DAY_OPTIONS.map((day) => {
                          const checked = prefsForm.available_days.includes(day.value);
                          return (
                            <label key={day.value} className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 p-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(state) => {
                                  setPrefsForm(prev => {
                                    const nextDays = new Set(prev.available_days);
                                    if (state === true) {
                                      nextDays.add(day.value);
                                    } else {
                                      nextDays.delete(day.value);
                                    }
                                    const ordered = DAY_OPTIONS.map(opt => opt.value).filter(value => nextDays.has(value));
                                    return { ...prev, available_days: ordered };
                                  });
                                }}
                              />
                              {day.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Button type="button" variant="ghost" className="gap-2" onClick={resetPreferences}>
                        <RefreshCcw className="w-4 h-4" />
                        Restaurar agenda padrão
                      </Button>
                      <Button type="submit" className="btn-futuristic" disabled={!preferencesDirty || prefsSaving}>
                        {prefsSaving ? "Salvando..." : "Salvar agenda"}
                      </Button>
                    </div>
                  </form>
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
                    <CardDescription>Cadastre novos acessos ao sistema.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddUser} className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="users-name">Nome</Label>
                        <Input
                          id="users-name"
                          value={userForm.name || ""}
                          onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="users-email">E-mail</Label>
                        <Input
                          id="users-email"
                          type="email"
                          value={userForm.email || ""}
                          onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="users-password">Senha temporária</Label>
                        <Input
                          id="users-password"
                          type="password"
                          value={userForm.password || ""}
                          onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="defina uma senha inicial"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="users-role">Permissão</Label>
                        <Select
                          value={userForm.role}
                          onValueChange={(value) => setUserForm(prev => ({ ...prev, role: value as "psychologist" | "admin" }))}
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
              </div>
            </TabsContent>

            <TabsContent value="insurance">
              <div className="space-y-6">
                <InsurancesManager />
                <SessionPackagesManager />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="card-glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Resumo da conta</CardTitle>
              <CardDescription>Dados sincronizados com a nuvem.</CardDescription>
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
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Configurações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notificações</p>
                  <p className="text-xs text-muted-foreground">E-mail ativo</p>
                </div>
                <Badge variant={preferences.email_notifications ? "default" : "secondary"}>
                  {preferences.email_notifications ? "Ativo" : "Desativado"}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Duração da sessão</p>
                  <p className="text-xs text-muted-foreground">Padrão</p>
                </div>
                <span className="text-sm font-medium">{preferences.default_session_duration} min</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Dias de atendimento</p>
                  <p className="text-xs text-muted-foreground">Configurado</p>
                </div>
                <span className="text-sm font-medium">{preferences.available_days.length} dias</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Configuracoes;
