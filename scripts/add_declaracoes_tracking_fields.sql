-- Adicionar campos de rastreamento de status e documentos à tabela declaracoes
ALTER TABLE declaracoes
ADD COLUMN IF NOT EXISTS status_investigacao_iniciada BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status_coleta_dados BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status_resolucao BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status_encerrada BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resumo_caso TEXT,
ADD COLUMN IF NOT EXISTS documentos JSONB DEFAULT '[]'::jsonb;

-- Adicionar comentários para documentação
COMMENT ON COLUMN declaracoes.status_investigacao_iniciada IS 'Indica se a investigação foi iniciada';
COMMENT ON COLUMN declaracoes.status_coleta_dados IS 'Indica se a coleta de dados foi realizada';
COMMENT ON COLUMN declaracoes.status_resolucao IS 'Indica se a resolução foi aplicada';
COMMENT ON COLUMN declaracoes.status_encerrada IS 'Indica se o caso foi encerrado';
COMMENT ON COLUMN declaracoes.resumo_caso IS 'Resumo do caso e encerramento';
COMMENT ON COLUMN declaracoes.documentos IS 'Array JSON com URLs dos documentos anexados';
