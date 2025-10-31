-- Criar tabela para histórico de clientes e fornecedores
CREATE TABLE IF NOT EXISTS client_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_supplier_id UUID NOT NULL REFERENCES clients_suppliers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('positivo', 'negativo', 'neutro')),
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_client_history_client_supplier_id ON client_history(client_supplier_id);
CREATE INDEX IF NOT EXISTS idx_client_history_date ON client_history(date);

-- Comentários para documentação
COMMENT ON TABLE client_history IS 'Histórico de registros dos clientes e fornecedores';
COMMENT ON COLUMN client_history.client_supplier_id IS 'ID do cliente ou fornecedor';
COMMENT ON COLUMN client_history.type IS 'Tipo do registro: positivo, negativo ou neutro';
COMMENT ON COLUMN client_history.description IS 'Descrição do registro histórico';
COMMENT ON COLUMN client_history.date IS 'Data do registro';
