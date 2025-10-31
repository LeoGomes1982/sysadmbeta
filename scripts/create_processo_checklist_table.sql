-- Criar tabela para checklist de processos jurídicos
CREATE TABLE IF NOT EXISTS processo_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES processos_juridicos(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  concluido BOOLEAN DEFAULT FALSE,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar itens por processo
CREATE INDEX IF NOT EXISTS idx_processo_checklist_processo_id ON processo_checklist(processo_id);

-- Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_processo_checklist_ordem ON processo_checklist(processo_id, ordem);

-- Habilitar RLS
ALTER TABLE processo_checklist ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (ajuste conforme necessário)
CREATE POLICY "Permitir todas as operações no checklist" ON processo_checklist
  FOR ALL USING (true) WITH CHECK (true);
