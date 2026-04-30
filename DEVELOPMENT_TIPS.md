# Dicas de Desenvolvimento

## 🎯 Boas Práticas

### 1. Commits
Use conventional commits:
```bash
feat: adiciona calendário de escalas
fix: corrige bug no login
docs: atualiza README
style: formata código
refactor: refatora service de equipes
test: adiciona testes para teamService
chore: atualiza dependências
```

### 2. Branches
```bash
main              # Produção
develop           # Desenvolvimento
feature/nome      # Nova funcionalidade
fix/nome          # Correção de bug
hotfix/nome       # Correção urgente
```

### 3. Pull Requests
- Título descritivo
- Descrição detalhada
- Screenshots (se UI)
- Testes realizados
- Checklist de verificação

## 🔧 Comandos Úteis

### Desenvolvimento
```bash
# Iniciar servidor
npm run dev

# Build
npm run build

# Preview da build
npm run preview

# Verificar tipos
npm run type-check

# Lint
npm run lint

# Lint e corrigir
npm run lint:fix

# Formatar código
npm run format
```

### Supabase
```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Iniciar local
supabase start

# Parar local
supabase stop

# Migrations
supabase db diff -f nome_da_migration
supabase db push
```

### Git
```bash
# Status
git status

# Adicionar arquivos
git add .

# Commit
git commit -m "feat: nova funcionalidade"

# Push
git push

# Pull
git pull

# Criar branch
git checkout -b feature/nome

# Mudar branch
git checkout main

# Merge
git merge feature/nome

# Stash
git stash
git stash pop
```

## 🐛 Debug

### React DevTools
1. Instale a extensão React DevTools
2. Abra F12 > Components
3. Inspecione componentes e props

### TanStack Query DevTools
Já incluído no projeto:
- Aparece no canto inferior da tela
- Mostra queries ativas
- Cache state
- Refetch manual

### Supabase Logs
No dashboard do Supabase:
1. Vá em "Logs"
2. Filtre por tipo (API, Auth, Database)
3. Veja erros em tempo real

### Console do Navegador
```javascript
// Ver estado do Zustand
console.log(useAuthStore.getState())

// Ver queries do TanStack
console.log(queryClient.getQueryCache())

// Ver dados do Supabase
console.log(supabase.auth.getSession())
```

## 🎨 Estilização

### TailwindCSS
```tsx
// Classes utilitárias
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Hover e estados
<button className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700">

// Dark mode (quando implementado)
<div className="bg-white dark:bg-gray-800">
```

### Cores por Ministério
```tsx
import { getMinistryColor } from '@/lib/permissions'

<Badge className={getMinistryColor('louvor')}>
  Louvor
</Badge>
```

### Componentes Shadcn/UI
```tsx
// Sempre use os componentes do Shadcn
import { Button } from '@/components/ui/button'

// Não use elementos HTML diretamente para UI
// ❌ <button>
// ✅ <Button>
```

## 📝 TypeScript

### Types
```typescript
// Sempre defina types para props
interface MyComponentProps {
  title: string
  count?: number // opcional
  onSave: (data: FormData) => void
}

// Use types do banco
import { Database } from '@/types/database.types'
type Team = Database['public']['Tables']['teams']['Row']

// Estenda types quando necessário
interface TeamWithMembers extends Team {
  members: TeamMember[]
}
```

### Generics
```typescript
// Use generics em funções reutilizáveis
function createService<T>(tableName: string) {
  return {
    async getAll(): Promise<T[]> {
      // ...
    }
  }
}
```

## 🔄 State Management

### Zustand
```typescript
// Criar store
import { create } from 'zustand'

interface MyStore {
  count: number
  increment: () => void
}

export const useMyStore = create<MyStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

// Usar store
const { count, increment } = useMyStore()
```

### TanStack Query
```typescript
// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['teams'],
  queryFn: () => teamService.getTeams(),
})

// Mutation
const mutation = useMutation({
  mutationFn: (data) => teamService.createTeam(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['teams'] })
  },
})
```

## 🔐 Segurança

### Nunca Exponha
```typescript
// ❌ Nunca
const API_KEY = 'minha-chave-secreta'

// ✅ Sempre use variáveis de ambiente
const API_KEY = import.meta.env.VITE_API_KEY
```

### Validação
```typescript
// Use Zod para validação
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// Validar
const result = schema.safeParse(data)
if (!result.success) {
  console.error(result.error)
}
```

### Sanitização
```typescript
// Sanitize inputs
const sanitize = (input: string) => {
  return input.trim().replace(/[<>]/g, '')
}
```

## 🚀 Performance

### Memoização
```typescript
// Memoizar componentes
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* ... */}</div>
})

// Memoizar valores
const filteredData = useMemo(() => {
  return data.filter(item => item.active)
}, [data])

// Memoizar callbacks
const handleClick = useCallback(() => {
  console.log('clicked')
}, [])
```

### Lazy Loading
```typescript
// Lazy load de páginas
const Dashboard = lazy(() => import('./pages/Dashboard'))

// Usar com Suspense
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

## 📱 Responsividade

### Breakpoints
```typescript
// Tailwind breakpoints
sm: 640px   // @media (min-width: 640px)
md: 768px   // @media (min-width: 768px)
lg: 1024px  // @media (min-width: 1024px)
xl: 1280px  // @media (min-width: 1280px)
2xl: 1536px // @media (min-width: 1536px)
```

### Mobile First
```tsx
// Sempre comece mobile
<div className="
  flex-col        // mobile
  md:flex-row     // tablet+
  lg:gap-8        // desktop+
">
```

## 🧪 Testes (Futuro)

### Unit Tests
```typescript
import { describe, it, expect } from 'vitest'

describe('teamService', () => {
  it('should get teams', async () => {
    const teams = await teamService.getTeams()
    expect(teams).toBeDefined()
  })
})
```

### Component Tests
```typescript
import { render, screen } from '@testing-library/react'

describe('Button', () => {
  it('should render', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

## 📚 Recursos Úteis

### Documentação
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/docs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Shadcn/UI](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query/latest)
- [Supabase](https://supabase.com/docs)
- [Zustand](https://docs.pmnd.rs/zustand)

### Ferramentas
- [VS Code](https://code.visualstudio.com)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Supabase Studio](https://supabase.com/docs/guides/platform/studio)
- [Postman](https://www.postman.com) (para testar APIs)

### Comunidades
- [React Discord](https://discord.gg/react)
- [Supabase Discord](https://discord.supabase.com)
- [Stack Overflow](https://stackoverflow.com)

## 💡 Dicas Extras

### 1. Use Snippets
Configure snippets no VS Code para componentes comuns:
```json
{
  "React Component": {
    "prefix": "rfc",
    "body": [
      "interface ${1:Component}Props {",
      "  $2",
      "}",
      "",
      "export function ${1:Component}({ $3 }: ${1:Component}Props) {",
      "  return (",
      "    <div>$4</div>",
      "  )",
      "}"
    ]
  }
}
```

### 2. Atalhos do VS Code
- `Ctrl+P`: Buscar arquivo
- `Ctrl+Shift+P`: Command palette
- `Ctrl+D`: Selecionar próxima ocorrência
- `Alt+Click`: Múltiplos cursores
- `Ctrl+/`: Comentar linha
- `F2`: Renomear símbolo

### 3. Extensões Recomendadas
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Auto Rename Tag
- ES7+ React/Redux/React-Native snippets
- GitLens

### 4. Organize Imports
```typescript
// Ordem recomendada
// 1. React
import { useState, useEffect } from 'react'

// 2. Bibliotecas externas
import { useQuery } from '@tanstack/react-query'

// 3. Componentes internos
import { Button } from '@/components/ui/button'

// 4. Services
import { teamService } from '@/services/teamService'

// 5. Types
import { Team } from '@/types'

// 6. Utils
import { cn } from '@/lib/utils'
```

### 5. Console Logs
```typescript
// Use console.log estrategicamente
console.log('🔍 Debug:', data)
console.error('❌ Error:', error)
console.warn('⚠️ Warning:', warning)
console.info('ℹ️ Info:', info)

// Remova antes do commit
// Use um linter para detectar console.logs
```

---

**Lembre-se**: Código limpo é melhor que código rápido!
