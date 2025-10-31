-- Criar tabela de logins/credenciais
CREATE TABLE IF NOT EXISTS login_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  login TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE login_credentials ENABLE ROW LEVEL SECURITY;

-- Política RLS (permitir acesso público para este sistema interno)
CREATE POLICY "Allow all operations on login_credentials" ON login_credentials FOR ALL USING (true);

-- Habilitar realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE login_credentials;

-- Criar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_login_credentials_login ON login_credentials(login);
