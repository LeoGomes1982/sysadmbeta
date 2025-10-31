-- Adicionar campo 'pago' na tabela cash_flow
ALTER TABLE cash_flow ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT false;

-- Atualizar registros existentes para false
UPDATE cash_flow SET pago = false WHERE pago IS NULL;
