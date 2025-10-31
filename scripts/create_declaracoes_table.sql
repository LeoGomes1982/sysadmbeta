-- Criar tabela de declarações (sugestões, elogios, reclamações, denúncias)
CREATE TABLE IF NOT EXISTS declaracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('sugestao', 'elogio', 'reclamacao', 'denuncia')),
  data DATE NOT NULL,
  eh_colaborador BOOLEAN NOT NULL,
  quer_contato BOOLEAN NOT NULL,
  eh_anonimo BOOLEAN NOT NULL,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  mensagem TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'resolvido')),
  resposta TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_declaracoes_tipo ON declaracoes(tipo);
CREATE INDEX IF NOT EXISTS idx_declaracoes_status ON declaracoes(status);
CREATE INDEX IF NOT EXISTS idx_declaracoes_data ON declaracoes(data);
CREATE INDEX IF NOT EXISTS idx_declaracoes_created_at ON declaracoes(created_at);
