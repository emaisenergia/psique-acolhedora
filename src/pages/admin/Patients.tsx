import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";
import { UserPlus, Users, Search, Link as LinkIcon, Clock, CheckCircle2, Eye, Pencil, Trash2, Handshake, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { useInsurances } from "@/hooks/useInsurances";
import { usePatients, type PatientRow } from "@/hooks/usePatients";
import { useAppointments } from "@/hooks/useAppointments";
import { Skeleton } from "@/components/ui/skeleton";

const Stat = ({ label, value, accent = "primary" as "primary" | "emerald" | "amber" }) => (
  <Card className="card-glass">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      <div className="text-3xl font-semibold">
        <span className={accent === "primary" ? "text-foreground" : accent === "emerald" ? "text-primary" : "text-amber-600"}>{value}</span>
      </div>
    </CardContent>
  </Card>
);

const Patients = () => {
  const { patients, isLoading, createPatient, updatePatient, toggleFavorite } = usePatients();
  const { appointments } = useAppointments();
  const [tab, setTab] = useState("pacientes");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PatientRow | null>(null);

  // Patients with recent appointments (last 90 days)
  const recentActiveSet = useMemo(() => {
    const now = new Date();
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() - 90);
    const set = new Set<string>();
    appointments.forEach((a) => {
      const dt = new Date(a.date_time);
      if (a.status !== "cancelled" && (dt >= horizon || dt >= now)) {
        if (a.patient_id) set.add(a.patient_id);
      }
    });
    return set;
  }, [appointments]);

  const total = patients.length;
  const ativos = patients.filter((p) => p.status === 'active').length;
  const inativos = total - ativos;
  const taxa = total ? Math.round((ativos / total) * 100) : 0;

  const filtered = patients
    .filter((p) => (q ? p.name.toLowerCase().includes(q.toLowerCase()) : true))
    .filter((p) => {
      if (statusFilter === "active") return p.status === 'active';
      if (statusFilter === "inactive") return p.status !== 'active';
      return true;
    })
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleAddPatient = async (form: Record<string, any>) => {
    if (!form.name || !form.email) return false;
    const result = await createPatient({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      notes: form.notes || null,
      status: form.status || "active",
      birth_date: form.birth_date || null,
      insurance_id: form.insurance_id || null,
    });
    return !!result;
  };

  const handleRemove = async (id: string) => {
    // Supabase delete - only admins can delete via RLS
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover paciente");
    } else {
      toast("Paciente removido");
      // Refresh by updating local state - the hook will handle this
      window.location.reload();
    }
  };

  const handleUpdate = async (id: string, patch: Record<string, any>) => {
    const result = await updatePatient(id, {
      name: patch.name,
      email: patch.email,
      phone: patch.phone || null,
      notes: patch.notes || null,
      status: patch.status || "active",
      birth_date: patch.birth_date || null,
      insurance_id: patch.insurance_id || null,
    });
    if (result) toast("Paciente atualizado");
    return !!result;
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-light">Pacientes</h1>
        <p className="text-muted-foreground">Gerencie seus pacientes e suas informações</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="w-full justify-between bg-muted/60 rounded-2xl">
          <TabsTrigger value="pacientes" className="flex-1 rounded-xl">Pacientes</TabsTrigger>
          <TabsTrigger value="links" className="flex-1 rounded-xl">Links de Cadastro</TabsTrigger>
          <TabsTrigger value="solicitacoes" className="flex-1 rounded-xl">Solicitações</TabsTrigger>
        </TabsList>

        <TabsContent value="pacientes" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Lista de Pacientes</h2>
              <p className="text-sm text-muted-foreground">Visualize e gerencie todos os seus pacientes</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="btn-futuristic"><UserPlus className="w-4 h-4"/> Novo Paciente</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Paciente</DialogTitle>
                </DialogHeader>
                <PatientForm onSubmit={async (f) => { const ok = await handleAddPatient(f); if (ok) setOpen(false); return ok; }} />
              </DialogContent>
            </Dialog>
          </div>

          {/* KPIs */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat label="Total de Pacientes" value={isLoading ? "..." : total} />
            <Stat label="Pacientes Ativos" value={isLoading ? "..." : ativos} accent="emerald" />
            <Stat label="Pacientes Inativos" value={isLoading ? "..." : inativos} />
            <Stat label="Taxa de Atividade" value={isLoading ? "..." : `${taxa}%`} />
          </div>

          <Card className="card-glass">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border/50 flex items-center gap-3">
                <div className="flex items-center gap-2 text-lg font-semibold"><Users className="w-5 h-5"/> Gerenciar Pacientes</div>
              </div>
              <div className="p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input placeholder="Buscar por nome..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
                </div>
                <div className="w-full md:w-56">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue placeholder="Filtro" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-12">Nenhum paciente encontrado</TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell className="text-muted-foreground">{p.email || "—"}{p.phone ? ` • ${p.phone}` : ""}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                p.status === 'active' 
                                  ? 'bg-primary/10 text-primary' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {p.status === 'active' ? 'Ativo' : 'Inativo'}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFavorite(p.id)}
                                  className={`h-8 w-8 p-0 ${p.is_favorite ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'}`}
                                  title={p.is_favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                >
                                  <Star className={`w-4 h-4 ${p.is_favorite ? 'fill-current' : ''}`} />
                                </Button>
                                <Link className="text-primary text-sm flex items-center gap-1" to={`/admin/pacientes/${p.id}`}>
                                  <Eye className="w-4 h-4" /> Ver perfil
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setEditTarget(p); setEditOpen(true); }}
                                  className="text-foreground hover:bg-muted flex items-center gap-1"
                                >
                                  <Pencil className="w-4 h-4" /> Editar
                                </Button>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Ativo</span>
                                  <Switch
                                    checked={p.status === 'active'}
                                    onCheckedChange={(checked) => updatePatient(p.id, { status: checked ? 'active' : 'inactive' })}
                                  />
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleRemove(p.id)} className="text-destructive hover:bg-destructive/10">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Links de Cadastro</h2>
              <p className="text-sm text-muted-foreground">Gerencie os links públicos para cadastro de pacientes</p>
            </div>
            <Button className="btn-futuristic"><UserPlus className="w-4 h-4"/> Criar Link</Button>
          </div>
          <Card className="card-glass">
            <CardContent className="p-10 text-center text-muted-foreground">
              <LinkIcon className="w-10 h-10 mx-auto mb-3" />
              <div className="mb-2">Nenhum link de cadastro criado ainda</div>
              <Button className="btn-futuristic"><UserPlus className="w-4 h-4"/> Criar Primeiro Link</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solicitacoes" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Submissões de Cadastro</h2>
            <p className="text-sm text-muted-foreground">Gerencie as solicitações de cadastro dos pacientes</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="card-glass"><CardContent className="p-5"><div className="text-sm text-muted-foreground flex items-center justify-between">Total <Users className="w-4 h-4"/></div><div className="text-3xl font-semibold">0</div><div className="text-xs text-muted-foreground mt-1">Submissões recebidas</div></CardContent></Card>
            <Card className="card-glass"><CardContent className="p-5"><div className="text-sm text-muted-foreground flex items-center justify-between">Pendentes <Clock className="w-4 h-4"/></div><div className="text-3xl font-semibold text-amber-600">0</div><div className="text-xs text-muted-foreground mt-1">Aguardando aprovação</div></CardContent></Card>
            <Card className="card-glass"><CardContent className="p-5"><div className="text-sm text-muted-foreground flex items-center justify-between">Processadas <CheckCircle2 className="w-4 h-4"/></div><div className="text-3xl font-semibold text-primary">0</div><div className="text-xs text-muted-foreground mt-1">Aprovadas ou rejeitadas</div></CardContent></Card>
          </div>
          <Card className="card-glass">
            <CardContent className="p-10 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3" />
              <div>Nenhuma submissão de cadastro recebida ainda</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <PatientForm
              initial={{
                name: editTarget.name,
                email: editTarget.email,
                phone: editTarget.phone || "",
                notes: editTarget.notes || "",
                status: editTarget.status,
                birth_date: editTarget.birth_date || "",
                insurance_id: editTarget.insurance_id || "",
              }}
              submitLabel="Salvar alterações"
              onSubmit={async (f) => {
                const ok = await handleUpdate(editTarget.id, f);
                if (ok) setEditOpen(false);
                return ok;
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

// Patient form component
interface PatientFormProps {
  onSubmit: (form: Record<string, any>) => Promise<boolean>;
  initial?: Record<string, any>;
  submitLabel?: string;
}

const PatientForm = ({ onSubmit, initial, submitLabel = "Criar Paciente" }: PatientFormProps) => {
  const [form, setForm] = useState<Record<string, any>>({ status: "active", ...initial });
  const { insurances } = useInsurances();
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!form.name) return;
        setSubmitting(true);
        await onSubmit(form);
        setSubmitting(false);
      }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground -mt-2">Preencha os dados do paciente.</p>

      <div className="grid gap-3">
        <div>
          <label className="text-sm">Nome Completo *</label>
          <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nome completo" />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Email *</label>
            <Input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="email@exemplo.com" />
          </div>
          <div>
            <label className="text-sm">Telefone</label>
            <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Data de Nascimento</label>
            <Input type="date" value={form.birth_date || ''} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
          </div>
          <div>
            <label className="text-sm">Status</label>
            <Select value={form.status || 'active'} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-sm flex items-center gap-2">
            <Handshake className="h-4 w-4" /> Convênio
          </label>
          <Select value={form.insurance_id || ''} onValueChange={(v) => setForm({ ...form, insurance_id: v || null })}>
            <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum (Particular)</SelectItem>
              {insurances.map((ins) => (
                <SelectItem key={ins.id} value={ins.id}>
                  {ins.name}{ins.coverage_percentage > 0 && ` (${ins.coverage_percentage}%)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm">Observações</label>
          <Textarea rows={3} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="btn-outline-futuristic">Cancelar</Button>
        </DialogClose>
        <Button type="submit" className="btn-futuristic" disabled={submitting}>
          {submitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default Patients;
