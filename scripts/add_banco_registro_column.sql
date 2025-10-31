-- Adicionar coluna banco_registro para todos os registros de fluxo de caixa
ALTER TABLE cash_flow
ADD COLUMN IF NOT EXISTS banco_registro TEXT;

-- Comentário explicativo
COMMENT ON COLUMN cash_flow.banco_registro IS 'Banco associado ao registro de recebimento ou despesa';
