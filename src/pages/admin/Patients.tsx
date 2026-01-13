import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { storage, type Patient, uid } from "@/lib/storage";
import { useMemo, useState } from "react";
import { UserPlus, Users, Search, Link as LinkIcon, Clock, CheckCircle2, Eye, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

const Stat = ({ label, value, accent = "primary" as "primary" | "emerald" | "amber" }) => (
  <Card className="card-glass">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      <div className="text-3xl font-semibold">
        <span className={accent === "primary" ? "text-foreground" : accent === "emerald" ? "text-primary" : "text-amber-600"}>{value}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {label === "Total de Pacientes" && "Todos os pacientes cadastrados"}
        {label === "Pacientes Ativos" && "Pacientes em tratamento ativo"}
        {label === "Pacientes Inativos" && "Pacientes inativos"}
        {label === "Taxa de Atividade" && "Percentual de pacientes ativos"}
      </div>
    </CardContent>
  </Card>
);

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>(storage.getPatients());
  const appointments = storage.getAppointments();
  const [tab, setTab] = useState("pacientes");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Patient | null>(null);

  const recentActiveSet = useMemo(() => {
    const now = new Date();
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() - 90);
    const set = new Set<string>();
    appointments.forEach((a) => {
      const dt = new Date(a.dateTime);
      if (a.status !== "cancelled" && (dt >= horizon || dt >= now)) {
        set.add(a.patientId);
      }
    });
    return set;
  }, [appointments]);

  const total = patients.length;
  const ativos = patients.filter((p) => (p.status ?? (recentActiveSet.has(p.id) ? 'active' : 'inactive')) === 'active').length;
  const inativos = total - ativos;
  const taxa = total ? Math.round((ativos / total) * 100) : 0;

  const filtered = patients
    .filter((p) => (q ? p.name.toLowerCase().includes(q.toLowerCase()) : true))
    .filter((p) => {
      if (statusFilter === "active") return recentActiveSet.has(p.id);
      if (statusFilter === "inactive") return !recentActiveSet.has(p.id);
      return true;
    })
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const addPatient = (form: Partial<Patient>) => {
    if (!form.name) return false;
    const newP: Patient = {
      id: uid(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      notes: form.notes,
      status: (form.status as any) || "active",
      createdAt: new Date().toISOString(),
    };
    const next = [newP, ...patients];
    setPatients(next);
    storage.savePatients(next);
    toast("Paciente criado", { description: `${newP.name} adicionado(a) com sucesso.` });
    return true;
  };

  const remove = (id: string) => {
    const next = patients.filter((p) => p.id !== id);
    setPatients(next);
    storage.savePatients(next);
    toast("Paciente removido");
  };

  const updatePatient = (id: string, patch: Partial<Patient>) => {
    const next = patients.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setPatients(next);
    storage.savePatients(next);
    toast("Paciente atualizado");
    return true;
  };

  const toggleStatus = (p: Patient) => {
    const nextStatus = (p.status || (recentActiveSet.has(p.id) ? "active" : "inactive")) === "active" ? "inactive" : "active";
    updatePatient(p.id, { status: nextStatus });
  };

  return (
    <AdminLayout>
      {/* Título e tabs */}
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

        {/* Aba: Pacientes */}
        <TabsContent value="pacientes" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Lista de Pacientes</h2>
              <p className="text-sm text-muted-foreground">Visualize e gerencie todos os seus pacientes</p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-futuristic"><UserPlus className="w-4 h-4"/> Novo Paciente</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Paciente</DialogTitle>
                  </DialogHeader>
                  <CreatePatientForm onSubmit={(f)=>{const ok=addPatient(f); if(ok) setOpen(false); return ok;}} />
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="btn-outline-futuristic">
                Registro Rápido
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat label="Total de Pacientes" value={total} />
            <Stat label="Pacientes Ativos" value={ativos} accent="emerald" />
            <Stat label="Pacientes Inativos" value={inativos} />
            <Stat label="Taxa de Atividade" value={`${taxa}%`} />
          </div>

          {/* Gerenciar Pacientes */}
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
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Gênero</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-12">Nenhum paciente encontrado</TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-muted-foreground">{p.email || "—"}{p.phone ? ` • ${p.phone}` : ""}</TableCell>
                          <TableCell className="text-muted-foreground">{p.gender || '—'}</TableCell>
                          <TableCell>
                            <span
                              className={(p.status === 'active' || (!p.status && recentActiveSet.has(p.id))) ? "px-2 py-1 rounded-full text-xs" : "bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs"}
                              style={
                                (p.status === 'active' || (!p.status && recentActiveSet.has(p.id)))
                                  ? (p.color
                                      ? { backgroundColor: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40` }
                                      : { backgroundColor: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))' } )
                                  : undefined
                              }
                            >
                              {p.status ? (p.status === 'active' ? 'Ativo' : 'Inativo') : (recentActiveSet.has(p.id) ? 'Ativo' : 'Inativo')}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-3">
                              <Link className="text-primary text-sm flex items-center gap-1" to={`/admin/pacientes/${p.id}`}>
                                <Eye className="w-4 h-4" /> Ver perfil
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditTarget(p);
                                  setEditOpen(true);
                                }}
                                className="text-foreground hover:bg-muted flex items-center gap-1"
                              >
                                <Pencil className="w-4 h-4" />
                                <span>Editar</span>
                              </Button>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Ativo</span>
                                <Switch
                                  checked={(p.status || (recentActiveSet.has(p.id) ? 'active' : 'inactive')) === 'active'}
                                  onCheckedChange={(checked) => updatePatient(p.id, { status: checked ? 'active' : 'inactive' })}
                                />
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => remove(p.id)} className="text-rose-600 hover:bg-rose-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Links de Cadastro */}
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

        {/* Aba: Solicitações */}
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

      {/* Editar Paciente */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <CreatePatientForm
              initial={editTarget}
              submitLabel="Salvar alterações"
              onSubmit={(f) => {
                const ok = updatePatient(editTarget.id, f);
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

const CreatePatientForm = ({ onSubmit, initial, submitLabel = "Criar Paciente" }: { onSubmit: (form: Partial<Patient>) => boolean; initial?: Partial<Patient>; submitLabel?: string }) => {
  const [tab, setTab] = useState("pessoal");
  const [loadingCep, setLoadingCep] = useState(false);
  const [form, setForm] = useState<Partial<Patient>>({ status: "active", color: "#3B82F6", ...initial });

  const buscaCEP = async () => {
    if (!form.cep) return;
    try {
      setLoadingCep(true);
      const cep = (form.cep || '').replace(/\D/g, '');
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data?.erro) throw new Error('CEP não encontrado');
      const end = `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''}-${data.uf || ''}`.replace(/^[,\s]+|[,\s]+$/g,'');
      setForm((f) => ({ ...f, address: end }));
    } catch (e) {
      // silencioso; formulário segue aberto
    } finally {
      setLoadingCep(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name) return;
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground -mt-2">Preencha os dados obrigatórios do novo paciente. Os demais campos podem ser adicionados posteriormente.</p>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-muted/60 rounded-2xl p-1">
          <TabsTrigger value="pessoal" className="flex-1 rounded-xl data-[state=active]:border data-[state=active]:border-secondary">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="endereco" className="flex-1 rounded-xl data-[state=active]:border data-[state=active]:border-secondary">Endereço</TabsTrigger>
          <TabsTrigger value="profissional" className="flex-1 rounded-xl data-[state=active]:border data-[state=active]:border-secondary">Profissional</TabsTrigger>
        </TabsList>

        {/* Dados Pessoais */}
        <TabsContent value="pessoal" className="mt-4">
          <div className="grid gap-3">
            <div>
              <label className="text-sm">Nome Completo *</label>
              <Input value={form.name || ''} onChange={(e)=>setForm({ ...form, name: e.target.value })} required placeholder="Nome completo do paciente" />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Email</label>
                <Input type="email" value={form.email || ''} onChange={(e)=>setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com"/>
              </div>
              <div>
                <label className="text-sm">Telefone</label>
                <Input value={form.phone || ''} onChange={(e)=>setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999"/>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">CPF</label>
                <Input value={form.cpf || ''} onChange={(e)=>setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00"/>
              </div>
              <div>
                <label className="text-sm">Data de Nascimento</label>
                <Input type="date" value={form.birthDate || ''} onChange={(e)=>setForm({ ...form, birthDate: e.target.value })} placeholder="dd/mm/aaaa"/>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Gênero</label>
                <Select value={form.gender} onValueChange={(v)=>setForm({ ...form, gender: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                    <SelectItem value="nao_informar">Não informar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Endereço */}
        <TabsContent value="endereco" className="mt-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm">CEP</label>
              <Input value={form.cep || ''} onChange={(e)=>setForm({ ...form, cep: e.target.value })} placeholder="00000-000"/>
            </div>
            <div className="hidden md:block"/>
            <div className="md:col-span-2">
              <Button type="button" variant="outline" className="w-full" onClick={buscaCEP} disabled={loadingCep}>{loadingCep ? 'Buscando...' : 'Buscar CEP'}</Button>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Endereço</label>
              <Textarea rows={3} value={form.address || ''} onChange={(e)=>setForm({ ...form, address: e.target.value })} placeholder="Endereço completo" />
            </div>
          </div>
        </TabsContent>

        {/* Profissional */}
        <TabsContent value="profissional" className="mt-4">
          <div className="grid gap-3">
            <div>
              <label className="text-sm">Profissão</label>
              <Input value={form.profession || ''} onChange={(e)=>setForm({ ...form, profession: e.target.value })} placeholder="Profissão do paciente" />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Status</label>
                <Select value={form.status || 'active'} onValueChange={(v)=>setForm({ ...form, status: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Cor de Identificação</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color || '#3B82F6'} onChange={(e)=>setForm({ ...form, color: e.target.value })} className="h-10 w-16 rounded-md border" />
                  <Input value={form.color || '#3B82F6'} onChange={(e)=>setForm({ ...form, color: e.target.value })} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">Escolha uma cor para identificar o paciente na agenda</div>
              </div>
            </div>
            <div>
              <label className="text-sm">Observações Gerais</label>
              <Textarea rows={3} value={form.notes || ''} onChange={(e)=>setForm({ ...form, notes: e.target.value })} placeholder="Observações importantes sobre o paciente" />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-3 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="btn-outline-futuristic">Cancelar</Button>
        </DialogClose>
        <Button type="submit" className="btn-futuristic">{submitLabel}</Button>
      </div>
    </form>
  );
};

export default Patients;
