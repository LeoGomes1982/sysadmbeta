-- Adicionar campos para suportar parcelamento no fluxo de caixa
ALTER TABLE cash_flow
ADD COLUMN IF NOT EXISTS parcelado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS numero_parcelas INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parcela_atual INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS id_parcelamento UUID;

-- Criar índice para melhorar performance de consultas por parcelamento
CREATE INDEX IF NOT EXISTS idx_cash_flow_parcelamento ON cash_flow(id_parcelamento) WHERE id_parcelamento IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN cash_flow.parcelado IS 'Indica se o registro é parcelado (true) ou à vista (false)';
COMMENT ON COLUMN cash_flow.numero_parcelas IS 'Número total de parcelas (1-12)';
COMMENT ON COLUMN cash_flow.parcela_atual IS 'Número da parcela atual (1 a numero_parcelas)';
COMMENT ON COLUMN cash_flow.id_parcelamento IS 'UUID que agrupa todas as parcelas de um mesmo parcelamento';
