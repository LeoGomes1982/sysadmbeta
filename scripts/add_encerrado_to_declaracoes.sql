-- Adicionar campos de encerramento à tabela declaracoes
ALTER TABLE declaracoes
ADD COLUMN IF NOT EXISTS encerrado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_encerramento TIMESTAMP;

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_declaracoes_encerrado ON declaracoes(encerrado);
