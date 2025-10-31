-- Criar tabela para avaliações de desempenho completas
CREATE TABLE IF NOT EXISTS public.performance_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  evaluator_name TEXT NOT NULL,
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('interna', 'externa')),
  form_type TEXT NOT NULL CHECK (form_type IN ('colega', 'lider')),
  status TEXT NOT NULL CHECK (status IN ('pendente', 'concluida')),
  score INTEGER,
  evaluation_date DATE NOT NULL,
  external_link TEXT,
  observations TEXT,
  responses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;

-- Política RLS
CREATE POLICY "performance_evaluations_authenticated" ON public.performance_evaluations FOR ALL USING (true);

-- Índice
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_employee_id ON public.performance_evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_date ON public.performance_evaluations(evaluation_date);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_evaluations;
