-- Adicionar novas colunas à tabela data_entries
ALTER TABLE data_entries 
ADD COLUMN IF NOT EXISTS uniform_item TEXT,
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients_suppliers(id);

-- Atualizar comentário da tabela
COMMENT ON TABLE data_entries IS 'Tabela para armazenar dados e informações da empresa com tipos específicos e associação a clientes';
COMMENT ON COLUMN data_entries.uniform_item IS 'Item específico quando o tipo for uniforme-epi';
COMMENT ON COLUMN data_entries.client_id IS 'ID do cliente associado ao registro';
