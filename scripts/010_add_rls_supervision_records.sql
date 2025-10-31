-- Adicionar coluna user_id à tabela supervision_records se não existir
ALTER TABLE supervision_records 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Habilitar Row Level Security
ALTER TABLE supervision_records ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários podem ver apenas suas próprias atas
CREATE POLICY "Users can view their own supervision records" 
ON supervision_records FOR SELECT 
USING (auth.uid() = user_id);

-- Política para INSERT: usuários podem criar apenas suas próprias atas
CREATE POLICY "Users can insert their own supervision records" 
ON supervision_records FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar apenas suas próprias atas
CREATE POLICY "Users can update their own supervision records" 
ON supervision_records FOR UPDATE 
USING (auth.uid() = user_id);

-- Política para DELETE: usuários podem deletar apenas suas próprias atas
CREATE POLICY "Users can delete their own supervision records" 
ON supervision_records FOR DELETE 
USING (auth.uid() = user_id);

-- Atualizar registros existentes para ter um user_id (opcional, para dados de teste)
-- Você pode remover esta parte se não quiser dados de exemplo
UPDATE supervision_records 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;
