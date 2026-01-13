import { 
  Heart, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Instagram,
  Facebook,
  Linkedin
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' }
  ];

  const quickLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Sobre', href: '#sobre' },
    { name: 'Serviços', href: '#servicos' },
    { name: 'Blog', href: '#blog' },
    { name: 'Contato', href: '#contato' }
  ];

  const services = [
    'Terapia Individual',
    'Terapia Online',
    'Terapia de Casal',
    'TCC',
    'Tratamento de Ansiedade',
    'Apoio Psicológico'
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-background border-t border-border/50">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12">
          {/* Brand & Contact */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">E</span>
              </div>
              <span className="font-display text-2xl font-light text-foreground">
                Equanimité
              </span>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              Equilibrando mente e vida através da psicoterapia personalizada. 
              Seu bem-estar é nossa prioridade.
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                 Rua Cassiano Jorge Fernandes - Maria Luíza<br />
                  Cascavel, Paraná - CEP 86.819-710
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">(45) 99124-4303</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">contato@clinicaequanimite.com</span>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Segunda a Sexta: 7h às 21h<br />
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-6">
              Navegação
            </h3>
            <nav className="space-y-3">
              {quickLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className="block text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  {link.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-foreground mb-6">
              Nossos Serviços
            </h3>
            <nav className="space-y-3">
              {services.map((service) => (
                <button
                  key={service}
                  onClick={() => scrollToSection('#servicos')}
                  className="block text-muted-foreground hover:text-primary transition-colors text-left text-sm"
                >
                  {service}
                </button>
              ))}
            </nav>
          </div>

          {/* Professional Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-6">
              Informações Profissionais
            </h3>
            
            <div className="space-y-4">
              <div className="card-glass p-4 rounded-xl">
                <div className="text-sm text-muted-foreground mb-2">
                  Psicóloga Amanda Cristina Salomão
                </div>
                <div className="font-semibold text-foreground">
                  CRP 08/38431
                </div>
                
              </div>
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>✓ Especialização em TCC</p>
                <p>✓ Formação em Terapia Online</p>
                <p>✓ Atendimento humanizado</p>
                <p>✓ Sigilo profissional garantido</p>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6">
              <h4 className="font-medium text-foreground mb-3 text-sm">
                Siga-nos
              </h4>
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 bg-muted hover:bg-primary/20 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5 text-muted-foreground hover:text-primary" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-border/50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>
                © {currentYear} Clínica Equanimité. Todos os direitos reservados.
              </span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <Link 
                to="/politica-de-privacidade" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Política de Privacidade
              </Link>
              <Link 
                to="/termos-de-uso" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Termos de Uso
              </Link>
              <Link 
                to="/admin/login" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Área do Administrador
              </Link>
              <a
                href="https://site.cfp.org.br/wp-content/uploads/2022/06/WEB_29535_Codigo_de_etica_da_profissao_14.04-1.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Código de Ética
              </a>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Desenvolvido por</span>
              <Heart className="w-4 h-4 text-primary fill-primary" />
              <span>Amanda Cristina | Dev</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
