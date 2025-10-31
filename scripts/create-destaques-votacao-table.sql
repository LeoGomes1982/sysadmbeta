-- Tabela para armazenar votações de destaque do mês
CREATE TABLE IF NOT EXISTS destaques_votacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  mes_referencia DATE NOT NULL,
  votos INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, mes_referencia)
);

-- Tabela para armazenar os votos individuais
CREATE TABLE IF NOT EXISTS votos_destaque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  votacao_id UUID REFERENCES destaques_votacao(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(votacao_id, user_identifier)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_destaques_votacao_mes ON destaques_votacao(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_destaques_votacao_ativo ON destaques_votacao(ativo);
CREATE INDEX IF NOT EXISTS idx_votos_destaque_votacao ON votos_destaque(votacao_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_destaques_votacao_updated_at
  BEFORE UPDATE ON destaques_votacao
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE destaques_votacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos_destaque ENABLE ROW LEVEL SECURITY;

-- Políticas para destaques_votacao
CREATE POLICY "Permitir leitura para todos" ON destaques_votacao
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para todos" ON destaques_votacao
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização para todos" ON destaques_votacao
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão para todos" ON destaques_votacao
  FOR DELETE USING (true);

-- Políticas para votos_destaque
CREATE POLICY "Permitir leitura para todos" ON votos_destaque
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para todos" ON votos_destaque
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização para todos" ON votos_destaque
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão para todos" ON votos_destaque
  FOR DELETE USING (true);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE destaques_votacao;
ALTER PUBLICATION supabase_realtime ADD TABLE votos_destaque;
