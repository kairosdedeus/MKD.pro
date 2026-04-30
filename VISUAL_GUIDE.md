# Guia Visual do Projeto

## 🎨 Paleta de Cores

### Cores por Ministério

```
Louvor:   #8b5cf6 (Roxo)    ████████
Dança:    #ec4899 (Rosa)    ████████
Mídia:    #3b82f6 (Azul)    ████████
Obreiros: #10b981 (Verde)   ████████
Células:  #f97316 (Laranja) ████████
```

### Cores do Sistema

```
Primary:      #222222 (Cinza Escuro)
Secondary:    #f3f4f6 (Cinza Claro)
Background:   #ffffff (Branco)
Foreground:   #111827 (Preto)
Muted:        #6b7280 (Cinza Médio)
Border:       #e5e7eb (Cinza Borda)
```

## 📐 Layout

### Desktop (1024px+)

```
┌─────────────────────────────────────────────────────┐
│ Header                                              │
│ ┌─────────┬─────────────────────────────────────┐ │
│ │         │                                     │ │
│ │         │                                     │ │
│ │ Sidebar │         Main Content                │ │
│ │         │                                     │ │
│ │         │                                     │ │
│ └─────────┴─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

```
┌─────────────────┐
│ Header          │
│ ☰ Menu          │
├─────────────────┤
│                 │
│                 │
│ Main Content    │
│                 │
│                 │
└─────────────────┘
```

## 🧩 Componentes

### Card

```
┌─────────────────────────────┐
│ Título                      │
├─────────────────────────────┤
│                             │
│ Conteúdo                    │
│                             │
└─────────────────────────────┘
```

### Modal

```
        ┌─────────────────────────┐
        │ Título            [X]   │
        ├─────────────────────────┤
        │                         │
        │ Conteúdo                │
        │                         │
        ├─────────────────────────┤
        │ [Cancelar]  [Confirmar] │
        └─────────────────────────┘
```

### Calendário

```
┌─────────────────────────────────────┐
│ ◀ Janeiro 2024 ▶                    │
├───┬───┬───┬───┬───┬───┬───┐
│ D │ S │ T │ Q │ Q │ S │ S │
├───┼───┼───┼───┼───┼───┼───┤
│   │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │
├───┼───┼───┼───┼───┼───┼───┤
│ 7 │ 8 │ 9 │10 │11 │12 │13 │
├───┼───┼───┼───┼───┼───┼───┤
│14 │15 │16 │17 │18 │19 │20 │
└───┴───┴───┴───┴───┴───┴───┘
```

## 📱 Telas Principais

### Login

```
┌─────────────────────────────┐
│                             │
│   Escalas Ministeriais      │
│                             │
│   ┌─────────────────────┐   │
│   │ Email               │   │
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │ Senha               │   │
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │      Entrar         │   │
│   └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

### Dashboard Gerencial

```
┌─────────────────────────────────────────────────────┐
│ Dashboard Gerencial                                 │
├─────────────┬─────────────┬─────────────┬──────────┤
│ Usuários    │ Equipes     │ Escalas     │ Músicas  │
│ 45          │ 12          │ 28          │ 156      │
└─────────────┴─────────────┴─────────────┴──────────┘
│                                                     │
├─────────────────────────┬───────────────────────────┤
│ Próximas Escalas        │ Escalas por Ministério    │
│                         │                           │
│ • 15/01 - Louvor        │ ┌─────────────────────┐   │
│ • 16/01 - Dança         │ │ Gráfico de Barras   │   │
│ • 17/01 - Mídia         │ │                     │   │
│                         │ └─────────────────────┘   │
└─────────────────────────┴───────────────────────────┘
```

### Dashboard Louvor

```
┌─────────────────────────────────────────────────────┐
│ Louvor                              [+ Nova Escala] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Calendário                                  │   │
│ │                                             │   │
│ │ [Dias com escalas destacados em roxo]      │   │
│ │                                             │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Membros da Equipe                                   │
│                                                     │
│ • João Silva (Ministro, Guitarrista)               │
│ • Maria Santos (Back Vocal)                        │
│ • Pedro Oliveira (Baterista)                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Modal de Escala

```
┌─────────────────────────────────────────────────────┐
│ Nova Escala de Louvor                         [X]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Data: [15/01/2024]                                  │
│                                                     │
│ Equipe: [Equipe Principal ▼]                       │
│                                                     │
│ Membros Escalados:                                  │
│ ┌─────────────────────────────────────────────┐   │
│ │ ☑ João Silva                                │   │
│ │   ☑ Ministro  ☑ Guitarrista                │   │
│ │                                             │   │
│ │ ☑ Maria Santos                              │   │
│ │   ☑ Back Vocal                              │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Músicas:                                            │
│ ┌─────────────────────────────────────────────┐   │
│ │ 1. Reckless Love (Tom: C)                   │   │
│ │ 2. Oceans (Tom: D)                          │   │
│ │ [+ Adicionar Música]                        │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Observações:                                        │
│ ┌─────────────────────────────────────────────┐   │
│ │                                             │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│                         [Cancelar]  [Salvar]        │
└─────────────────────────────────────────────────────┘
```

## 🎯 Estados Visuais

### Loading

```
┌─────────────────────────────┐
│                             │
│      ⟳ Carregando...        │
│                             │
└─────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────┐
│                             │
│         📋                  │
│                             │
│   Nenhum dado encontrado    │
│                             │
│   [+ Adicionar Novo]        │
│                             │
└─────────────────────────────┘
```

### Error State

```
┌─────────────────────────────┐
│                             │
│         ⚠️                  │
│                             │
│   Erro ao carregar dados    │
│                             │
│   [Tentar Novamente]        │
│                             │
└─────────────────────────────┘
```

## 🔔 Notificações

### Toast Success

```
┌─────────────────────────────┐
│ ✓ Sucesso!                  │
│ Escala criada com sucesso   │
└─────────────────────────────┘
```

### Toast Error

```
┌─────────────────────────────┐
│ ✗ Erro!                     │
│ Não foi possível salvar     │
└─────────────────────────────┘
```

### Toast Warning

```
┌─────────────────────────────┐
│ ⚠ Atenção!                  │
│ Conflito de agenda          │
└─────────────────────────────┘
```

## 📊 Gráficos

### Gráfico de Barras

```
Escalas por Ministério

Louvor    ████████████ 12
Dança     ████████ 8
Mídia     ██████ 6
Obreiros  ████ 4
Células   ██ 2
```

### Gráfico de Pizza

```
    Distribuição de Membros

        ╱─────╲
       ╱   30% ╲
      │  Louvor │
      │         │
       ╲   20% ╱
        ╲─────╱
```

## 🎨 Badges

```
[Louvor]    - Roxo
[Dança]     - Rosa
[Mídia]     - Azul
[Obreiros]  - Verde
[Células]   - Laranja

[Ativo]     - Verde
[Inativo]   - Cinza
[Pendente]  - Amarelo
```

## 🔘 Botões

### Primary

```
┌─────────────┐
│   Salvar    │
└─────────────┘
```

### Secondary

```
┌─────────────┐
│  Cancelar   │
└─────────────┘
```

### Destructive

```
┌─────────────┐
│   Deletar   │
└─────────────┘
```

### Ghost

```
  Editar
```

## 📝 Formulários

### Input

```
Label
┌─────────────────────────┐
│ Placeholder             │
└─────────────────────────┘
```

### Select

```
Label
┌─────────────────────────┐
│ Selecione...        ▼   │
└─────────────────────────┘
```

### Textarea

```
Label
┌─────────────────────────┐
│                         │
│                         │
│                         │
└─────────────────────────┘
```

### Checkbox

```
☑ Opção 1
☐ Opção 2
☑ Opção 3
```

### Radio

```
◉ Opção 1
○ Opção 2
○ Opção 3
```

## 🎭 Ícones

```
🏠 Home
👤 Usuário
👥 Equipe
📅 Calendário
🎵 Música
📊 Dashboard
⚙️ Configurações
🔔 Notificações
🔍 Buscar
➕ Adicionar
✏️ Editar
🗑️ Deletar
💾 Salvar
❌ Cancelar
✓ Confirmar
⚠️ Alerta
ℹ️ Info
```

## 📐 Espaçamentos

```
Padding:
p-2  = 8px
p-4  = 16px
p-6  = 24px
p-8  = 32px

Gap:
gap-2 = 8px
gap-4 = 16px
gap-6 = 24px
gap-8 = 32px
```

## 🔤 Tipografia

```
Heading 1: 2xl (24px) - Bold
Heading 2: xl (20px) - Semibold
Heading 3: lg (18px) - Semibold
Body: base (16px) - Regular
Small: sm (14px) - Regular
Tiny: xs (12px) - Regular
```

## 🎨 Sombras

```
Shadow SM:  Leve
Shadow MD:  Média
Shadow LG:  Grande
Shadow XL:  Extra Grande
```

## 📱 Breakpoints

```
Mobile:   < 640px
Tablet:   640px - 1024px
Desktop:  > 1024px
```

---

**Use este guia como referência visual ao desenvolver o projeto!**
