import { useState, useEffect, useMemo } from 'react';
import { Menu, X, Home, User, Heart, Calendar, BookOpen, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';
import { useActiveSection } from '@/hooks/useActiveSection';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const sectionIds = useMemo(() => ['home', 'sobre', 'servicos', 'processo', 'agendamento', 'blog', 'contato'], []);
  const activeSection = useActiveSection(sectionIds);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Inicio', href: '#home', icon: Home, sectionId: 'home' },
    { name: 'Sobre', href: '#sobre', icon: User, sectionId: 'sobre' },
    { name: 'Serviços', href: '#servicos', icon: Heart, sectionId: 'servicos' },
    { name: 'Processo', href: '#processo', icon: Sparkles, sectionId: 'processo' },
    { name: 'Agendamento', href: '#agendamento', icon: Calendar, sectionId: 'agendamento' },
    { name: 'Blog', href: '#blog', icon: BookOpen, sectionId: 'blog' },
    { name: 'Portal', href: '/portal', icon: Shield, sectionId: '' },
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

  const isActive = (sectionId: string) => {
    if (!sectionId) return false;
    // Handle agendamento which maps to contato section
    if (sectionId === 'agendamento' && activeSection === 'contato') return true;
    return activeSection === sectionId;
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
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const active = isActive(item.sectionId);
              return (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium tracking-wide inline-flex items-center gap-2 rounded-full transition-colors duration-300",
                    active 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {/* Active indicator background */}
                  {active && (
                    <motion.div
                      layoutId="activeSection"
                      className="absolute inset-0 bg-primary/10 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn(
                    "w-4 h-4 relative z-10 transition-colors",
                    active && "text-primary"
                  )} />
                  <span className="relative z-10">{item.name}</span>
                  
                  {/* Active dot indicator */}
                  {active && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"
                    />
                  )}
                </button>
              );
            })}
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
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-lg border-t border-border/50"
          >
            <nav className="flex flex-col p-4 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.sectionId);
                return (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.href)}
                    className={cn(
                      "text-left py-3 px-4 rounded-lg transition-all inline-flex items-center gap-3",
                      active 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                    {active && (
                      <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
              <Button 
                onClick={() => scrollToSection('#agendamento')}
                className="btn-futuristic mt-4 inline-flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Agendar consulta
              </Button>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;
