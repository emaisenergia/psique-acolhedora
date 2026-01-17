import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WhatsAppWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(true);
  const [mounted, setMounted] = useState(false);

  const phoneNumber = '5545991244303';
  const message = encodeURIComponent('Olá! Gostaria de agendar uma consulta.');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  useEffect(() => {
    setMounted(true);
    
    // Auto-expand after 5 seconds on first visit
    const hasVisited = localStorage.getItem('whatsapp-greeted');
    if (!hasVisited) {
      const timer = setTimeout(() => {
        setIsExpanded(true);
        setHasNewMessage(false);
        localStorage.setItem('whatsapp-greeted', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setHasNewMessage(false);
    }
  }, []);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (hasNewMessage) setHasNewMessage(false);
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Card */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-4 w-80 bg-card border border-border rounded-2xl shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#25D366] p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" fill="white" />
              </div>
              <div className="flex-1 text-white">
                <p className="font-semibold text-sm">Clínica Equanimité</p>
                <p className="text-xs text-white/80">Online agora</p>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 bg-gradient-to-b from-muted/50 to-background">
              {/* Message Bubble */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="relative bg-card rounded-2xl rounded-tl-sm p-4 shadow-sm border border-border/50 max-w-[90%]"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-foreground">
                    Olá! 👋 Bem-vindo(a)!
                  </p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sou da equipe da Clínica Equanimité. Como posso ajudar você hoje?
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  Tire suas dúvidas ou agende sua primeira consulta.
                </p>
                
                {/* Timestamp */}
                <span className="absolute bottom-1 right-3 text-[10px] text-muted-foreground/50">
                  Agora
                </span>
              </motion.div>
            </div>

            {/* CTA Button */}
            <div className="p-4 pt-0">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white py-5 rounded-xl font-medium transition-all duration-300 hover:shadow-lg">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Iniciar conversa
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onClick={handleToggle}
        className="relative bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isExpanded ? "Fechar widget" : "Abrir widget WhatsApp"}
      >
        {/* Pulse animation */}
        {!isExpanded && (
          <>
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse opacity-20" />
          </>
        )}
        
        {/* Badge */}
        <AnimatePresence>
          {hasNewMessage && !isExpanded && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-xs font-bold text-white"
            >
              1
            </motion.span>
          )}
        </AnimatePresence>

        {/* Icon */}
        <AnimatePresence mode="wait" initial={false}>
          {isExpanded ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              <X className="w-7 h-7" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              <MessageCircle className="w-7 h-7" fill="currentColor" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default WhatsAppWidget;
