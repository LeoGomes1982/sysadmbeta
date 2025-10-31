-- Criar tabela para armazenar o progresso do portal de admissão
CREATE TABLE IF NOT EXISTS admission_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_identifier TEXT NOT NULL, -- Pode ser CPF, email ou outro identificador único
  step_1_completed BOOLEAN DEFAULT FALSE,
  step_2_completed BOOLEAN DEFAULT FALSE,
  step_3_completed BOOLEAN DEFAULT FALSE,
  step_4_completed BOOLEAN DEFAULT FALSE,
  current_step INTEGER DEFAULT 1,
  progress_percentage NUMERIC DEFAULT 0,
  process_started BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida por identificador
CREATE INDEX IF NOT EXISTS idx_admission_progress_user_identifier 
ON admission_progress(user_identifier);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_admission_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_admission_progress_updated_at ON admission_progress;
CREATE TRIGGER trigger_update_admission_progress_updated_at
  BEFORE UPDATE ON admission_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_admission_progress_updated_at();
