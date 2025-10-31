-- Adicionar campo data_fim à tabela enquetes
ALTER TABLE enquetes ADD COLUMN IF NOT EXISTS data_fim DATE;

-- Comentário explicativo
COMMENT ON COLUMN enquetes.data_fim IS 'Data de término da votação da enquete';
