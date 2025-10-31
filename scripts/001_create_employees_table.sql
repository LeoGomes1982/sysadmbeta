-- Tabela principal de funcionários
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  rg TEXT,
  cargo TEXT NOT NULL,
  departamento TEXT NOT NULL,
  empresa TEXT DEFAULT 'GA SERVIÇOS',
  data_admissao DATE NOT NULL,
  data_nascimento DATE,
  salario DECIMAL(10,2),
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  data_limite DATE,
  destaque_inicio DATE,
  destaque_fim DATE,
  destaque_count INTEGER DEFAULT 0,
  ultimo_destaque DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para funcionários (acesso público para usuários autenticados)
CREATE POLICY "employees_select_authenticated" ON public.employees FOR SELECT USING (true);
CREATE POLICY "employees_insert_authenticated" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "employees_update_authenticated" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "employees_delete_authenticated" ON public.employees FOR DELETE USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_employees_cpf ON public.employees(cpf);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_departamento ON public.employees(departamento);
