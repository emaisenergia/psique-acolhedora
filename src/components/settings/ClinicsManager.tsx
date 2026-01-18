import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus, Edit, Trash2, Star, DollarSign, MapPin, Phone, Mail } from "lucide-react";
import { useClinics, type Clinic, type ClinicInsert } from "@/hooks/useClinics";
import { useServicePrices, type ServicePrice, type ServicePriceInsert } from "@/hooks/useServicePrices";
import { useInsurances } from "@/hooks/useInsurances";

const SERVICE_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "casal", label: "Casal" },
  { value: "familia", label: "Família" },
  { value: "grupo", label: "Grupo" },
  { value: "avaliacao", label: "Avaliação" },
  { value: "social", label: "Atendimento Social" },
];

interface ClinicFormState {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  is_default: boolean;
  status: string;
}

const defaultClinicForm: ClinicFormState = {
  name: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  is_default: false,
  status: "active",
};

interface PriceFormState {
  clinic_id: string;
  insurance_id: string;
  service_type: string;
  price: string;
  is_social: boolean;
  notes: string;
}

const defaultPriceForm: PriceFormState = {
  clinic_id: "",
  insurance_id: "",
  service_type: "individual",
  price: "0,00",
  is_social: false,
  notes: "",
};

export function ClinicsManager() {
  const { clinics, isLoading: clinicsLoading, createClinic, updateClinic, deleteClinic } = useClinics();
  const { servicePrices, isLoading: pricesLoading, createServicePrice, updateServicePrice, deleteServicePrice } = useServicePrices();
  const { insurances } = useInsurances();
  
  const [clinicDialogOpen, setClinicDialogOpen] = useState(false);
  const [clinicForm, setClinicForm] = useState<ClinicFormState>(defaultClinicForm);
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [priceForm, setPriceForm] = useState<PriceFormState>(defaultPriceForm);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);

  const isLoading = clinicsLoading || pricesLoading;

  const openCreateClinicDialog = () => {
    setClinicForm(defaultClinicForm);
    setEditingClinicId(null);
    setClinicDialogOpen(true);
  };

  const openEditClinicDialog = (clinic: Clinic) => {
    setClinicForm({
      name: clinic.name,
      address: clinic.address || "",
      city: clinic.city || "",
      phone: clinic.phone || "",
      email: clinic.email || "",
      is_default: clinic.is_default,
      status: clinic.status,
    });
    setEditingClinicId(clinic.id);
    setClinicDialogOpen(true);
  };

  const handleSaveClinic = async () => {
    if (!clinicForm.name.trim()) return;

    const data: ClinicInsert = {
      name: clinicForm.name.trim(),
      address: clinicForm.address.trim() || null,
      city: clinicForm.city.trim() || null,
      phone: clinicForm.phone.trim() || null,
      email: clinicForm.email.trim() || null,
      is_default: clinicForm.is_default,
      status: clinicForm.status,
    };

    if (editingClinicId) {
      await updateClinic(editingClinicId, data);
    } else {
      await createClinic(data);
    }

    setClinicDialogOpen(false);
    setClinicForm(defaultClinicForm);
    setEditingClinicId(null);
  };

  const handleDeleteClinic = async (id: string) => {
    if (confirm("Tem certeza que deseja remover esta clínica?")) {
      await deleteClinic(id);
    }
  };

  const openCreatePriceDialog = (clinicId?: string) => {
    setPriceForm({
      ...defaultPriceForm,
      clinic_id: clinicId || "",
    });
    setEditingPriceId(null);
    setPriceDialogOpen(true);
  };

  const openEditPriceDialog = (price: ServicePrice) => {
    setPriceForm({
      clinic_id: price.clinic_id || "",
      insurance_id: price.insurance_id || "",
      service_type: price.service_type,
      price: price.price.toFixed(2).replace(".", ","),
      is_social: price.is_social,
      notes: price.notes || "",
    });
    setEditingPriceId(price.id);
    setPriceDialogOpen(true);
  };

  const handleSavePrice = async () => {
    const priceValue = parseFloat(priceForm.price.replace(",", ".")) || 0;

    const data: ServicePriceInsert = {
      clinic_id: priceForm.clinic_id || null,
      insurance_id: priceForm.insurance_id || null,
      service_type: priceForm.service_type,
      price: priceValue,
      is_social: priceForm.is_social,
      notes: priceForm.notes.trim() || null,
    };

    if (editingPriceId) {
      await updateServicePrice(editingPriceId, data);
    } else {
      await createServicePrice(data);
    }

    setPriceDialogOpen(false);
    setPriceForm(defaultPriceForm);
    setEditingPriceId(null);
  };

  const handleDeletePrice = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este preço?")) {
      await deleteServicePrice(id);
    }
  };

  const getPricesForClinic = (clinicId: string | null) => {
    return servicePrices.filter(p => p.clinic_id === clinicId);
  };

  const getClinicName = (id: string | null) => {
    if (!id) return "Geral (todas as clínicas)";
    const clinic = clinics.find(c => c.id === id);
    return clinic?.name || "—";
  };

  const getInsuranceName = (id: string | null) => {
    if (!id) return "Particular";
    const insurance = insurances.find(i => i.id === id);
    return insurance?.name || "—";
  };

  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="clinics">
        <TabsList>
          <TabsTrigger value="clinics">Clínicas</TabsTrigger>
          <TabsTrigger value="prices">Valores por Serviço</TabsTrigger>
        </TabsList>

        <TabsContent value="clinics" className="mt-4">
          <Card className="card-glass">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <CardTitle className="text-xl">Clínicas de Atendimento</CardTitle>
                </div>
                <Button onClick={openCreateClinicDialog} className="btn-futuristic">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Clínica
                </Button>
              </div>
              <CardDescription>Cadastre as clínicas ou locais onde você atende.</CardDescription>
            </CardHeader>
            <CardContent>
              {clinics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma clínica cadastrada.</p>
                  <p className="text-sm">Adicione sua primeira clínica para começar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clinics.map((clinic) => (
                    <div
                      key={clinic.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{clinic.name}</h3>
                          {clinic.is_default && (
                            <Badge variant="secondary" className="gap-1">
                              <Star className="w-3 h-3" />
                              Padrão
                            </Badge>
                          )}
                          <Badge variant={clinic.status === "active" ? "default" : "outline"}>
                            {clinic.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {clinic.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {clinic.address}{clinic.city ? `, ${clinic.city}` : ""}
                            </span>
                          )}
                          {clinic.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {clinic.phone}
                            </span>
                          )}
                          {clinic.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {clinic.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditClinicDialog(clinic)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClinic(clinic.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices" className="mt-4">
          <Card className="card-glass">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <CardTitle className="text-xl">Valores por Serviço</CardTitle>
                </div>
                <Button onClick={() => openCreatePriceDialog()} className="btn-futuristic">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Valor
                </Button>
              </div>
              <CardDescription>
                Configure os valores por tipo de atendimento, clínica e convênio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {servicePrices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum valor cadastrado.</p>
                  <p className="text-sm">Configure os valores dos seus atendimentos.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clínica</TableHead>
                      <TableHead>Tipo de Serviço</TableHead>
                      <TableHead>Convênio</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Social</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servicePrices.map((price) => (
                      <TableRow key={price.id}>
                        <TableCell>{getClinicName(price.clinic_id)}</TableCell>
                        <TableCell>
                          {SERVICE_TYPES.find(t => t.value === price.service_type)?.label || price.service_type}
                        </TableCell>
                        <TableCell>{getInsuranceName(price.insurance_id)}</TableCell>
                        <TableCell className="font-medium">{brl.format(price.price)}</TableCell>
                        <TableCell>
                          {price.is_social && (
                            <Badge variant="secondary">Social</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditPriceDialog(price)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePrice(price.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Clinic Dialog */}
      <Dialog open={clinicDialogOpen} onOpenChange={setClinicDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClinicId ? "Editar Clínica" : "Nova Clínica"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="clinic-name">Nome da Clínica *</Label>
              <Input
                id="clinic-name"
                value={clinicForm.name}
                onChange={(e) => setClinicForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Clínica Centro"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="clinic-address">Endereço</Label>
              <Input
                id="clinic-address"
                value={clinicForm.address}
                onChange={(e) => setClinicForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Ex: Rua das Flores, 123"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="clinic-city">Cidade</Label>
              <Input
                id="clinic-city"
                value={clinicForm.city}
                onChange={(e) => setClinicForm(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Ex: São Paulo - SP"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="clinic-phone">Telefone</Label>
                <Input
                  id="clinic-phone"
                  value={clinicForm.phone}
                  onChange={(e) => setClinicForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="clinic-email">E-mail</Label>
                <Input
                  id="clinic-email"
                  type="email"
                  value={clinicForm.email}
                  onChange={(e) => setClinicForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@clinica.com"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="clinic-status">Status</Label>
              <Select
                value={clinicForm.status}
                onValueChange={(value) => setClinicForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Clínica padrão</p>
                <p className="text-sm text-muted-foreground">Será pré-selecionada nos agendamentos</p>
              </div>
              <Switch
                checked={clinicForm.is_default}
                onCheckedChange={(checked) => setClinicForm(prev => ({ ...prev, is_default: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClinicDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveClinic} className="btn-futuristic">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPriceId ? "Editar Valor" : "Novo Valor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="price-clinic">Clínica</Label>
              <Select
                value={priceForm.clinic_id || "all"}
                onValueChange={(value) => setPriceForm(prev => ({ ...prev, clinic_id: value === "all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma clínica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Geral (todas as clínicas)</SelectItem>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="price-service">Tipo de Serviço *</Label>
              <Select
                value={priceForm.service_type}
                onValueChange={(value) => setPriceForm(prev => ({ ...prev, service_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="price-insurance">Convênio</Label>
              <Select
                value={priceForm.insurance_id || "particular"}
                onValueChange={(value) => setPriceForm(prev => ({ ...prev, insurance_id: value === "particular" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um convênio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="particular">Particular</SelectItem>
                  {insurances.map((insurance) => (
                    <SelectItem key={insurance.id} value={insurance.id}>
                      {insurance.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="price-value">Valor (R$) *</Label>
              <Input
                id="price-value"
                value={priceForm.price}
                onChange={(e) => setPriceForm(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0,00"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Atendimento Social</p>
                <p className="text-sm text-muted-foreground">Valor reduzido para casos sociais</p>
              </div>
              <Switch
                checked={priceForm.is_social}
                onCheckedChange={(checked) => setPriceForm(prev => ({ ...prev, is_social: checked }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="price-notes">Observações</Label>
              <Textarea
                id="price-notes"
                value={priceForm.notes}
                onChange={(e) => setPriceForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionais..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePrice} className="btn-futuristic">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
