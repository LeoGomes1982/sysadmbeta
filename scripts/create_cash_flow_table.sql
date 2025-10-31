-- Criar tabela para fluxo de caixa
CREATE TABLE IF NOT EXISTS cash_flow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('recebimento', 'despesa')),
  categoria TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cash_flow_tipo ON cash_flow(tipo);
CREATE INDEX IF NOT EXISTS idx_cash_flow_data ON cash_flow(data);
CREATE INDEX IF NOT EXISTS idx_cash_flow_categoria ON cash_flow(categoria);

-- Comentários para documentação
COMMENT ON TABLE cash_flow IS 'Registros de fluxo de caixa - entradas e saídas';
COMMENT ON COLUMN cash_flow.tipo IS 'Tipo do registro: recebimento ou despesa';
COMMENT ON COLUMN cash_flow.categoria IS 'Categoria do registro';
COMMENT ON COLUMN cash_flow.valor IS 'Valor em reais';
COMMENT ON COLUMN cash_flow.data IS 'Data do registro';
