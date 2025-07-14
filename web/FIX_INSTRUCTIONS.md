# Instruções de Correção - DeerFlow

## ✅ Correções Já Aplicadas

### 1. Página de Chat (`/app/(with-sidebar)/chat/page.tsx`)
- ✅ Removida sidebar deer-flow duplicada
- ✅ Removido header customizado
- ✅ Removido layout manual (ml-14)
- ✅ HistoryPanel integrado corretamente

### 2. Página Home (`/app/(with-sidebar)/home/page.tsx`)
- ✅ Removido SiteHeader duplicado
- ✅ Ajustado espaçamento responsivo

## 🔧 Próximas Correções Necessárias

### 1. Remover Sidebar Antiga
- **Arquivo:** `~/components/deer-flow/sidebar.tsx`
- **Ação:** Pode ser deletado após garantir que não há mais referências

### 2. Padronizar Rotas
- **Problema:** Conflito entre `/` e `/home`
- **Solução Sugerida:** 
  - Manter `/home` como padrão (já implementado no redirect)
  - Atualizar qualquer referência à rota `/` para `/home`

### 3. Verificar e Corrigir Outras Páginas
Páginas que precisam ser verificadas:
- `/calendar/page.tsx`
- `/dashboard/page.tsx`
- `/projects/page.tsx`
- `/notes/page.tsx`
- `/health/page.tsx`
- `/settings/page.tsx`

### 4. Unificar Estilos CSS
- Mesclar `globals.css` e `jarvis-globals.css`
- Remover classes duplicadas
- Estabelecer convenções de nomenclatura

### 5. Limpar Imports
Procurar e substituir todos os imports que ainda referenciam:
- `~/components/deer-flow/sidebar`
- Qualquer outro componente deer-flow duplicado

### 6. Verificar Componentes Duplicados
- `site-header.tsx` (deer-flow) vs `app-header.tsx` (jarvis)
- Outros possíveis componentes duplicados

## 📝 Checklist de Validação

- [ ] Todas as páginas usam o mesmo layout
- [ ] Apenas uma sidebar é renderizada
- [ ] Headers não são duplicados
- [ ] Navegação funciona corretamente
- [ ] Estilos são consistentes
- [ ] Não há imports de componentes antigos
- [ ] Layout é responsivo em todas as telas

## 🎯 Objetivo Final

Um sistema unificado onde:
- Todas as páginas seguem o padrão (with-sidebar)
- Componentes jarvis são usados consistentemente
- Não há duplicação de elementos UI
- Design system é coeso e profissional
