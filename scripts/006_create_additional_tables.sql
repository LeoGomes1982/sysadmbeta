-- Tabelas adicionais do sistema

-- Cargos e posições
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nivel TEXT NOT NULL,
  salario_base DECIMAL(10,2),
  beneficios TEXT,
  requisitos TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compromissos/Agenda
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT,
  responsaveis TEXT[],
  prioridade TEXT DEFAULT 'media',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projetos
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cliente TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'em_andamento',
  valor DECIMAL(10,2),
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leis e regulamentações
CREATE TABLE IF NOT EXISTS public.laws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  pontuacao INTEGER DEFAULT 0,
  categoria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laws ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "positions_authenticated" ON public.positions FOR ALL USING (true);
CREATE POLICY "appointments_authenticated" ON public.appointments FOR ALL USING (true);
CREATE POLICY "projects_authenticated" ON public.projects FOR ALL USING (true);
CREATE POLICY "laws_authenticated" ON public.laws FOR ALL USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_appointments_data ON public.appointments(data);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_laws_categoria ON public.laws(categoria);
