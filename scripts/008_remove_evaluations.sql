-- Remove todos os registros de avaliação de desempenho
DELETE FROM employee_evaluations;

-- Confirma que a tabela está vazia
SELECT COUNT(*) as total_avaliacoes_restantes FROM employee_evaluations;
