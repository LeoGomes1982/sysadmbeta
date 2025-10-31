-- Adicionar campos para sistema de fechamento mensal
ALTER TABLE cash_flow
ADD COLUMN IF NOT EXISTS mes_referencia VARCHAR(7), -- formato: YYYY-MM
ADD COLUMN IF NOT EXISTS mes_consolidado BOOLEAN DEFAULT FALSE;

-- Criar tabela para saldos mensais consolidados
CREATE TABLE IF NOT EXISTS cash_flow_monthly_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia VARCHAR(7) NOT NULL UNIQUE, -- formato: YYYY-MM
  saldo_final DECIMAL(10, 2) NOT NULL,
  consolidado_em TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Atualizar registros existentes com mes_referencia
UPDATE cash_flow
SET mes_referencia = TO_CHAR(data::DATE, 'YYYY-MM')
WHERE mes_referencia IS NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_cash_flow_mes_referencia ON cash_flow(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_cash_flow_pago ON cash_flow(pago);
