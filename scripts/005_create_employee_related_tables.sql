-- Tabelas relacionadas aos funcionários

-- Dependentes
CREATE TABLE IF NOT EXISTS public.employee_dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  parentesco TEXT NOT NULL,
  data_nascimento DATE,
  cpf TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documentos dos funcionários
CREATE TABLE IF NOT EXISTS public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  numero TEXT NOT NULL,
  data_emissao DATE,
  data_vencimento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico dos funcionários
CREATE TABLE IF NOT EXISTS public.employee_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('positivo', 'negativo')),
  descricao TEXT NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Avaliações de desempenho
CREATE TABLE IF NOT EXISTS public.employee_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  pontuacao INTEGER NOT NULL,
  data DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fiscalizações
CREATE TABLE IF NOT EXISTS public.employee_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  pontuacao INTEGER NOT NULL,
  data DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sanções disciplinares
CREATE TABLE IF NOT EXISTS public.employee_sanctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para todas as tabelas relacionadas
ALTER TABLE public.employee_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_sanctions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para todas as tabelas relacionadas
CREATE POLICY "employee_dependents_authenticated" ON public.employee_dependents FOR ALL USING (true);
CREATE POLICY "employee_documents_authenticated" ON public.employee_documents FOR ALL USING (true);
CREATE POLICY "employee_history_authenticated" ON public.employee_history FOR ALL USING (true);
CREATE POLICY "employee_evaluations_authenticated" ON public.employee_evaluations FOR ALL USING (true);
CREATE POLICY "employee_inspections_authenticated" ON public.employee_inspections FOR ALL USING (true);
CREATE POLICY "employee_sanctions_authenticated" ON public.employee_sanctions FOR ALL USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_employee_dependents_employee_id ON public.employee_dependents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON public.employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_history_employee_id ON public.employee_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_evaluations_employee_id ON public.employee_evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_inspections_employee_id ON public.employee_inspections(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_sanctions_employee_id ON public.employee_sanctions(employee_id);
