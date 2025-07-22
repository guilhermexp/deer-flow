-- Script para criar as tabelas necessárias no Supabase

-- Tabela de notas
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    source TEXT,
    source_url TEXT,
    summary TEXT,
    transcript TEXT,
    metadata JSONB,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de sessões de notas
CREATE TABLE IF NOT EXISTS public.note_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    session_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de mensagens de sessões de notas
CREATE TABLE IF NOT EXISTS public.note_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.note_sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de dados de saúde
CREATE TABLE IF NOT EXISTS public.health_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    health_score INTEGER,
    hydration_ml INTEGER,
    hydration_goal_ml INTEGER,
    sleep_hours NUMERIC(4,2),
    sleep_quality INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    pulse INTEGER,
    workouts_completed INTEGER,
    workouts_goal INTEGER,
    sleep_phases JSONB,
    medications JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Tabela de métricas de saúde
CREATE TABLE IF NOT EXISTS public.health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    value JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de eventos de calendário
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    category TEXT,
    color TEXT,
    location TEXT,
    is_all_day BOOLEAN DEFAULT false,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS public.projects (
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

-- Tabela de tarefas
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'TODO',
    priority TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    order INTEGER DEFAULT 0,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Função para criar tabelas se não existirem
CREATE OR REPLACE FUNCTION public.create_required_tables()
RETURNS void AS $$
BEGIN
    -- Criar tabela health_data se não existir
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'health_data') THEN
        CREATE TABLE public.health_data (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            health_score INTEGER,
            hydration_ml INTEGER,
            hydration_goal_ml INTEGER,
            sleep_hours NUMERIC(4,2),
            sleep_quality INTEGER,
            blood_pressure_systolic INTEGER,
            blood_pressure_diastolic INTEGER,
            pulse INTEGER,
            workouts_completed INTEGER,
            workouts_goal INTEGER,
            sleep_phases JSONB,
            medications JSONB,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(user_id, date)
        );
    END IF;
    
    -- Criar tabela notes se não existir
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notes') THEN
        CREATE TABLE public.notes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            content TEXT,
            source TEXT,
            source_url TEXT,
            summary TEXT,
            transcript TEXT,
            metadata JSONB,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;
    
    -- Criar tabela calendar_events se não existir
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calendar_events') THEN
        CREATE TABLE public.calendar_events (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            description TEXT,
            date TIMESTAMP WITH TIME ZONE NOT NULL,
            end_date TIMESTAMP WITH TIME ZONE,
            category TEXT,
            color TEXT,
            location TEXT,
            is_all_day BOOLEAN DEFAULT false,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;
    
    -- Criar tabela projects se não existir
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
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
    END IF;
    
    -- Criar tabela tasks se não existir
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
        CREATE TABLE public.tasks (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'TODO',
            priority TEXT,
            due_date TIMESTAMP WITH TIME ZONE,
            order INTEGER DEFAULT 0,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões RLS (Row Level Security)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notas
CREATE POLICY "Usuários podem ver suas próprias notas" ON public.notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias notas" ON public.notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias notas" ON public.notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas próprias notas" ON public.notes
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para sessões de notas
CREATE POLICY "Usuários podem ver suas próprias sessões de notas" ON public.note_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_sessions.note_id
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem inserir suas próprias sessões de notas" ON public.note_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_sessions.note_id
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem atualizar suas próprias sessões de notas" ON public.note_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_sessions.note_id
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem excluir suas próprias sessões de notas" ON public.note_sessions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_sessions.note_id
            AND notes.user_id = auth.uid()
        )
    );

-- Políticas RLS para mensagens de sessões de notas
CREATE POLICY "Usuários podem ver suas próprias mensagens de sessões de notas" ON public.note_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.note_sessions
            JOIN public.notes ON notes.id = note_sessions.note_id
            WHERE note_sessions.id = note_messages.session_id
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem inserir suas próprias mensagens de sessões de notas" ON public.note_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.note_sessions
            JOIN public.notes ON notes.id = note_sessions.note_id
            WHERE note_sessions.id = note_messages.session_id
            AND notes.user_id = auth.uid()
        )
    );

-- Políticas RLS para dados de saúde
CREATE POLICY "Usuários podem ver seus próprios dados de saúde" ON public.health_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios dados de saúde" ON public.health_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios dados de saúde" ON public.health_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios dados de saúde" ON public.health_data
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para métricas de saúde
CREATE POLICY "Usuários podem ver suas próprias métricas de saúde" ON public.health_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias métricas de saúde" ON public.health_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para eventos de calendário
CREATE POLICY "Usuários podem ver seus próprios eventos de calendário" ON public.calendar_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios eventos de calendário" ON public.calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios eventos de calendário" ON public.calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios eventos de calendário" ON public.calendar_events
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para projetos
CREATE POLICY "Usuários podem ver seus próprios projetos" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios projetos" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios projetos" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios projetos" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para tarefas
CREATE POLICY "Usuários podem ver suas próprias tarefas" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias tarefas" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias tarefas" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas próprias tarefas" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS note_sessions_note_id_idx ON public.note_sessions(note_id);
CREATE INDEX IF NOT EXISTS note_messages_session_id_idx ON public.note_messages(session_id);
CREATE INDEX IF NOT EXISTS health_data_user_id_date_idx ON public.health_data(user_id, date);
CREATE INDEX IF NOT EXISTS health_metrics_user_id_idx ON public.health_metrics(user_id);
CREATE INDEX IF NOT EXISTS health_metrics_recorded_at_idx ON public.health_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS calendar_events_user_id_idx ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS calendar_events_date_idx ON public.calendar_events(date);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);