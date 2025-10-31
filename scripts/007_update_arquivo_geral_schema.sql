-- Atualizar schema do arquivo geral para suportar funcionalidades completas

-- Adicionar colunas à tabela files para suportar diferentes tipos de arquivo
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS file_type TEXT CHECK (file_type IN ('texto', 'link', 'upload')) DEFAULT 'texto',
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS file_size TEXT,
ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Remover a referência de user_id das tabelas (não estamos usando auth ainda)
ALTER TABLE public.folders DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.files DROP COLUMN IF EXISTS user_id;

-- Remover políticas RLS antigas
DROP POLICY IF EXISTS "folders_select_own" ON public.folders;
DROP POLICY IF EXISTS "folders_insert_own" ON public.folders;
DROP POLICY IF EXISTS "folders_update_own" ON public.folders;
DROP POLICY IF EXISTS "folders_delete_own" ON public.folders;

DROP POLICY IF EXISTS "files_select_own" ON public.files;
DROP POLICY IF EXISTS "files_insert_own" ON public.files;
DROP POLICY IF EXISTS "files_update_own" ON public.files;
DROP POLICY IF EXISTS "files_delete_own" ON public.files;

-- Criar políticas RLS simples (permitir tudo por enquanto)
CREATE POLICY "folders_authenticated" ON public.folders FOR ALL USING (true);
CREATE POLICY "files_authenticated" ON public.files FOR ALL USING (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON public.files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_file_type ON public.files(file_type);
CREATE INDEX IF NOT EXISTS idx_folders_created_at ON public.folders(created_at);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at);
