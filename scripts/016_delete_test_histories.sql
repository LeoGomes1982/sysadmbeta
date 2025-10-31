-- Script para deletar históricos de teste dos funcionários Leandro e Arthur
-- Criado em: 2025-01-20

-- Deletar históricos do Leandro Da Silva Gomes E Silva
DELETE FROM employee_history
WHERE employee_id IN (
  SELECT id FROM employees 
  WHERE nome ILIKE '%Leandro%Silva%Gomes%'
);

-- Deletar históricos do Arthur Pizzani Silva
DELETE FROM employee_history
WHERE employee_id IN (
  SELECT id FROM employees 
  WHERE nome ILIKE '%Arthur%Pizzani%Silva%'
);

-- Resetar pontos desses funcionários para 10 (pontuação base)
UPDATE employees
SET points = 10, updated_at = NOW()
WHERE nome ILIKE '%Leandro%Silva%Gomes%' 
   OR nome ILIKE '%Arthur%Pizzani%Silva%';

-- Verificar os registros deletados
SELECT 
  e.nome,
  e.points as pontos_atuais,
  COUNT(eh.id) as historicos_restantes
FROM employees e
LEFT JOIN employee_history eh ON e.id = eh.employee_id
WHERE e.nome ILIKE '%Leandro%Silva%Gomes%' 
   OR e.nome ILIKE '%Arthur%Pizzani%Silva%'
GROUP BY e.id, e.nome, e.points;
