import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-light mb-4">
              Política de
              <span className="block bg-gradient-secondary bg-clip-text text-transparent">
                Privacidade
              </span>
            </h1>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Transparência sobre como coletamos, utilizamos e protegemos seus dados pessoais.
            </p>
          </div>

          <Card className="card-glass max-w-4xl mx-auto">
            <CardContent className="p-6 md:p-10 space-y-8 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Introdução</h2>
                <p>
                  Esta Política de Privacidade descreve como a Clínica Equanimité coleta,
                  utiliza, armazena e protege os dados pessoais dos usuários deste site. Ao utilizar
                  nossos serviços, você concorda com as práticas descritas neste documento.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Dados coletados</h2>
                <p className="mb-2">Podemos coletar as seguintes informações:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Dados de contato (nome, e-mail, telefone) enviados via formulário;</li>
                  <li>Dados de navegação (IP, navegador, páginas acessadas);</li>
                  <li>Informações fornecidas voluntariamente para agendamentos e contatos.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Uso das informações</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Responder a contatos e solicitações;</li>
                  <li>Agendar e confirmar atendimentos;</li>
                  <li>Melhorar a experiência no site e serviços;</li>
                  <li>Cumprir obrigações legais e regulatórias.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Compartilhamento</h2>
                <p>
                  Não comercializamos seus dados. O compartilhamento poderá ocorrer apenas com
                  provedores de serviço estritamente necessários (por exemplo, hospedagem e
                  e-mail), sob obrigações de confidencialidade e segurança, ou quando exigido por lei.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Segurança</h2>
                <p>
                  Adotamos medidas técnicas e administrativas para proteger seus dados contra
                  acessos não autorizados, perda ou alteração. No entanto, nenhum método é 100% seguro.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Seus direitos</h2>
                <p className="mb-2">
                  Você pode solicitar acesso, correção, atualização ou exclusão dos seus dados, nos termos da LGPD.
                </p>
                <p>
                  Para exercer seus direitos, entre em contato em: contato@clinicaequanimite.com.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Cookies</h2>
                <p>
                  Utilizamos cookies para melhorar a usabilidade e analisar o tráfego do site.
                  Você pode gerenciar cookies nas configurações do seu navegador.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Alterações</h2>
                <p>
                  Podemos atualizar esta política periodicamente. A data de vigência será ajustada conforme alterações.
                </p>
              </section>

              <p className="text-xs">Vigência: {new Date().getFullYear()}</p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

