-- Criar tabela para documentos de clientes e fornecedores
CREATE TABLE IF NOT EXISTS client_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_supplier_id UUID NOT NULL REFERENCES clients_suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_name TEXT,
  file_size TEXT,
  file_data BYTEA, -- Para armazenar o arquivo como dados binários
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_client_documents_client_supplier_id ON client_documents(client_supplier_id);

-- Comentários para documentação
COMMENT ON TABLE client_documents IS 'Documentos anexados aos clientes e fornecedores';
COMMENT ON COLUMN client_documents.client_supplier_id IS 'ID do cliente ou fornecedor';
COMMENT ON COLUMN client_documents.name IS 'Nome do documento';
COMMENT ON COLUMN client_documents.type IS 'Tipo do documento (ex: Contrato, RG, CNPJ)';
COMMENT ON COLUMN client_documents.file_name IS 'Nome original do arquivo';
COMMENT ON COLUMN client_documents.file_size IS 'Tamanho do arquivo formatado';
COMMENT ON COLUMN client_documents.file_data IS 'Dados binários do arquivo';
