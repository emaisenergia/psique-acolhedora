import { useState } from "react";
import { Edit, Handshake, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useInsurances, type Insurance } from "@/hooks/useInsurances";

type InsuranceFormState = {
  name: string;
  coverage_percentage: number;
  contact_phone: string;
  contact_email: string;
  notes: string;
};

const defaultFormState: InsuranceFormState = {
  name: "",
  coverage_percentage: 0,
  contact_phone: "",
  contact_email: "",
  notes: "",
};

export const InsurancesManager = () => {
  const { insurances, isLoading, createInsurance, updateInsurance, deleteInsurance } = useInsurances();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InsuranceFormState>(defaultFormState);

  const openCreateDialog = () => {
    setForm(defaultFormState);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditDialog = (ins: Insurance) => {
    setForm({
      name: ins.name,
      coverage_percentage: ins.coverage_percentage,
      contact_phone: ins.contact_phone || "",
      contact_email: ins.contact_email || "",
      notes: ins.notes || "",
    });
    setEditingId(ins.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name) return;

    if (editingId) {
      await updateInsurance(editingId, {
        name: form.name,
        coverage_percentage: form.coverage_percentage,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        notes: form.notes || null,
      });
    } else {
      await createInsurance({
        name: form.name,
        coverage_percentage: form.coverage_percentage,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        notes: form.notes || null,
      });
    }

    setShowForm(false);
    setEditingId(null);
    setForm(defaultFormState);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este convênio?")) {
      await deleteInsurance(id);
    }
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
              <Handshake className="h-5 w-5" />
              Convênios
            </CardTitle>
            <CardDescription>
              Gerencie os convênios e planos de saúde aceitos
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Convênio
          </Button>
        </CardHeader>
        <CardContent>
          {insurances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Handshake className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p>Nenhum convênio cadastrado</p>
              <p className="text-sm mt-1">Clique em "Novo Convênio" para cadastrar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insurances.map((ins) => (
                <div
                  key={ins.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{ins.name}</span>
                      {ins.coverage_percentage > 0 && (
                        <Badge variant="secondary">
                          {ins.coverage_percentage}% cobertura
                        </Badge>
                      )}
                      <Badge className={ins.status === "active" ? "bg-emerald-500" : ""}>
                        {ins.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    {(ins.contact_phone || ins.contact_email) && (
                      <p className="text-sm text-muted-foreground">
                        {ins.contact_phone && <span>{ins.contact_phone}</span>}
                        {ins.contact_phone && ins.contact_email && <span> • </span>}
                        {ins.contact_email && <span>{ins.contact_email}</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(ins)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(ins.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Convênio" : "Novo Convênio"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Convênio *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Unimed"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Porcentagem de Cobertura (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.coverage_percentage}
                onChange={(e) =>
                  setForm({ ...form, coverage_percentage: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Telefone de Contato</Label>
                <Input
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  placeholder="(00) 0000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Email de Contato</Label>
                <Input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="contato@convenio.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas sobre o convênio..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? "Salvar Alterações" : "Cadastrar Convênio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
