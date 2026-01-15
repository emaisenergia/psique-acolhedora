import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCcw, Plus, Trash2, Calendar } from "lucide-react";
import { useRecurringTransactions, RecurringTransactionInsert } from "@/hooks/useRecurringTransactions";

const EXPENSE_CATEGORIES = [
  "Aluguel",
  "Materiais",
  "Supervisão",
  "Cursos/Formação",
  "Marketing",
  "Software/Assinaturas",
  "Impostos",
  "Outros",
];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const RecurringTransactionsManager = () => {
  const { 
    recurringTransactions, 
    createRecurringTransaction, 
    updateRecurringTransaction,
    deleteRecurringTransaction,
    generateMonthlyTransactions 
  } = useRecurringTransactions();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<RecurringTransactionInsert>({
    type: "expense",
    amount: 0,
    description: "",
    category: "",
    payment_method: "Transferência",
    day_of_month: 1,
  });

  const handleSubmit = async () => {
    if (formData.amount <= 0) return;
    await createRecurringTransaction(formData);
    setIsDialogOpen(false);
    setFormData({
      type: "expense",
      amount: 0,
      description: "",
      category: "",
      payment_method: "Transferência",
      day_of_month: 1,
    });
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await updateRecurringTransaction(id, { is_active: !isActive });
  };

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5" />
            Lançamentos Recorrentes
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={generateMonthlyTransactions}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Gerar deste mês
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Novo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Lançamento Recorrente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as "revenue" | "expense" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">Despesa</SelectItem>
                          <SelectItem value="revenue">Receita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Dia do mês</Label>
                      <Input
                        type="number"
                        min={1}
                        max={28}
                        value={formData.day_of_month}
                        onChange={(e) => setFormData(prev => ({ ...prev, day_of_month: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={formData.description || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Ex: Aluguel do consultório"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  {formData.type === "expense" && (
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select 
                        value={formData.category || ""} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select 
                      value={formData.payment_method || "Transferência"} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                        <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                        <SelectItem value="Transferência">Transferência</SelectItem>
                        <SelectItem value="Boleto">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSubmit} className="w-full">
                    Criar Lançamento Recorrente
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recurringTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCcw className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum lançamento recorrente cadastrado</p>
            <p className="text-sm">Adicione despesas fixas mensais como aluguel, supervisão, etc.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Dia</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurringTransactions.map((rt) => (
                <TableRow key={rt.id}>
                  <TableCell className="font-medium">{rt.description || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={rt.type === "revenue" ? "default" : "destructive"}>
                      {rt.type === "revenue" ? "Receita" : "Despesa"}
                    </Badge>
                  </TableCell>
                  <TableCell>{rt.category || "-"}</TableCell>
                  <TableCell className="text-center">{rt.day_of_month}</TableCell>
                  <TableCell className={`text-right font-semibold ${rt.type === "revenue" ? "text-green-600" : "text-red-500"}`}>
                    {currencyFormatter.format(rt.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch 
                      checked={rt.is_active} 
                      onCheckedChange={() => toggleActive(rt.id, rt.is_active)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteRecurringTransaction(rt.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
