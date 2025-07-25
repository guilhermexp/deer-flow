import { getSupabaseClient } from "~/lib/supabase/client"

/**
 * Serviço centralizado para verificação e setup do banco de dados
 */
export const setupService = {
  // Lista de tabelas necessárias
  requiredTables: [
    'user_profiles',
    'notes',
    'note_sessions',
    'note_messages',
    'health_data',
    'health_metrics',
    'calendar_events',
    'projects',
    'tasks'
  ],

  // Cache de verificação de tabelas
  tablesChecked: false,
  tableStatus: new Map<string, boolean>(),

  /**
   * Verifica se uma tabela existe
   */
  async checkTableExists(tableName: string): Promise<boolean> {
    // Se já verificamos, usar cache
    if (this.tablesChecked && this.tableStatus.has(tableName)) {
      return this.tableStatus.get(tableName) ?? false;
    }

    const supabase = getSupabaseClient();
    
    try {
      const { error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);
      
      const exists = !error;
      this.tableStatus.set(tableName, exists);
      return exists;
    } catch (error) {
      console.error(`Erro ao verificar tabela ${tableName}:`, error);
      this.tableStatus.set(tableName, false);
      return false;
    }
  },

  /**
   * Verifica todas as tabelas necessárias
   */
  async checkAllTables(): Promise<{ 
    allExist: boolean, 
    missing: string[], 
    existing: string[] 
  }> {
    const missing: string[] = [];
    const existing: string[] = [];

    for (const table of this.requiredTables) {
      const exists = await this.checkTableExists(table);
      if (exists) {
        existing.push(table);
      } else {
        missing.push(table);
      }
    }

    this.tablesChecked = true;

    return {
      allExist: missing.length === 0,
      missing,
      existing
    };
  },

  /**
   * Verifica se o usuário está autenticado
   */
  async checkAuth(): Promise<boolean> {
    const supabase = getSupabaseClient();
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return !error && !!session;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  },

  /**
   * Verifica se o setup do banco está completo
   */
  async checkSetup(): Promise<{
    isComplete: boolean,
    issues: string[],
    recommendations: string[]
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Verificar autenticação
    const isAuthenticated = await this.checkAuth();
    if (!isAuthenticated) {
      issues.push('Usuário não autenticado');
      recommendations.push('Faça login ou crie uma conta');
    }

    // Verificar tabelas
    const { allExist, missing } = await this.checkAllTables();
    if (!allExist) {
      issues.push(`Tabelas faltando: ${missing.join(', ')}`);
      recommendations.push('Execute o script de setup: cd web && node scripts/setup-supabase-complete.js');
      recommendations.push('Ou execute o SQL no painel do Supabase');
    }

    return {
      isComplete: issues.length === 0,
      issues,
      recommendations
    };
  },

  /**
   * Mensagem de setup para o console
   */
  getSetupInstructions(): string {
    return `
🚀 Setup do Banco de Dados DeerFlow

Para configurar o banco de dados:

1. Certifique-se de ter configurado o arquivo .env com:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

2. Execute o script de setup automático:
   cd web
   node scripts/setup-supabase-complete.js

3. Ou manualmente no Supabase:
   - Acesse o SQL Editor no painel do Supabase
   - Execute o conteúdo do arquivo:
     web/scripts/create-supabase-tables.sql

4. Crie uma conta em /register

5. Pronto! A aplicação está configurada.

Para verificar o status do setup, acesse: /test-supabase
`;
  },

  /**
   * Cria dados de exemplo para teste
   */
  async createSampleData(userId: string): Promise<void> {
    const supabase = getSupabaseClient();

    try {
      // Criar nota de exemplo
      const { error: noteError } = await supabase
        .from('notes')
        .insert({
          title: 'Nota de Exemplo',
          content: 'Esta é uma nota de exemplo criada automaticamente.',
          source: 'Arquivos',
          user_id: userId,
          metadata: {
            tags: ['exemplo', 'teste'],
            mediaType: 'file'
          }
        });

      if (noteError) {
        console.error('Erro ao criar nota de exemplo:', noteError);
      }

      // Criar dados de saúde de exemplo
      const today = new Date().toISOString().split('T')[0];
      const { error: healthError } = await supabase
        .from('health_data')
        .insert({
          user_id: userId,
          date: today,
          health_score: 85,
          hydration_ml: 1200,
          hydration_goal_ml: 2000,
          sleep_hours: 7.5,
          sleep_quality: 4,
          blood_pressure_systolic: 120,
          blood_pressure_diastolic: 80,
          pulse: 72,
          workouts_completed: 2,
          workouts_goal: 5,
          medications: [
            { name: 'Vitamina D', dosage: '1000 UI', time: '08:00', taken: true }
          ]
        });

      if (healthError && !healthError.message.includes('duplicate')) {
        console.error('Erro ao criar dados de saúde de exemplo:', healthError);
      }

      // Criar projeto de exemplo
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: 'Projeto de Exemplo',
          description: 'Um projeto de exemplo para começar',
          color: '#3B82F6',
          icon: '📁',
          user_id: userId
        })
        .select()
        .single();

      if (projectError) {
        console.error('Erro ao criar projeto de exemplo:', projectError);
      } else if (project) {
        // Criar tarefa de exemplo
        const { error: taskError } = await supabase
          .from('tasks')
          .insert({
            project_id: project.id,
            title: 'Primeira Tarefa',
            description: 'Esta é sua primeira tarefa!',
            status: 'TODO',
            priority: 'medium',
            user_id: userId
          });

        if (taskError) {
          console.error('Erro ao criar tarefa de exemplo:', taskError);
        }
      }

      console.log('✅ Dados de exemplo criados com sucesso!');
    } catch (error) {
      console.error('Erro ao criar dados de exemplo:', error);
    }
  }
};