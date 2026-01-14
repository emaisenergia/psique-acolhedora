import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, LogIn, Info, Lock, BadgeCheck, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePatientAuth } from "@/context/PatientAuth";

const PortalLogin = () => {
  const { isAuthenticated, isLoading, login, resetPassword } = usePatientAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/portal/app", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(email.trim(), password);
    
    setLoading(false);
    if (result.success) {
      toast({ title: "Bem-vindo(a)", description: "Login realizado com sucesso." });
      const to = location?.state?.from || "/portal/app";
      navigate(to, { replace: true });
    } else {
      toast({ 
        title: "Erro no login", 
        description: result.error || "Verifique seu e-mail e senha.", 
        variant: "destructive" 
      });
    }
  };

  const handleResetPassword = async () => {
    if (!forgotEmail) return;
    
    setSendingReset(true);
    const result = await resetPassword(forgotEmail);
    setSendingReset(false);
    
    if (result.success) {
      toast({ 
        title: "E-mail enviado", 
        description: `Verifique ${forgotEmail} para redefinir sua senha.` 
      });
      setForgotOpen(false);
      setForgotEmail("");
    } else {
      toast({ 
        title: "Erro", 
        description: result.error || "Não foi possível enviar o e-mail.", 
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen section-gradient flex items-center justify-center relative overflow-hidden py-12 px-4">
      <div className="absolute -top-10 -left-10 w-48 h-48 bg-secondary/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-light text-foreground">
                Portal do Paciente
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Acesso seguro ao seu espaço terapêutico
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">Senha</label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <div className="mt-2 text-right">
                  <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                    <DialogTrigger asChild>
                      <button type="button" className="text-xs text-primary hover:underline">
                        Esqueci minha senha
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Recuperar senha</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Informe seu e-mail cadastrado para enviarmos um link de redefinição.
                        </p>
                        <div>
                          <label htmlFor="reset-email" className="block text-sm mb-2">E-mail</label>
                          <Input 
                            id="reset-email" 
                            type="email" 
                            placeholder="seu@email.com" 
                            value={forgotEmail} 
                            onChange={(e) => setForgotEmail(e.target.value)} 
                          />
                        </div>
                        <Button
                          type="button"
                          className="btn-futuristic inline-flex items-center gap-2"
                          onClick={handleResetPassword}
                          disabled={!forgotEmail || sendingReset}
                        >
                          <Mail className="w-4 h-4" /> 
                          {sendingReset ? "Enviando..." : "Enviar instruções"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading} 
                className="btn-futuristic w-full inline-flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                {loading ? "Entrando..." : "Entrar no Portal"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="card-glass p-4 rounded-xl text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground mb-1">Primeiro acesso?</div>
                    <div>Seu psicólogo irá cadastrar você no sistema e enviar suas credenciais de acesso.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-1"><Lock className="w-3 h-3" /> Criptografado</div>
              <div className="inline-flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> LGPD</div>
              <div className="inline-flex items-center gap-1"><Shield className="w-3 h-3" /> CRP Certificado</div>
            </div>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              <Link to="/" className="underline underline-offset-4">Voltar ao site</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortalLogin;
