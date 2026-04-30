# Arquitetura do Sistema

## Visão Geral

Sistema web para gestão de escalas ministeriais desenvolvido com arquitetura moderna e escalável.

## Stack Tecnológico

### Frontend
- **React 18**: Biblioteca UI
- **TypeScript**: Tipagem estática
- **Vite**: Build tool e dev server
- **TailwindCSS**: Framework CSS utility-first
- **Shadcn/UI**: Componentes UI baseados em Radix UI

### Backend (Supabase)
- **PostgreSQL**: Banco de dados relacional
- **Supabase Auth**: Autenticação e autorização
- **Supabase Storage**: Armazenamento de arquivos
- **Row Level Security (RLS)**: Segurança em nível de linha

### State Management
- **Zustand**: Estado global leve e performático
- **TanStack Query**: Cache e sincronização de dados do servidor

### Forms & Validation
- **React Hook Form**: Gerenciamento de formulários
- **Zod**: Validação de schemas

## Estrutura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (Shadcn/UI)
│   ├── layouts/        # Layouts (Sidebar, Header, etc)
│   └── shared/         # Componentes compartilhados
│
├── features/           # Features organizadas por domínio
│   ├── auth/          # Autenticação
│   ├── dashboard/     # Dashboard gerencial
│   ├── teams/         # Gestão de equipes
│   ├── schedules/     # Gestão de escalas
│   ├── worship/       # Módulo de louvor
│   ├── dance/         # Módulo de dança
│   ├── media/         # Módulo de mídia
│   ├── ushers/        # Módulo de obreiros
│   └── cells/         # Módulo de células
│
├── hooks/             # Custom hooks
│   ├── useAuth.ts
│   ├── useTeams.ts
│   └── useSchedules.ts
│
├── lib/               # Configurações e utilitários
│   ├── supabaseClient.ts  # Cliente Supabase
│   ├── permissions.ts     # Lógica de permissões
│   └── utils.ts          # Funções utilitárias
│
├── pages/             # Páginas da aplicação
│   ├── LoginPage.tsx
│   ├── gerencial/
│   ├── worship/
│   ├── dance/
│   ├── media/
│   ├── ushers/
│   └── cells/
│
├── services/          # Services para comunicação com API
│   ├── authService.ts
│   ├── userService.ts
│   ├── teamService.ts
│   ├── scheduleService.ts
│   ├── songService.ts
│   └── cellService.ts
│
├── stores/            # Zustand stores
│   ├── authStore.ts
│   └── uiStore.ts
│
├── types/             # TypeScript types e interfaces
│   ├── database.types.ts
│   └── index.ts
│
└── utils/             # Funções utilitárias
    ├── date.ts
    └── format.ts
```

## Fluxo de Dados

### 1. Autenticação

```
User Input → authService.login()
           → Supabase Auth
           → authStore.setUser()
           → userService.getCurrentUserProfile()
           → authStore.setProfiles()
           → Redirect to Dashboard
```

### 2. Busca de Dados

```
Component → useQuery (TanStack Query)
         → Service (ex: teamService.getTeams())
         → Supabase Client
         → PostgreSQL (com RLS)
         → Cache (TanStack Query)
         → Component Re-render
```

### 3. Mutação de Dados

```
User Action → useMutation (TanStack Query)
           → Service (ex: teamService.createTeam())
           → Supabase Client
           → PostgreSQL (com RLS)
           → Invalidate Cache
           → Refetch Data
           → Component Re-render
```

## Camadas da Aplicação

### 1. Presentation Layer (Components/Pages)
- Componentes React
- Lógica de UI
- Interação com usuário
- Validação de formulários

### 2. Business Logic Layer (Services/Hooks)
- Regras de negócio
- Transformação de dados
- Validações complexas
- Lógica de permissões

### 3. Data Access Layer (Services)
- Comunicação com Supabase
- Queries e mutations
- Tratamento de erros
- Cache management

### 4. Database Layer (Supabase/PostgreSQL)
- Armazenamento de dados
- Row Level Security
- Triggers e functions
- Constraints e validações

## Segurança

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS:

```sql
-- Exemplo: Usuários só veem suas equipes
CREATE POLICY "Membros podem ver suas equipes"
    ON teams FOR SELECT
    USING (
        is_gerencial() OR 
        is_team_leader(id) OR 
        is_team_member(id)
    );
```

### Funções de Segurança

```sql
-- Verifica se usuário é gerencial
CREATE FUNCTION is_gerencial() RETURNS BOOLEAN

-- Verifica se usuário é líder de equipe
CREATE FUNCTION is_team_leader(team_uuid UUID) RETURNS BOOLEAN

-- Verifica se usuário é membro de equipe
CREATE FUNCTION is_team_member(team_uuid UUID) RETURNS BOOLEAN
```

### Frontend Permissions

```typescript
// Verificação de permissões no frontend
const permissions = getTeamPermissions(
  userProfiles,
  teamType,
  isTeamLeader,
  isTeamMember
)

if (permissions.canEdit) {
  // Mostrar botão de editar
}
```

## Padrões de Código

### 1. Naming Conventions

- **Components**: PascalCase (ex: `TeamCard.tsx`)
- **Hooks**: camelCase com prefixo `use` (ex: `useTeams.ts`)
- **Services**: camelCase com sufixo `Service` (ex: `teamService.ts`)
- **Types**: PascalCase (ex: `Team`, `UserProfile`)
- **Constants**: UPPER_SNAKE_CASE (ex: `PROFILE_CODES`)

### 2. Component Structure

```tsx
// 1. Imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 2. Types
interface MyComponentProps {
  title: string
}

// 3. Component
export function MyComponent({ title }: MyComponentProps) {
  // 3.1. Hooks
  const [state, setState] = useState()
  
  // 3.2. Handlers
  const handleClick = () => {}
  
  // 3.3. Render
  return <div>{title}</div>
}
```

### 3. Service Structure

```typescript
export const myService = {
  async getItems() {
    const { data, error } = await supabase
      .from('table')
      .select('*')
    
    if (error) throw error
    return data
  },
  
  async createItem(itemData) {
    // ...
  },
}
```

## Performance

### 1. Code Splitting

```tsx
// Lazy loading de páginas
const WorshipDashboard = lazy(() => import('./pages/worship/WorshipDashboard'))
```

### 2. Memoization

```tsx
// Memoizar componentes pesados
const ExpensiveComponent = memo(({ data }) => {
  // ...
})

// Memoizar valores calculados
const filteredData = useMemo(() => {
  return data.filter(item => item.active)
}, [data])
```

### 3. TanStack Query Cache

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      cacheTime: 1000 * 60 * 10, // 10 minutos
    },
  },
})
```

## Escalabilidade

### 1. Preparado para API Backend

Os services estão estruturados para facilitar migração:

```typescript
// Atual: Supabase direto
export const teamService = {
  async getTeams() {
    return supabase.from('teams').select('*')
  }
}

// Futuro: API .NET
export const teamService = {
  async getTeams() {
    return fetch('/api/teams').then(r => r.json())
  }
}
```

### 2. Modular e Desacoplado

- Features isoladas
- Services independentes
- Components reutilizáveis
- Types compartilhados

### 3. Extensível

Adicionar novo ministério:

1. Criar tipo no banco
2. Adicionar funções
3. Criar página do dashboard
4. Adicionar rota
5. Adicionar cor no tema

## Testing Strategy (Futuro)

### Unit Tests
- Services
- Utilities
- Hooks

### Integration Tests
- Components com hooks
- Forms
- Fluxos completos

### E2E Tests
- Fluxos críticos
- Login
- Criação de escala

## Monitoramento (Futuro)

- Error tracking (Sentry)
- Analytics (Google Analytics)
- Performance monitoring
- User behavior tracking

## CI/CD

### GitHub Actions

```yaml
# Build e deploy automático
on: push to main
  → Install dependencies
  → Run tests
  → Build project
  → Deploy to GitHub Pages
```

## Documentação

- **README.md**: Visão geral e quick start
- **SETUP.md**: Guia de configuração detalhado
- **ARCHITECTURE.md**: Este arquivo
- **COMPONENTS.md**: Guia de componentes
- **API.md**: Documentação da API (futuro)

## Roadmap

### Fase 1 (Atual)
- ✅ Estrutura base
- ✅ Autenticação
- ✅ CRUD básico
- ✅ RLS configurado

### Fase 2
- [ ] Calendário interativo
- [ ] Modais de cadastro
- [ ] Dashboard com gráficos
- [ ] Upload de áudio

### Fase 3
- [ ] Notificações em tempo real
- [ ] Exportação de escalas
- [ ] App mobile
- [ ] API .NET

## Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

MIT License - veja LICENSE para detalhes
