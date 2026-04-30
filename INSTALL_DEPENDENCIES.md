# Instalação de Dependências

## 📦 Dependências Necessárias

O projeto precisa de algumas dependências adicionais do Radix UI que não vêm por padrão.

### Instalar Todas de Uma Vez

```bash
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-toast @radix-ui/react-checkbox @radix-ui/react-label @hookform/resolvers
```

### Ou Instalar Individualmente

```bash
# Radix UI Components
npm install @radix-ui/react-dialog
npm install @radix-ui/react-select
npm install @radix-ui/react-toast
npm install @radix-ui/react-checkbox
npm install @radix-ui/react-label

# Form Validation
npm install @hookform/resolvers
```

## ✅ Dependências Já Incluídas no package.json

Estas já estão no `package.json` e serão instaladas com `npm install`:

- react
- react-dom
- react-router-dom
- @tanstack/react-query
- @supabase/supabase-js
- zustand
- react-hook-form
- zod
- tailwindcss
- lucide-react
- class-variance-authority
- clsx
- tailwind-merge
- date-fns

## 🔧 Verificar Instalação

Após instalar, verifique se tudo está OK:

```bash
npm list @radix-ui/react-dialog
npm list @radix-ui/react-select
npm list @radix-ui/react-toast
npm list @radix-ui/react-checkbox
npm list @hookform/resolvers
```

## 🚨 Problemas Comuns

### Erro: "Cannot find module '@radix-ui/react-dialog'"

**Solução**: Instale a dependência
```bash
npm install @radix-ui/react-dialog
```

### Erro: "peer dependencies"

**Solução**: Use --legacy-peer-deps
```bash
npm install --legacy-peer-deps
```

### Erro: "ERESOLVE unable to resolve dependency tree"

**Solução**: Limpe o cache e reinstale
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📋 Checklist de Instalação

- [ ] Node.js 18+ instalado
- [ ] npm atualizado
- [ ] Dependências do package.json instaladas (`npm install`)
- [ ] Dependências Radix UI instaladas
- [ ] Arquivo .env configurado
- [ ] Supabase configurado
- [ ] Schema SQL executado

## 🎯 Próximo Passo

Após instalar todas as dependências:

1. Configure o `.env`
2. Execute o schema SQL no Supabase
3. Rode o projeto: `npm run dev`

## 💡 Dica

Se você está começando do zero, rode:

```bash
# 1. Instalar todas as dependências
npm install

# 2. Instalar dependências adicionais
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-toast @radix-ui/react-checkbox @radix-ui/react-label @hookform/resolvers

# 3. Configurar .env
cp .env.example .env
# Edite o .env com suas credenciais

# 4. Rodar projeto
npm run dev
```

---

**Pronto!** Todas as dependências estarão instaladas e o projeto funcionando.
