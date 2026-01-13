import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-light mb-4">
              Termos de
              <span className="block bg-gradient-secondary bg-clip-text text-transparent">
                Uso
              </span>
            </h1>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Condições para utilização do site e dos serviços oferecidos.
            </p>
          </div>

          <Card className="card-glass max-w-4xl mx-auto">
            <CardContent className="p-6 md:p-10 space-y-8 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Aceitação dos termos</h2>
                <p>
                  Ao acessar e utilizar este site, você concorda com estes Termos de Uso e com a
                  Política de Privacidade. Se não concordar, por favor, não utilize o site.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Finalidade do site</h2>
                <p>
                  Este site tem finalidade informativa e de contato para agendamento de atendimentos
                  psicológicos. Ele não substitui avaliação, diagnóstico ou atendimento profissional
                  presencial quando necessário.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Responsabilidades do usuário</h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Fornecer informações verdadeiras e atualizadas nos formulários;</li>
                  <li>Utilizar o site de forma ética e conforme a legislação;</li>
                  <li>Não tentar acessar áreas restritas ou interferir no funcionamento do site.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Conteúdo e propriedade intelectual</h2>
                <p>
                  Todo conteúdo exibido (textos, marcas, layouts) pertence à Clínica Equanimité ou
                  é utilizado mediante autorização. É proibida a reprodução sem consentimento prévio.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Limitação de responsabilidade</h2>
                <p>
                  Empregamos esforços para manter as informações atualizadas, mas não garantimos
                  a ausência de erros. O uso do site é de responsabilidade do usuário.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Alterações</h2>
                <p>
                  Podemos modificar estes Termos a qualquer momento. As alterações entram em vigor
                  a partir de sua publicação neste site.
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

export default TermsOfUse;

