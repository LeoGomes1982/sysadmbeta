-- Tabela de serviços extras
CREATE TABLE IF NOT EXISTS public.extra_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executor_type TEXT NOT NULL CHECK (executor_type IN ('funcionario', 'externo')),
  executor_name TEXT NOT NULL,
  service TEXT NOT NULL,
  location TEXT NOT NULL,
  supervisor TEXT NOT NULL,
  date DATE NOT NULL,
  hours TEXT NOT NULL CHECK (hours IN ('4', '6', '8', '12')),
  function TEXT NOT NULL CHECK (function IN ('Guarda', 'Limpeza')),
  pix_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.extra_services ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "extra_services_select_authenticated" ON public.extra_services FOR SELECT USING (true);
CREATE POLICY "extra_services_insert_authenticated" ON public.extra_services FOR INSERT WITH CHECK (true);
CREATE POLICY "extra_services_update_authenticated" ON public.extra_services FOR UPDATE USING (true);
CREATE POLICY "extra_services_delete_authenticated" ON public.extra_services FOR DELETE USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_extra_services_date ON public.extra_services(date);
CREATE INDEX IF NOT EXISTS idx_extra_services_executor ON public.extra_services(executor_name);
CREATE INDEX IF NOT EXISTS idx_extra_services_location ON public.extra_services(location);
