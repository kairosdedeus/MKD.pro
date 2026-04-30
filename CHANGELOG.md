# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Planejado
- Calendário interativo de escalas
- Modais de cadastro/edição
- Dashboard com gráficos
- Sistema de notificações
- Exportação de escalas em PDF
- Modo escuro

## [0.1.0] - 2024-XX-XX

### Adicionado
- Estrutura inicial do projeto com Vite + React + TypeScript
- Configuração do TailwindCSS e Shadcn/UI
- Schema SQL completo do Supabase com:
  - 17 tabelas principais
  - Row Level Security (RLS)
  - Triggers e funções auxiliares
  - Dados iniciais
- Sistema de autenticação com Supabase Auth
- Store Zustand para gerenciamento de estado
- Services para comunicação com Supabase:
  - authService
  - userService
  - teamService
  - scheduleService
  - songService
  - cellService
- Sistema de permissões no frontend
- Layout base com Sidebar e Header
- Páginas de dashboard para cada ministério:
  - Dashboard Gerencial
  - Dashboard Louvor
  - Dashboard Dança
  - Dashboard Mídia
  - Dashboard Obreiros
  - Dashboard Células
- Componentes UI base:
  - Button
  - Input
  - Label
  - Card
- Tipos TypeScript completos
- Documentação completa:
  - README.md
  - SETUP.md
  - ARCHITECTURE.md
  - COMPONENTS.md
  - QUICK_START.md
  - DEVELOPMENT_TIPS.md
  - CONTRIBUTING.md
  - IMPLEMENTATION_CHECKLIST.md
  - PROJECT_SUMMARY.md
- GitHub Actions workflow para deploy
- Configuração do VS Code
- Licença MIT

### Segurança
- Row Level Security em todas as tabelas
- Funções de verificação de permissões
- Validação de dados com Zod
- Variáveis de ambiente para credenciais

---

## Tipos de Mudanças

- `Added` - para novas funcionalidades
- `Changed` - para mudanças em funcionalidades existentes
- `Deprecated` - para funcionalidades que serão removidas
- `Removed` - para funcionalidades removidas
- `Fixed` - para correções de bugs
- `Security` - para correções de vulnerabilidades

## Versionamento

- **MAJOR** (X.0.0): Mudanças incompatíveis com versões anteriores
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Correções de bugs compatíveis

---

[Unreleased]: https://github.com/seu-usuario/escalas-ministeriais/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/seu-usuario/escalas-ministeriais/releases/tag/v0.1.0
