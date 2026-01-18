import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConsentDialogProps {
  open: boolean;
  patientId: string;
  onConsentAccepted: () => void;
}

const CURRENT_CONSENT_VERSION = "1.0";

export const ConsentDialog = ({ open, patientId, onConsentAccepted }: ConsentDialogProps) => {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAcceptConsent = async () => {
    if (!accepted) {
      toast.error("Você precisa aceitar os termos para continuar");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("patient_consents").insert({
        patient_id: patientId,
        consent_version: CURRENT_CONSENT_VERSION,
        consent_type: "terms_and_privacy",
        user_agent: navigator.userAgent,
      });

      if (error) throw error;

      toast.success("Termos aceitos com sucesso!");
      onConsentAccepted();
    } catch (error) {
      console.error("Erro ao salvar consentimento:", error);
      toast.error("Erro ao salvar consentimento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Termo de Consentimento e Política de Privacidade
          </DialogTitle>
          <DialogDescription>
            Para continuar utilizando o portal, por favor leia e aceite os termos abaixo.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="flex items-center gap-2 font-semibold text-base mb-2">
                <FileText className="h-4 w-4" />
                1. Introdução
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Este termo de consentimento estabelece as condições de uso do Portal do Paciente 
                e a nossa Política de Privacidade, em conformidade com a Lei Geral de Proteção 
                de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </section>

            <section>
              <h3 className="flex items-center gap-2 font-semibold text-base mb-2">
                <Lock className="h-4 w-4" />
                2. Dados Coletados
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Para a prestação dos serviços de acompanhamento psicológico, coletamos e processamos:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Dados de identificação (nome, e-mail, telefone, data de nascimento)</li>
                <li>Registros de sessões e anotações clínicas</li>
                <li>Atividades e tarefas terapêuticas</li>
                <li>Mensagens trocadas pelo portal</li>
                <li>Registros do diário emocional</li>
                <li>Planos de tratamento</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Finalidade do Tratamento</h3>
              <p className="text-muted-foreground leading-relaxed">
                Os seus dados são utilizados exclusivamente para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-2">
                <li>Prestação de serviços de psicoterapia</li>
                <li>Comunicação sobre agendamentos e lembretes</li>
                <li>Acompanhamento do seu progresso terapêutico</li>
                <li>Cumprimento de obrigações legais e regulatórias</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Compartilhamento de Dados</h3>
              <p className="text-muted-foreground leading-relaxed">
                Seus dados <strong>não são compartilhados</strong> com terceiros, exceto:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-2">
                <li>Por determinação judicial ou legal</li>
                <li>Com seu consentimento expresso</li>
                <li>Para proteger direitos, propriedade ou segurança</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Seus Direitos (LGPD)</h3>
              <p className="text-muted-foreground leading-relaxed">
                Você tem direito a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-2">
                <li>Acesso aos seus dados pessoais</li>
                <li>Correção de dados incompletos ou inexatos</li>
                <li>Portabilidade dos dados</li>
                <li>Eliminação dos dados (respeitando obrigações legais)</li>
                <li>Informação sobre compartilhamento de dados</li>
                <li>Revogação do consentimento</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Segurança</h3>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-2">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Controle de acesso baseado em funções</li>
                <li>Monitoramento de segurança contínuo</li>
                <li>Backups regulares</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Retenção de Dados</h3>
              <p className="text-muted-foreground leading-relaxed">
                Os dados serão mantidos pelo período necessário para o cumprimento das finalidades 
                descritas e conforme exigências legais do Conselho Federal de Psicologia (mínimo de 
                5 anos após o término do tratamento).
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Contato</h3>
              <p className="text-muted-foreground leading-relaxed">
                Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de seus dados, 
                entre em contato através das mensagens do portal ou pelos canais de comunicação 
                disponibilizados.
              </p>
            </section>

            <p className="text-xs text-muted-foreground mt-4 border-t pt-4">
              Versão do termo: {CURRENT_CONSENT_VERSION} | Última atualização: Janeiro de 2026
            </p>
          </div>
        </ScrollArea>

        <div className="flex items-center space-x-2 pt-4 border-t">
          <Checkbox
            id="consent"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
          />
          <label
            htmlFor="consent"
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Li e aceito o Termo de Consentimento e a Política de Privacidade
          </label>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleAcceptConsent} 
            disabled={!accepted || loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Salvando..." : "Aceitar e Continuar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConsentDialog;
