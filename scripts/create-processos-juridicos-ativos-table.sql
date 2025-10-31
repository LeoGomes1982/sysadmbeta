-- Criar tabela de processos jurídicos ativos (em andamento)
CREATE TABLE IF NOT EXISTS processos_juridicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_reclamante_id UUID REFERENCES employees(id),
  reclamadas JSONB DEFAULT '[]'::jsonb,
  data_audiencia DATE,
  hora_audiencia TIME,
  datas_adicionais JSONB DEFAULT '[]'::jsonb,
  cidade TEXT,
  tipo_audiencia TEXT CHECK (tipo_audiencia IN ('presencial', 'distancia')),
  link_audiencia TEXT,
  mensagem TEXT,
  documentos JSONB DEFAULT '[]'::jsonb,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca por funcionário
CREATE INDEX IF NOT EXISTS idx_processos_juridicos_ativos_funcionario 
ON processos_juridicos(funcionario_reclamante_id);

-- Criar índice para ordenação
CREATE INDEX IF NOT EXISTS idx_processos_juridicos_ativos_ordem 
ON processos_juridicos(ordem);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_processos_juridicos_updated_at
  BEFORE UPDATE ON processos_juridicos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE processos_juridicos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir acesso a todos os usuários autenticados)
CREATE POLICY "Permitir leitura para todos" ON processos_juridicos
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para todos" ON processos_juridicos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização para todos" ON processos_juridicos
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão para todos" ON processos_juridicos
  FOR DELETE USING (true);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE processos_juridicos;
