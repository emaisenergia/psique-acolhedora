import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, Package, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSessionPackages, type SessionPackage } from "@/hooks/useSessionPackages";
import { usePatients } from "@/hooks/usePatients";
import { cn } from "@/lib/utils";

type PackageFormState = {
  patient_id: string;
  name: string;
  total_sessions: number;
  price: number;
  notes: string;
  start_date: string;
  expiry_date: string;
};

const defaultFormState: PackageFormState = {
  patient_id: "",
  name: "",
  total_sessions: 10,
  price: 0,
  notes: "",
  start_date: "",
  expiry_date: "",
};

export const SessionPackagesManager = () => {
  const { packages, isLoading, createPackage, updatePackage, deletePackage } = useSessionPackages();
  const { patients } = usePatients();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PackageFormState>(defaultFormState);

  const patientMap = Object.fromEntries(patients.map((p) => [p.id, p.name]));

  const openCreateDialog = () => {
    setForm(defaultFormState);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditDialog = (pkg: SessionPackage) => {
    setForm({
      patient_id: pkg.patient_id,
      name: pkg.name,
      total_sessions: pkg.total_sessions,
      price: pkg.price,
      notes: pkg.notes || "",
      start_date: pkg.start_date || "",
      expiry_date: pkg.expiry_date || "",
    });
    setEditingId(pkg.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.patient_id || !form.name || form.total_sessions < 1) return;

    if (editingId) {
      await updatePackage(editingId, {
        name: form.name,
        total_sessions: form.total_sessions,
        price: form.price,
        notes: form.notes || null,
        start_date: form.start_date || null,
        expiry_date: form.expiry_date || null,
      });
    } else {
      await createPackage({
        patient_id: form.patient_id,
        name: form.name,
        total_sessions: form.total_sessions,
        price: form.price,
        notes: form.notes || null,
        start_date: form.start_date || null,
        expiry_date: form.expiry_date || null,
      });
    }

    setShowForm(false);
    setEditingId(null);
    setForm(defaultFormState);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este pacote?")) {
      await deletePackage(id);
    }
  };

  const getStatusBadge = (pkg: SessionPackage) => {
    if (pkg.status !== "active") {
      return <Badge variant="secondary">Inativo</Badge>;
    }
    if (pkg.used_sessions >= pkg.total_sessions) {
      return <Badge variant="destructive">Esgotado</Badge>;
    }
    const remaining = pkg.total_sessions - pkg.used_sessions;
    if (remaining <= 2) {
      return <Badge className="bg-amber-500">Finalizando</Badge>;
    }
    return <Badge className="bg-emerald-500">Ativo</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pacotes de Sessões
            </CardTitle>
            <CardDescription>
              Gerencie os pacotes de sessões dos pacientes
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pacote
          </Button>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p>Nenhum pacote cadastrado</p>
              <p className="text-sm mt-1">Clique em "Novo Pacote" para criar o primeiro.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {packages.map((pkg) => {
                const progress = (pkg.used_sessions / pkg.total_sessions) * 100;
                const remaining = pkg.total_sessions - pkg.used_sessions;
                
                return (
                  <div
                    key={pkg.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{pkg.name}</span>
                        {getStatusBadge(pkg)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {patientMap[pkg.patient_id] || "Paciente"}
                        {pkg.price > 0 && (
                          <span className="ml-2">
                            • R$ {pkg.price.toFixed(2).replace(".", ",")}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3">
                        <Progress value={progress} className="flex-1 h-2" />
                        <span className="text-sm font-medium whitespace-nowrap">
                          {pkg.used_sessions}/{pkg.total_sessions}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {remaining === 0
                          ? "Todas as sessões utilizadas"
                          : `${remaining} sessão(ões) restante(s)`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(pkg)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(pkg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Pacote" : "Novo Pacote de Sessões"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select
                value={form.patient_id}
                onValueChange={(v) => setForm({ ...form, patient_id: v })}
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome do Pacote *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Pacote Mensal"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Total de Sessões *</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.total_sessions}
                  onChange={(e) =>
                    setForm({ ...form, total_sessions: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Total (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Expiração</Label>
                <Input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas sobre o pacote..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? "Salvar Alterações" : "Criar Pacote"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
