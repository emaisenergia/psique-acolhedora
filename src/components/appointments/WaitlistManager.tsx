import { useState } from 'react';
import { format, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useWaitlist, WaitlistEntry } from '@/hooks/useWaitlist';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Clock,
  Calendar,
  User,
  Bell,
  Trash2,
  Mail,
  Phone,
  Search,
  ClipboardList
} from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  waiting: { label: 'Aguardando', variant: 'secondary' },
  notified: { label: 'Notificado', variant: 'default' },
  scheduled: { label: 'Agendado', variant: 'outline' },
  expired: { label: 'Expirado', variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'destructive' }
};

const WaitlistManager = () => {
  const { waitlist, isLoading, notifyPatient, removeFromWaitlist } = useWaitlist();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);

  const filteredWaitlist = waitlist.filter(entry => {
    const matchesSearch = entry.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.patient?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleNotify = async (entry: WaitlistEntry) => {
    await notifyPatient(entry.id);
  };

  const handleDelete = async () => {
    if (selectedEntry) {
      await removeFromWaitlist(selectedEntry.id);
      setDeleteDialogOpen(false);
      setSelectedEntry(null);
    }
  };

  const openDeleteDialog = (entry: WaitlistEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const getTimeDisplay = (entry: WaitlistEntry): string => {
    if (entry.desired_time) return entry.desired_time;
    if (entry.time_range_start && entry.time_range_end) {
      return `${entry.time_range_start} - ${entry.time_range_end}`;
    }
    return 'Qualquer horário';
  };

  const isExpired = (entry: WaitlistEntry): boolean => {
    if (!entry.expires_at) return false;
    return isAfter(new Date(), parseISO(entry.expires_at));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Lista de Espera
          </CardTitle>
          <CardDescription>
            Pacientes aguardando horários disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="waiting">Aguardando</SelectItem>
                <SelectItem value="notified">Notificado</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredWaitlist.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum paciente na lista de espera</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Data Desejada</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWaitlist.map((entry) => (
                    <TableRow key={entry.id} className={isExpired(entry) ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {entry.patient?.name || 'Paciente'}
                          </span>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            {entry.patient?.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {entry.patient.email}
                              </span>
                            )}
                            {entry.patient?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {entry.patient.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(parseISO(entry.desired_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {getTimeDisplay(entry)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.service || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[entry.status]?.variant || 'secondary'}>
                          {statusConfig[entry.status]?.label || entry.status}
                        </Badge>
                        {entry.notified_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Notificado em {format(parseISO(entry.notified_at), 'dd/MM HH:mm')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {entry.status === 'waiting' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNotify(entry)}
                              className="gap-1"
                            >
                              <Bell className="w-4 h-4" />
                              Notificar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(entry)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da Lista de Espera</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {selectedEntry?.patient?.name} da lista de espera?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WaitlistManager;
