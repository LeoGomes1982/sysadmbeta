-- Adicionar coluna funcionario_id na tabela cash_flow
-- Esta coluna armazena o ID do funcionário quando o registro é de Folha de Pagamento ou Vale Alimentação

ALTER TABLE cash_flow
ADD COLUMN IF NOT EXISTS funcionario_id uuid REFERENCES employees(id) ON DELETE SET NULL;

-- Adicionar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_cash_flow_funcionario_id ON cash_flow(funcionario_id);

-- Comentário na coluna
COMMENT ON COLUMN cash_flow.funcionario_id IS 'ID do funcionário associado ao registro (usado para Folha de Pagamento e Vale Alimentação)';
