-- Criar tabela para armazenar saldos dos bancos
CREATE TABLE IF NOT EXISTS bank_balances (
  id SERIAL PRIMARY KEY,
  empresa TEXT NOT NULL,
  banco TEXT NOT NULL,
  data DATE NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_bank_balances_empresa_banco ON bank_balances(empresa, banco);

-- Habilitar RLS
ALTER TABLE bank_balances ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações (ajuste conforme necessário)
CREATE POLICY "Permitir todas as operações em bank_balances" ON bank_balances
  FOR ALL
  USING (true)
  WITH CHECK (true);
