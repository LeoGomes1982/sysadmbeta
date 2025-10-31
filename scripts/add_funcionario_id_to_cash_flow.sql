-- Adicionar coluna funcionario_id na tabela cash_flow
ALTER TABLE cash_flow
ADD COLUMN IF NOT EXISTS funcionario_id UUID REFERENCES funcionarios(id);

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_cash_flow_funcionario_id ON cash_flow(funcionario_id);

-- Comentário explicativo
COMMENT ON COLUMN cash_flow.funcionario_id IS 'ID do funcionário associado (para Folha de Pagamento e Vale Alimentação)';
