import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, UserPlus } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuth";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const to = location?.state?.from || "/admin";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (isSignUp) {
      // Sign up flow
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Create profile
        await supabase.from("admin_profiles").insert({
          user_id: data.user.id,
          name: name || email.split("@")[0],
        });

        // Note: Roles need to be assigned by an admin via the database
        setError("Conta criada! Aguarde a atribuição de permissões por um administrador.");
        setIsSignUp(false);
      }
      setIsLoading(false);
    } else {
      // Login flow
      const result = await login(email, password);
      if (result.success) {
        navigate(to, { replace: true });
      } else {
        setError(result.error || "Credenciais inválidas.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="card-glass w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
              {isSignUp ? (
                <UserPlus className="w-7 h-7 text-primary-foreground" />
              ) : (
                <Lock className="w-7 h-7 text-primary-foreground" />
              )}
            </div>
            <h1 className="text-2xl font-display font-light">
              {isSignUp ? "Criar Conta" : "Acesso Profissionais"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignUp 
                ? "Crie sua conta para acessar o sistema." 
                : "Entre para gerenciar agenda, pacientes e blog."}
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-sm">Nome</label>
                <Input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Seu nome completo" 
                />
              </div>
            )}
            <div>
              <label className="text-sm">E-mail</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Seu e-mail" 
                required
              />
            </div>
            <div>
              <label className="text-sm">Senha</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Digite sua senha" 
                required
                minLength={6}
              />
            </div>
            {error && (
              <p className={`text-sm ${error.includes("criada") ? "text-green-600" : "text-red-500"}`}>
                {error}
              </p>
            )}
            <Button type="submit" className="btn-futuristic w-full" disabled={isLoading}>
              {isLoading ? "Carregando..." : isSignUp ? "Criar Conta" : "Entrar"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full" 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
            >
              {isSignUp ? "Já tenho conta" : "Criar nova conta"}
            </Button>
            <Button asChild variant="outline" className="btn-outline-futuristic w-full">
              <Link to="/">Voltar à página inicial</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;