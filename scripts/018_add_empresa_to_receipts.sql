-- Adicionar coluna empresa na tabela de recibos gerados
ALTER TABLE public.receipts_generated 
ADD COLUMN IF NOT EXISTS empresa VARCHAR(100);

-- Criar índice para a nova coluna
CREATE INDEX IF NOT EXISTS idx_receipts_generated_empresa ON public.receipts_generated(empresa);
