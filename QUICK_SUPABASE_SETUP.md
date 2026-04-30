# ⚡ Setup Rápido do Supabase

## ✅ Passo 1: Credenciais Configuradas

O arquivo `.env` já foi criado com suas credenciais! ✅

## 🗄️ Passo 2: Executar o Schema SQL

Agora você precisa criar as tabelas no Supabase:

### Como fazer:

1. **Acesse seu projeto no Supabase**: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh

2. **Abra o SQL Editor**:
   - No menu lateral esquerdo, clique em **"SQL Editor"**
   - Clique em **"New query"**

3. **Copie o Schema**:
   - Abra o arquivo `supabase/schema.sql` deste projeto
   - Selecione TODO o conteúdo (Ctrl+A)
   - Copie (Ctrl+C)

4. **Execute no Supabase**:
   - Cole o conteúdo no SQL Editor do Supabase (Ctrl+V)
   - Clique no botão **"Run"** (ou pressione Ctrl+Enter)
   - Aguarde a execução (pode levar 10-20 segundos)

5. **Verifique se deu certo**:
   - No menu lateral, clique em **"Table Editor"**
   - Você deve ver várias tabelas criadas:
     - profiles
     - users_profile
     - team_types
     - teams
     - schedules
     - songs
     - E outras...

## 👤 Passo 3: Criar Primeiro Usuário

### Opção Fácil (Recomendada):

1. No Supabase, clique em **"Authentication"** no menu lateral
2. Clique em **"Users"**
3. Clique em **"Add user"** → **"Create new user"**
4. Preencha:
   - **Email**: admin@igreja.com (ou seu email)
   - **Password**: senha123 (ou sua senha)
   - **✅ Auto Confirm User**: MARQUE ESTA OPÇÃO!
5. Clique em **"Create user"**

### Depois de criar o usuário:

Você precisa criar o perfil dele. Execute este SQL no SQL Editor:

```sql
-- 1. Pegue o ID do usuário que você acabou de criar
-- Vá em Authentication → Users e copie o ID (UUID)

-- 2. Crie o perfil do usuário (substitua o auth_user_id pelo ID copiado)
INSERT INTO users_profile (auth_user_id, nome, email, ativo)
VALUES (
  'COLE-O-ID-DO-USUARIO-AQUI',
  'Administrador',
  'admin@igreja.com',
  true
);

-- 3. Atribua o perfil gerencial
-- Primeiro, pegue o ID do usuário que acabou de criar em users_profile
-- Depois execute:
INSERT INTO user_profiles (user_id, profile_id)
SELECT 
  (SELECT id FROM users_profile WHERE email = 'admin@igreja.com'),
  (SELECT id FROM profiles WHERE codigo = 'gerencial');
```

### Ou use este SQL completo (mais fácil):

```sql
-- Criar usuário completo com perfil gerencial
DO $$
DECLARE
  v_auth_user_id uuid;
  v_user_profile_id uuid;
BEGIN
  -- Pegar o ID do usuário de autenticação pelo email
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = 'admin@igreja.com';
  
  -- Se não encontrou, mostrar erro
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado. Crie primeiro em Authentication → Users';
  END IF;
  
  -- Criar perfil do usuário
  INSERT INTO users_profile (auth_user_id, nome, email, ativo)
  VALUES (v_auth_user_id, 'Administrador', 'admin@igreja.com', true)
  ON CONFLICT (auth_user_id) DO NOTHING
  RETURNING id INTO v_user_profile_id;
  
  -- Se já existia, pegar o ID
  IF v_user_profile_id IS NULL THEN
    SELECT id INTO v_user_profile_id 
    FROM users_profile 
    WHERE auth_user_id = v_auth_user_id;
  END IF;
  
  -- Atribuir perfil gerencial
  INSERT INTO user_profiles (user_id, profile_id)
  SELECT v_user_profile_id, id 
  FROM profiles 
  WHERE codigo = 'gerencial'
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Usuário criado com sucesso!';
END $$;
```

## 🚀 Passo 4: Rodar o Projeto

No terminal, execute:

```bash
npm install
npm run dev
```

Depois abra o navegador em: http://localhost:5173

## 🔐 Fazer Login

Use as credenciais que você criou:
- **Email**: admin@igreja.com
- **Senha**: senha123

## ✅ Checklist Rápido

- [ ] Arquivo `.env` criado (já está pronto! ✅)
- [ ] Schema SQL executado no Supabase
- [ ] Tabelas visíveis no Table Editor
- [ ] Usuário criado em Authentication
- [ ] Perfil do usuário criado (SQL acima)
- [ ] Projeto rodando (`npm run dev`)
- [ ] Login funcionando

## 🐛 Problemas?

### "Invalid login credentials"
- Certifique-se de marcar "Auto Confirm User" ao criar o usuário
- Verifique se executou o SQL para criar o perfil
- Tente resetar a senha no Supabase

### "relation does not exist"
- O schema SQL não foi executado
- Execute novamente o conteúdo de `supabase/schema.sql`

### Erro ao executar o schema
- Execute em partes menores
- Verifique se há mensagens de erro no SQL Editor
- Algumas mensagens de "NOTICE" são normais

## 📞 Próximos Passos

Após fazer login:

1. ✅ Criar tipos de equipe (já vem no schema)
2. ✅ Criar equipes de ministérios
3. ✅ Adicionar membros
4. ✅ Cadastrar músicas
5. ✅ Criar escalas

---

**Seu projeto Supabase**: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh

**Precisa de ajuda?** Abra o console do navegador (F12) para ver erros detalhados.
