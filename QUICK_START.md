# Quick Start Guide

Guia rápido para começar a usar o sistema em 5 minutos.

## ⚡ Setup Rápido

### 1. Instalar Dependências (2 min)

```bash
npm install
```

### 2. Configurar Supabase (2 min)

1. Crie conta em [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Copie URL e Anon Key
4. Execute o SQL do arquivo `supabase/schema.sql`

### 3. Configurar Ambiente (30 seg)

```bash
cp .env.example .env
```

Edite `.env`:
```env
VITE_SUPABASE_URL=sua-url-aqui
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

### 4. Rodar Projeto (30 seg)

```bash
npm run dev
```

Acesse: http://localhost:5173

## 🎯 Comandos Principais

### Desenvolvimento
```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview da build
npm run lint         # Verifica código
```

### Adicionar Componentes
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
```

### Git
```bash
git add .
git commit -m "feat: nova funcionalidade"
git push
```

## 📝 Criar Primeiro Usuário

### No Supabase Dashboard:

1. **Authentication** → **Users** → **Add user**
2. Preencha email e senha
3. Marque "Auto Confirm User"
4. Copie o UUID do usuário

### No SQL Editor:

```sql
-- Criar perfil
INSERT INTO users_profile (auth_user_id, nome, email, ativo)
VALUES ('UUID-AQUI', 'Admin', 'admin@email.com', true);

-- Vincular ao perfil gerencial
INSERT INTO user_profiles (user_id, profile_id)
VALUES (
  (SELECT id FROM users_profile WHERE email = 'admin@email.com'),
  (SELECT id FROM profiles WHERE codigo = 'gerencial')
);
```

## 🚀 Deploy GitHub Pages

### 1. Configurar Repositório

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/escalas-ministeriais.git
git push -u origin main
```

### 2. Configurar Secrets

No GitHub:
1. **Settings** → **Secrets and variables** → **Actions**
2. Adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 3. Habilitar Pages

1. **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Save

### 4. Deploy

```bash
git push
```

Acesse: `https://seu-usuario.github.io/escalas-ministeriais/`

## 📚 Estrutura Básica

```
src/
├── components/     # Componentes reutilizáveis
├── pages/         # Páginas da aplicação
├── services/      # Comunicação com Supabase
├── stores/        # Estado global (Zustand)
├── types/         # TypeScript types
└── lib/           # Configurações
```

## 🔑 Perfis do Sistema

- **gerencial**: Acesso total
- **lider_louvor**: Gerencia louvor
- **lider_danca**: Gerencia dança
- **lider_midia**: Gerencia mídia
- **lider_obreiros**: Gerencia obreiros
- **lider_celula**: Gerencia células
- **membro_***: Acesso de membro

## 🎨 Cores por Ministério

```css
Louvor:   #8b5cf6 (roxo)
Dança:    #ec4899 (rosa)
Mídia:    #3b82f6 (azul)
Obreiros: #10b981 (verde)
Células:  #f97316 (laranja)
```

## 🛠️ Troubleshooting Rápido

### Erro: "Missing Supabase environment variables"
```bash
# Verifique o arquivo .env
cat .env

# Reinicie o servidor
npm run dev
```

### Erro ao fazer login
```sql
-- Verifique se o usuário tem perfil
SELECT u.*, up.*, p.*
FROM users_profile u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN profiles p ON up.profile_id = p.id
WHERE u.email = 'seu@email.com';
```

### Erro 404 no GitHub Pages
```typescript
// vite.config.ts
export default defineConfig({
  base: '/nome-do-repositorio/', // Verifique isso
})
```

## 📖 Documentação Completa

- **README.md**: Visão geral
- **SETUP.md**: Setup detalhado
- **ARCHITECTURE.md**: Arquitetura
- **COMPONENTS.md**: Componentes UI

## 🆘 Precisa de Ajuda?

1. Verifique a documentação
2. Veja os logs do navegador (F12)
3. Veja os logs do Supabase
4. Abra uma issue no GitHub

## ✅ Checklist

- [ ] Node.js instalado
- [ ] Projeto Supabase criado
- [ ] Schema SQL executado
- [ ] Variáveis de ambiente configuradas
- [ ] Dependências instaladas
- [ ] Primeiro usuário criado
- [ ] Login funcionando
- [ ] Dashboard acessível

## 🎉 Pronto!

Agora você pode:
- Criar equipes
- Cadastrar membros
- Montar escalas
- Gerenciar células
- Cadastrar músicas

---

**Dica**: Comece criando equipes e membros antes de criar escalas!
