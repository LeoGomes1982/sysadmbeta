-- Corrigindo estrutura das tabelas para corresponder ao código
-- Criar tabela de pastas
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    is_protected BOOLEAN DEFAULT false,
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de arquivos
CREATE TABLE IF NOT EXISTS public.files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('texto', 'link', 'upload')),
    content TEXT, -- Para arquivos de texto
    url TEXT, -- Para links
    file_data BYTEA, -- Para uploads
    file_size TEXT, -- Tamanho formatado como string
    original_filename TEXT, -- Nome original do arquivo
    mime_type TEXT,
    folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para folders
CREATE POLICY "Permitir todas as operações em folders" ON public.folders
    FOR ALL USING (true) WITH CHECK (true);

-- Criar políticas RLS para files
CREATE POLICY "Permitir todas as operações em files" ON public.files
    FOR ALL USING (true) WITH CHECK (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON public.files(folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_name ON public.folders(name);
CREATE INDEX IF NOT EXISTS idx_files_name ON public.files(name);
CREATE INDEX IF NOT EXISTS idx_files_type ON public.files(file_type);

-- Inserir algumas pastas padrão
INSERT INTO public.folders (name, parent_id, is_protected) VALUES 
    ('Documentos', NULL, false),
    ('Contratos', NULL, false),
    ('Relatórios', NULL, false)
ON CONFLICT DO NOTHING;
