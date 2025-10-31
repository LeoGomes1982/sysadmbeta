-- Habilitar RLS e criar políticas públicas para todas as tabelas principais
-- Isso permite que o aplicativo acesse os dados sem autenticação

-- Tabela employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a employees" ON employees
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela clients_suppliers
ALTER TABLE clients_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a clients_suppliers" ON clients_suppliers
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela cash_flow
ALTER TABLE cash_flow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a cash_flow" ON cash_flow
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a appointments" ON appointments
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela extra_services
ALTER TABLE extra_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a extra_services" ON extra_services
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela data_entries
ALTER TABLE data_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a data_entries" ON data_entries
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela login_credentials
ALTER TABLE login_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a login_credentials" ON login_credentials
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela employee_dependents
ALTER TABLE employee_dependents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a employee_dependents" ON employee_dependents
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela employee_history
ALTER TABLE employee_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a employee_history" ON employee_history
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela employee_evaluations
ALTER TABLE employee_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a employee_evaluations" ON employee_evaluations
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela employee_inspections
ALTER TABLE employee_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a employee_inspections" ON employee_inspections
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela employee_sanctions
ALTER TABLE employee_sanctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a employee_sanctions" ON employee_sanctions
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a projects" ON projects
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela positions
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a positions" ON positions
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a folders" ON folders
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela files
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a files" ON files
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela admission_progress
ALTER TABLE admission_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a admission_progress" ON admission_progress
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela receipts_generated
ALTER TABLE receipts_generated ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a receipts_generated" ON receipts_generated
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela supervision_records
ALTER TABLE supervision_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a supervision_records" ON supervision_records
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela cash_flow_monthly_balance
ALTER TABLE cash_flow_monthly_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a cash_flow_monthly_balance" ON cash_flow_monthly_balance
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela client_documents
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a client_documents" ON client_documents
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela client_history
ALTER TABLE client_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a client_history" ON client_history
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela employee_documents
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a employee_documents" ON employee_documents
FOR ALL
USING (true)
WITH CHECK (true);

-- Tabela laws
ALTER TABLE laws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso público a laws" ON laws
FOR ALL
USING (true)
WITH CHECK (true);
