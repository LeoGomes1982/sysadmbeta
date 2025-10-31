-- Adiciona coluna event_type à tabela employee_history para suportar históricos neutros
ALTER TABLE public.employee_history 
ADD COLUMN IF NOT EXISTS event_type TEXT CHECK (event_type IN ('positivo', 'negativo', 'neutro'));

-- Atualiza registros existentes baseado no campo 'tipo'
UPDATE public.employee_history 
SET event_type = tipo 
WHERE event_type IS NULL;

-- Remove a constraint antiga do campo 'tipo' se existir
ALTER TABLE public.employee_history 
DROP CONSTRAINT IF EXISTS employee_history_tipo_check;

-- Adiciona nova constraint permitindo neutro
ALTER TABLE public.employee_history 
DROP CONSTRAINT IF EXISTS employee_history_tipo_check1;

ALTER TABLE public.employee_history 
ADD CONSTRAINT employee_history_tipo_check 
CHECK (tipo IN ('positivo', 'negativo', 'neutro'));
