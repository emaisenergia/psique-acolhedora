import AdminLayout from "./AdminLayout";

const Prontuarios = () => {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-light">Prontuários</h1>
        <p className="text-muted-foreground">Prontuários psicológicos e anotações clínicas.</p>
      </div>
      <div className="card-glass p-6 rounded-2xl text-muted-foreground">
        Em breve: modelos de prontuário e registro de sessões.
      </div>
    </AdminLayout>
  );
};

export default Prontuarios;

