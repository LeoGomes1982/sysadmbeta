-- Criar tabela para registrar os PDFs de recibos gerados
CREATE TABLE IF NOT EXISTS public.receipts_generated (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL DEFAULT 'vale_alimentacao',
  periodo VARCHAR(100) NOT NULL,
  data_pagamento DATE NOT NULL,
  total_funcionarios INTEGER NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  arquivo_nome VARCHAR(255) NOT NULL,
  data_geracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_receipts_generated_tipo ON public.receipts_generated(tipo);
CREATE INDEX IF NOT EXISTS idx_receipts_generated_periodo ON public.receipts_generated(periodo);
CREATE INDEX IF NOT EXISTS idx_receipts_generated_data_geracao ON public.receipts_generated(data_geracao);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.receipts_generated ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações (ajustar conforme necessário)
CREATE POLICY "Enable all operations for receipts_generated" ON public.receipts_generated
FOR ALL USING (true);
