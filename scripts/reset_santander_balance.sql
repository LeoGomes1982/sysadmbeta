-- Script para zerar o saldo do banco Santander
-- Remove o saldo inicial de R$ 80,00 e define como R$ 0,00

UPDATE bank_balances
SET saldo_diario = 0.00
WHERE banco = 'Santander';

-- Verificar se a atualização foi bem-sucedida
SELECT banco, saldo_diario, data_atualizacao
FROM bank_balances
WHERE banco = 'Santander';
