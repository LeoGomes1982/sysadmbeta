-- Adicionar campo cliente_id na tabela cash_flow para vincular recebimentos a clientes

ALTER TABLE cash_flow
ADD COLUMN cliente_id uuid REFERENCES clients_suppliers(id) ON DELETE SET NULL;

-- Criar índice para melhorar performance de consultas
CREATE INDEX idx_cash_flow_cliente_id ON cash_flow(cliente_id);

-- Comentário explicativo
COMMENT ON COLUMN cash_flow.cliente_id IS 'ID do cliente vinculado ao recebimento (quando categoria = Recebimento de Cliente)';
