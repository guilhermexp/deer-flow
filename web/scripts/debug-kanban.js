// Debug script para o Kanban - execute isso no console do navegador

console.log('=== KANBAN DEBUG ===');

// Verificar todos os dados do localStorage
const projects = JSON.parse(localStorage.getItem('kanban-projects-v2') || '[]');
const tasksByProject = JSON.parse(localStorage.getItem('kanban-tasksByProject-v2') || '{}');
const lastActiveProject = localStorage.getItem('kanban-lastActiveProject-v2');
const lastActiveTab = localStorage.getItem('kanban-lastActiveTab-v2');

console.log('Projects:', projects);
console.log('Tasks by Project:', tasksByProject);
console.log('Last Active Project:', lastActiveProject);
console.log('Last Active Tab:', lastActiveTab);

// Contar tarefas por projeto
Object.entries(tasksByProject).forEach(([projectId, tasks]) => {
  console.log(`Project ${projectId}: ${tasks.length} tasks`);
});

// Função para resetar o Kanban com dados de exemplo
window.resetKanban = function() {
  // Criar projeto padrão
  const defaultProject = {
    id: 'default-project-1',
    name: 'Meu Projeto',
    description: 'Projeto de exemplo',
    createdAt: new Date().toISOString(),
    isPriority: false
  };
  
  // Criar tarefas de exemplo
  const defaultTasks = [
    {
      id: 'task-1',
      title: 'Configurar ambiente de desenvolvimento',
      date: new Date().toLocaleDateString('pt-BR'),
      progress: 30,
      status: 'not-started',
      comments: 2,
      attachments: 1,
      assignees: [{
        name: 'João',
        initials: 'J',
        avatar: null
      }]
    },
    {
      id: 'task-2',
      title: 'Implementar autenticação',
      date: new Date().toLocaleDateString('pt-BR'),
      progress: 60,
      status: 'in-progress',
      comments: 5,
      attachments: 3,
      assignees: [{
        name: 'Maria',
        initials: 'M',
        avatar: null
      }]
    },
    {
      id: 'task-3',
      title: 'Criar testes unitários',
      date: new Date().toLocaleDateString('pt-BR'),
      progress: 0,
      status: 'paused',
      comments: 1,
      attachments: 0,
      assignees: []
    },
    {
      id: 'task-4',
      title: 'Deploy para produção',
      date: new Date().toLocaleDateString('pt-BR'),
      progress: 100,
      status: 'done',
      comments: 8,
      attachments: 2,
      assignees: [{
        name: 'Pedro',
        initials: 'P',
        avatar: null
      }]
    }
  ];
  
  // Salvar no localStorage
  localStorage.setItem('kanban-projects-v2', JSON.stringify([defaultProject]));
  localStorage.setItem('kanban-tasksByProject-v2', JSON.stringify({
    [defaultProject.id]: defaultTasks
  }));
  localStorage.setItem('kanban-lastActiveProject-v2', defaultProject.id);
  localStorage.setItem('kanban-lastActiveTab-v2', 'kanbanBoard');
  
  console.log('Kanban resetado com dados de exemplo!');
  console.log('Recarregue a página para ver as mudanças.');
};

console.log('\nPara resetar o Kanban com dados de exemplo, execute: resetKanban()');