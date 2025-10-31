-- Configurar políticas RLS para todas as tabelas
-- Este script garante que todas as operações funcionem corretamente

-- Desabilitar RLS temporariamente para limpar políticas antigas
ALTER TABLE IF EXISTS admission_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bank_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cash_flow DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cash_flow_monthly_balance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS client_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS client_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients_suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS data_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_dependents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_inspections DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_sanctions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS extra_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS files DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS laws DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS login_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS receipts_generated DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS supervision_records DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Habilitar RLS em todas as tabelas
ALTER TABLE admission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_monthly_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_sanctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE laws ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts_generated ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervision_records ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas para todas as operações (SELECT, INSERT, UPDATE, DELETE)
-- Estas políticas permitem acesso total para usuários autenticados e anônimos

-- admission_progress
CREATE POLICY "Enable all for admission_progress" ON admission_progress FOR ALL USING (true) WITH CHECK (true);

-- appointments
CREATE POLICY "Enable all for appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);

-- bank_balances
CREATE POLICY "Enable all for bank_balances" ON bank_balances FOR ALL USING (true) WITH CHECK (true);

-- cash_flow
CREATE POLICY "Enable all for cash_flow" ON cash_flow FOR ALL USING (true) WITH CHECK (true);

-- cash_flow_monthly_balance
CREATE POLICY "Enable all for cash_flow_monthly_balance" ON cash_flow_monthly_balance FOR ALL USING (true) WITH CHECK (true);

-- client_documents
CREATE POLICY "Enable all for client_documents" ON client_documents FOR ALL USING (true) WITH CHECK (true);

-- client_history
CREATE POLICY "Enable all for client_history" ON client_history FOR ALL USING (true) WITH CHECK (true);

-- clients_suppliers
CREATE POLICY "Enable all for clients_suppliers" ON clients_suppliers FOR ALL USING (true) WITH CHECK (true);

-- data_entries
CREATE POLICY "Enable all for data_entries" ON data_entries FOR ALL USING (true) WITH CHECK (true);

-- employee_dependents
CREATE POLICY "Enable all for employee_dependents" ON employee_dependents FOR ALL USING (true) WITH CHECK (true);

-- employee_documents
CREATE POLICY "Enable all for employee_documents" ON employee_documents FOR ALL USING (true) WITH CHECK (true);

-- employee_evaluations
CREATE POLICY "Enable all for employee_evaluations" ON employee_evaluations FOR ALL USING (true) WITH CHECK (true);

-- employee_history
CREATE POLICY "Enable all for employee_history" ON employee_history FOR ALL USING (true) WITH CHECK (true);

-- employee_inspections
CREATE POLICY "Enable all for employee_inspections" ON employee_inspections FOR ALL USING (true) WITH CHECK (true);

-- employee_sanctions
CREATE POLICY "Enable all for employee_sanctions" ON employee_sanctions FOR ALL USING (true) WITH CHECK (true);

-- employees
CREATE POLICY "Enable all for employees" ON employees FOR ALL USING (true) WITH CHECK (true);

-- extra_services
CREATE POLICY "Enable all for extra_services" ON extra_services FOR ALL USING (true) WITH CHECK (true);

-- files
CREATE POLICY "Enable all for files" ON files FOR ALL USING (true) WITH CHECK (true);

-- folders
CREATE POLICY "Enable all for folders" ON folders FOR ALL USING (true) WITH CHECK (true);

-- laws
CREATE POLICY "Enable all for laws" ON laws FOR ALL USING (true) WITH CHECK (true);

-- login_credentials
CREATE POLICY "Enable all for login_credentials" ON login_credentials FOR ALL USING (true) WITH CHECK (true);

-- positions
CREATE POLICY "Enable all for positions" ON positions FOR ALL USING (true) WITH CHECK (true);

-- projects
CREATE POLICY "Enable all for projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- receipts_generated
CREATE POLICY "Enable all for receipts_generated" ON receipts_generated FOR ALL USING (true) WITH CHECK (true);

-- supervision_records
CREATE POLICY "Enable all for supervision_records" ON supervision_records FOR ALL USING (true) WITH CHECK (true);
