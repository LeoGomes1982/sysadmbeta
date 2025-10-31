-- Adiciona campos separados de endereço à tabela employees
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS rua TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS complemento TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT;

-- Comentário: O campo 'endereco' existente será mantido para compatibilidade
-- Os novos campos permitem armazenamento estruturado do endereço
