# 🔐 Solução para Problema de Senha

## Opção 1: Resetar Senha via SQL (Mais Rápido)

Execute este SQL no SQL Editor do Supabase:

```sql
-- Resetar senha para 'senha123'
UPDATE auth.users
SET 
  encrypted_password = crypt('senha123', gen_salt('bf')),
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'admin@igreja.com';
```

Depois tente fazer login novamente com:
- Email: `admin@igreja.com`
- Senha: `senha123`

---

## Opção 2: Resetar Senha via Interface do Supabase

1. Acesse: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/auth/users

2. Encontre o usuário `admin@igreja.com`

3. Clique nos **3 pontinhos** (⋮) ao lado do usuário

4. Clique em **"Reset Password"**

5. Digite a nova senha: `senha123`

6. Confirme

7. Tente fazer login novamente

---

## Opção 3: Criar Novo Usuário do Zero

Se as opções acima não funcionarem, vamos criar um novo usuário:

### Passo 1: Deletar o usuário antigo

No SQL Editor:

```sql
-- Deletar perfil do usuário
DELETE FROM users_profile WHERE email = 'admin@igreja.com';

-- Deletar usuário de autenticação
DELETE FROM auth.users WHERE email = 'admin@igreja.com';
```

### Passo 2: Criar novo usuário

1. Vá em: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/auth/users

2. Clique em **"Add user"** → **"Create new user"**

3. Preencha:
   ```
   Email: admin@igreja.com
   Password: Admin@123
   ✅ Auto Confirm User (IMPORTANTE!)
   ```

4. Clique em **"Create user"**

5. **COPIE O ID DO USUÁRIO**

### Passo 3: Criar perfil

Execute no SQL Editor (substitua o ID):

```sql
DO $$
DECLARE
  v_auth_user_id uuid := 'COLE-O-ID-AQUI';
  v_user_profile_id uuid;
BEGIN
  -- Criar perfil
  INSERT INTO users_profile (auth_user_id, nome, email, ativo)
  VALUES (v_auth_user_id, 'Administrador', 'admin@igreja.com', true)
  RETURNING id INTO v_user_profile_id;

  -- Atribuir perfil gerencial
  INSERT INTO user_profiles (user_id, profile_id)
  SELECT v_user_profile_id, id 
  FROM profiles 
  WHERE codigo = 'gerencial';

  RAISE NOTICE 'Usuário criado!';
END $$;
```

### Passo 4: Fazer login

Use:
- Email: `admin@igreja.com`
- Senha: `Admin@123`

---

## Opção 4: Usar Email Magic Link (Sem Senha)

Se você configurou SMTP no Supabase, pode usar login sem senha:

1. Na tela de login, clique em "Esqueci minha senha"
2. Digite o email
3. Receba o link por email
4. Clique no link para fazer login

---

## 🔍 Verificar se o Usuário Está Confirmado

Execute no SQL Editor:

```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  encrypted_password IS NOT NULL as has_password
FROM auth.users
WHERE email = 'admin@igreja.com';
```

**O que verificar**:
- ✅ `email_confirmed_at` deve ter uma data (não NULL)
- ✅ `confirmed_at` deve ter uma data (não NULL)
- ✅ `has_password` deve ser `true`

Se algum desses estiver NULL ou false, execute:

```sql
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'admin@igreja.com';
```

---

## 🐛 Debug: Ver Erro Completo

Abra o Console do navegador (F12) e veja a aba **Console** para ver o erro completo.

Erros comuns:
- `Email not confirmed` → Execute o UPDATE acima
- `Invalid login credentials` → Senha incorreta, use Opção 1 ou 2
- `User not found` → Usuário não existe, use Opção 3

---

## ✅ Recomendação

**Use a Opção 1** (Resetar via SQL) - é a mais rápida e confiável!

Depois de executar, aguarde 5 segundos e tente fazer login novamente.
