import { useState, useEffect } from 'react';
import { Menu, X, Home, User, Heart, Calendar, BookOpen, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Inicio', href: '#home', icon: Home },
    { name: 'Sobre', href: '#sobre', icon: User },
    { name: 'Serviços', href: '#servicos', icon: Heart },
    { name: 'Agendamento', href: '#agendamento', icon: Calendar },
    { name: 'Blog', href: '#blog', icon: BookOpen },
    { name: 'Portal', href: '/portal', icon: Shield },
  ];

  const scrollToSection = (href: string) => {
    // Direct navigation for routes
    if (href.startsWith('/')) {
      navigate(href);
      setIsMobileMenuOpen(false);
      return;
    }

    // Map aliases to actual section ids
    const target = href === '#agendamento' ? '#contato' : href;

    if (location.pathname === '/') {
      const element = document.querySelector(target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Fallback: update hash to allow default browser behavior
        window.location.hash = target.replace('#', '');
      }
      setIsMobileMenuOpen(false);
    } else {
      navigate(`/${target}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'header-glass' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">E</span>
            </div>
            <span className="font-display text-2xl font-light text-foreground">
              Equanimité
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="link-hover text-sm font-medium tracking-wide inline-flex items-center gap-2"
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </button>
            ))}
          </nav>

          {/* CTA Button & Theme Toggle */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Button 
              onClick={() => scrollToSection('#agendamento')}
              className="btn-futuristic inline-flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Agendar consulta
            </Button>
          </div>

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-lg border-t border-border/50">
            <nav className="flex flex-col p-4 space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="text-left py-2 text-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </button>
              ))}
              <Button 
                onClick={() => scrollToSection('#agendamento')}
                className="btn-futuristic mt-4 inline-flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Agendar consulta
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
