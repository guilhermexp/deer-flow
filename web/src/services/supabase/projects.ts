import { getSupabaseClient } from "~/lib/supabase/client"
import type { Database } from "~/types/supabase"
import type { Project as AppProject, Task as AppTask, TaskStatus } from "~/components/jarvis/kanban/lib/types"

type SupabaseProject = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
}

type SupabaseTask = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  order: number;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
}

type SupabaseProjectInsert = Omit<SupabaseProject, 'id' | 'created_at' | 'updated_at'>;
type SupabaseProjectUpdate = Partial<Omit<SupabaseProject, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;
type SupabaseTaskInsert = Omit<SupabaseTask, 'id' | 'created_at' | 'updated_at'>;
type SupabaseTaskUpdate = Partial<Omit<SupabaseTask, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'project_id'>>;

// Converter formato da aplicação para formato Supabase
export function convertProjectToSupabase(project: Partial<AppProject>, userId: string): SupabaseProjectInsert {
  return {
    name: project.name || 'Novo Projeto',
    description: project.description || null,
    color: '#3B82F6',
    icon: 'folder',
    status: 'active',
    user_id: userId
  }
}

// Converter formato Supabase para formato da aplicação
export function convertSupabaseToProject(supabaseProject: SupabaseProject): AppProject {
  return {
    id: supabaseProject.id,
    name: supabaseProject.name,
    description: supabaseProject.description || undefined,
    createdAt: supabaseProject.created_at || new Date().toISOString(),
    isPriority: false
  }
}

// Converter tarefa da aplicação para formato Supabase
export function convertTaskToSupabase(task: Partial<AppTask>, projectId: string, userId: string): SupabaseTaskInsert {
  // Mapear status da aplicação para status do Supabase
  const statusMap: { [key in TaskStatus]: string } = {
    'not-started': 'TODO',
    'in-progress': 'IN_PROGRESS',
    'done': 'DONE',
    'paused': 'TODO'
  }
  
  return {
    project_id: projectId,
    title: task.title || 'Nova Tarefa',
    description: task.description || null,
    status: statusMap[task.status || 'not-started'] || 'TODO',
    priority: 'medium',
    due_date: null,
    order: 0,
    user_id: userId
  }
}

// Converter tarefa do Supabase para formato da aplicação
export function convertSupabaseToTask(supabaseTask: SupabaseTask): AppTask {
  // Mapear status do Supabase para status da aplicação
  const statusMap: { [key: string]: TaskStatus } = {
    'TODO': 'not-started',
    'IN_PROGRESS': 'in-progress',
    'DONE': 'done'
  }
  
  return {
    id: supabaseTask.id,
    projectId: supabaseTask.project_id,
    title: supabaseTask.title,
    description: supabaseTask.description || undefined,
    date: new Date(supabaseTask.created_at || '').toLocaleDateString('pt-BR'),
    progress: supabaseTask.status === 'DONE' ? 100 : (supabaseTask.status === 'IN_PROGRESS' ? 50 : 0),
    comments: 0,
    attachments: 0,
    assignees: [],
    status: statusMap[supabaseTask.status] || 'not-started',
    weekDay: 'none'
  }
}

// Helper para obter o usuário atual
async function getCurrentUser() {
  const supabase = getSupabaseClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('Usuário não autenticado');
  }
  
  return session.user;
}

export const projectsService = {
  // Buscar projetos
  async getProjects(): Promise<AppProject[]> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar projetos:', error);
      throw error;
    }
    
    return (data || []).map(project => convertSupabaseToProject(project as SupabaseProject));
  },
  
  // Buscar projeto por ID
  async getProject(projectId: string): Promise<AppProject | null> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Erro ao buscar projeto:', error);
      throw error;
    }
    
    return data ? convertSupabaseToProject(data as SupabaseProject) : null;
  },
  
  // Criar projeto
  async createProject(projectData: Partial<AppProject>): Promise<AppProject> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    const supabaseProject = convertProjectToSupabase(projectData, user.id);
    
    const { data, error } = await supabase
      .from('projects')
      .insert(supabaseProject)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar projeto:', error);
      throw error;
    }
    
    return convertSupabaseToProject(data as SupabaseProject);
  },
  
  // Atualizar projeto
  async updateProject(projectId: string, updates: Partial<AppProject>): Promise<AppProject> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    const supabaseUpdates: SupabaseProjectUpdate = {};
    
    if (updates.name !== undefined) supabaseUpdates.name = updates.name;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    
    const { data, error } = await supabase
      .from('projects')
      .update(supabaseUpdates)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar projeto:', error);
      throw error;
    }
    
    return convertSupabaseToProject(data as SupabaseProject);
  },
  
  // Excluir projeto
  async deleteProject(projectId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Erro ao excluir projeto:', error);
      throw error;
    }
  },
  
  // Buscar tarefas de um projeto
  async getProjectTasks(projectId: string): Promise<AppTask[]> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('order', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar tarefas do projeto:', error);
      throw error;
    }
    
    return (data || []).map(task => convertSupabaseToTask(task as SupabaseTask));
  },
  
  // Criar tarefa
  async createTask(projectId: string, taskData: Partial<AppTask>, status: string = 'TODO'): Promise<AppTask> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    // Obter a ordem mais alta atual para o status
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('order')
      .eq('project_id', projectId)
      .eq('status', status)
      .order('order', { ascending: false })
      .limit(1);
    
    const highestOrder = existingTasks && existingTasks.length > 0 ? existingTasks[0].order : -1;
    
    const taskWithStatus = {
      ...taskData,
      status: status === 'backlog' || status === 'todo' ? 'not-started' : 
              status === 'in_progress' ? 'in-progress' : 
              status === 'done' ? 'done' : 'not-started'
    };
    
    const supabaseTask = convertTaskToSupabase(taskWithStatus, projectId, user.id);
    supabaseTask.order = highestOrder + 1;
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(supabaseTask)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar tarefa:', error);
      throw error;
    }
    
    return convertSupabaseToTask(data as SupabaseTask);
  },
  
  // Atualizar tarefa
  async updateTask(taskId: string, updates: Partial<AppTask>): Promise<AppTask> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    const supabaseUpdates: SupabaseTaskUpdate = {};
    
    if (updates.title !== undefined) supabaseUpdates.title = updates.title;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    
    if (updates.status !== undefined) {
      const statusMap: { [key in TaskStatus]: string } = {
        'not-started': 'TODO',
        'in-progress': 'IN_PROGRESS',
        'done': 'DONE',
        'paused': 'TODO'
      };
      supabaseUpdates.status = statusMap[updates.status];
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .update(supabaseUpdates)
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar tarefa:', error);
      throw error;
    }
    
    return convertSupabaseToTask(data as SupabaseTask);
  },
  
  // Mover tarefa
  async moveTask(projectId: string, taskId: string, newStatus: string, newOrder: number): Promise<AppTask> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    // Mapear status da aplicação para status do Supabase
    const statusMap: { [key: string]: string } = {
      'backlog': 'TODO',
      'todo': 'TODO',
      'in_progress': 'IN_PROGRESS',
      'done': 'DONE'
    };
    
    const supabaseStatus = statusMap[newStatus] || 'TODO';
    
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: supabaseStatus,
        order: newOrder
      })
      .eq('id', taskId)
      .eq('project_id', projectId)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao mover tarefa:', error);
      throw error;
    }
    
    return convertSupabaseToTask(data as SupabaseTask);
  },
  
  // Excluir tarefa
  async deleteTask(taskId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Erro ao excluir tarefa:', error);
      throw error;
    }
  },
  
  // Obter quadro kanban
  async getKanbanBoard(projectId: string): Promise<{
    project_id: string;
    project_name: string;
    columns: {
      id: string;
      title: string;
      color: string;
      tasks: AppTask[];
    }[];
  }> {
    const supabase = getSupabaseClient();
    const user = await getCurrentUser();
    
    // Buscar projeto
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();
    
    if (projectError) {
      console.error('Erro ao buscar projeto para kanban:', projectError);
      throw projectError;
    }
    
    // Buscar tarefas
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('order', { ascending: true });
    
    if (tasksError) {
      console.error('Erro ao buscar tarefas para kanban:', tasksError);
      throw tasksError;
    }
    
    // Converter tarefas
    const tasks = (tasksData || []).map(task => convertSupabaseToTask(task as SupabaseTask));
    
    // Agrupar tarefas por status
    const todoTasks = tasks.filter(task => task.status === 'not-started' || task.status === 'paused');
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
    const doneTasks = tasks.filter(task => task.status === 'done');
    
    return {
      project_id: projectId,
      project_name: (projectData as SupabaseProject).name,
      columns: [
        {
          id: 'backlog',
          title: 'Backlog',
          color: '#64748b',
          tasks: todoTasks
        },
        {
          id: 'in_progress',
          title: 'Em Progresso',
          color: '#3b82f6',
          tasks: inProgressTasks
        },
        {
          id: 'done',
          title: 'Concluído',
          color: '#22c55e',
          tasks: doneTasks
        }
      ]
    };
  },
  
  // Verificar se as tabelas de projetos existem
  async checkProjectTablesExist(): Promise<boolean> {
    const supabase = getSupabaseClient();
    
    try {
      // Verificar tabela de projetos
      const { error: projectsError } = await supabase
        .from('projects')
        .select('count')
        .limit(1);
      
      // Verificar tabela de tarefas
      const { error: tasksError } = await supabase
        .from('tasks')
        .select('count')
        .limit(1);
      
      return !projectsError && !tasksError;
    } catch (error) {
      console.error('Erro ao verificar tabelas de projetos:', error);
      return false;
    }
  }
};