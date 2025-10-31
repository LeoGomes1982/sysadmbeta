-- Tabela de clientes e fornecedores
CREATE TABLE IF NOT EXISTS public.clients_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  fantasy_name TEXT NOT NULL,
  legal_representative TEXT NOT NULL,
  legal_representative_cpf TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cliente', 'fornecedor')),
  document TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.clients_suppliers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "clients_suppliers_select_authenticated" ON public.clients_suppliers FOR SELECT USING (true);
CREATE POLICY "clients_suppliers_insert_authenticated" ON public.clients_suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "clients_suppliers_update_authenticated" ON public.clients_suppliers FOR UPDATE USING (true);
CREATE POLICY "clients_suppliers_delete_authenticated" ON public.clients_suppliers FOR DELETE USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clients_suppliers_document ON public.clients_suppliers(document);
CREATE INDEX IF NOT EXISTS idx_clients_suppliers_type ON public.clients_suppliers(type);
CREATE INDEX IF NOT EXISTS idx_clients_suppliers_name ON public.clients_suppliers(name);
