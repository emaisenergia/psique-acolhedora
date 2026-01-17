-- Tabela para registrar visualizações de recursos
CREATE TABLE public.resource_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.therapeutic_resources(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes para consultas rápidas
CREATE INDEX idx_resource_views_resource ON public.resource_views(resource_id);
CREATE INDEX idx_resource_views_patient ON public.resource_views(patient_id);

-- RLS
ALTER TABLE public.resource_views ENABLE ROW LEVEL SECURITY;

-- Pacientes podem inserir visualizações
CREATE POLICY "Patients can insert views" ON public.resource_views
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients p WHERE p.user_id = auth.uid()
    )
  );

-- Psicólogos e admins podem ver todas as visualizações
CREATE POLICY "Psychologists and admins can view resource views" ON public.resource_views
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role)
  );

-- Adicionar coluna de contagem na tabela therapeutic_resources
ALTER TABLE public.therapeutic_resources 
ADD COLUMN view_count INTEGER DEFAULT 0;

-- Função para atualizar contador automaticamente
CREATE OR REPLACE FUNCTION public.update_resource_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.therapeutic_resources 
  SET view_count = (
    SELECT COUNT(*) FROM public.resource_views 
    WHERE resource_id = NEW.resource_id
  )
  WHERE id = NEW.resource_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para manter contador atualizado
CREATE TRIGGER on_resource_view_insert
AFTER INSERT ON public.resource_views
FOR EACH ROW EXECUTE FUNCTION public.update_resource_view_count();