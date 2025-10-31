-- Remover a constraint antiga do campo type
ALTER TABLE public.data_entries 
DROP CONSTRAINT IF EXISTS data_entries_type_check;

-- Adicionar nova constraint com todos os tipos suportados
ALTER TABLE public.data_entries 
ADD CONSTRAINT data_entries_type_check 
CHECK (type IN (
  'rescisao', 
  'gasto-extra', 
  'compras-extras', 
  'servicos-extras', 
  'uniforme-epi'
));

-- Comentário explicativo
COMMENT ON CONSTRAINT data_entries_type_check ON public.data_entries IS 
'Tipos permitidos: rescisao, gasto-extra, compras-extras, servicos-extras, uniforme-epi';
