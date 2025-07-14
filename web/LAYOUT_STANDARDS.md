# Layout Standards - Deep Flow Web

## Visão Geral
Este documento define os padrões de layout e design utilizados no projeto Deep Flow Web para garantir consistência visual em todas as páginas.

## Tema Dark (Kortex-inspired)

### Cores Base
- **Background Principal**: `#0a0a0a` - Preto profundo
- **Glassmorphism**: `bg-white/[0.05]` com `backdrop-blur-md` ou `backdrop-blur-sm`
- **Bordas**: `border-white/10` (padrão) ou `border-white/20` (hover/active)
- **Texto**: 
  - Principal: `text-gray-100` ou `text-white`
  - Secundário: `text-gray-300` ou `text-gray-400`
  - Desabilitado: `text-gray-500`

### Componentes

#### Sidebar
- **Largura**: `w-12` (48px) no desktop
- **Botões**: `w-9 h-9` (36px) com ícones `w-4 h-4` (16px)
- **Padding**: `px-1.5 py-2` para nav, gaps de `gap-1.5`
- **Mobile**: `w-64` (256px) com animação slide-in

#### Cards e Containers
```css
/* Padrão para cards com glassmorphism */
className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-xl"

/* Hover state */
className="hover:bg-white/[0.08] hover:border-white/20"
```

#### Botões
```css
/* Botão ghost padrão */
className="bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] text-gray-300"

/* Botão primário */
className="bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30 text-blue-400"

/* Botão danger */
className="bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400"
```

#### Inputs
```css
className="bg-white/[0.05] border-white/10 text-gray-100 placeholder:text-gray-500 focus:border-white/20"
```

### Layout Structure

#### Main Layout
```tsx
<div className="bg-[#0a0a0a] text-foreground min-h-screen">
  <AppSidebar />
  <div className="h-screen flex flex-col lg:pl-12 overflow-hidden">
    <AppHeader />
    <main className="flex-1">
      {/* Conteúdo */}
    </main>
  </div>
</div>
```

#### Páginas Full Height
Páginas como `/chat` e `/projects` usam altura total:
```tsx
const fullHeightPages = ['/projects', '/chat'];
```

### Responsividade

#### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px  
- Desktop: > 1024px

#### Abreviações Mobile
Botões devem ter versões abreviadas para mobile:
```tsx
<span className="hidden sm:inline">Acadêmico</span>
<span className="sm:hidden">Acadêm.</span>
```

### Animações
- Transições: `transition-all duration-300` ou `duration-200`
- Hover: Sempre incluir estados hover com mudanças sutis de opacidade/cor
- Mobile sidebar: Usar Framer Motion com spring animation

## Checklist para Novos Componentes

- [ ] Usar background `#0a0a0a` como base
- [ ] Aplicar glassmorphism em cards e containers
- [ ] Usar bordas `white/10` com hover `white/20`
- [ ] Seguir padrão de cores de texto (gray-100/300/400/500)
- [ ] Incluir estados hover em todos elementos interativos
- [ ] Testar responsividade em mobile/tablet/desktop
- [ ] Usar tamanhos consistentes de padding/margin
- [ ] Aplicar `rounded-xl` para bordas arredondadas

## Exemplos de Implementação

Ver implementações de referência em:
- `/src/app/(with-sidebar)/chat/` - Layout com painel duplo e glassmorphism
- `/src/components/jarvis/app-sidebar-optimized.tsx` - Sidebar responsiva
- `/src/app/(with-sidebar)/chat/components/history-panel.tsx` - Painel com tema dark