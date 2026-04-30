# Guia de Componentes Shadcn/UI

Este projeto usa componentes do Shadcn/UI. Alguns componentes básicos já foram criados manualmente. Para adicionar mais componentes conforme necessário, siga as instruções abaixo.

## Componentes Já Incluídos

- ✅ Button
- ✅ Input
- ✅ Label
- ✅ Card

## Como Adicionar Novos Componentes

### Método 1: CLI do Shadcn/UI (Recomendado)

```bash
npx shadcn-ui@latest add [component-name]
```

### Componentes Necessários para o Projeto Completo

Execute os comandos abaixo para adicionar os componentes necessários:

```bash
# Componentes de formulário
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add radio-group

# Componentes de navegação
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add popover

# Componentes de feedback
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add dialog

# Componentes de dados
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add separator

# Componentes de calendário
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add date-picker
```

### Método 2: Criar Manualmente

Se preferir criar manualmente, siga o padrão dos componentes já criados:

1. Crie o arquivo em `src/components/ui/[component-name].tsx`
2. Use os componentes Radix UI correspondentes
3. Aplique os estilos com Tailwind CSS
4. Use a função `cn()` para merge de classes

## Componentes Prioritários por Feature

### Para Formulários de Cadastro
```bash
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add dialog
```

### Para Calendário de Escalas
```bash
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add badge
```

### Para Dashboard
```bash
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add table
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add separator
```

### Para Notificações
```bash
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert-dialog
```

## Configuração do Toast Provider

Após adicionar o componente Toast, adicione o provider no `App.tsx`:

```tsx
import { Toaster } from '@/components/ui/toaster'

function App() {
  return (
    <>
      {/* Seu código existente */}
      <Toaster />
    </>
  )
}
```

## Uso dos Componentes

### Exemplo: Dialog para Modal

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

function MyComponent() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Abrir Modal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Título do Modal</DialogTitle>
          <DialogDescription>
            Descrição do modal aqui
          </DialogDescription>
        </DialogHeader>
        {/* Conteúdo do modal */}
      </DialogContent>
    </Dialog>
  )
}
```

### Exemplo: Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function MyComponent() {
  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Selecione..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Opção 1</SelectItem>
        <SelectItem value="option2">Opção 2</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

### Exemplo: Toast

```tsx
import { useToast } from '@/components/ui/use-toast'

function MyComponent() {
  const { toast } = useToast()

  const showToast = () => {
    toast({
      title: "Sucesso!",
      description: "Operação realizada com sucesso.",
    })
  }

  return <Button onClick={showToast}>Mostrar Toast</Button>
}
```

## Customização

Todos os componentes podem ser customizados através do `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      // Suas cores customizadas
    },
  },
}
```

## Documentação Completa

Para mais informações sobre cada componente:
- [Shadcn/UI Docs](https://ui.shadcn.com/docs/components)
- [Radix UI Docs](https://www.radix-ui.com/docs/primitives/overview/introduction)

## Troubleshooting

### Erro: "Module not found"
- Verifique se o componente foi instalado corretamente
- Verifique o caminho de importação
- Reinicie o servidor de desenvolvimento

### Estilos não aplicados
- Verifique se o Tailwind CSS está configurado corretamente
- Verifique se o arquivo `index.css` está importado
- Limpe o cache: `npm run dev -- --force`

### Componente não renderiza
- Verifique se todas as dependências foram instaladas
- Verifique se o componente está sendo usado corretamente
- Consulte a documentação do Shadcn/UI
