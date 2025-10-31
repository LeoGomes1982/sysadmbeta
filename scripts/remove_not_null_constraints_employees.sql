-- Remove NOT NULL constraints from non-required columns in employees table
-- Required fields: nome, data_admissao, funcao, nivel, empresa

-- Personal Information (optional)
ALTER TABLE employees ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN rg DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN rg_orgao_emissor DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN rg_uf DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN rg_data_expedicao DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN sexo DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN raca DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN nome_pai DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN nome_mae DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN nacionalidade DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN grau_instrucao DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN estado_civil DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN nome_conjuge DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN data_nascimento DROP NOT NULL;

-- Professional Information (optional except funcao, nivel, empresa)
ALTER TABLE employees ALTER COLUMN cargo DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN departamento DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN carga_horaria DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN horario_trabalho DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN tipo_contrato DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN salario DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN reemprego DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN utiliza_vale_transporte DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN quantidade_vale_transporte DROP NOT NULL;

-- Documents (optional)
ALTER TABLE employees ALTER COLUMN pis DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN ctps_numero DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN ctps_serie DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN ctps_uf DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN cnh_numero DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN cnh_categoria DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN cnh_data_vencimento DROP NOT NULL;

-- Contact and Address (optional)
ALTER TABLE employees ALTER COLUMN telefone DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN email DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN endereco DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN cep DROP NOT NULL;

-- Other (optional)
ALTER TABLE employees ALTER COLUMN observacoes DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN status DROP NOT NULL;

-- Ensure required fields have NOT NULL constraint
ALTER TABLE employees ALTER COLUMN nome SET NOT NULL;
ALTER TABLE employees ALTER COLUMN data_admissao SET NOT NULL;
ALTER TABLE employees ALTER COLUMN funcao SET NOT NULL;
ALTER TABLE employees ALTER COLUMN nivel SET NOT NULL;
ALTER TABLE employees ALTER COLUMN empresa SET NOT NULL;
