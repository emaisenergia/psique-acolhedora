import { useState } from "react";
import { MessageCircle, Check, Calendar, X, Send, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAppointmentActions } from "@/hooks/useAppointmentActions";
import {
  generateWhatsAppConfirmActionLink,
  generateWhatsAppCancelActionLink,
  generateWhatsAppRescheduleActionLink,
  generateWhatsAppWithActionLinks,
} from "@/lib/whatsapp";
import { toast } from "@/components/ui/sonner";

interface WhatsAppActionMenuProps {
  appointmentId: string;
  patientName: string;
  patientPhone?: string | null;
  appointmentDateTime: string;
  appointmentMode?: string;
  appointmentService?: string;
}

export const WhatsAppActionMenu = ({
  appointmentId,
  patientName,
  patientPhone,
  appointmentDateTime,
  appointmentMode,
  appointmentService,
}: WhatsAppActionMenuProps) => {
  const { generateActionTokens, isGenerating } = useAppointmentActions();
  const [isOpen, setIsOpen] = useState(false);

  if (!patientPhone) {
    return null;
  }

  const patient = { name: patientName, phone: patientPhone };
  const appointment = {
    date_time: appointmentDateTime,
    mode: appointmentMode,
    service: appointmentService,
  };

  const handleAction = async (
    actionType: "confirm" | "cancel" | "reschedule" | "complete"
  ) => {
    const urls = await generateActionTokens(appointmentId);

    if (!urls) {
      toast.error("Erro ao gerar links de ação");
      return;
    }

    let whatsappLink: string | null = null;

    switch (actionType) {
      case "confirm":
        whatsappLink = generateWhatsAppConfirmActionLink(patient, appointment, urls.confirmUrl);
        break;
      case "cancel":
        whatsappLink = generateWhatsAppCancelActionLink(patient, appointment, urls.cancelUrl);
        break;
      case "reschedule":
        whatsappLink = generateWhatsAppRescheduleActionLink(patient, appointment, urls.rescheduleUrl);
        break;
      case "complete":
        whatsappLink = generateWhatsAppWithActionLinks(patient, appointment, urls);
        break;
    }

    if (whatsappLink) {
      window.open(whatsappLink, "_blank");
      setIsOpen(false);
    } else {
      toast.error("Erro ao gerar link do WhatsApp");
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-green-600" />
          Enviar via WhatsApp
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleAction("confirm")}
          className="cursor-pointer"
          disabled={isGenerating}
        >
          <Check className="h-4 w-4 mr-2 text-emerald-600" />
          Link de Confirmação
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleAction("reschedule")}
          className="cursor-pointer"
          disabled={isGenerating}
        >
          <Calendar className="h-4 w-4 mr-2 text-blue-600" />
          Link de Reagendamento
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleAction("cancel")}
          className="cursor-pointer"
          disabled={isGenerating}
        >
          <X className="h-4 w-4 mr-2 text-red-600" />
          Link de Cancelamento
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleAction("complete")}
          className="cursor-pointer"
          disabled={isGenerating}
        >
          <Send className="h-4 w-4 mr-2 text-primary" />
          Mensagem Completa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
