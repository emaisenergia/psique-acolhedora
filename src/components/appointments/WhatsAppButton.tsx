import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle } from 'lucide-react';
import { generateWhatsAppConfirmationLink } from '@/lib/whatsapp';

interface WhatsAppButtonProps {
  patientName: string;
  patientPhone?: string | null;
  appointmentDateTime: string;
  appointmentMode?: string;
  size?: 'sm' | 'default' | 'icon';
  variant?: 'default' | 'ghost' | 'outline';
}

export function WhatsAppButton({
  patientName,
  patientPhone,
  appointmentDateTime,
  appointmentMode,
  size = 'icon',
  variant = 'ghost',
}: WhatsAppButtonProps) {
  const whatsappLink = patientPhone
    ? generateWhatsAppConfirmationLink(
        { name: patientName, phone: patientPhone },
        { date_time: appointmentDateTime, mode: appointmentMode }
      )
    : null;

  if (!whatsappLink) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={size}
            variant={variant}
            className="text-muted-foreground cursor-not-allowed opacity-50"
            disabled
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Paciente sem telefone cadastrado</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size={size}
          variant={variant}
          className="text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10"
          onClick={(e) => {
            e.stopPropagation();
            window.open(whatsappLink, '_blank');
          }}
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Enviar confirmação via WhatsApp</p>
      </TooltipContent>
    </Tooltip>
  );
}
