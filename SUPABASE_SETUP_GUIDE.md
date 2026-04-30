# 🚀 Guia de Configuração do Supabase

Este guia vai te ajudar a conectar o projeto ao Supabase passo a passo.

## 📋 Pré-requisitos

- Conta no Supabase (gratuita): https://supabase.com
- Node.js instalado
- Projeto clonado localmente

## 🔧 Passo 1: Criar Projeto no Supabase

1. Acesse https://supabase.com e faça login
2. Clique em **"New Project"**
3. Preencha as informações:
   - **Name**: `escalas-ministeriais` (ou nome de sua preferência)
   - **Database Password**: Crie uma senha forte (GUARDE ESTA SENHA!)
   - **Region**: Escolha a região mais próxima (ex: South America - São Paulo)
   - **Pricing Plan**: Free (suficiente para começar)
4. Clique em **"Create new project"**
5. Aguarde 2-3 minutos enquanto o projeto é criado

## 🔑 Passo 2: Obter as Credenciais

Após o projeto ser criado:

1. No painel do Supabase, clique em **"Settings"** (ícone de engrenagem) no menu lateral
2. Clique em **"API"**
3. Você verá duas informações importantes:

### Project URL
```
https://seu-projeto-id.supabase.co
```

### API Keys
- **anon/public**: Esta é a chave que vamos usar
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE**: Copie estas informações, vamos usá-las no próximo passo!

## 📝 Passo 3: Configurar Variáveis de Ambiente

1. Na raiz do projeto, crie um arquivo chamado `.env`:

```bash
# No terminal, na pasta do projeto:
copy .env.example .env
```

Ou crie manualmente um arquivo `.env` na raiz do projeto.

2. Abra o arquivo `.env` e cole suas credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **ATENÇÃO**: 
- Substitua os valores pelos seus dados reais do Supabase
- Não compartilhe este arquivo
- O `.env` já está no `.gitignore` (não será enviado ao Git)

## 🗄️ Passo 4: Executar o Schema SQL

Agora vamos criar todas as tabelas, funções e dados iniciais:

1. No painel do Supabase, clique em **"SQL Editor"** no menu lateral
2. Clique em **"New query"**
3. Abra o arquivo `supabase/schema.sql` deste projeto
4. **Copie TODO o conteúdo** do arquivo
5. **Cole** no SQL Editor do Supabase
6. Clique em **"Run"** (ou pressione Ctrl+Enter)

Você verá mensagens de sucesso. O script vai criar:
- ✅ 17 tabelas
- ✅ Políticas RLS (Row Level Security)
- ✅ Triggers automáticos
- ✅ Funções auxiliares
- ✅ Dados iniciais (perfis, tipos de equipe, funções)
- ✅ Bucket de storage para áudios

### Verificar se deu certo

No menu lateral, clique em **"Table Editor"**. Você deve ver estas tabelas:
- profiles
- users_profile
- user_profiles
- team_types
- teams
- team_members
- team_functions
- team_member_functions
- schedules
- schedule_members
- schedule_member_functions
- songs
- schedule_songs
- cells
- cell_members
- cell_meetings
- cell_attendance

## 👤 Passo 5: Criar Primeiro Usuário

### Opção A: Via Interface do Supabase (Recomendado)

1. No Supabase, clique em **"Authentication"** no menu lateral
2. Clique em **"Users"**
3. Clique em **"Add user"** → **"Create new user"**
4. Preencha:
   - **Email**: seu-email@exemplo.com
   - **Password**: sua-senha-segura
   - **Auto Confirm User**: ✅ Marque esta opção
5. Clique em **"Create user"**

### Opção B: Via SQL

No SQL Editor, execute:

```sql
-- Criar usuário de autenticação
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@igreja.com',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

### Criar Perfil do Usuário

Após criar o usuário de autenticação, crie o perfil:

1. Vá em **"Table Editor"** → **"users_profile"**
2. Clique em **"Insert"** → **"Insert row"**
3. Preencha:
   - **auth_user_id**: Copie o ID do usuário criado (em Authentication → Users)
   - **nome**: Seu Nome
   - **email**: mesmo email usado acima
   - **telefone**: (opcional)
   - **ativo**: true
4. Clique em **"Save"**

### Atribuir Perfil Gerencial

1. Vá em **"Table Editor"** → **"user_profiles"**
2. Clique em **"Insert"** → **"Insert row"**
3. Preencha:
   - **user_id**: ID do usuário criado em users_profile
   - **profile_id**: Copie o ID do perfil "Gerencial" da tabela profiles
4. Clique em **"Save"**

## 🎨 Passo 6: Configurar Storage (Opcional)

Para upload de áudios de músicas:

1. No Supabase, clique em **"Storage"** no menu lateral
2. Você deve ver o bucket **"audio-musicas"** (criado pelo schema)
3. Clique no bucket
4. Clique em **"Policies"**
5. Verifique se as políticas estão ativas:
   - ✅ Usuários autenticados podem fazer upload
   - ✅ Usuários autenticados podem ler arquivos

Se não estiverem, execute no SQL Editor:

```sql
-- Política de upload
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-musicas');

-- Política de leitura
CREATE POLICY "Usuários autenticados podem ler arquivos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audio-musicas');
```

## 🚀 Passo 7: Testar a Conexão

1. Certifique-se de que o arquivo `.env` está configurado
2. No terminal, execute:

```bash
npm install
npm run dev
```

3. Abra o navegador em `http://localhost:5173`
4. Faça login com as credenciais criadas
5. Você deve ver o dashboard!

## ✅ Checklist de Verificação

Marque conforme for completando:

- [ ] Projeto criado no Supabase
- [ ] URL e API Key copiadas
- [ ] Arquivo `.env` criado e configurado
- [ ] Schema SQL executado com sucesso
- [ ] Tabelas visíveis no Table Editor
- [ ] Primeiro usuário criado
- [ ] Perfil do usuário criado
- [ ] Perfil gerencial atribuído
- [ ] Storage configurado
- [ ] Projeto rodando localmente
- [ ] Login funcionando

## 🐛 Problemas Comuns

### Erro: "Invalid API key"
- Verifique se copiou a chave correta (anon/public)
- Certifique-se de que não há espaços extras
- Reinicie o servidor de desenvolvimento

### Erro: "relation does not exist"
- O schema SQL não foi executado completamente
- Execute novamente o schema.sql
- Verifique se há erros no SQL Editor

### Erro ao fazer login: "Invalid login credentials"
- Verifique se o usuário foi criado corretamente
- Confirme que marcou "Auto Confirm User"
- Tente resetar a senha no Supabase

### Erro: "Row Level Security"
- As políticas RLS podem estar bloqueando
- Verifique se o usuário tem perfil atribuído
- Execute as políticas RLS do schema.sql novamente

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)

## 💡 Dicas

1. **Backup**: Sempre faça backup do schema SQL
2. **Desenvolvimento**: Use um projeto Supabase separado para testes
3. **Produção**: Crie outro projeto para produção
4. **Segurança**: Nunca compartilhe suas chaves de API
5. **Logs**: Use o SQL Editor para debugar queries

## 🎉 Próximos Passos

Após conectar o Supabase:

1. ✅ Criar equipes de ministérios
2. ✅ Adicionar membros às equipes
3. ✅ Cadastrar músicas
4. ✅ Criar escalas
5. ✅ Explorar os dashboards

---

**Precisa de ajuda?** Verifique os logs do navegador (F12 → Console) para mensagens de erro detalhadas.
