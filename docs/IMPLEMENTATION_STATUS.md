# Status de Implementação

**Última atualização:** 30/04/2026
**Versão:** 0.5.0

---

## 📊 Progresso Geral

```
████████████████████░░░░░░░░░░░░░░░░░░░░ 45%
```

| Módulo              | Status       | %   |
|---------------------|--------------|-----|
| Setup & Infra       | ✅ Completo  | 100 |
| Banco de Dados      | ✅ Completo  | 100 |
| Autenticação        | ✅ Completo  | 100 |
| Interface Base      | ✅ Completo  | 100 |
| Dashboard Louvor    | ✅ Completo  | 100 |
| Gestão de Equipes   | 🔄 Parcial   | 60  |
| Gestão de Usuários  | 🔄 Parcial   | 50  |
| Gestão de Músicas   | 🔄 Parcial   | 30  |
| Gestão de Escalas   | 🔄 Parcial   | 80  |
| Notificações        | ❌ Pendente  | 0   |
| Relatórios/PDF      | ❌ Pendente  | 0   |
| Perfil/Config       | ❌ Pendente  | 0   |
| Responsividade      | ❌ Pendente  | 0   |
| Testes              | ❌ Pendente  | 0   |
| Deploy              | ❌ Pendente  | 0   |

---

## ✅ O que está funcionando

### Autenticação
- Login com email/senha
- Sessão persistente
- Logout
- Proteção de rotas

### Dashboard Louvor
- Calendário interativo com navegação por mês
- Criar escala com membros e funções
- Editar escala existente
- Excluir escala com confirmação
- Busca de músicas em tempo real
- Criar música inline (quando não encontrada na busca)
- Drag and drop para reordenar músicas
- Tom de execução por música
- Validação: 1 escala por equipe por dia
- Aviso visual de conflito de data
- Visualização detalhada da escala
- Grid de membros da equipe com funções

### Gestão de Equipes
- Listar equipes
- Criar equipe com tipo, líder, membros e funções por membro
- Visualizar membros e funções

### Gestão de Usuários
- Listar usuários
- Criar usuário com geração automática de email
  - Regra: `[inicial_nome][ultimo_sobrenome]@mkd.com`
  - Ex: Michael Cabrera → `mcabrera@mkd.com`
- Atribuir perfis ao criar

### Gestão de Músicas
- Listar músicas
- Criar música (nome, artista, tom, URL, áudio)
- Busca em tempo real

---

## 🔄 Em desenvolvimento

### Gestão de Equipes
- Editar equipe (nome, líder, membros)
- Remover membros
- Desativar equipe

### Gestão de Usuários
- Editar usuário
- Desativar usuário
- Resetar senha pelo sistema

### Gestão de Músicas
- Editar música
- Excluir música
- Player de áudio

---

## ❌ Não iniciado

- Notificações em tempo real
- Exportação para PDF
- Gráficos e relatórios
- Página de perfil do usuário
- Modo escuro
- Responsividade mobile
- Testes automatizados
- Deploy para GitHub Pages
- Gestão de Células (módulo futuro)
- Outros ministérios (Dança, Mídia, Obreiros — ocultos por ora)

---

## 🏗️ Stack Tecnológico

| Tecnologia     | Versão  | Uso                        |
|----------------|---------|----------------------------|
| React          | 18      | UI Framework               |
| TypeScript     | 5       | Tipagem estática           |
| Vite           | 5       | Build tool                 |
| TailwindCSS    | 3       | Estilização                |
| Shadcn/UI      | latest  | Componentes UI             |
| Supabase       | 2       | Backend + Auth + DB        |
| React Query    | 5       | Cache e estado servidor    |
| Zustand        | 4       | Estado global              |
| React Router   | 6       | Roteamento                 |
| date-fns       | 3       | Manipulação de datas       |
| Zod            | 3       | Validação de formulários   |
| React Hook Form| 7       | Gerenciamento de formulários|

---

## 🗄️ Banco de Dados

- **Projeto:** escalas-ministeriais
- **ID:** ewuvrindvhjislkrohwh
- **Tabelas:** 17
- **RLS:** Desabilitado (desenvolvimento)
- **Storage:** Bucket `audio-musicas` criado

### Tabelas principais:
`users_profile`, `profiles`, `user_profiles`, `team_types`, `teams`,
`team_members`, `team_functions`, `team_member_functions`, `schedules`,
`schedule_members`, `schedule_member_functions`, `songs`, `schedule_songs`,
`cells`, `cell_members`, `cell_meetings`, `cell_attendance`

---

## 🔑 Credenciais de Desenvolvimento

| Campo  | Valor                                      |
|--------|--------------------------------------------|
| URL    | https://ewuvrindvhjislkrohwh.supabase.co   |
| Admin  | admin@igreja.com / Admin@2024              |
| Dev    | http://localhost:5173                      |

---

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   ├── features/
│   │   ├── schedules/   ← CreateScheduleModal, ScheduleDetailModal
│   │   ├── teams/       ← CreateTeamModal
│   │   ├── users/       ← CreateUserModal
│   │   └── songs/       ← CreateSongModal
│   ├── layouts/         ← DashboardLayout, Sidebar, Header
│   ├── shared/          ← EmptyState, LoadingSpinner, StatsCard
│   └── ui/              ← Shadcn components
├── hooks/               ← useTeams, useUsers, useSchedules, useSongs
├── pages/
│   ├── gerencial/       ← GerencialDashboard, TeamsPage, UsersPage
│   ├── worship/         ← WorshipDashboard ← foco atual
│   └── songs/           ← SongsPage
├── services/            ← teamService, userService, scheduleService, songService
├── stores/              ← authStore (Zustand)
├── types/               ← index.ts, database.types.ts
└── lib/                 ← supabaseClient, utils, permissions
```
