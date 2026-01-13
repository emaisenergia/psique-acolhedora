import AdminLayout from "./AdminLayout";

const Financeiro = () => {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-light">Financeiro</h1>
        <p className="text-muted-foreground">Controle financeiro e faturamento.</p>
      </div>
      <div className="card-glass p-6 rounded-2xl text-muted-foreground">
        Em breve: gráficos e relatórios financeiros.
      </div>
    </AdminLayout>
  );
};

export default Financeiro;

