import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Shield } from "lucide-react";
import type { Role } from "@/context/AdminAuth";

type DatabaseRole = "admin" | "psychologist" | "patient";

type UserWithRoles = {
  id: string;
  email: string;
  name: string;
  roles: DatabaseRole[];
  created_at: string;
};

const Users = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ 
    email: "", 
    password: "", 
    name: "",
    role: "psychologist" as DatabaseRole 
  });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("admin_profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // For each profile, get their roles
      const usersWithRoles: UserWithRoles[] = [];
      
      for (const profile of profiles || []) {
        const { data: rolesData } = await supabase
          .rpc("get_user_roles", { _user_id: profile.user_id });
        
        usersWithRoles.push({
          id: profile.user_id,
          email: "", // We don't have access to auth.users email directly
          name: profile.name,
          roles: (rolesData as DatabaseRole[]) || [],
          created_at: profile.created_at,
        });
      }
      
      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({ 
        title: "Erro ao carregar usuários", 
        description: "Não foi possível carregar a lista de profissionais.",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) {
      toast({ 
        title: "Campos obrigatórios", 
        description: "Preencha todos os campos.",
        variant: "destructive" 
      });
      return;
    }

    setIsCreating(true);
    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from("admin_profiles")
          .insert({
            user_id: authData.user.id,
            name: form.name,
          });

        if (profileError) throw profileError;

        // Add role - this requires admin privileges
        // For now, we'll show a message that roles need to be assigned manually
        toast({ 
          title: "Usuário criado", 
          description: `${form.name} foi criado. Atribua a permissão "${form.role}" via banco de dados (user_roles table).`
        });

        setForm({ email: "", password: "", name: "", role: "psychologist" });
        loadUsers();
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({ 
        title: "Erro ao criar usuário", 
        description: error.message || "Não foi possível criar o usuário.",
        variant: "destructive" 
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "psychologist": return "default";
      case "patient": return "secondary";
      default: return "outline";
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-light">Profissionais</h1>
        <p className="text-muted-foreground">Cadastre e gerencie acessos e permissões.</p>
      </div>

      <Card className="card-glass mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Adicionar Profissional
          </CardTitle>
          <CardDescription>
            Crie uma nova conta para um profissional acessar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input 
                id="name"
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email"
                type="email" 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password"
                type="password" 
                value={form.password} 
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Permissão</Label>
              <Select 
                value={form.role} 
                onValueChange={(v) => setForm({ ...form, role: v as DatabaseRole })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="psychologist">Psicólogo</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="btn-futuristic" disabled={isCreating}>
                {isCreating ? "Criando..." : "Adicionar Profissional"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : users.length === 0 ? (
          <p className="text-muted-foreground text-center p-8">Nenhum profissional cadastrado.</p>
        ) : (
          users.map((u) => (
            <Card key={u.id} className="card-glass">
              <CardContent className="p-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      {u.roles.map((role) => (
                        <Badge key={role} variant={getRoleBadgeVariant(role)} className="capitalize">
                          {role === "psychologist" ? "Psicólogo" : role === "admin" ? "Admin" : role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default Users;