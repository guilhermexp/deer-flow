import { useState, useEffect, useCallback } from 'react';

import type { Project, Task, TaskStatus, ActiveTabValue } from '~/components/jarvis/kanban/lib/types';
import { useUser } from '@clerk/nextjs';
import { projectsApiService as projectsService } from '~/services/api/projects';

/**
 * Hook para gerenciar projetos e tarefas via REST API
 */
export function useProjectsSupabase() {
  const { user, isLoaded } = useUser();
  const isAuthenticated = isLoaded && !!user;
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasksByProject, setTasksByProject] = useState<Record<string, Task[]>>({});
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTabValue>("projectList");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar projetos do Supabase
  const loadProjects = useCallback(async (): Promise<Project[]> => {
    if (!isAuthenticated || !user?.id) {
      setProjects([]);
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando projetos...');
      
      // Verificar se as tabelas existem
      const tablesExist = await projectsService.checkProjectsTableExists();

      if (!tablesExist) {
        console.log('⚠️ Tabelas de projetos não encontradas');
        throw new Error('Tabelas de projetos não encontradas. Verifique se as tabelas do Supabase foram criadas corretamente.');
      }

      const apiProjects = await projectsService.list();
      console.log(`✅ ${apiProjects.length} projetos carregados`);

      // Converter projetos da API para formato local
      const localProjects = apiProjects.map((p: any) => ({
        id: p.id.toString(),
        name: p.name,
        description: p.description,
        createdAt: p.created_at,
        isPriority: false
      }));

      setProjects(localProjects);
      return localProjects;
    } catch (err) {
      console.error('❌ Erro ao carregar projetos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar projetos');
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Carregar tarefas de um projeto
  const loadProjectTasks = useCallback(async (projectId: string): Promise<Task[]> => {
    if (!isAuthenticated || !user?.id || !projectId) {
      return [];
    }

    try {
      console.log(`🔄 Carregando tarefas do projeto ${projectId}...`);

      const kanbanBoard = await projectsService.getKanbanBoard(parseInt(projectId));
      const tasks: Task[] = [];

      // Extract tasks from all columns
      if (kanbanBoard) {
        kanbanBoard.columns.forEach((column: any) => {
          tasks.push(...column.tasks);
        });
      }

      console.log(`✅ ${tasks.length} tarefas carregadas`);

      setTasksByProject(prev => ({
        ...prev,
        [projectId]: tasks
      }));

      return tasks;
    } catch (err) {
      console.error(`❌ Erro ao carregar tarefas do projeto ${projectId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas do projeto');
      return [];
    }
  }, [isAuthenticated, user?.id]);

  // Criar projeto
  const createProject = useCallback(async (projectData: Partial<Project>): Promise<Project | null> => {
    if (!isAuthenticated || !user?.id) {
      setError('Usuário não autenticado');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const newProject = await projectsService.createProject(projectData);
      setProjects(prev => [...prev, newProject]);
      
      return newProject;
    } catch (err) {
      console.error('❌ Erro ao criar projeto:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Atualizar projeto
  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>): Promise<Project | null> => {
    if (!isAuthenticated || !user?.id) {
      setError('Usuário não autenticado');
      return null;
    }

    try {
      const updatedProject = await projectsService.updateProject(projectId, updates);
      
      setProjects(prev => 
        prev.map(p => p.id === projectId ? updatedProject : p)
      );
      
      if (currentProject?.id === projectId) {
        setCurrentProject(updatedProject);
      }
      
      return updatedProject;
    } catch (err) {
      console.error('❌ Erro ao atualizar projeto:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar projeto');
      return null;
    }
  }, [isAuthenticated, user?.id, currentProject]);

  // Excluir projeto
  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    if (!isAuthenticated || !user?.id) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      await projectsService.deleteProject(projectId);
      
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setTasksByProject(prev => {
        const newTasks = { ...prev };
        delete newTasks[projectId];
        return newTasks;
      });
      
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
        setActiveTab("projectList");
      }
      
      return true;
    } catch (err) {
      console.error('❌ Erro ao excluir projeto:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir projeto');
      return false;
    }
  }, [isAuthenticated, user?.id, currentProject]);

  // Criar tarefa
  const createTask = useCallback(async (projectId: string, taskData: Partial<Task>, columnId = 'backlog'): Promise<Task | null> => {
    if (!isAuthenticated || !user?.id) {
      setError('Usuário não autenticado');
      return null;
    }

    try {
      const newTask = await projectsService.createTask(projectId, taskData, columnId);
      
      setTasksByProject(prev => ({
        ...prev,
        [projectId]: [...(prev[projectId] || []), newTask]
      }));
      
      return newTask;
    } catch (err) {
      console.error('❌ Erro ao criar tarefa:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar tarefa');
      return null;
    }
  }, [isAuthenticated, user?.id]);

  // Mover tarefa
  const moveTask = useCallback(async (projectId: string, taskId: string, columnId: string, order: number): Promise<boolean> => {
    if (!isAuthenticated || !user?.id) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      await projectsService.moveTask(projectId, taskId, columnId, order);
      
      // Update local state
      setTasksByProject(prev => {
        const projectTasks = prev[projectId] || [];
        const updatedTasks = projectTasks.map(task => {
          if (task.id === taskId) {
            const statusMap: Record<string, TaskStatus> = {
              'backlog': 'not-started',
              'todo': 'not-started',
              'in_progress': 'in-progress',
              'done': 'done',
            };
            return {
              ...task,
              status: statusMap[columnId] || 'not-started',
              progress: columnId === 'done' ? 100 : (columnId === 'in_progress' ? 50 : 0)
            };
          }
          return task;
        });
        
        return {
          ...prev,
          [projectId]: updatedTasks
        };
      });
      
      return true;
    } catch (err) {
      console.error('❌ Erro ao mover tarefa:', err);
      setError(err instanceof Error ? err.message : 'Erro ao mover tarefa');
      return false;
    }
  }, [isAuthenticated, user?.id]);

  // Carregar projetos ao montar ou quando o usuário mudar
  useEffect(() => {
    if (isAuthenticated && user) {
      loadProjects().then(loadedProjects => {
        if (loadedProjects.length > 0 && !currentProject) {
          const firstProject = loadedProjects[0];
          if (firstProject) {
            setCurrentProject(firstProject);
            setActiveTab("kanbanBoard");
            loadProjectTasks(firstProject.id);
          }
        }
      });
    } else if (!isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, user, loadProjects, loadProjectTasks, currentProject]);

  // Carregar tarefas quando o projeto atual mudar
  useEffect(() => {
    if (currentProject && isAuthenticated) {
      loadProjectTasks(currentProject.id);
    }
  }, [currentProject, isAuthenticated, loadProjectTasks]);

  return {
    // State
    projects,
    tasksByProject,
    currentProject,
    activeTab,
    loading,
    error,
    
    // Setters
    setProjects,
    setTasksByProject,
    setCurrentProject,
    setActiveTab,
    
    // API methods
    loadProjects,
    loadProjectTasks,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    moveTask,
    
    // Utils
    isAuthenticated
  };
}