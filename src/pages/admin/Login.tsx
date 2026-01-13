import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const to = location?.state?.from || "/admin";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(email, password);
    if (ok) {
      navigate(to, { replace: true });
    } else {
      setError("Credenciais inválidas.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="card-glass w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-display font-light">Acesso Profissionais</h1>
            <p className="text-sm text-muted-foreground">Entre para gerenciar agenda, pacientes e blog.</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm">E-mail</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail" />
            </div>
            <div>
              <label className="text-sm">Senha</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="btn-futuristic w-full">Entrar</Button>
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
