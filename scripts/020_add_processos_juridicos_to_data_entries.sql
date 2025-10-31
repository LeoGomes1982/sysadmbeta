-- Adicionar tipo "processos-juridicos" à constraint de data_entries
ALTER TABLE public.data_entries 
DROP CONSTRAINT IF EXISTS data_entries_type_check;

-- Adicionar nova constraint com o tipo processos-juridicos
ALTER TABLE public.data_entries 
ADD CONSTRAINT data_entries_type_check 
CHECK (type IN (
  'rescisao', 
  'gasto-extra', 
  'compras-extras', 
  'servicos-extras', 
  'uniforme-epi',
  'processos-juridicos'
));

-- Adicionar coluna para armazenar o ID do funcionário reclamante (opcional)
ALTER TABLE public.data_entries 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id);

-- Comentário explicativo
COMMENT ON CONSTRAINT data_entries_type_check ON public.data_entries IS 
'Tipos permitidos: rescisao, gasto-extra, compras-extras, servicos-extras, uniforme-epi, processos-juridicos';

COMMENT ON COLUMN public.data_entries.employee_id IS 
'ID do funcionário relacionado (usado para processos jurídicos - reclamante)';
