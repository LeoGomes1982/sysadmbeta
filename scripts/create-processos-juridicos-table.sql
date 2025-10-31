-- Criar tabela de processos jurídicos encerrados
CREATE TABLE IF NOT EXISTS processos_juridicos_encerrados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_reclamante_id UUID REFERENCES employees(id),
  reclamadas JSONB NOT NULL,
  data_audiencia DATE NOT NULL,
  hora_audiencia TIME NOT NULL,
  data_segunda_audiencia DATE,
  cidade TEXT NOT NULL,
  tipo_audiencia TEXT NOT NULL CHECK (tipo_audiencia IN ('presencial', 'distancia')),
  link_audiencia TEXT,
  mensagem TEXT NOT NULL,
  documentos JSONB DEFAULT '[]'::jsonb,
  valor_finalizacao TEXT NOT NULL,
  data_encerramento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca por funcionário
CREATE INDEX IF NOT EXISTS idx_processos_juridicos_funcionario 
ON processos_juridicos_encerrados(funcionario_reclamante_id);

-- Criar índice para busca por data de encerramento
CREATE INDEX IF NOT EXISTS idx_processos_juridicos_data_encerramento 
ON processos_juridicos_encerrados(data_encerramento DESC);
