import os
from supabase import create_client

# Conectar ao Supabase usando as variáveis de ambiente
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas")
    exit(1)

supabase = create_client(supabase_url, supabase_key)

print("🔄 Criando tabela performance_evaluations...")

# SQL para criar a tabela
create_table_sql = """
-- Criar tabela de avaliações de desempenho
CREATE TABLE IF NOT EXISTS performance_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  avaliado TEXT NOT NULL,
  tipo_avaliado TEXT NOT NULL CHECK (tipo_avaliado IN ('colaborador', 'lideranca')),
  avaliador TEXT NOT NULL,
  tipo_avaliacao TEXT NOT NULL CHECK (tipo_avaliacao IN ('interna', 'externa')),
  tipo_formulario TEXT CHECK (tipo_formulario IN ('colega', 'lider')),
  data DATE NOT NULL,
  pontuacao INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'concluida')),
  link_externo TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_employee_id ON performance_evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_data ON performance_evaluations(data);
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_status ON performance_evaluations(status);

-- Habilitar RLS
ALTER TABLE performance_evaluations ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (permitir todas as operações para usuários autenticados)
DROP POLICY IF EXISTS "Permitir leitura de avaliações" ON performance_evaluations;
CREATE POLICY "Permitir leitura de avaliações" ON performance_evaluations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de avaliações" ON performance_evaluations;
CREATE POLICY "Permitir inserção de avaliações" ON performance_evaluations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de avaliações" ON performance_evaluations;
CREATE POLICY "Permitir atualização de avaliações" ON performance_evaluations
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir exclusão de avaliações" ON performance_evaluations;
CREATE POLICY "Permitir exclusão de avaliações" ON performance_evaluations
  FOR DELETE USING (true);
"""

try:
    # Executar o SQL
    result = supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
    print("✅ Tabela performance_evaluations criada com sucesso!")
    print("✅ Índices criados")
    print("✅ RLS habilitado")
    print("✅ Políticas de segurança configuradas")
    
except Exception as e:
    # Se o RPC não existir, tentar executar diretamente
    print(f"⚠️  Método RPC não disponível, tentando executar SQL diretamente...")
    try:
        # Dividir o SQL em comandos individuais e executar cada um
        commands = create_table_sql.split(';')
        for cmd in commands:
            cmd = cmd.strip()
            if cmd:
                supabase.postgrest.rpc('exec', {'query': cmd}).execute()
        print("✅ Tabela criada com sucesso!")
    except Exception as e2:
        print(f"❌ Erro ao criar tabela: {str(e2)}")
        print("\n📋 Execute este SQL manualmente no Supabase SQL Editor:")
        print("\n" + create_table_sql)
        exit(1)

print("\n✅ Configuração concluída! Agora você pode salvar avaliações de desempenho.")
