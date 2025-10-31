-- Adicionar campo empresa nas tabelas de fluxo de caixa
ALTER TABLE cash_flow
ADD COLUMN IF NOT EXISTS empresa TEXT DEFAULT 'GA Serviços';

ALTER TABLE cash_flow_monthly_balance
ADD COLUMN IF NOT EXISTS empresa TEXT DEFAULT 'GA Serviços';

-- Criar índice para melhorar performance de consultas por empresa
CREATE INDEX IF NOT EXISTS idx_cash_flow_empresa ON cash_flow(empresa);
CREATE INDEX IF NOT EXISTS idx_cash_flow_monthly_balance_empresa ON cash_flow_monthly_balance(empresa);

-- Atualizar registros existentes para GA Serviços (padrão)
UPDATE cash_flow SET empresa = 'GA Serviços' WHERE empresa IS NULL;
UPDATE cash_flow_monthly_balance SET empresa = 'GA Serviços' WHERE empresa IS NULL;
