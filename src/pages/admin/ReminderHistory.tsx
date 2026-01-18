import { useState, useEffect } from 'react';
import { format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AdminLayout from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Mail,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReminderLog {
  id: string;
  appointment_id: string | null;
  reminder_type: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  appointment?: {
    date_time: string;
    patient?: {
      name: string;
      email: string;
    };
  };
}

interface DateRange {
  from: Date;
  to: Date;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  sent: { label: 'Enviado', icon: CheckCircle2, color: 'text-green-500' },
  failed: { label: 'Falhou', icon: XCircle, color: 'text-destructive' },
  pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-500' }
};

const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  email: { label: 'Email', icon: Mail },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare }
};

const ReminderHistory = () => {
  const [reminders, setReminders] = useState<ReminderLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  useEffect(() => {
    fetchReminders();
  }, [dateRange]);

  const fetchReminders = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('reminder_logs')
        .select(`
          *,
          appointment:appointments(
            date_time,
            patient:patients(name, email)
          )
        `)
        .gte('created_at', startOfDay(dateRange.from).toISOString())
        .lte('created_at', endOfDay(dateRange.to).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion since Supabase types may not fully reflect the join
      setReminders((data || []) as unknown as ReminderLog[]);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = 
      reminder.appointment?.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.appointment?.patient?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reminder.status === statusFilter;
    const matchesType = typeFilter === 'all' || reminder.reminder_type === typeFilter;
    return (searchTerm === '' || matchesSearch) && matchesStatus && matchesType;
  });

  // Stats
  const totalSent = reminders.filter(r => r.status === 'sent').length;
  const totalFailed = reminders.filter(r => r.status === 'failed').length;
  const successRate = reminders.length > 0 
    ? Math.round((totalSent / reminders.length) * 100) 
    : 0;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Histórico de Lembretes
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o envio de lembretes automáticos para pacientes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Enviados</p>
                  <p className="text-3xl font-bold text-green-500">{totalSent}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Falhas</p>
                  <p className="text-3xl font-bold text-destructive">{totalFailed}</p>
                </div>
                <XCircle className="w-10 h-10 text-destructive opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                  <p className="text-3xl font-bold text-primary">{successRate}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                    {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sent">Enviados</SelectItem>
                  <SelectItem value="failed">Falhas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lembretes</CardTitle>
            <CardDescription>
              {filteredReminders.length} lembrete(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredReminders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum lembrete encontrado no período selecionado</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Consulta</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReminders.map((reminder) => {
                      const StatusIcon = statusConfig[reminder.status]?.icon || AlertCircle;
                      const TypeIcon = typeConfig[reminder.reminder_type]?.icon || Mail;
                      
                      return (
                        <TableRow key={reminder.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {reminder.sent_at 
                                  ? format(parseISO(reminder.sent_at), 'dd/MM/yyyy', { locale: ptBR })
                                  : format(parseISO(reminder.created_at), 'dd/MM/yyyy', { locale: ptBR })
                                }
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {reminder.sent_at 
                                  ? format(parseISO(reminder.sent_at), 'HH:mm')
                                  : format(parseISO(reminder.created_at), 'HH:mm')
                                }
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{reminder.appointment?.patient?.name || 'Paciente não encontrado'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {reminder.appointment?.date_time ? (
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  {format(parseISO(reminder.appointment.date_time), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <TypeIcon className="w-3 h-3" />
                              {typeConfig[reminder.reminder_type]?.label || reminder.reminder_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className={cn('flex items-center gap-1', statusConfig[reminder.status]?.color)}>
                              <StatusIcon className="w-4 h-4" />
                              <span>{statusConfig[reminder.status]?.label || reminder.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {reminder.error_message ? (
                              <span className="text-sm text-destructive truncate max-w-[200px] block" title={reminder.error_message}>
                                {reminder.error_message}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ReminderHistory;
