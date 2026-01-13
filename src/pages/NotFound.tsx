import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center section-gradient">
      <div className="text-center space-y-8 max-w-md mx-auto px-4">
        <div className="space-y-4">
          <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto animate-glow-pulse">
            <AlertCircle className="w-12 h-12 text-primary-foreground" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-6xl font-display font-light text-foreground">404</h1>
            <h2 className="text-2xl font-display font-light text-foreground">
              Página não encontrada
            </h2>
          </div>
          
          <p className="text-muted-foreground leading-relaxed">
            A página que você está procurando pode ter sido movida, 
            removida ou não existe mais.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => window.location.href = '/'}
            className="btn-futuristic"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
          
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
            className="btn-outline-futuristic"
          >
            Página Anterior
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>Precisa de ajuda? Entre em contato conosco:</p>
          <p className="text-primary">contato@clinicaequanimite.com.br</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
