-- Script para verificar e corrigir a estrutura da tabela tasks no Supabase

-- 1. Verificar a estrutura atual da tabela tasks
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'tasks'
ORDER BY 
    ordinal_position;

-- 2. Se a coluna project_id não existir, adicione ela
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'project_id'
    ) THEN
        -- Adicionar a coluna project_id
        ALTER TABLE public.tasks 
        ADD COLUMN project_id UUID;
        
        -- Não podemos adicionar NOT NULL e REFERENCES imediatamente se já existem dados
        -- Primeiro vamos verificar se existem dados na tabela
        IF EXISTS (SELECT 1 FROM public.tasks LIMIT 1) THEN
            RAISE NOTICE 'A tabela tasks contém dados. Você precisará:';
            RAISE NOTICE '1. Criar um projeto padrão';
            RAISE NOTICE '2. Atualizar todas as tarefas existentes com o project_id';
            RAISE NOTICE '3. Depois adicionar as constraints';
        ELSE
            -- Se não há dados, podemos adicionar as constraints
            ALTER TABLE public.tasks 
            ALTER COLUMN project_id SET NOT NULL;
            
            ALTER TABLE public.tasks 
            ADD CONSTRAINT tasks_project_id_fkey 
            FOREIGN KEY (project_id) 
            REFERENCES public.projects(id) 
            ON DELETE CASCADE;
        END IF;
    ELSE
        RAISE NOTICE 'A coluna project_id já existe na tabela tasks';
    END IF;
END $$;

-- 3. Verificar se a tabela projects existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projects'
    ) THEN
        -- Criar a tabela projects se não existir
        CREATE TABLE public.projects (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            description TEXT,
            color TEXT,
            icon TEXT,
            status TEXT DEFAULT 'active',
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Habilitar RLS
        ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas RLS
        CREATE POLICY "Users can view own projects" ON public.projects
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can create own projects" ON public.projects
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own projects" ON public.projects
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete own projects" ON public.projects
            FOR DELETE USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Tabela projects criada com sucesso';
    END IF;
END $$;

-- 4. Script para migrar tarefas existentes (se necessário)
-- ATENÇÃO: Execute este bloco apenas se você tiver tarefas sem project_id
/*
-- Primeiro, crie um projeto padrão para migração
INSERT INTO public.projects (name, description, user_id)
SELECT 
    'Projeto Padrão',
    'Projeto criado para migração de tarefas existentes',
    user_id
FROM public.tasks
GROUP BY user_id;

-- Depois, atualize as tarefas com o project_id do projeto padrão
UPDATE public.tasks t
SET project_id = p.id
FROM public.projects p
WHERE t.user_id = p.user_id
AND p.name = 'Projeto Padrão'
AND t.project_id IS NULL;

-- Finalmente, adicione as constraints
ALTER TABLE public.tasks 
ALTER COLUMN project_id SET NOT NULL;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES public.projects(id) 
ON DELETE CASCADE;
*/

-- 5. Verificar a estrutura final
SELECT 
    'tasks' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'tasks'
ORDER BY 
    ordinal_position;