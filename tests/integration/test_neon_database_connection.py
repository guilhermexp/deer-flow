#!/usr/bin/env python3
"""
Teste de integração para validar conexão com banco de dados Neon
Usa MCP Neon Server para testar diretamente a conexão e operações CRUD
"""

import os
import time

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

pytestmark = pytest.mark.skip(reason="Integration test requires external services")

if False:  # pragma: no cover
    from src.database.models import Conversation, Project, Task, User


class TestNeonDatabaseConnection:
    """Teste de conexão e operações com banco de dados Neon"""

    def __init__(self):
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://neondb_owner:npg_yEmBN5tG1dPc@ep-nameless-bonus-ad34rj3g-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
        )
        self.engine = None
        self.session = None

    def setup_connection(self):
        """Configurar conexão com banco de dados"""
        try:
            print("🔧 Configurando conexão com banco de dados Neon...")
            self.engine = create_engine(self.database_url)
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            self.session = SessionLocal()
            
            # Testar conexão básica
            result = self.session.execute(text("SELECT 1")).scalar()
            assert result == 1, "Falha na conexão básica"
            
            print("✅ Conexão estabelecida com sucesso!")
            return True
            
        except Exception as e:
            print(f"❌ Erro na conexão: {e}")
            return False

    def test_database_connection(self):
        """Testar conexão básica com banco de dados"""
        print("\n🔍 Testando conexão básica...")
        
        try:
            # Verificar se estamos conectados ao PostgreSQL
            result = self.session.execute(text("SELECT version()")).scalar()
            print(f"✅ Versão do PostgreSQL: {result[:50]}...")
            
            # Verificar database atual
            db_name = self.session.execute(text("SELECT current_database()")).scalar()
            print(f"✅ Database atual: {db_name}")
            
            # Verificar usuário
            user = self.session.execute(text("SELECT current_user")).scalar()
            print(f"✅ Usuário atual: {user}")
            
            return True
            
        except Exception as e:
            print(f"❌ Erro ao testar conexão: {e}")
            return False

    def test_tables_exist(self):
        """Testar se todas as tabelas foram criadas"""
        print("\n📋 Verificando tabelas criadas...")
        
        expected_tables = [
            'users', 'projects', 'tasks', 'conversations', 
            'calendar_events', 'health_data', 'reminders'
        ]
        
        try:
            # Listar tabelas existentes
            result = self.session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """)).fetchall()
            
            existing_tables = [row[0] for row in result]
            print(f"✅ Tabelas encontradas: {', '.join(existing_tables)}")
            
            # Verificar se todas as tabelas esperadas existem
            missing_tables = []
            for table in expected_tables:
                if table in existing_tables:
                    print(f"   ✅ {table}")
                else:
                    print(f"   ❌ {table} (faltando)")
                    missing_tables.append(table)
            
            if missing_tables:
                print(f"❌ Tabelas faltando: {', '.join(missing_tables)}")
                return False
            
            print("✅ Todas as tabelas esperadas foram encontradas!")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao verificar tabelas: {e}")
            return False

    def test_user_crud_operations(self):
        """Testar operações CRUD na tabela users"""
        print("\n👤 Testando operações CRUD na tabela users...")
        
        try:
            # Create - Criar usuário de teste
            test_user = User(
                email=f"test_{int(time.time())}@example.com",
                username=f"testuser_{int(time.time())}",
                clerk_id=f"clerk_test_{int(time.time())}",
                is_active=True
            )
            
            self.session.add(test_user)
            self.session.commit()
            self.session.refresh(test_user)
            
            print(f"✅ Usuário criado: ID={test_user.id}, Email={test_user.email}")
            
            # Read - Ler usuário
            retrieved_user = self.session.query(User).filter(User.id == test_user.id).first()
            assert retrieved_user is not None, "Usuário não encontrado"
            assert retrieved_user.email == test_user.email, "Email não corresponde"
            print(f"✅ Usuário recuperado: {retrieved_user.email}")
            
            # Update - Atualizar usuário
            retrieved_user.username = "updated_username"
            self.session.commit()
            self.session.refresh(retrieved_user)
            
            assert retrieved_user.username == "updated_username", "Update falhou"
            print(f"✅ Usuário atualizado: username={retrieved_user.username}")
            
            # Delete - Deletar usuário
            self.session.delete(retrieved_user)
            self.session.commit()
            
            deleted_user = self.session.query(User).filter(User.id == test_user.id).first()
            assert deleted_user is None, "Delete falhou"
            print("✅ Usuário deletado com sucesso!")
            
            return True
            
        except Exception as e:
            print(f"❌ Erro nas operações CRUD: {e}")
            self.session.rollback()
            return False

    def test_project_crud_operations(self):
        """Testar operações CRUD na tabela projects"""
        print("\n📁 Testando operações CRUD na tabela projects...")
        
        try:
            # Primeiro criar um usuário para associar ao projeto
            test_user = User(
                email=f"project_test_{int(time.time())}@example.com",
                username=f"projectuser_{int(time.time())}",
                clerk_id=f"clerk_project_{int(time.time())}",
                is_active=True
            )
            self.session.add(test_user)
            self.session.commit()
            self.session.refresh(test_user)
            
            # Create - Criar projeto
            test_project = Project(
                user_id=test_user.id,
                name="Projeto de Teste",
                description="Descrição do projeto de teste",
                color="#FF5722",
                icon="test",
                status="active"
            )
            
            self.session.add(test_project)
            self.session.commit()
            self.session.refresh(test_project)
            
            print(f"✅ Projeto criado: ID={test_project.id}, Nome={test_project.name}")
            
            # Read - Ler projeto com relacionamento
            retrieved_project = self.session.query(Project).filter(Project.id == test_project.id).first()
            assert retrieved_project is not None, "Projeto não encontrado"
            assert retrieved_project.user_id == test_user.id, "Relacionamento incorreto"
            print(f"✅ Projeto recuperado: {retrieved_project.name} (User: {retrieved_project.user.email})")
            
            # Update - Atualizar projeto
            retrieved_project.name = "Projeto Atualizado"
            retrieved_project.status = "completed"
            self.session.commit()
            self.session.refresh(retrieved_project)
            
            assert retrieved_project.name == "Projeto Atualizado", "Update falhou"
            print(f"✅ Projeto atualizado: {retrieved_project.name}")
            
            # Delete - Deletar projeto e usuário
            self.session.delete(retrieved_project)
            self.session.delete(test_user)
            self.session.commit()
            
            print("✅ Projeto e usuário de teste deletados!")
            return True
            
        except Exception as e:
            print(f"❌ Erro nas operações CRUD de projetos: {e}")
            self.session.rollback()
            return False

    def test_constraints_and_indexes(self):
        """Testar constraints e índices"""
        print("\n🔒 Testando constraints e índices...")
        
        try:
            # Testar unique constraint em email
            user1 = User(
                email="duplicate@test.com",
                username="user1",
                clerk_id="clerk1",
                is_active=True
            )
            self.session.add(user1)
            self.session.commit()
            
            # Tentar criar outro usuário com mesmo email (deve falhar)
            user2 = User(
                email="duplicate@test.com",  # Mesmo email
                username="user2",
                clerk_id="clerk2",
                is_active=True
            )
            self.session.add(user2)
            
            try:
                self.session.commit()
                print("❌ Unique constraint não funcionou!")
                return False
            except Exception:
                print("✅ Unique constraint em email funcionou!")
                self.session.rollback()
            
            # Limpar
            self.session.delete(user1)
            self.session.commit()
            
            # Verificar índices
            indexes = self.session.execute(text("""
                SELECT indexname, tablename 
                FROM pg_indexes 
                WHERE schemaname = 'public' 
                AND tablename IN ('users', 'projects', 'tasks')
                ORDER BY tablename, indexname
            """)).fetchall()
            
            print(f"✅ Índices encontrados:")
            for idx in indexes:
                print(f"   - {idx[0]} na tabela {idx[1]}")
            
            return True
            
        except Exception as e:
            print(f"❌ Erro ao testar constraints: {e}")
            self.session.rollback()
            return False

    def test_enum_types(self):
        """Testar tipos ENUM criados"""
        print("\n🏷️ Testando tipos ENUM...")
        
        try:
            # Verificar se os tipos ENUM foram criados
            enum_types = self.session.execute(text("""
                SELECT typname 
                FROM pg_type 
                WHERE typtype = 'e' 
                AND typname IN ('taskstatus', 'taskpriority')
            """)).fetchall()
            
            enum_names = [row[0] for row in enum_types]
            print(f"✅ Tipos ENUM encontrados: {', '.join(enum_names)}")
            
            # Verificar valores dos enums
            if 'taskstatus' in enum_names:
                status_values = self.session.execute(text("""
                    SELECT enumlabel 
                    FROM pg_enum 
                    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'taskstatus')
                    ORDER BY enumsortorder
                """)).fetchall()
                
                statuses = [row[0] for row in status_values]
                print(f"✅ Valores de taskstatus: {', '.join(statuses)}")
            
            if 'taskpriority' in enum_names:
                priority_values = self.session.execute(text("""
                    SELECT enumlabel 
                    FROM pg_enum 
                    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'taskpriority')
                    ORDER BY enumsortorder
                """)).fetchall()
                
                priorities = [row[0] for row in priority_values]
                print(f"✅ Valores de taskpriority: {', '.join(priorities)}")
            
            return True
            
        except Exception as e:
            print(f"❌ Erro ao testar ENUMs: {e}")
            return False

    def cleanup(self):
        """Limpar recursos"""
        try:
            if self.session:
                self.session.close()
            if self.engine:
                self.engine.dispose()
            print("🧹 Recursos limpos com sucesso!")
        except Exception as e:
            print(f"⚠️ Erro ao limpar recursos: {e}")

    def run_all_tests(self):
        """Executar todos os testes"""
        print("🚀 Iniciando testes de integração com banco de dados Neon")
        print("=" * 60)
        
        # Configurar conexão
        if not self.setup_connection():
            return False
        
        # Lista de testes
        tests = [
            ("Conexão Básica", self.test_database_connection),
            ("Verificação de Tabelas", self.test_tables_exist),
            ("Operações CRUD - Users", self.test_user_crud_operations),
            ("Operações CRUD - Projects", self.test_project_crud_operations),
            ("Constraints e Índices", self.test_constraints_and_indexes),
            ("Tipos ENUM", self.test_enum_types),
        ]
        
        # Executar testes
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                print(f"\n🧪 Executando: {test_name}")
                if test_func():
                    passed += 1
                    print(f"✅ {test_name} - PASSOU")
                else:
                    failed += 1
                    print(f"❌ {test_name} - FALHOU")
            except Exception as e:
                failed += 1
                print(f"❌ {test_name} - FALHOU com exceção: {e}")
        
        # Resumo
        print("\n" + "=" * 60)
        print("📊 RESUMO DOS TESTES")
        print(f"✅ Testes aprovados: {passed}")
        print(f"❌ Testes falharam: {failed}")
        print(f"📈 Taxa de sucesso: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("🎉 Todos os testes passaram! O banco de dados Neon está funcionando perfeitamente.")
            success = True
        else:
            print("⚠️ Alguns testes falharam. Verifique os logs acima.")
            success = False
        
        # Limpar
        self.cleanup()
        return success


def main():
    """Função principal"""
    tester = TestNeonDatabaseConnection()
    success = tester.run_all_tests()
    exit(0 if success else 1)


if __name__ == "__main__":
    main()
