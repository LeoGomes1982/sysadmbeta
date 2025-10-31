-- Adicionar campo forma_pagamento à tabela cash_flow
ALTER TABLE cash_flow
ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;

-- Atualizar registros existentes com valor padrão
UPDATE cash_flow
SET forma_pagamento = 'PIX'
WHERE forma_pagamento IS NULL;

-- Adicionar constraint para validar valores permitidos
ALTER TABLE cash_flow
ADD CONSTRAINT forma_pagamento_check 
CHECK (forma_pagamento IN ('PIX', 'Boleto', 'Transferência', 'Cartão'));
