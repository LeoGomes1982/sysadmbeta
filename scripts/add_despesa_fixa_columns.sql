-- Adicionar colunas para despesas fixas recorrentes na tabela cash_flow
ALTER TABLE cash_flow
ADD COLUMN IF NOT EXISTS tipo_despesa text,
ADD COLUMN IF NOT EXISTS recorrencia_meses integer,
ADD COLUMN IF NOT EXISTS id_recorrencia uuid;

-- Adicionar comentários para documentação
COMMENT ON COLUMN cash_flow.tipo_despesa IS 'Tipo de despesa: Fixa ou Variável (apenas para despesas)';
COMMENT ON COLUMN cash_flow.recorrencia_meses IS 'Quantidade de meses de recorrência para despesas fixas';
COMMENT ON COLUMN cash_flow.id_recorrencia IS 'ID para agrupar registros de despesas fixas recorrentes';
