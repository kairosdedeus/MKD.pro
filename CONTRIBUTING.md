# Guia de Contribuição

Obrigado por considerar contribuir com o projeto Escalas Ministeriais! 🎉

## 📋 Código de Conduta

Este projeto segue um código de conduta. Ao participar, você concorda em manter um ambiente respeitoso e acolhedor.

## 🚀 Como Contribuir

### 1. Fork o Projeto

```bash
# Clone seu fork
git clone https://github.com/seu-usuario/escalas-ministeriais.git
cd escalas-ministeriais

# Adicione o repositório original como upstream
git remote add upstream https://github.com/original/escalas-ministeriais.git
```

### 2. Crie uma Branch

```bash
# Atualize sua main
git checkout main
git pull upstream main

# Crie uma branch para sua feature
git checkout -b feature/minha-feature
```

### 3. Faça suas Alterações

- Escreva código limpo e bem documentado
- Siga os padrões do projeto
- Adicione testes se aplicável
- Atualize a documentação

### 4. Commit suas Mudanças

Use conventional commits:

```bash
git add .
git commit -m "feat: adiciona nova funcionalidade"
```

Tipos de commit:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

### 5. Push para seu Fork

```bash
git push origin feature/minha-feature
```

### 6. Abra um Pull Request

1. Vá para o repositório original no GitHub
2. Clique em "New Pull Request"
3. Selecione sua branch
4. Preencha o template de PR
5. Aguarde review

## 📝 Template de Pull Request

```markdown
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. Passo 1
2. Passo 2
3. Passo 3

## Screenshots (se aplicável)
Cole aqui

## Checklist
- [ ] Código segue os padrões do projeto
- [ ] Comentários foram adicionados onde necessário
- [ ] Documentação foi atualizada
- [ ] Testes foram adicionados/atualizados
- [ ] Todas as verificações passaram
```

## 🎯 Áreas para Contribuir

### 🐛 Reportar Bugs

Use o template de issue:

```markdown
**Descrição do Bug**
Descrição clara do problema

**Como Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

**Comportamento Esperado**
O que deveria acontecer

**Screenshots**
Se aplicável

**Ambiente**
- OS: [ex: Windows 10]
- Browser: [ex: Chrome 120]
- Versão: [ex: 1.0.0]

**Contexto Adicional**
Qualquer outra informação relevante
```

### ✨ Sugerir Funcionalidades

Use o template de feature request:

```markdown
**Problema que Resolve**
Descrição clara do problema

**Solução Proposta**
Como você imagina a solução

**Alternativas Consideradas**
Outras soluções que você pensou

**Contexto Adicional**
Screenshots, mockups, etc
```

### 📚 Melhorar Documentação

- Corrigir erros de digitação
- Adicionar exemplos
- Melhorar explicações
- Traduzir documentação

### 🧪 Adicionar Testes

- Testes unitários
- Testes de integração
- Testes E2E

### 🎨 Melhorar UI/UX

- Melhorar acessibilidade
- Otimizar responsividade
- Adicionar animações
- Melhorar feedback visual

## 🔧 Configuração do Ambiente

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Git
- Conta no Supabase

### Setup

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Rodar projeto
npm run dev
```

## 📏 Padrões de Código

### TypeScript

```typescript
// ✅ Bom
interface UserProps {
  name: string
  age: number
}

function User({ name, age }: UserProps) {
  return <div>{name} - {age}</div>
}

// ❌ Ruim
function User(props: any) {
  return <div>{props.name} - {props.age}</div>
}
```

### Componentes

```typescript
// ✅ Bom - Componente funcional com tipos
interface ButtonProps {
  label: string
  onClick: () => void
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>
}

// ❌ Ruim - Sem tipos
export function Button(props) {
  return <button onClick={props.onClick}>{props.label}</button>
}
```

### Naming

```typescript
// Componentes: PascalCase
export function MyComponent() {}

// Hooks: camelCase com prefixo 'use'
export function useMyHook() {}

// Services: camelCase com sufixo 'Service'
export const myService = {}

// Constants: UPPER_SNAKE_CASE
export const MY_CONSTANT = 'value'

// Types/Interfaces: PascalCase
export interface MyType {}
```

### Imports

```typescript
// Ordem:
// 1. React
import { useState } from 'react'

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

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Escrever Testes

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('should render with label', () => {
    render(<Button label="Click me" onClick={() => {}} />)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button label="Click me" onClick={onClick} />)
    screen.getByText('Click me').click()
    expect(onClick).toHaveBeenCalled()
  })
})
```

## 📖 Documentação

### Comentários

```typescript
// ✅ Bom - Comentário útil
// Calcula o total de membros ativos nas equipes
function calculateActiveMembers(teams: Team[]): number {
  return teams.reduce((acc, team) => 
    acc + team.members.filter(m => m.ativo).length, 0
  )
}

// ❌ Ruim - Comentário óbvio
// Retorna o nome
function getName() {
  return name
}
```

### JSDoc

```typescript
/**
 * Busca equipes por tipo
 * @param teamTypeCode - Código do tipo de equipe
 * @returns Promise com array de equipes
 * @throws Error se a busca falhar
 */
async function getTeams(teamTypeCode: string): Promise<Team[]> {
  // ...
}
```

## 🔍 Review Process

### O que Verificamos

1. **Funcionalidade**: O código faz o que deveria?
2. **Qualidade**: O código é limpo e bem estruturado?
3. **Testes**: Há testes adequados?
4. **Documentação**: A documentação foi atualizada?
5. **Performance**: Há problemas de performance?
6. **Segurança**: Há vulnerabilidades?

### Tempo de Review

- PRs pequenos: 1-2 dias
- PRs médios: 3-5 dias
- PRs grandes: 1 semana+

### Feedback

- Seja respeitoso e construtivo
- Explique o "porquê" das sugestões
- Aprenda com o feedback recebido

## 🎓 Recursos para Contribuidores

### Documentação do Projeto

- [README.md](README.md) - Visão geral
- [SETUP.md](SETUP.md) - Configuração
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura
- [DEVELOPMENT_TIPS.md](DEVELOPMENT_TIPS.md) - Dicas

### Tutoriais

- [React](https://react.dev/learn)
- [TypeScript](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Supabase](https://supabase.com/docs)
- [TailwindCSS](https://tailwindcss.com/docs)

### Comunidade

- GitHub Discussions
- Discord (se houver)
- Issues do GitHub

## 🏆 Reconhecimento

Contribuidores serão:
- Listados no README
- Mencionados no changelog
- Reconhecidos nas releases

## ❓ Dúvidas

Tem dúvidas? Abra uma issue com a tag `question` ou entre em contato.

## 📜 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto (MIT).

---

**Obrigado por contribuir! 🙏**
