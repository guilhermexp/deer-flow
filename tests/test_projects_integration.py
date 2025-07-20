#!/usr/bin/env python3
"""
Teste de integração para API de projetos
Verifica se a funcionalidade completa está funcionando: autenticação, CRUD de projetos e kanban board
"""

import pytest
import requests
import json
from datetime import datetime


class TestProjectsIntegration:
    BASE_URL = "http://localhost:9090/api"

    def __init__(self):
        self.access_token = None
        self.user_data = None
        self.test_project_id = None
        self.test_task_id = None

    def setup_test_user(self):
        """Criar usuário de teste e fazer login"""
        # Dados do usuário de teste
        test_user = {
            "username": f"testuser_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "email": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@exemplo.com",
            "password": "testpassword123",
        }

        # Registrar usuário
        print("🔐 Registrando usuário de teste...")
        register_response = requests.post(
            f"{self.BASE_URL}/auth/register", json=test_user
        )

        if register_response.status_code != 200:
            print(f"❌ Erro ao registrar usuário: {register_response.status_code}")
            print(f"Resposta: {register_response.text}")
            return False

        print(f"✅ Usuário registrado: {test_user['username']}")

        # Fazer login
        print("🔑 Fazendo login...")
        login_data = {
            "username": test_user["username"],
            "password": test_user["password"],
        }

        login_response = requests.post(
            f"{self.BASE_URL}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if login_response.status_code != 200:
            print(f"❌ Erro ao fazer login: {login_response.status_code}")
            print(f"Resposta: {login_response.text}")
            return False

        login_result = login_response.json()
        self.access_token = login_result["access_token"]
        print(f"✅ Login realizado com sucesso")

        # Verificar usuário atual
        headers = {"Authorization": f"Bearer {self.access_token}"}
        user_response = requests.get(f"{self.BASE_URL}/auth/me", headers=headers)

        if user_response.status_code != 200:
            print(f"❌ Erro ao verificar usuário: {user_response.status_code}")
            return False

        self.user_data = user_response.json()
        print(f"✅ Usuário autenticado: {self.user_data['email']}")
        return True

    def test_create_project(self):
        """Teste: Criar projeto"""
        print("\n📁 Testando criação de projeto...")

        project_data = {
            "name": "Projeto de Teste",
            "description": "Um projeto criado para testes de integração",
            "color": "#FF5722",
            "icon": "test",
            "status": "active",
        }

        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.post(
            f"{self.BASE_URL}/projects/", json=project_data, headers=headers
        )

        if response.status_code != 200:
            print(f"❌ Erro ao criar projeto: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False

        project = response.json()
        self.test_project_id = project["id"]

        print(f"✅ Projeto criado com sucesso!")
        print(f"   ID: {project['id']}")
        print(f"   Nome: {project['name']}")
        print(f"   Descrição: {project['description']}")
        return True

    def test_get_projects(self):
        """Teste: Listar projetos"""
        print("\n📋 Testando listagem de projetos...")

        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(f"{self.BASE_URL}/projects/", headers=headers)

        if response.status_code != 200:
            print(f"❌ Erro ao listar projetos: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False

        projects = response.json()
        print(f"✅ Projetos listados com sucesso! Total: {len(projects)}")

        for project in projects:
            print(f"   - {project['name']} (ID: {project['id']})")

        return len(projects) > 0

    def test_get_kanban_board(self):
        """Teste: Obter quadro kanban"""
        print(f"\n📊 Testando quadro kanban do projeto {self.test_project_id}...")

        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(
            f"{self.BASE_URL}/projects/{self.test_project_id}/kanban", headers=headers
        )

        if response.status_code != 200:
            print(f"❌ Erro ao obter kanban: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False

        kanban = response.json()
        print(f"✅ Quadro kanban obtido com sucesso!")
        print(f"   Projeto: {kanban['project_name']}")
        print(f"   Colunas: {len(kanban['columns'])}")

        for column in kanban["columns"]:
            print(f"   - {column['title']}: {len(column['tasks'])} tarefas")

        return True

    def test_create_task(self):
        """Teste: Criar tarefa no kanban"""
        print(f"\n✏️ Testando criação de tarefa no projeto {self.test_project_id}...")

        task_data = {
            "title": "Tarefa de Teste",
            "description": "Uma tarefa criada para testes de integração",
            "priority": "high",
        }

        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.post(
            f"{self.BASE_URL}/projects/{self.test_project_id}/tasks?column_id=todo",
            json=task_data,
            headers=headers,
        )

        if response.status_code != 200:
            print(f"❌ Erro ao criar tarefa: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False

        task = response.json()
        self.test_task_id = task["id"]

        print(f"✅ Tarefa criada com sucesso!")
        print(f"   ID: {task['id']}")
        print(f"   Título: {task['title']}")
        print(f"   Prioridade: {task['priority']}")
        return True

    def test_move_task(self):
        """Teste: Mover tarefa entre colunas"""
        print(f"\n🔄 Testando movimentação da tarefa {self.test_task_id}...")

        move_data = {"column_id": "in_progress", "order": 1}

        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.put(
            f"{self.BASE_URL}/projects/{self.test_project_id}/tasks/{self.test_task_id}/move",
            json=move_data,
            headers=headers,
        )

        if response.status_code != 200:
            print(f"❌ Erro ao mover tarefa: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False

        task = response.json()
        print(f"✅ Tarefa movida com sucesso!")
        print(f"   ID: {task['id']}")
        print(f"   Título: {task['title']}")
        return True

    def test_update_project(self):
        """Teste: Atualizar projeto"""
        print(f"\n✏️ Testando atualização do projeto {self.test_project_id}...")

        update_data = {
            "name": "Projeto de Teste - Atualizado",
            "description": "Descrição atualizada para teste",
        }

        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.put(
            f"{self.BASE_URL}/projects/{self.test_project_id}",
            json=update_data,
            headers=headers,
        )

        if response.status_code != 200:
            print(f"❌ Erro ao atualizar projeto: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False

        project = response.json()
        print(f"✅ Projeto atualizado com sucesso!")
        print(f"   Nome: {project['name']}")
        print(f"   Descrição: {project['description']}")
        return True

    def test_delete_project(self):
        """Teste: Deletar projeto"""
        print(f"\n🗑️ Testando exclusão do projeto {self.test_project_id}...")

        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.delete(
            f"{self.BASE_URL}/projects/{self.test_project_id}", headers=headers
        )

        if response.status_code != 200:
            print(f"❌ Erro ao deletar projeto: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False

        result = response.json()
        print(f"✅ Projeto deletado com sucesso!")
        print(f"   Mensagem: {result['message']}")
        return True

    def run_all_tests(self):
        """Executar todos os testes"""
        print("🚀 Iniciando testes de integração da API de Projetos")
        print("=" * 60)

        # Configurar usuário de teste
        if not self.setup_test_user():
            print("❌ Falha na configuração do usuário de teste")
            return False

        # Lista de testes
        tests = [
            ("Criar Projeto", self.test_create_project),
            ("Listar Projetos", self.test_get_projects),
            ("Obter Kanban Board", self.test_get_kanban_board),
            ("Criar Tarefa", self.test_create_task),
            ("Mover Tarefa", self.test_move_task),
            ("Atualizar Projeto", self.test_update_project),
            ("Deletar Projeto", self.test_delete_project),
        ]

        # Executar testes
        passed = 0
        failed = 0

        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
                    print(f"❌ Teste '{test_name}' falhou")
            except Exception as e:
                failed += 1
                print(f"❌ Teste '{test_name}' falhou com exceção: {e}")

        # Resumo
        print("\n" + "=" * 60)
        print("📊 RESUMO DOS TESTES")
        print(f"✅ Testes aprovados: {passed}")
        print(f"❌ Testes falharam: {failed}")
        print(f"📈 Taxa de sucesso: {(passed/(passed+failed)*100):.1f}%")

        if failed == 0:
            print("🎉 Todos os testes passaram! A API está funcionando corretamente.")
            return True
        else:
            print("⚠️ Alguns testes falharam. Verifique os logs acima.")
            return False


def main():
    """Função principal"""
    tester = TestProjectsIntegration()
    success = tester.run_all_tests()
    exit(0 if success else 1)


if __name__ == "__main__":
    main()
