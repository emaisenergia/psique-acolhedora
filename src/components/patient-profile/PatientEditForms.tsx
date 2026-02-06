import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogClose } from "@/components/ui/dialog";
import { Save, Search } from "lucide-react";

type Patient = {
  name?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  profession?: string;
  cpf?: string;
  cep?: string;
  color?: string;
  notes?: string;
  status?: string;
};

// Full edit form with tabs
export const FullEditForm = ({ initial, onSubmit }: { initial: Partial<Patient>; onSubmit: (data: Partial<Patient>) => boolean }) => {
  const [tab, setTab] = useState("pessoal");
  const [loadingCep, setLoadingCep] = useState(false);
  const [form, setForm] = useState<Partial<Patient>>({ ...initial });

  const buscaCEP = async () => {
    if (!form.cep) return;
    try {
      setLoadingCep(true);
      const cep = (form.cep || '').replace(/\D/g, '');
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data?.erro) throw new Error('CEP não encontrado');
      const end = `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''}-${data.uf || ''}`.replace(/^[,\s]+|[,\s]+$/g, '');
      setForm((f) => ({ ...f, address: end }));
    } catch {} finally { setLoadingCep(false); }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-muted/60 rounded-2xl p-1">
          <TabsTrigger value="pessoal" className="flex-1 rounded-xl">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="endereco" className="flex-1 rounded-xl">Endereço</TabsTrigger>
          <TabsTrigger value="profissional" className="flex-1 rounded-xl">Profissional</TabsTrigger>
        </TabsList>
        <TabsContent value="pessoal" className="mt-4">
          <div className="grid gap-3">
            <div><label className="text-sm">Nome Completo *</label><Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="grid md:grid-cols-2 gap-3">
              <div><label className="text-sm">Email</label><Input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="text-sm">Telefone</label><Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div><label className="text-sm">CPF</label><Input value={form.cpf || ''} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
              <div><label className="text-sm">Data de Nascimento</label><Input type="date" value={form.birthDate || ''} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></div>
            </div>
            <div>
              <label className="text-sm">Gênero</label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o gênero" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                  <SelectItem value="nao_informar">Não informar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="endereco" className="mt-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="text-sm">CEP</label><Input value={form.cep || ''} onChange={(e) => setForm({ ...form, cep: e.target.value })} placeholder="00000-000" /></div>
            <div className="hidden md:block" />
            <div className="md:col-span-2"><Button type="button" variant="outline" className="w-full" onClick={buscaCEP} disabled={loadingCep}>{loadingCep ? 'Buscando...' : 'Buscar CEP'}</Button></div>
            <div className="md:col-span-2"><label className="text-sm">Endereço</label><Textarea rows={3} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
        </TabsContent>
        <TabsContent value="profissional" className="mt-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2"><label className="text-sm">Profissão</label><Input value={form.profession || ''} onChange={(e) => setForm({ ...form, profession: e.target.value })} /></div>
            <div>
              <label className="text-sm">Status</label>
              <Select value={form.status || 'active'} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Cor de Identificação</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color || '#3B82F6'} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-16 rounded-md border" />
                <Input value={form.color || '#3B82F6'} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>
            <div className="md:col-span-2"><label className="text-sm">Observações</label><Textarea rows={3} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        </TabsContent>
      </Tabs>
      <div className="flex items-center justify-end gap-3 pt-2"><Button type="submit" className="btn-futuristic">Salvar</Button></div>
    </form>
  );
};

// Basic edit form
export const EditBasicForm = ({ initial, onSubmit }: { initial: Partial<Patient>; onSubmit: (data: Partial<Patient>) => boolean }) => {
  const [form, setForm] = useState<Partial<Patient>>({ ...initial });
  const [loadingCep, setLoadingCep] = useState(false);

  const formatCPF = (v: string) => {
    const d = (v || '').replace(/\D/g, '').slice(0, 11);
    return [d.slice(0, 3), d.slice(3, 6) && `.${d.slice(3, 6)}`, d.slice(6, 9) && `.${d.slice(6, 9)}`, d.slice(9, 11) && `-${d.slice(9, 11)}`].filter(Boolean).join('');
  };
  const formatCEP = (v: string) => { const d = (v || '').replace(/\D/g, '').slice(0, 8); return d.slice(5, 8) ? `${d.slice(0, 5)}-${d.slice(5, 8)}` : d.slice(0, 5); };
  const formatPhone = (v: string) => {
    const d = (v || '').replace(/\D/g, '').slice(0, 11);
    const ddd = d.slice(0, 2); const mid = d.length > 10 ? d.slice(2, 7) : d.slice(2, 6); const end = d.length > 10 ? d.slice(7, 11) : d.slice(6, 10);
    if (!ddd) return ''; if (!mid) return `(${ddd}`; if (!end) return `(${ddd}) ${mid}`; return `(${ddd}) ${mid}-${end}`;
  };
  const buscaCEP = async () => {
    if (!form.cep) return;
    try { setLoadingCep(true); const cep = (form.cep || '').replace(/\D/g, ''); const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`); const data = await res.json(); if (data?.erro) throw new Error('CEP não encontrado'); setForm((f) => ({ ...f, address: `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''}-${data.uf || ''}`.replace(/^[,\s]+|[,\s]+$/g, '') })); } catch {} finally { setLoadingCep(false); }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!form.name) return; onSubmit(form); }} className="space-y-4">
      <div><label className="text-sm">Nome Completo *</label><Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className="text-sm">Email</label><Input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="text-sm">Telefone</label><Input type="tel" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(11) 99999-9999" /></div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className="text-sm">Data de Nascimento</label><Input type="date" value={form.birthDate || ''} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></div>
        <div><label className="text-sm">CPF</label><Input value={form.cpf || ''} onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" /></div>
      </div>
      <div><label className="text-sm">Buscar Endereço</label>
        <div className="flex items-center gap-2">
          <Select defaultValue="cep"><SelectTrigger className="w-40"><SelectValue placeholder="Por CEP" /></SelectTrigger><SelectContent><SelectItem value="cep">Por CEP</SelectItem></SelectContent></Select>
          <Button type="button" variant="outline" onClick={buscaCEP} className="flex items-center gap-2"><Search className="w-4 h-4" /> Buscar</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3"><div><label className="text-sm">CEP</label><Input value={form.cep || ''} onChange={(e) => setForm({ ...form, cep: formatCEP(e.target.value) })} placeholder="00000-000" /></div></div>
      <div><label className="text-sm">Endereço Completo</label><Textarea rows={3} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Endereço completo (preenchido automaticamente ou manualmente)" /></div>
      <div><label className="text-sm">Profissão</label><Input value={form.profession || ''} onChange={(e) => setForm({ ...form, profession: e.target.value })} placeholder="Profissão" /></div>
      <div className="flex items-center justify-end gap-2 pt-4">
        <DialogClose asChild><Button type="button" variant="outline" className="btn-outline-futuristic">Cancelar</Button></DialogClose>
        <Button type="submit" className="btn-futuristic flex items-center gap-2"><Save className="w-4 h-4" />Salvar Alterações</Button>
      </div>
    </form>
  );
};

// Emergency contacts form
export const EmergencyForm = ({ initial, onSubmit }: { initial: { name: string; phone?: string; relation?: string }[]; onSubmit: (list: { name: string; phone?: string; relation?: string }[]) => boolean }) => {
  const [list, setList] = useState(initial);
  const [item, setItem] = useState<{ name: string; phone?: string; relation?: string }>({ name: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(list); }} className="space-y-4">
      <div className="grid md:grid-cols-3 gap-2">
        <Input placeholder="Nome" value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} />
        <Input placeholder="Telefone" value={item.phone || ''} onChange={(e) => setItem({ ...item, phone: e.target.value })} />
        <div className="flex gap-2">
          <Input placeholder="Relação" value={item.relation || ''} onChange={(e) => setItem({ ...item, relation: e.target.value })} />
          <Button type="button" onClick={() => { if (!item.name) return; setList([...list, item]); setItem({ name: '' }); }} className="btn-futuristic">Adicionar</Button>
        </div>
      </div>
      <div className="space-y-2">
        {list.length === 0 ? <div className="text-sm text-muted-foreground">Nenhum contato adicionado</div> : list.map((c, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted">
            <div className="text-sm">{c.name} {c.phone ? `• ${c.phone}` : ''} {c.relation ? `• ${c.relation}` : ''}</div>
            <Button type="button" variant="ghost" onClick={() => setList(list.filter((_, idx) => idx !== i))}>Remover</Button>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <DialogClose asChild><Button type="button" variant="outline" className="btn-outline-futuristic">Cancelar</Button></DialogClose>
        <Button type="submit" className="btn-futuristic">Salvar</Button>
      </div>
    </form>
  );
};

// Medications form
export const MedsForm = ({ initial, onSubmit }: { initial: { name: string; dosage?: string }[]; onSubmit: (list: { name: string; dosage?: string }[]) => boolean }) => {
  const [list, setList] = useState(initial);
  const [item, setItem] = useState<{ name: string; dosage?: string }>({ name: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(list); }} className="space-y-4">
      <div className="grid md:grid-cols-3 gap-2">
        <Input placeholder="Medicação" value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} />
        <Input placeholder="Dosagem" value={item.dosage || ''} onChange={(e) => setItem({ ...item, dosage: e.target.value })} />
        <Button type="button" onClick={() => { if (!item.name) return; setList([...list, item]); setItem({ name: '' }); }} className="btn-futuristic">Adicionar</Button>
      </div>
      <div className="space-y-2">
        {list.length === 0 ? <div className="text-sm text-muted-foreground">Nenhuma medicação adicionada</div> : list.map((m, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted">
            <div className="text-sm">{m.name} {m.dosage ? `• ${m.dosage}` : ''}</div>
            <Button type="button" variant="ghost" onClick={() => setList(list.filter((_, idx) => idx !== i))}>Remover</Button>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <DialogClose asChild><Button type="button" variant="outline" className="btn-outline-futuristic">Cancelar</Button></DialogClose>
        <Button type="submit" className="btn-futuristic">Salvar</Button>
      </div>
    </form>
  );
};

// Notes form
export const NotesForm = ({ initial, onSubmit }: { initial: string; onSubmit: (notes: string) => boolean }) => {
  const [notes, setNotes] = useState(initial);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(notes); }} className="space-y-3">
      <Textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações gerais" />
      <div className="flex justify-end gap-2">
        <DialogClose asChild><Button type="button" variant="outline" className="btn-outline-futuristic">Cancelar</Button></DialogClose>
        <Button type="submit" className="btn-futuristic">Salvar</Button>
      </div>
    </form>
  );
};
