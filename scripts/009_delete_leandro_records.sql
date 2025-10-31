-- Script para deletar sanção e avaliação de desempenho do funcionário Leandro
-- Executar este script para remover os registros

-- Deletar sanção disciplinar do Leandro
DELETE FROM employee_sanctions
WHERE employee_name = 'Leandro Da Silva Gomes E Silva';

-- Deletar avaliação de desempenho do Leandro
DELETE FROM employee_evaluations
WHERE employee_name = 'Leandro Da Silva Gomes E Silva';

-- Verificar se os registros foram deletados
SELECT 
  (SELECT COUNT(*) FROM employee_sanctions WHERE employee_name = 'Leandro Da Silva Gomes E Silva') as sancoes_restantes,
  (SELECT COUNT(*) FROM employee_evaluations WHERE employee_name = 'Leandro Da Silva Gomes E Silva') as avaliacoes_restantes;
