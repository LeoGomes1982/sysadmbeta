-- Script para adicionar campos de controle de status temporários
-- Este script adiciona campos para gerenciar status com data limite

-- Verificar se os campos já existem antes de adicionar
DO $$ 
BEGIN
  -- Campo data_limite já existe, não precisa adicionar
  
  -- Adicionar índice para melhorar performance de consultas de alertas
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_employees_data_limite') THEN
    CREATE INDEX idx_employees_data_limite ON employees(data_limite) WHERE data_limite IS NOT NULL;
  END IF;
  
  -- Adicionar índice para status
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_employees_status') THEN
    CREATE INDEX idx_employees_status ON employees(status);
  END IF;
  
  -- Adicionar índice para destaque_inicio
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_employees_destaque_inicio') THEN
    CREATE INDEX idx_employees_destaque_inicio ON employees(destaque_inicio) WHERE destaque_inicio IS NOT NULL;
  END IF;
END $$;

-- Comentários explicativos
COMMENT ON COLUMN employees.data_limite IS 'Data limite para status temporários (Férias, Em Experiência, Aviso Prévio)';
COMMENT ON COLUMN employees.destaque_inicio IS 'Data de início do status Destaque (expira após 30 dias)';
COMMENT ON COLUMN employees.destaque_fim IS 'Data de fim do status Destaque (calculada automaticamente)';
