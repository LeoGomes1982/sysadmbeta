-- Tabela para armazenar documentos dos processos jurídicos
CREATE TABLE IF NOT EXISTS processo_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  pasta TEXT,
  tamanho BIGINT NOT NULL,
  tipo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar documentos por processo
CREATE INDEX IF NOT EXISTS idx_processo_documentos_processo_id ON processo_documentos(processo_id);

-- Índice para buscar documentos por pasta
CREATE INDEX IF NOT EXISTS idx_processo_documentos_pasta ON processo_documentos(pasta);

-- Habilitar Row Level Security
ALTER TABLE processo_documentos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para todos
CREATE POLICY "Permitir leitura para todos" ON processo_documentos
  FOR SELECT USING (true);

-- Política para permitir inserção para todos
CREATE POLICY "Permitir inserção para todos" ON processo_documentos
  FOR INSERT WITH CHECK (true);

-- Política para permitir atualização para todos
CREATE POLICY "Permitir atualização para todos" ON processo_documentos
  FOR UPDATE USING (true);

-- Política para permitir exclusão para todos
CREATE POLICY "Permitir exclusão para todos" ON processo_documentos
  FOR DELETE USING (true);
