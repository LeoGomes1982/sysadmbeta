-- ============================================
-- SCRIPT CONSOLIDADO DE CONFIGURAÇÃO DO BANCO
-- ============================================
-- Este script configura todo o banco de dados de uma vez
-- Pode ser executado múltiplas vezes sem causar erros

-- Desabilitar RLS temporariamente para limpeza
ALTER TABLE IF EXISTS arquivo_geral DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients_suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS extra_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS data_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS supervision_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS login_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cash_flow DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bank_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drive_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drive_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS client_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS client_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admission_progress DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ============================================
-- CRIAR POLÍTICAS RLS PERMISSIVAS
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE IF EXISTS arquivo_geral ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS extra_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS data_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS supervision_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS login_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bank_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drive_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drive_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS client_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admission_progress ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas para arquivo_geral
CREATE POLICY "allow_all_arquivo_geral" ON arquivo_geral FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas permissivas para employees
CREATE POLICY "allow_all_employees" ON employees FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas permissivas para clients_suppliers
CREATE POLICY "allow_all_clients_suppliers" ON clients_suppliers FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas permissivas para extra_services
CREATE POLICY "allow_all_extra_services" ON extra_services FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas permissivas para data_entries
CREATE POLICY "allow_all_data_entries" ON data_entries FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas permissivas para supervision_records
CREATE POLICY "allow_all_supervision_records" ON supervision_records FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas permissivas para login_credentials
CREATE POLICY "allow_all_login_credentials" ON login_credentials FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas permissivas para cash_flow
CREATE POLICY "allow_all_cash_flow" ON cash_flow FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas permissivas para bank_balances
CREATE POLICY "allow_all_bank_balances" ON bank_balances FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas permissivas para receipts
CREATE POLICY "allow_all_receipts" ON receipts FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas permissivas para drive_folders
CREATE POLICY "allow_all_drive_folders" ON drive_folders FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas permissivas para drive_files
CREATE POLICY "allow_all_drive_files" ON drive_files FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas permissivas para client_documents
CREATE POLICY "allow_all_client_documents" ON client_documents FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas permissivas para client_history
CREATE POLICY "allow_all_client_history" ON client_history FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas permissivas para admission_progress
CREATE POLICY "allow_all_admission_progress" ON admission_progress FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- HABILITAR REALTIME
-- ============================================

-- Adicionar tabelas à publicação realtime (ignora erros se já existirem)
DO $$ 
BEGIN
    -- Tentar adicionar cada tabela, ignorando erros se já existir
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE arquivo_geral;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE employees;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE clients_suppliers;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE extra_services;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE data_entries;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE supervision_records;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE login_credentials;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE cash_flow;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE bank_balances;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE receipts;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE drive_folders;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE drive_files;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE client_documents;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE client_history;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE admission_progress;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
