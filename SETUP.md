# Guia de Configuração Completo

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Git instalado
- Editor de código (VS Code recomendado)

## 🚀 Passo a Passo Completo

### 1. Configuração do Supabase

#### 1.1. Criar Conta e Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub ou email
4. Clique em "New Project"
5. Preencha:
   - **Name**: escalas-ministeriais
   - **Database Password**: Crie uma senha forte (anote!)
   - **Region**: Escolha a mais próxima (South America - São Paulo)
6. Clique em "Create new project"
7. Aguarde 2-3 minutos para o projeto ser criado

#### 1.2. Obter Credenciais
1. No dashboard do projeto, clique em "Settings" (ícone de engrenagem)
2. Clique em "API"
3. Anote:
   - **Project URL** (algo como: https://xxxxx.supabase.co)
   - **anon public** key (chave longa começando com eyJ...)

#### 1.3. Executar o Schema SQL
1. No menu lateral, clique em "SQL Editor"
2. Clique em "New query"
3. Abra o arquivo `supabase/schema.sql` deste projeto
4. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
5. Cole no SQL Editor do Supabase
6. Clique em "Run" (ou pressione Ctrl+Enter)
7. Aguarde a execução (pode levar 10-20 segundos)
8. Você verá "Success. No rows returned" - isso é normal!

#### 1.4. Configurar Storage
1. No menu lateral, clique em "Storage"
2. Clique em "Create a new bucket"
3. Preencha:
   - **Name**: audio-musicas
   - **Public bucket**: DESMARQUE (deixe privado)
4. Clique em "Create bucket"
5. Clique no bucket criado
6. Clique em "Policies"
7. Clique em "New policy"
8. Escolha "Custom policy"
9. Cole as policies do arquivo schema.sql (seção de Storage)

#### 1.5. Criar Primeiro Usuário Gerencial
1. No menu lateral, clique em "Authentication"
2. Clique em "Users"
3. Clique em "Add user"
4. Preencha:
   - **Email**: seu@email.com
   - **Password**: sua-senha-segura
   - **Auto Confirm User**: MARQUE
5. Clique em "Create user"
6. Anote o UUID do usuário criado

7. Volte ao SQL Editor
8. Execute este SQL (substitua o UUID):

```sql
-- Inserir perfil do usuário
INSERT INTO users_profile (auth_user_id, nome, email, ativo)
VALUES ('UUID-DO-USUARIO-AQUI', 'Administrador', 'seu@email.com', true);

-- Obter o ID do perfil gerencial
SELECT id FROM profiles WHERE codigo = 'gerencial';

-- Vincular usuário ao perfil gerencial (substitua os IDs)
INSERT INTO user_profiles (user_id, profile_id)
VALUES (
  (SELECT id FROM users_profile WHERE email = 'seu@email.com'),
  (SELECT id FROM profiles WHERE codigo = 'gerencial')
);
```

### 2. Configuração do Frontend

#### 2.1. Clonar/Baixar o Projeto
```bash
# Se estiver no GitHub
git clone https://github.com/seu-usuario/escalas-ministeriais.git
cd escalas-ministeriais

# Ou extraia o ZIP baixado e navegue até a pasta
```

#### 2.2. Instalar Dependências
```bash
npm install
```

Se houver erros, tente:
```bash
npm install --legacy-peer-deps
```

#### 2.3. Configurar Variáveis de Ambiente
1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Abra o arquivo `.env` no editor
3. Cole suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...sua-chave-aqui
```

#### 2.4. Executar o Projeto
```bash
npm run dev
```

O projeto abrirá em: http://localhost:5173

### 3. Primeiro Acesso

1. Acesse http://localhost:5173
2. Você será redirecionado para /login
3. Entre com as credenciais criadas no Supabase
4. Você será redirecionado para o dashboard

## 🌐 Deploy para GitHub Pages

### 1. Preparar o Projeto

#### 1.1. Atualizar vite.config.ts
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/escalas-ministeriais/', // Nome do seu repositório
})
```

#### 1.2. Criar Workflow do GitHub Actions
Crie o arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 20
          
      - name: Install dependencies
        run: npm install
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

### 2. Configurar GitHub

#### 2.1. Criar Repositório
1. Acesse github.com
2. Clique em "New repository"
3. Nome: escalas-ministeriais
4. Público ou Privado (sua escolha)
5. Clique em "Create repository"

#### 2.2. Adicionar Secrets
1. No repositório, vá em "Settings"
2. No menu lateral, clique em "Secrets and variables" > "Actions"
3. Clique em "New repository secret"
4. Adicione:
   - **Name**: VITE_SUPABASE_URL
   - **Value**: sua URL do Supabase
5. Repita para:
   - **Name**: VITE_SUPABASE_ANON_KEY
   - **Value**: sua chave anônima

#### 2.3. Habilitar GitHub Pages
1. Vá em "Settings" > "Pages"
2. Em "Source", selecione "GitHub Actions"
3. Salve

### 3. Fazer Deploy

```bash
# Adicionar arquivos
git add .

# Commit
git commit -m "Initial commit"

# Adicionar remote
git remote add origin https://github.com/seu-usuario/escalas-ministeriais.git

# Push
git push -u origin main
```

O GitHub Actions irá:
1. Instalar dependências
2. Fazer build do projeto
3. Fazer deploy para GitHub Pages

Acesse em: https://seu-usuario.github.io/escalas-ministeriais/

## 🔧 Solução de Problemas

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env` existe
- Verifique se as variáveis estão corretas
- Reinicie o servidor de desenvolvimento

### Erro ao fazer login
- Verifique se o usuário foi criado no Supabase
- Verifique se o perfil foi vinculado corretamente
- Verifique as policies RLS no Supabase

### Erro 404 no GitHub Pages
- Verifique se o `base` no vite.config.ts está correto
- Verifique se o GitHub Pages está habilitado
- Aguarde alguns minutos após o deploy

### Erro de permissão no Supabase
- Verifique se as policies RLS foram criadas
- Verifique se o usuário tem o perfil correto
- Execute novamente o schema.sql

## 📞 Suporte

Para problemas:
1. Verifique os logs do navegador (F12 > Console)
2. Verifique os logs do Supabase (Dashboard > Logs)
3. Abra uma issue no GitHub

## ✅ Checklist de Verificação

- [ ] Projeto Supabase criado
- [ ] Schema SQL executado com sucesso
- [ ] Bucket de storage criado
- [ ] Primeiro usuário gerencial criado
- [ ] Variáveis de ambiente configuradas
- [ ] Dependências instaladas
- [ ] Projeto rodando localmente
- [ ] Login funcionando
- [ ] Dashboard acessível
- [ ] (Opcional) Deploy no GitHub Pages funcionando
