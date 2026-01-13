import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storage, type AdminUser, type Role, uid } from "@/lib/storage";
import { useState } from "react";

const Users = () => {
  const [users, setUsers] = useState<AdminUser[]>(storage.getUsers());
  const [form, setForm] = useState<Partial<AdminUser>>({ roles: ["psychologist"] });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.roles || form.roles.length === 0) return;
    const newU: AdminUser = {
      id: uid(),
      name: form.name,
      email: form.email,
      password: form.password,
      roles: form.roles as Role[],
      createdAt: new Date().toISOString(),
    };
    const next = [newU, ...users];
    setUsers(next);
    storage.saveUsers(next);
    setForm({ roles: ["psychologist"] });
  };

  const remove = (id: string) => {
    const next = users.filter((u) => u.id !== id);
    setUsers(next);
    storage.saveUsers(next);
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-light">Profissionais</h1>
        <p className="text-muted-foreground">Cadastre e gerencie acessos e permissões.</p>
      </div>

      <Card className="card-glass mb-6">
        <CardContent className="p-6">
          <form onSubmit={save} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Nome</label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">E-mail</label>
              <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Senha</label>
              <Input type="password" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Papel (role)</label>
              <Select value={(form.roles?.[0] as any) || "psychologist"} onValueChange={(v) => setForm({ ...form, roles: [v as Role] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="psychologist">Psychologist</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="btn-futuristic">Adicionar Profissional</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {users.length === 0 && <p className="text-muted-foreground">Nenhum profissional cadastrado.</p>}
        {users.map((u) => (
          <Card key={u.id} className="card-glass">
            <CardContent className="p-5 flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">{u.name}</div>
                <div className="text-sm text-muted-foreground">{u.email} • {u.roles.join(", ")}</div>
              </div>
              <Button variant="outline" onClick={() => remove(u.id)}>Remover</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default Users;
