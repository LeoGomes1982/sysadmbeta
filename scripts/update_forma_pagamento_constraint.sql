-- Atualizar constraint de forma_pagamento para incluir "Débito automático"

-- Remover a constraint antiga
ALTER TABLE cash_flow DROP CONSTRAINT IF EXISTS forma_pagamento_check;

-- Criar nova constraint com "Débito automático" incluído
ALTER TABLE cash_flow ADD CONSTRAINT forma_pagamento_check 
CHECK (forma_pagamento IN ('PIX', 'Boleto', 'Transferência', 'Cartão', 'Débito automático'));

-- Verificar se a constraint foi criada corretamente
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'cash_flow'::regclass 
AND conname = 'forma_pagamento_check';
