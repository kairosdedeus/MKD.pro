# Guia de desenvolvimento do projeto MKD

> Documento técnico do estado atual do repositório, levantado diretamente do código em 28/07/2026.
>
> Este arquivo descreve o que existe hoje. Quando houver diferença entre este documento e o código, o código, as migrations do Supabase e as políticas RLS implantadas são a fonte final de verdade.

## 1. Visão geral

O MKD é uma plataforma para organização ministerial de igreja. O núcleo é uma aplicação web React que autentica usuários pelo Supabase, controla o acesso por perfil e vínculo real com equipes, mantém usuários, equipes, escalas e repertório, publica notificações e oferece painéis específicos para cada ministério.

O repositório também contém:

- uma página institucional com conteúdo editável e galeria, ainda pendente de rota pública permanente no ambiente configurado;
- automação de escalas e rodízio de equipes fixas do louvor;
- geração de textos de escala para WhatsApp;
- reprodução e download de áudios e links do YouTube;
- um helper desktop local chamado YouMp3Tube;
- um aplicativo Android para conversão local de links autorizados;
- schema, migrations, utilitários e políticas do Supabase;
- testes unitários de serviços e utilitários.

### 1.1 Objetivos de negócio

- Centralizar pessoas, perfis, ministérios, equipes e funções.
- Planejar escalas por data e por equipe.
- Evitar conflitos de pessoas escaladas no mesmo dia.
- Compartilhar informações entre Louvor, Dança e Mídia.
- Manter repertório musical com tom, áudio, link e metadados.
- Automatizar parte do trabalho repetitivo do Louvor.
- Notificar os envolvidos quando uma escala é criada, alterada ou excluída.
- Oferecer uma visão gerencial consolidada.
- Publicar e editar o conteúdo institucional da igreja.

## 2. Stack e execução

| Camada | Tecnologia |
|---|---|
| Interface | React 18, TypeScript e Vite |
| Estilo | Tailwind CSS, Radix UI e componentes no padrão shadcn/ui |
| Rotas | React Router DOM |
| Estado global | Zustand |
| Estado remoto/cache | TanStack Query |
| Formulários | React Hook Form e Zod |
| Datas | date-fns com locale `pt-BR` |
| Gráficos | Recharts |
| Backend | Supabase Auth, PostgreSQL, Storage e RLS |
| Testes | Vitest, Testing Library e jsdom |
| Desktop local | Node.js, Electron, yt-dlp e FFmpeg |
| Android | Kotlin, Gradle e youtubedl-android |

### 2.1 Variáveis de ambiente da aplicação web

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

Sem as duas variáveis, `src/main.tsx` mostra uma tela de ambiente ausente e `src/lib/supabaseClient.ts` impede a criação de um cliente inválido.

### 2.2 Comandos

| Comando | Finalidade |
|---|---|
| `npm run dev` | Servidor Vite de desenvolvimento |
| `npm run build` | Type-check e build de produção |
| `npm run build:pages` | Build e criação de `404.html` para GitHub Pages |
| `npm run preview` | Pré-visualização local da build |
| `npm test` | Executa a suíte Vitest uma vez |
| `npm run test:watch` | Testes em modo observação |
| `npm run test:ui` | Interface do Vitest |
| `npm run test:coverage` | Cobertura de testes |
| `npm run lint` | ESLint sem tolerar warnings |
| `npm run lint:fix` | Correções automáticas do ESLint |
| `npm run type-check` | TypeScript sem emitir arquivos |
| `npm run format` | Prettier em `src` |

## 3. Arquitetura

```text
Páginas e componentes
        ↓
Hooks de consulta/mutação (TanStack Query)
        ↓
Services e regras locais
        ↓
Cliente Supabase
        ↓
PostgreSQL + Auth + Storage + RLS
```

- `pages/` compõe cada experiência de negócio.
- `components/features/` contém modais e fluxos reutilizáveis.
- `hooks/` oferece consultas, mutations, cache e permissões para a interface.
- `services/` concentra acesso ao Supabase e operações de domínio.
- `stores/` guarda autenticação e o miniplayer global.
- `lib/` concentra permissões, tema, logging, e-mail e mapeamentos.
- `types/` define contratos compartilhados.
- `supabase/` define estrutura, migrations, RLS e ferramentas operacionais.

## 4. Inicialização e autenticação

1. `main.tsx` valida o ambiente e inicializa React.
2. `authStore.initialize()` consulta a sessão persistida.
3. Existindo sessão, `userService.getCurrentUserProfile()` carrega o perfil de negócio e seus perfis de acesso.
4. `App` aguarda `loading`; sem usuário, expõe apenas login.
5. Com usuário, monta `DashboardLayout`, rotas protegidas, miniplayer global e toaster.
6. `DefaultRedirect` envia o perfil `gerencial` ao painel gerencial; os demais seguem para a primeira equipe compatível com perfil e vínculo.

O login é feito por e-mail/senha no Supabase Auth. O usuário autenticado é relacionado a `users_profile` por `auth_user_id`. A autorização visual não substitui RLS: o banco deve repetir as restrições importantes.

## 5. Rotas e regras de acesso

| Rota | Tela | Proteção |
|---|---|---|
| `/login` | Login | Somente visitante; autenticado vai para `/app` |
| `/app` | Redirecionamento inteligente | Usuário autenticado |
| `/gerencial` | Dashboard gerencial | Perfil `gerencial` |
| `/gerencial/equipes` | Gestão de equipes | Perfil `gerencial` |
| `/gerencial/usuarios` | Gestão de usuários | Qualquer líder, incluindo gerencial |
| `/gerencial/musicas` | Repertório | Gerencial ou membro real do Louvor |
| `/musicas` | Repertório | Mesma proteção da rota anterior |
| `/louvor` | Dashboard de Louvor | Gerencial ou perfil/vínculo no Louvor |
| `/danca` | Dashboard de Dança | Gerencial ou perfil/vínculo na Dança |
| `/midia` | Dashboard de Mídia | Gerencial ou perfil/vínculo na Mídia |
| `/obreiros` | Dashboard de Obreiros | Gerencial ou perfil/vínculo em Obreiros |
| `/celulas` | Dashboard de Células | Gerencial ou perfil/vínculo em Célula |
| `/test-connection` | Diagnóstico Supabase | Perfil `gerencial` |
| `/acesso-negado` | Aviso de restrição | Usuário autenticado |

### 5.1 Perfis reconhecidos

- `gerencial`
- `lider_louvor`, `lider_danca`, `lider_obreiros`, `lider_midia`, `lider_celula`
- `auxiliar_celula`
- `membro_louvor`, `membro_danca`, `membro_obreiro`, `membro_midia`, `membro_celula`

### 5.2 Regra de dupla validação

Para entrar em um ministério não basta possuir um perfil textual. A rota verifica também se o `user.id` consta entre os membros de uma equipe daquele tipo. Gerencial é a exceção de acesso total.

### 5.3 Permissões operacionais

- Gerencial: visualiza, cria, edita e, em geral, desativa/exclui.
- Líder: visualiza e administra dados no escopo permitido.
- Membro: visualiza o próprio ministério quando realmente vinculado.
- Membro de Louvor: pode editar escala de Louvor; esta é uma exceção explícita em `canEditSchedule`.
- Exclusões administrativas permanecem reservadas ao gerencial nas funções centralizadas.

## 6. Funcionalidades por módulo

### 6.1 Home institucional e editor

`HomePage` apresenta banner, eventos especiais, seção sobre a igreja, destaques, ministérios, horários fixos, galerias e contato. Links internos e externos são normalizados antes do uso. A galeria abre em visualizador e permite navegação anterior/próxima.

No bootstrap atual, essa home é montada na raiz quando as variáveis do Supabase estão ausentes. Quando o ambiente está configurado, `App.tsx` redireciona `/` para `/app` e não declara uma rota pública para `HomePage`. Portanto, o componente institucional e seu editor existem, mas a publicação pública permanente ainda exige ligar a página a uma rota no fluxo configurado.

`HomeContentEditor` edita:

- marca, cores e hero;
- título, descrição, missão, visão e imagens;
- orientação para primeira visita;
- destaques e ministérios;
- eventos fixos e especiais;
- galerias com imagens e vídeos;
- endereço, horários, WhatsApp, Instagram e e-mail;
- JSON completo para operações avançadas.

O conteúdo fica em `home_content`, registro `main`. A leitura pública usa fallback local se a tabela estiver indisponível. Imagens são enviadas ao bucket público `site-media`.

### 6.2 Dashboard gerencial

Mostra:

- quantidade de usuários ativos, equipes, escalas do mês e músicas;
- escalas agrupadas por semana;
- equipes por ministério;
- próximas escalas;
- membros mais escalados;
- estados vazios e orientação inicial.

Os dados vêm dos hooks de usuários, equipes, escalas e músicas e são transformados para cards e gráficos Recharts.

### 6.3 Usuários

- Listagem, paginação e busca por nome, login/e-mail ou telefone.
- Criação com dados pessoais mínimos, perfis e equipes por ministério.
- Geração automática de login `inicial + último sobrenome @mkd.com`.
- Detecção de duplicidade e sufixo incremental (`nome2@mkd.com`).
- Edição de nome, sobrenome, telefone, e-mail, perfis, equipes e funções.
- Ativação/desativação.
- Redefinição de senha por função SQL controlada.
- Visualização de histórico na interface.

Ao criar usuário, o service chama a função remota `create_user_with_profile`, depois sincroniza perfis e associações de equipe. Atualizações preservam o relacionamento entre perfil ministerial e equipe.

### 6.4 Equipes

- Listar todas ou filtrar por tipo ministerial.
- Criar nome, tipo, cor, líder, membros e funções.
- Editar dados e composição.
- Adicionar/remover membro.
- Associar várias funções a um membro.
- Desativar equipe sem apagar histórico.
- Carregar tipos e catálogo de funções por ministério.

### 6.5 Escalas

- Visualização mensal e diária por equipe.
- Criação de título, data, horário, local, observações, membros, funções e músicas.
- Status `draft`, `published` ou `completed`.
- Atualização integral com reconstrução controlada de membros/funções/músicas.
- Exclusão.
- Detecção de conflitos por usuário e por conjunto de membros.
- Consulta cruzada por tipo ministerial.
- Abertura direta por parâmetros `date` e `schedule` vindos de notificações.
- Detalhe da escala e texto formatado para WhatsApp.

As operações compostas são divididas em inserção da escala, membros, funções e músicas. Falhas de notificação não anulam a operação principal: são registradas de forma segura.

### 6.6 Louvor

Além das funções comuns de escala:

- equipes padrão/fixas;
- membros agrupados por instrumento/função;
- repertório dentro da escala;
- tom de execução independente do tom original;
- ordenação de músicas por arrastar e soltar;
- player de áudio e miniplayer do YouTube;
- download de áudio;
- texto individual e texto consolidado do fim de semana;
- geração automática mensal;
- configuração da ordem de rodízio;
- equipe exclusiva do primeiro fim de semana;
- continuidade baseada no mês anterior;
- regras próprias para baixistas e bateristas;
- atribuições fixas de teclado e guitarra.

Existem duas implementações de geração automática. A `worshipAutoScheduleServiceV2` usa regras por IDs do banco e reduz dependência de nomes; a versão anterior permanece no repositório como implementação legada.

### 6.7 Dança

- Calendário, escalas do dia e visão mensal.
- Membros agrupados por função.
- Consulta das músicas do Louvor na mesma data.
- União das músicas da própria escala e do Louvor para comunicação.
- Criação, edição e exclusão conforme permissão.
- Texto de WhatsApp por escala/fim de semana.

### 6.8 Mídia

- Calendário, escalas do dia e visão mensal.
- Consulta das músicas do Louvor na mesma data para projeção/transmissão.
- Criação, edição e exclusão conforme permissão.
- Cards recolhíveis e identificação do usuário atual.
- Texto pronto para WhatsApp.

### 6.9 Obreiros

- Calendário, escalas do dia e visão mensal.
- Agrupamento de pessoas por função.
- Criação, edição e exclusão conforme permissão.
- Texto de WhatsApp e cópia para a área de transferência.

### 6.10 Células

O service já suporta:

- células, líder, endereço, dia, horário e observações;
- membros nos papéis `lider`, `auxiliar` e `membro`;
- encontros;
- presença por pessoa;
- desativação.

A página atual usa `ComingSoonPage`. Portanto, o domínio e o banco existem, mas o dashboard visual completo ainda não está entregue.

### 6.11 Repertório

- Listar e buscar por nome ou artista.
- Criar e editar música, artista, tom original, BPM, duração, letra, cifra, link do YouTube e observações.
- Upload de MP3 para o bucket `audio-musicas`.
- URL assinada para reprodução de conteúdo privado.
- Download de áudio.
- Player com fila e troca de faixa.
- Miniplayer de YouTube local/global.
- Inclusão, ordenação, alteração de tom e remoção dentro da escala.
- Exclusão lógica da música (`ativo = false`).

### 6.12 Notificações

Eventos:

- escala criada;
- escala atualizada;
- escala publicada;
- escala excluída;
- pessoa adicionada à escala;
- informação genérica.

Destinatários são calculados a partir de líder, membros atuais/anteriores e pessoas adicionadas ou removidas. Cada notificação guarda metadados, equipe, escala, ator e link contextual. O destinatário pode marcar uma, marcar todas como lidas ou dispensar todas.

Se as tabelas de notificação ainda não existirem, o service reconhece o erro e degrada sem derrubar a operação de escala.

### 6.13 Tema e experiência

- Modos claro e escuro.
- Cinco paletas: azul, violeta, verde, rosa e âmbar.
- Quatro tamanhos de fonte.
- Preferências persistidas em `localStorage`.
- Sidebar responsiva, header, breadcrumbs, skeletons, estados vazios e paginação.
- Toasts de sucesso/erro.
- Componentes Radix com acessibilidade de teclado.

## 7. Catálogo das funções de negócio e infraestrutura

Esta seção lista as funções nomeadas e métodos relevantes do código autoral. Callbacks puramente visuais e APIs internas de dependências em `node_modules` não são parte do catálogo.

### 7.1 Autenticação — `authService`

| Função | Responsabilidade |
|---|---|
| `login(data)` | Autentica por e-mail e senha. |
| `logout()` | Encerra a sessão Supabase. |
| `getSession()` | Recupera a sessão persistida. |
| `getCurrentUser()` | Recupera o usuário do Auth. |
| `onAuthStateChange(callback)` | Inscreve um observador de mudanças de autenticação. |

No `authStore`: `setUser`, `setProfiles`, `setCurrentProfile`, `login`, `logout` e `initialize` mantêm o estado global e carregam os perfis de negócio.

### 7.2 Usuários — `userService`

| Função | Responsabilidade |
|---|---|
| `getUsers()` | Lista usuários ativos com perfis. |
| `getUserById(id)` | Busca usuário e relações pelo ID. |
| `getCurrentUserProfile()` | Resolve o usuário autenticado em `users_profile`. |
| `getUserProfiles(userId)` | Lista perfis atribuídos. |
| `createUser(userData)` | Cria conta/perfil e sincroniza perfis/equipes. |
| `updateUser(userId, userData)` | Atualiza cadastro e relações. |
| `deactivateUser(userId)` | Efetua desativação lógica. |
| `getProfiles()` | Lista perfis disponíveis. |

Funções de e-mail: `removeAccents`, `generateEmailPrefix`, `generateEmail`, `getAvailableGeneratedEmail` e `isDuplicateGeneratedEmailError`.

### 7.3 Equipes — `teamService`

`getTeamTypes`, `getTeams`, `getTeamById`, `createTeam`, `updateTeam`, `addMember`, `removeMember`, `getTeamMembers`, `getTeamFunctions`, `updateMemberFunctions` e `deactivateTeam`.

Essas funções leem relações aninhadas, sincronizam membros/funções e preferem desativação lógica a remoção definitiva.

### 7.4 Escalas — `scheduleService`

| Função | Responsabilidade |
|---|---|
| `normalizeMemberFunctions` | Normaliza funções recebidas em cada membro. |
| `getCurrentUserId` | Obtém o ator da operação. |
| `formatDateToISO` | Padroniza datas para o banco. |
| `safelyNotify` | Isola falhas do subsistema de notificações. |
| `getSchedulesByMonth` | Consulta intervalo mensal de uma equipe. |
| `getScheduleByDate` | Consulta escala da equipe em uma data. |
| `createSchedule` | Orquestra criação e notificação. |
| `_insertSchedule` | Insere o cabeçalho. |
| `_insertScheduleMembers` | Insere membros escalados. |
| `_insertMemberFunctions` | Insere funções por membro escalado. |
| `_insertScheduleSongs` | Insere repertório e ordem. |
| `updateSchedule` | Atualiza a escala completa e notifica diferenças. |
| `_updateScheduleBasicData` | Atualiza campos básicos. |
| `_deleteScheduleMembers` | Limpa membros antes da reconstrução. |
| `_deleteScheduleSongs` | Limpa músicas antes da reconstrução. |
| `deleteSchedule` | Exclui e notifica usando snapshot anterior. |
| `checkConflicts` | Procura conflito de uma pessoa/data. |
| `checkMembersConflicts` | Procura conflitos de vários selecionados. |
| `getSchedulesByTeamType` | Consulta escalas mensais de um ministério. |

### 7.5 Músicas — `songService`

`searchSongs`, `getSongs`, `getSongById`, `createSong`, `updateSong`, `uploadSongAudio`, `getAudioUrl`, `downloadAudio`, `addSongToSchedule`, `updateScheduleSong` e `removeSongFromSchedule`.

### 7.6 Células — `cellService`

`getCells`, `getCellById`, `createCell`, `updateCell`, `addCellMember`, `removeCellMember`, `getCellMeetings`, `createCellMeeting`, `registerAttendance` e `deactivateCell`.

### 7.7 Conteúdo da home — `homeContentService`

`mergeHomeContent` combina conteúdo salvo, modelo atual e formatos legados. `getPublished`, `getDraft`, `save` e `uploadImage` implementam leitura pública, edição, publicação e mídia.

### 7.8 Notificações — `notificationService`

Funções auxiliares:

- `isMissingNotificationsTable`, `unique` e `createId`;
- `teamRoute`, `scheduleLink`, `scheduleTargetLink` e `notificationTargetLink`;
- `formatScheduleDate`, `getCurrentUserProfileId` e `getScheduleSnapshot`;
- `getScheduleMemberUserIds`, `getScheduleSongKeys` e `getAddedSongNames`;
- `createBaseMetadata`, `getScheduleRecipients`, `getPreviousAndCurrentRecipients`;
- `getAddedMemberUserIds`, `getRemovedMemberUserIds`;
- `createNotification`, `notifyScheduleEvent` e `createFor`.

API pública: `listForCurrentUser`, `markAsRead`, `markAllAsRead`, `dismissAll`, `notifyScheduleCreated`, `notifyScheduleUpdated`, `notifyScheduleDeleted` e `getScheduleSnapshot`.

### 7.9 Equipes fixas e rodízio

`worshipFixedTeamService`: `isMissingTableError`, `getByTeamId`, `create`, `update` e `delete`.

`worshipRotationService` contém:

- `getSupabaseClient`;
- `separateFirstWeekendTeam`;
- `getNextRotationIndex`;
- `getRotationSequence`;
- `updateRotationOrder`;
- `setFirstWeekendTeam`;
- `toggleTeamRotation`;
- `isFirstWeekendOfMonth`;
- `getNextRotationTeam`;
- `suggestTeamForDate`;
- operações auxiliares de consulta ao histórico e cálculo de continuidade.

Os geradores automático original e V2 compartilham conceitos como `normalizeText`, `buildWeekendBlocks`, `addMemberFunction`, `buildPresetMap`, `buildMembersForTeam`, `identifyPresetFromSchedule`, `loadContinuityState`, `ensureFunctions` e `generateMonthly`.

A V2 acrescenta `getBassistRotationRules`, `getDrummerRotationRules`, `nextFromRotation`, `getFunctionByName`, `getMemberById`, `getFixedFunctionAssignments` e identificação por IDs.

### 7.10 Permissões e fluxo ministerial

| Função | Responsabilidade |
|---|---|
| `isGerencial` | Detecta acesso total. |
| `isAnyLeader` | Detecta qualquer liderança. |
| `isLeader` | Detecta liderança geral ou de um ministério. |
| `isMember` | Detecta perfil compatível com ministério. |
| `canEditSchedule` | Aplica exceções de edição. |
| `getTeamPermissions` | Retorna `canView/create/edit/delete` para equipes. |
| `getSchedulePermissions` | Retorna permissões para escalas. |
| `getUserPermissions` | Retorna permissões de cadastro de usuários. |
| `getMinistryColor` | Resolve classes Tailwind do ministério. |
| `getMinistryColorHex` | Resolve cor hexadecimal. |
| `getSelectedTeamTypeCodes` | Converte perfis selecionados em tipos de equipe. |
| `getTeamsByType` | Agrupa equipes pelos tipos pedidos. |

### 7.11 Hooks

- Usuários: `useUsers`, `useUser`, `useCurrentUser`, `useCreateUser`, `useUpdateUser`, `useProfiles`.
- Equipes: `useTeams`, `useTeam`, `useCreateTeam`, `useUpdateTeam`, `useTeamFunctions`, `useTeamTypes`.
- Escalas: `useSchedules`, `useSchedulesByMonth`, `useScheduleByDate`, `useCreateSchedule`, `useUpdateSchedule`, `useDeleteSchedule`, `useCheckConflicts`.
- Músicas: `useSongs`, `useSearchSongs`, `useSong`, `useCreateSong`, `useUpdateSong`.
- Sistema: `usePermissions`, `useNotifications`, `useTheme`, `useDarkMode`, `usePhoneMask`.

Hooks de mutation invalidam as chaves relacionadas no TanStack Query após sucesso.

### 7.12 Utilitários

- `cn`: combina classes condicionais e resolve conflitos Tailwind.
- `formatDate` e `formatDateTime`: localização `pt-BR`.
- `formatPhone` e handlers de máscara: telefone durante entrada.
- `applyTheme` e `applyFontSize`: aplicam preferências ao elemento raiz.
- `sanitizeError`: remove senha, token e identificadores sensíveis de erros.
- `logger.error`, `logger.warn`, `logger.info`: só escrevem em desenvolvimento.
- `parseKey`, `buildKey`, `isModifierAllowed`: seletor de tonalidade musical.
- `extractYoutubeId`: reconhece o vídeo para o miniplayer.
- `formatTime`: duração no player de áudio.

## 8. Catálogo de páginas e componentes autorais

### 8.1 Páginas

- `HomePage`, `LoginPage`, `TestConnectionPage`, `AccessDeniedPage`, `ComingSoonPage`.
- `GerencialDashboard`, `TeamsPage`, `UsersPage`.
- `SongsPage`, `WorshipDashboard`, `DanceDashboard`, `MediaDashboard`, `UshersDashboard`, `CellsDashboard`.

Os dashboards ministeriais possuem helpers para identificar membro/usuário, agrupar escalas por fim de semana, agrupar membros por função, selecionar escalas do dia, gerar texto de WhatsApp e excluir conforme permissão.

### 8.2 Layout e compartilhados

- `DashboardLayout`, `Header`, `Sidebar` e `SidebarContent`.
- `AudioPlayer`, `YoutubeMiniplayer`, `FloatingMiniplayer`, `InlineMiniplayer`.
- `NotificationCenter`, `Pagination`, `usePagination`, `SimpleCalendar`.
- `Breadcrumbs`, `ThemeSelector`, `StatsCard`, `EmptyState`, `LoadingSpinner`.
- `Skeleton`, `SkeletonCard`, `SkeletonTable`, `SkeletonList`.
- `Logo`, `LogoCompact`, `LogoWithText`.
- `WorshipIcon`, `DanceIcon`, `MediaIcon`, `UshersIcon`.

### 8.3 Componentes de feature

- Usuários: `CreateUserModal`, `EditUserModal`.
- Equipes: `CreateTeamModal`, `EditTeamModal`.
- Escalas: `CreateScheduleModal`, `ScheduleDetailModal`, `RotationConfigModal`, `WorshipFixedTeamModal`.
- Músicas: `CreateSongModal`, `EditSongModal`.
- Home: `HomeContentEditor`, `GalleryEditor`, `Field`, `ImageField`, `EditorCard`, `ArrayToolbar`, `RepeaterItem`.
- YouMp3Tube: `YouMp3TubeDownloadButton`, `YouMp3TubeDownloadModal`, `YouMp3TubeDownloadOptionCard`.

### 8.4 Componentes básicos de UI

`accordion`, `alert-dialog`, `avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `key-selector`, `label`, `phone-input`, `popover`, `radio-group`, `select`, `switch`, `table`, `tabs`, `textarea`, `toast` e `toaster`.

Esses arquivos encapsulam Radix ou HTML para manter estilo, ref forwarding, variantes e acessibilidade consistentes. O gerenciador de toast expõe `genId`, `addToRemoveQueue`, `reducer`, `dispatch`, `toast` e `useToast`.

## 9. Modelo de dados

### 9.1 Identidade e autorização

| Tabela | Papel |
|---|---|
| `users_profile` | Perfil de negócio ligado ao usuário do Auth. |
| `profiles` | Catálogo de papéis. |
| `user_profiles` | Relação N:N usuário/perfil. |

### 9.2 Equipes

| Tabela | Papel |
|---|---|
| `team_types` | Catálogo Louvor, Dança, Mídia, Obreiros e Célula. |
| `teams` | Equipe e líder. |
| `team_members` | Pessoas vinculadas à equipe. |
| `team_functions` | Funções disponíveis por tipo. |
| `team_member_functions` | Funções exercidas por membro. |

### 9.3 Escalas e repertório

| Tabela | Papel |
|---|---|
| `schedules` | Cabeçalho da escala. |
| `schedule_members` | Membros escalados. |
| `schedule_member_functions` | Funções da pessoa naquela escala. |
| `songs` | Repertório. |
| `schedule_songs` | Música, tom e ordem na escala. |

### 9.4 Automação do Louvor

- `worship_fixed_teams`
- `worship_fixed_team_members`
- `worship_bassist_rotation_rules`
- `worship_drummer_rotation_rules`
- `worship_member_rules`
- `worship_fixed_function_assignments`

### 9.5 Células

- `cells`
- `cell_members`
- `cell_meetings`
- `cell_attendance`

### 9.6 Comunicação e site

- `app_notifications`
- `app_notification_recipients`
- `home_content`

### 9.7 Funções SQL relevantes

- `update_updated_at_column()`: mantém timestamps.
- `reset_user_password(...)`: troca senha por fluxo administrativo controlado.
- `get_next_rotation_team(...)`: calcula o próximo preset do rodízio.
- `get_rotation_sequence(...)`: retorna a sequência configurada.
- `exec_sql(...)`: utilitário de setup; não deve ser exposto em produção sem avaliação rigorosa.
- Função de criação de usuário usada por `userService.createUser`.

## 10. Storage

| Bucket | Uso | Acesso esperado |
|---|---|---|
| `audio-musicas` | MP3 do repertório | Privado; leitura por URL assinada |
| `site-media` | Imagens da home e galerias | Público para exibição institucional |

O upload deve validar tipo e tamanho também no backend/policies. A URL pública de `site-media` não deve receber documentos privados.

## 11. YouMp3Tube desktop

O helper em `youtube-local-helper/` executa apenas em `127.0.0.1:43921`.

Endpoints:

- `GET /health`: saúde, navegador detectado e versão.
- `GET /app`, `/app.js`, `/app.css`: interface local.
- `POST /convert`: recebe `youtube_url` e devolve MP3.
- `OPTIONS`: preflight CORS.

Funções:

- `isAllowedOrigin` e `setCorsHeaders`: limitam origens locais.
- `readJsonBody`: limita a requisição a 16 KiB.
- `normalizeYoutubeUrl`: aceita apenas hosts conhecidos do YouTube.
- `findBrowser`: escolhe Chrome, Edge ou Firefox, com override.
- `convertToMp3`: usa sessão local do navegador, yt-dlp e FFmpeg.
- `runProcess`: executa com timeout de cinco minutos.
- `sanitizeFileName`: cria nome seguro.
- `toUserMessage`: traduz falhas técnicas.
- `sendJson` e `sendStaticFile`: respostas HTTP.

Só uma conversão ocorre por vez. O diretório temporário é removido ao final. Cookies não são enviados ao MKD; o yt-dlp lê a sessão localmente.

`desktop-main.js` fornece `configureRuntimePaths`, `showMainWindow`, `buildAppUrl` e `findProtocolUrl` para inicialização Electron e protocolo `yoump3tube://`.

## 12. Aplicativo Android

`MainActivity`:

- cria a interface nativamente;
- recebe links `yoump3tube://convert?url=...`;
- valida hosts do YouTube;
- inicializa o conversor;
- executa fora da thread principal;
- extrai áudio MP3 em 128 Kbps;
- salva em `Downloads/YouMp3Tube`;
- apresenta progresso, sucesso e erro;
- encerra o executor no ciclo de destruição.

Funções Kotlin: `onCreate`, `onNewIntent`, `onDestroy`, `createContentView`, `startConversion`, `convertToMp3`, `applyIncomingUrl`, `setConverting`, `showStatus`, `text`, `matchWidth`, `wrapContent`, `dp` e `isSupportedYoutubeUrl`.

`YouMp3TubeApplication.ensureConverterInitialized` inicializa a biblioteca de download uma vez no processo.

## 13. Tipos centrais

- Identificadores: `ProfileCode`, `TeamTypeCode`, `ScheduleStatus`.
- Entidades: `UserProfile`, `Profile`, `TeamType`, `Team`, `TeamMember`, `TeamFunction`, `Schedule`, `ScheduleMember`, `Song`, `ScheduleSong`, `Cell`, `CellMember`, `CellMeeting`, `CellAttendance`.
- Formulários: `LoginFormData`, `UserFormData`, `TeamFormData`, `ScheduleFormData`, `SongFormData`, `CellFormData`.
- Apoio: `UserContext`, `DashboardStats`, `PermissionCheck`.
- `database.types.ts`: contrato TypeScript das tabelas, inserts, updates e relações do Supabase.

## 14. Testes existentes

| Arquivo | Cobertura principal |
|---|---|
| `songService.test.ts` | Operações do service de músicas |
| `theme.test.ts` | Aplicação de tema |
| `whatsapp.test.ts` | Formatação de comunicação |
| `phone.test.ts` | Máscara/normalização de telefone |
| `pagination.test.ts` | Paginação |
| `email.test.ts` | Geração e validação de e-mail |
| `schedule.test.ts` | Regras auxiliares de escala |

Antes de mergear mudanças de domínio, executar ao menos:

```bash
npm run type-check
npm test
npm run build
```

## 15. Segurança, privacidade e operação

- Nunca colocar `service_role` no frontend.
- Nunca versionar `.env`, tokens, cookies ou chave de assinatura Android.
- Manter RLS ativa em produção. `supabase/setup/permissoes-dev.sql` é somente para desenvolvimento e desativa proteções.
- Validar autorização no banco; esconder botão ou rota é apenas defesa de interface.
- Tratar nome, telefone e e-mail como dados pessoais.
- O logger remove chaves sensíveis e só escreve em desenvolvimento.
- Preferir desativação lógica para preservar auditoria e histórico.
- Buckets privados devem usar URL assinada curta.
- A função administrativa de reset de senha e qualquer função `SECURITY DEFINER` precisam de `search_path` seguro e autorização explícita.
- O helper YouMp3Tube deve permanecer limitado ao loopback e a origens permitidas.

## 16. Pontos de atenção atuais

1. O dashboard de Células ainda é uma tela “em breve”, embora service e tabelas existam.
2. Há duas versões do gerador automático do Louvor; novas evoluções devem priorizar a V2 e planejar retirada segura da versão por nomes.
3. Parte da documentação antiga afirma percentuais de conclusão; eles não devem ser usados como métrica automática.
4. `permissoes-dev.sql` não pode ser aplicado no ambiente produtivo.
5. Criações compostas em vários inserts não formam necessariamente uma transação PostgreSQL única no frontend; falhas intermediárias merecem testes e, quando crítico, RPC transacional.
6. Alterações de perfil precisam manter alinhados rota, header, sidebar, hooks, RLS e vínculo real na equipe.
7. Tabelas opcionais possuem fallback em alguns services; isso melhora disponibilidade, mas pode esconder migration ausente. Monitorar warnings no desenvolvimento.

## 17. Como desenvolver uma nova funcionalidade

1. Defina entidade, ator, permissão e resultado esperado.
2. Atualize schema/migration e RLS, se houver dado novo.
3. Atualize `database.types.ts` e `types/index.ts`.
4. Implemente a operação em `services/`.
5. Exponha query/mutation em `hooks/`.
6. Crie ou altere componente/página.
7. Centralize novas regras de perfil em `permissions.ts`.
8. Invalide as chaves corretas do TanStack Query.
9. Trate loading, vazio, sucesso e erro.
10. Adicione teste proporcional ao risco.
11. Execute type-check, testes e build.
12. Atualize este documento quando o comportamento público mudar.

## 18. Checklist de entrega

- [ ] Regra de negócio confirmada.
- [ ] Tipos e contratos atualizados.
- [ ] Migration reversível e idempotente quando possível.
- [ ] RLS/policies revisadas.
- [ ] Gerencial e perfis ministeriais testados.
- [ ] Vínculo real com equipe testado.
- [ ] Interface mobile e desktop conferida.
- [ ] Estados loading/vazio/erro cobertos.
- [ ] Dados pessoais não aparecem em logs.
- [ ] Cache invalidado após mutations.
- [ ] `npm run type-check` aprovado.
- [ ] `npm test` aprovado.
- [ ] `npm run build` aprovado.

## 19. Estrutura resumida

```text
MKD.pro/
├── src/
│   ├── components/       UI, layouts, compartilhados e modais
│   ├── features/         Configurações específicas de feature
│   ├── hooks/            Query, mutation, tema e permissões
│   ├── lib/              Supabase, regras e utilitários
│   ├── pages/            Rotas e dashboards
│   ├── services/         Casos de uso e persistência
│   ├── stores/           Zustand
│   ├── test/             Vitest
│   └── types/            Contratos TypeScript
├── supabase/
│   ├── setup/            Schema e dados iniciais
│   ├── migrations/       Evolução incremental
│   └── utils/            Diagnóstico e manutenção
├── youtube-local-helper/ Aplicativo desktop local
├── mkd-audio-android/    Aplicativo Android
├── scripts/              Automação de build/deploy
└── docs/                 Documentação técnica e operacional
```

---

**Mensagem de commit sugerida:** `docs: adiciona guia detalhado de desenvolvimento do projeto MKD`
