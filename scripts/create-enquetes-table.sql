-- Criar tabela de enquetes
CREATE TABLE IF NOT EXISTS enquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta TEXT NOT NULL,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finalizada_em TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de alternativas de enquetes
CREATE TABLE IF NOT EXISTS enquetes_alternativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquete_id UUID NOT NULL REFERENCES enquetes(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  votos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de votos de enquetes (para rastrear quem votou)
CREATE TABLE IF NOT EXISTS enquetes_votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquete_id UUID NOT NULL REFERENCES enquetes(id) ON DELETE CASCADE,
  alternativa_id UUID NOT NULL REFERENCES enquetes_alternativas(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(enquete_id, user_identifier)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_enquetes_ativa ON enquetes(ativa);
CREATE INDEX IF NOT EXISTS idx_enquetes_alternativas_enquete ON enquetes_alternativas(enquete_id);
CREATE INDEX IF NOT EXISTS idx_enquetes_votos_enquete ON enquetes_votos(enquete_id);
CREATE INDEX IF NOT EXISTS idx_enquetes_votos_user ON enquetes_votos(user_identifier);
