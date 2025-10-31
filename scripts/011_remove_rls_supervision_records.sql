-- Remove Row Level Security da tabela supervision_records
-- para permitir que todos os usuários vejam todas as atas

-- Remove as políticas RLS existentes
DROP POLICY IF EXISTS "Users can view their own supervision records" ON supervision_records;
DROP POLICY IF EXISTS "Users can insert their own supervision records" ON supervision_records;
DROP POLICY IF EXISTS "Users can update their own supervision records" ON supervision_records;
DROP POLICY IF EXISTS "Users can delete their own supervision records" ON supervision_records;

-- Desabilita RLS na tabela
ALTER TABLE supervision_records DISABLE ROW LEVEL SECURITY;

-- Remove a coluna user_id se existir (opcional)
-- ALTER TABLE supervision_records DROP COLUMN IF EXISTS user_id;

-- Comentário explicativo
COMMENT ON TABLE supervision_records IS 'Tabela de atas de supervisão - acesso público para todos os usuários';
