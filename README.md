# 🎵 Sistema de Escalas Ministeriais

> Sistema web completo para gestão de escalas ministeriais de igreja, desenvolvido com React, TypeScript e Supabase.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)](https://supabase.com/)

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + Shadcn/UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack Query
- **Routing**: React Router DOM

## 📋 Funcionalidades

### Ministérios Suportados

- ✅ Louvor
- ✅ Dança
- ✅ Obreiros
- ✅ Mídia
- ✅ Células

### Perfis de Usuário

- Gerencial (acesso total)
- Líderes de Ministério
- Auxiliares
- Membros de Equipe

### Recursos Principais

- 📅 Calendário interativo de escalas
- 👥 Gestão de equipes e membros
- 🎵 Cadastro e gerenciamento de músicas
- 🔄 Integração entre ministérios (Louvor → Dança → Mídia)
- 📊 Dashboard gerencial com estatísticas
- 🔐 Autenticação e autorização com RLS
- 📱 Interface responsiva (Mobile First)
- 🎨 Design moderno e intuitivo

## 🛠️ Configuração do Projeto

### 1. Pré-requisitos

- Node.js 18+ (recomendado: 20+)
- npm ou yarn
- Conta no Supabase

### 2. Configuração do Supabase

#### 2.1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e a chave anônima (anon key)

#### 2.2. Executar o Schema SQL

1. No dashboard do Supabase, vá em **SQL Editor**
2. Abra o arquivo `supabase/schema.sql`
3. Copie todo o conteúdo e execute no SQL Editor
4. Aguarde a conclusão (cria todas as tabelas, índices, triggers, RLS e dados iniciais)

#### 2.3. Configurar Storage

1. No dashboard do Supabase, vá em **Storage**
2. Crie um novo bucket chamado `audio-musicas`
3. Configure como **privado**
4. Adicione as policies de storage (comentadas no final do schema.sql)

### 3. Instalação do Frontend

```bash
# Clone o repositório
git clone <seu-repositorio>
cd escalas-ministeriais

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Edite o arquivo .env e adicione suas credenciais do Supabase
# VITE_SUPABASE_URL=https://seu-projeto.supabase.co
# VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 4. Executar o Projeto

```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes Shadcn/UI
│   ├── layouts/        # Layouts da aplicação
│   └── ...
├── features/           # Features por módulo
│   ├── auth/
│   ├── dashboard/
│   ├── teams/
│   ├── schedules/
│   ├── worship/
│   ├── dance/
│   ├── media/
│   ├── ushers/
│   └── cells/
├── hooks/              # Custom hooks
├── lib/                # Configurações e utilitários
│   ├── supabaseClient.ts
│   └── permissions.ts
├── pages/              # Páginas da aplicação
├── services/           # Services para API
│   ├── authService.ts
│   ├── userService.ts
│   ├── teamService.ts
│   ├── scheduleService.ts
│   ├── songService.ts
│   └── cellService.ts
├── stores/             # Zustand stores
├── types/              # TypeScript types
└── utils/              # Funções utilitárias
```

## 🔐 Sistema de Permissões

### Perfis e Acessos

#### Gerencial

- ✅ Acesso total ao sistema
- ✅ Cadastrar usuários e equipes
- ✅ Gerenciar todas as escalas
- ✅ Ver dashboard completo

#### Líder de Ministério

- ✅ Gerenciar suas equipes
- ✅ Criar e editar escalas do seu ministério
- ✅ Adicionar/remover membros
- ✅ Definir funções dos membros

#### Membro de Equipe

- ✅ Visualizar suas equipes
- ✅ Visualizar escalas
- ✅ Editar escalas (apenas Louvor)

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS configuradas:

- Usuários só veem dados das equipes que pertencem
- Líderes gerenciam apenas suas equipes
- Gerencial tem acesso total
- Funções auxiliares verificam permissões no banco

## 🎵 Fluxo de Músicas

1. **Louvor** cadastra músicas na escala
2. **Dança** visualiza as músicas do louvor e organiza coreografias
3. **Mídia** visualiza as músicas para projeção e transmissão
4. Alterações nas músicas refletem automaticamente

## 📊 Dashboard Gerencial

- Total de usuários, equipes e escalas
- Próximas escalas
- Membros mais escalados
- Membros sem escala no mês
- Escalas por ministério
- Alertas de escalas incompletas
- Detecção de conflitos de agenda
- Gráficos interativos

## 🚀 Deploy

### GitHub Pages

```bash
# Build do projeto
npm run build

# O conteúdo da pasta dist/ está pronto para deploy
```

Configure o `base` no `vite.config.ts` conforme seu repositório:

```typescript
export default defineConfig({
  base: "/nome-do-repositorio/",
  // ...
});
```

### Outras Plataformas

O projeto pode ser hospedado em:

- Vercel
- Netlify
- AWS Amplify
- Firebase Hosting

## 🔧 Desenvolvimento

### Adicionar Novo Ministério

1. Adicione o tipo no banco (team_types)
2. Adicione as funções (team_functions)
3. Crie o perfil correspondente (profiles)
4. Adicione a cor no tailwind.config.js
5. Crie a página do dashboard
6. Adicione a rota no App.tsx

### Adicionar Novo Componente Shadcn/UI

```bash
npx shadcn-ui@latest add [component-name]
```

## 📝 Próximos Passos

- [ ] Implementar notificações em tempo real (Supabase Realtime)
- [ ] Adicionar exportação de escalas (PDF/Excel)
- [ ] Implementar sistema de notificações por email
- [ ] Adicionar modo escuro
- [ ] Criar app mobile (React Native)
- [ ] Migrar para API .NET (backend próprio)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Equipe

Desenvolvido por uma equipe sênior especializada em:

- Análise de Requisitos
- Arquitetura Frontend React
- Supabase/PostgreSQL
- Segurança/RLS
- UX/UI Design
- Sistemas para Igrejas

## 📞 Suporte

Para dúvidas e suporte, abra uma issue no repositório.

---

**Nota**: Este sistema foi desenvolvido especificamente para gestão de escalas ministeriais, com foco em usabilidade, segurança e escalabilidade.
📍 MKD - LOUVOR 🎤 Equipe X

🗓 Sábado 04
1 - Tudo se fez novo - D
2 - Pisa - Em
3 - Somos 1 - D
4 - Nosso Coração Queima - A
5 - Cristo/ Tudo que tenho é teu - A
6 - Tu és tudo - D

🗓 Domingo 05
1 - Mil Graus - Alice
2 - Pedra Preciosa - João
3 - Canção do Apocalipse - Wallesca
