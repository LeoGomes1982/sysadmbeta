-- Tabela de dados financeiros e operacionais
CREATE TABLE IF NOT EXISTS public.data_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('rescisao', 'gasto-extra', 'compra-equipamento', 'servico-extra')),
  date DATE NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.data_entries ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "data_entries_select_authenticated" ON public.data_entries FOR SELECT USING (true);
CREATE POLICY "data_entries_insert_authenticated" ON public.data_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "data_entries_update_authenticated" ON public.data_entries FOR UPDATE USING (true);
CREATE POLICY "data_entries_delete_authenticated" ON public.data_entries FOR DELETE USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_data_entries_type ON public.data_entries(type);
CREATE INDEX IF NOT EXISTS idx_data_entries_date ON public.data_entries(date);
