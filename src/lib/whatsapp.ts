import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientData {
  name: string;
  phone?: string | null;
}

interface AppointmentData {
  date_time: string;
  mode?: string;
  service?: string;
}

/**
 * Format phone number for WhatsApp link
 * Removes all non-numeric characters and ensures country code
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  
  // If doesn't have country code (assuming Brazil = 55), add it
  if (cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}

/**
 * Generate a WhatsApp link for session confirmation
 */
export function generateWhatsAppConfirmationLink(
  patient: PatientData,
  appointment: AppointmentData
): string | null {
  if (!patient.phone) return null;
  
  const phone = formatPhoneForWhatsApp(patient.phone);
  const dateTime = new Date(appointment.date_time);
  
  const formattedDate = format(dateTime, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const formattedTime = format(dateTime, "HH:mm");
  const modeText = appointment.mode === 'online' ? 'Online' : 'Presencial';
  
  const message = `Olá ${patient.name}! 👋

Confirmando sua sessão de terapia:

📅 ${formattedDate}
🕐 ${formattedTime}
📍 ${modeText}

Por favor, confirme sua presença respondendo esta mensagem.

Caso precise remarcar, entre em contato o mais breve possível.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate a WhatsApp link for session reminder
 */
export function generateWhatsAppReminderLink(
  patient: PatientData,
  appointment: AppointmentData
): string | null {
  if (!patient.phone) return null;
  
  const phone = formatPhoneForWhatsApp(patient.phone);
  const dateTime = new Date(appointment.date_time);
  
  const formattedDate = format(dateTime, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const formattedTime = format(dateTime, "HH:mm");
  const modeText = appointment.mode === 'online' ? 'Online' : 'Presencial';
  
  const message = `Olá ${patient.name}! 👋

Lembrete: sua sessão está agendada para amanhã!

📅 ${formattedDate}
🕐 ${formattedTime}
📍 ${modeText}

Te vejo em breve! 😊`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate a custom WhatsApp link
 */
export function generateCustomWhatsAppLink(
  phone: string,
  message: string
): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate WhatsApp link with confirmation action URL
 */
export function generateWhatsAppConfirmActionLink(
  patient: PatientData,
  appointment: AppointmentData,
  confirmUrl: string
): string | null {
  if (!patient.phone) return null;
  
  const phone = formatPhoneForWhatsApp(patient.phone);
  const dateTime = new Date(appointment.date_time);
  
  const formattedDate = format(dateTime, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const formattedTime = format(dateTime, "HH:mm");
  const modeText = appointment.mode === 'online' ? 'Online' : 'Presencial';
  
  const message = `Olá ${patient.name}! 👋

Sua sessão de terapia está agendada:

📅 ${formattedDate}
🕐 ${formattedTime}
📍 ${modeText}

Para confirmar sua presença, clique no link abaixo:
✅ ${confirmUrl}

Caso precise cancelar ou reagendar, entre em contato.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate WhatsApp link with cancel action URL
 */
export function generateWhatsAppCancelActionLink(
  patient: PatientData,
  appointment: AppointmentData,
  cancelUrl: string
): string | null {
  if (!patient.phone) return null;
  
  const phone = formatPhoneForWhatsApp(patient.phone);
  const dateTime = new Date(appointment.date_time);
  
  const formattedDate = format(dateTime, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const formattedTime = format(dateTime, "HH:mm");
  const modeText = appointment.mode === 'online' ? 'Online' : 'Presencial';
  
  const message = `Olá ${patient.name}! 👋

Você solicitou o cancelamento da sua sessão:

📅 ${formattedDate}
🕐 ${formattedTime}
📍 ${modeText}

Para confirmar o cancelamento, clique no link:
❌ ${cancelUrl}

Se preferir reagendar, entre em contato.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate WhatsApp link with reschedule action URL
 */
export function generateWhatsAppRescheduleActionLink(
  patient: PatientData,
  appointment: AppointmentData,
  rescheduleUrl: string
): string | null {
  if (!patient.phone) return null;
  
  const phone = formatPhoneForWhatsApp(patient.phone);
  const dateTime = new Date(appointment.date_time);
  
  const formattedDate = format(dateTime, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const formattedTime = format(dateTime, "HH:mm");
  const modeText = appointment.mode === 'online' ? 'Online' : 'Presencial';
  
  const message = `Olá ${patient.name}! 👋

Você pode reagendar sua sessão atual:

📅 ${formattedDate}
🕐 ${formattedTime}
📍 ${modeText}

Para escolher um novo horário, clique no link:
📆 ${rescheduleUrl}

Escolha o melhor dia e horário disponível.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate WhatsApp link with all action URLs (confirmation message)
 */
export function generateWhatsAppWithActionLinks(
  patient: PatientData,
  appointment: AppointmentData,
  actions: {
    confirmUrl?: string;
    cancelUrl?: string;
    rescheduleUrl?: string;
  }
): string | null {
  if (!patient.phone) return null;
  
  const phone = formatPhoneForWhatsApp(patient.phone);
  const dateTime = new Date(appointment.date_time);
  
  const formattedDate = format(dateTime, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const formattedTime = format(dateTime, "HH:mm");
  const modeText = appointment.mode === 'online' ? 'Online' : 'Presencial';
  
  let actionLinks = '';
  if (actions.confirmUrl) {
    actionLinks += `\n✅ Confirmar: ${actions.confirmUrl}`;
  }
  if (actions.rescheduleUrl) {
    actionLinks += `\n📆 Reagendar: ${actions.rescheduleUrl}`;
  }
  if (actions.cancelUrl) {
    actionLinks += `\n❌ Cancelar: ${actions.cancelUrl}`;
  }
  
  const message = `Olá ${patient.name}! 👋

Sua sessão de terapia está agendada:

📅 ${formattedDate}
🕐 ${formattedTime}
📍 ${modeText}

Gerencie seu agendamento:${actionLinks}

Te vejo em breve! 😊`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
