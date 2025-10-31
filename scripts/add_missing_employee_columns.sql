-- Adicionar colunas faltantes na tabela employees
-- Este script adiciona todos os campos do formulário de funcionários que não existem na tabela

-- Informações pessoais adicionais
ALTER TABLE employees ADD COLUMN IF NOT EXISTS rg_orgao_emissor TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS rg_uf TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS rg_data_expedicao DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS sexo TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS raca TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nome_pai TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nome_mae TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nacionalidade TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS grau_instrucao TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS estado_civil TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nome_conjuge TEXT;

-- Documentos trabalhistas
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pis TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_numero TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_serie TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_uf TEXT;

-- CNH
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh_numero TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh_categoria TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh_data_vencimento DATE;

-- Endereço adicional
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cep TEXT;

-- Informações profissionais adicionais
ALTER TABLE employees ADD COLUMN IF NOT EXISTS funcao TEXT; -- Função do funcionário
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nivel TEXT; -- Nível I, II ou III
ALTER TABLE employees ADD COLUMN IF NOT EXISTS carga_horaria TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS horario_trabalho TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS reemprego BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tipo_contrato TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS utiliza_vale_transporte BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS quantidade_vale_transporte INTEGER;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN employees.funcao IS 'Função do funcionário (Auxiliar administrativa, Auxiliar de limpeza, etc.)';
COMMENT ON COLUMN employees.nivel IS 'Nível do funcionário (Nível I, II ou III)';
COMMENT ON COLUMN employees.grau_instrucao IS 'Grau de instrução do funcionário';
COMMENT ON COLUMN employees.estado_civil IS 'Estado civil do funcionário';
COMMENT ON COLUMN employees.nome_conjuge IS 'Nome do cônjuge (se casado)';
COMMENT ON COLUMN employees.reemprego IS 'Indica se é reemprego';
COMMENT ON COLUMN employees.utiliza_vale_transporte IS 'Indica se utiliza vale transporte';
COMMENT ON COLUMN employees.quantidade_vale_transporte IS 'Quantidade de vale transporte';
