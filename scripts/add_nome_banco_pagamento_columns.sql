-- Adicionar coluna 'nome' para identificar cada registro
ALTER TABLE cash_flow
ADD COLUMN IF NOT EXISTS nome TEXT;

-- Adicionar coluna 'banco_pagamento' para folha de pagamento
ALTER TABLE cash_flow
ADD COLUMN IF NOT EXISTS banco_pagamento TEXT;

-- Comentários
COMMENT ON COLUMN cash_flow.nome IS 'Nome identificador do registro financeiro';
COMMENT ON COLUMN cash_flow.banco_pagamento IS 'Banco utilizado para pagamento de folha';
