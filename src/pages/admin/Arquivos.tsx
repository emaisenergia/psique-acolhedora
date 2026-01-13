import AdminLayout from "./AdminLayout";

const Arquivos = () => {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-light">Arquivos</h1>
        <p className="text-muted-foreground">Organize e gerencie seus documentos.</p>
      </div>
      <div className="card-glass p-6 rounded-2xl text-muted-foreground">
        Em breve: biblioteca de documentos e uploads.
      </div>
    </AdminLayout>
  );
};

export default Arquivos;

