-- Tabela de atas de supervisão
CREATE TABLE IF NOT EXISTS supervision_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  data DATE NOT NULL,
  registro TEXT NOT NULL,
  arquivos TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'respondido', 'finalizado', 'arquivado')),
  resposta TEXT,
  tresposta TEXT,
  data_resposta DATE,
  data_tresposta DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_supervision_records_status ON supervision_records(status);
CREATE INDEX IF NOT EXISTS idx_supervision_records_data ON supervision_records(data);
CREATE INDEX IF NOT EXISTS idx_supervision_records_created_at ON supervision_records(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_supervision_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supervision_records_updated_at
  BEFORE UPDATE ON supervision_records
  FOR EACH ROW
  EXECUTE FUNCTION update_supervision_records_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE supervision_records ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (ajuste conforme necessário)
CREATE POLICY "Enable all operations for supervision_records" ON supervision_records
  FOR ALL USING (true);
