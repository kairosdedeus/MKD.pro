# 🚀 IMPLEMENTAÇÃO: Criar Usuário com Geração Automática de Login

## ✅ O QUE FOI IMPLEMENTADO

### 1. **Modal de Criação de Usuário Atualizado**
- ✅ Campo separado para **Nome** e **Sobrenome**
- ✅ Geração automática de email/login
- ✅ Preview do email gerado em tempo real
- ✅ Validação de campos

### 2. **Regra de Geração de Email**
**Formato:** `[primeira_letra_nome][ultimo_sobrenome]@mkd.com`

**Exemplos:**
- Nome: `Michael` | Sobrenome: `Felipe Cabrera` → `mcabrera@mkd.com`
- Nome: `João` | Sobrenome: `Silva` → `jsilva@mkd.com`
- Nome: `Maria` | Sobrenome: `Santos Costa` → `mcosta@mkd.com`

**Características:**
- Remove acentos automaticamente
- Converte para minúsculas
- Pega sempre o último sobrenome
- Se houver apenas um sobrenome, usa ele

### 3. **Função SQL para Criar Usuário**
Criada função `create_user_with_auth` que:
- ✅ Cria usuário em `auth.users`
- ✅ Cria identity em `auth.identities`
- ✅ Cria perfil em `users_profile`
- ✅ Retorna IDs criados

---

## 📋 PASSO A PASSO PARA ATIVAR

### PASSO 1: Executar Função SQL

1. Acesse: https://supabase.com/dashboard/project/ewuvrindvhjislkrohwh/sql/new
2. Abra o arquivo **`supabase/funcao-criar-usuario.sql`** no VS Code
3. Copie TODO o conteúdo
4. Cole no SQL Editor do Supabase
5. Clique em **Run**

**Resultado esperado:**
```
CREATE FUNCTION
GRANT
```

---

### PASSO 2: Testar a Criação de Usuário

1. No sistema, vá em **"Usuários"** no menu lateral
2. Clique em **"Novo Usuário"**
3. Preencha:
   - **Nome:** Michael
   - **Sobrenome:** Felipe Cabrera
   - **Telefone:** (11) 99999-9999 (opcional)
   - **Senha:** senha123 (mínimo 8 caracteres)
   - **Perfis:** Selecione pelo menos um
4. Observe que o email é gerado automaticamente: `mcabrera@mkd.com`
5. Clique em **"Criar Usuário"**

**Resultado esperado:**
- ✅ Usuário criado com sucesso
- ✅ Toast mostrando "Usuário criado! Login: mcabrera@mkd.com"
- ✅ Usuário aparece na lista

---

### PASSO 3: Verificar Usuário Criado

Execute no SQL Editor:

```sql
-- Ver usuário no auth.users
SELECT 
    u.email,
    u.created_at,
    u.confirmed_at
FROM auth.users u
WHERE u.email = 'mcabrera@mkd.com';

-- Ver perfil do usuário
SELECT 
    up.nome,
    up.email,
    up.telefone,
    up.ativo
FROM users_profile up
WHERE up.email = 'mcabrera@mkd.com';

-- Ver perfis atribuídos
SELECT 
    up.nome as usuario,
    p.nome as perfil
FROM users_profile up
JOIN user_profiles upr ON upr.user_id = up.id
JOIN profiles p ON p.id = upr.profile_id
WHERE up.email = 'mcabrera@mkd.com';
```

---

### PASSO 4: Testar Login com Novo Usuário

1. Faça logout do sistema
2. Acesse: http://localhost:5173/login
3. Digite:
   - **Email:** mcabrera@mkd.com
   - **Senha:** senha123
4. Clique em **Entrar**

**Resultado esperado:**
- ✅ Login bem-sucedido
- ✅ Redirecionado para o dashboard
- ✅ Nome do usuário aparece no menu

---

## 🎯 EXEMPLOS DE GERAÇÃO DE EMAIL

| Nome | Sobrenome | Email Gerado |
|------|-----------|--------------|
| Michael | Felipe Cabrera | mcabrera@mkd.com |
| João | Silva | jsilva@mkd.com |
| Maria | Santos Costa | mcosta@mkd.com |
| José | Oliveira | joliveira@mkd.com |
| Ana | Paula Souza | psouza@mkd.com |
| Pedro | Henrique Lima Santos | psantos@mkd.com |
| Carlos | Ferreira | cferreira@mkd.com |

---

## 🔧 ARQUIVOS MODIFICADOS

1. **`src/components/features/users/CreateUserModal.tsx`**
   - Adicionado campos nome e sobrenome separados
   - Implementada geração automática de email
   - Adicionado preview do email gerado

2. **`src/services/userService.ts`**
   - Atualizado para usar função SQL `create_user_with_auth`
   - Remove dependência de `auth.admin` (não disponível no frontend)

3. **`supabase/funcao-criar-usuario.sql`** (NOVO)
   - Função SQL para criar usuário completo
   - Cria em auth.users, auth.identities e users_profile

---

## 🚨 TROUBLESHOOTING

### Erro: "function create_user_with_auth does not exist"
**Solução:** Execute o arquivo `supabase/funcao-criar-usuario.sql`

### Erro: "duplicate key value violates unique constraint"
**Causa:** Email já existe no sistema
**Solução:** Use outro nome/sobrenome ou delete o usuário existente

### Email não está sendo gerado
**Solução:** 
- Verifique se preencheu nome E sobrenome
- Recarregue a página (Ctrl+Shift+R)

### Usuário criado mas não consegue fazer login
**Solução:** Execute no SQL Editor:
```sql
-- Resetar senha
UPDATE auth.users 
SET encrypted_password = crypt('senha123', gen_salt('bf'))
WHERE email = 'email@mkd.com';
```

---

## ✅ CHECKLIST

- [ ] Executar `funcao-criar-usuario.sql` no Supabase
- [ ] Testar criação de usuário no sistema
- [ ] Verificar email gerado automaticamente
- [ ] Confirmar usuário criado no banco
- [ ] Testar login com novo usuário
- [ ] Verificar perfis atribuídos

---

## 🎉 PRÓXIMAS FUNCIONALIDADES

Após confirmar que está funcionando, podemos implementar:

1. **Editar Usuário**
   - Alterar nome, sobrenome, telefone
   - Alterar perfis
   - Resetar senha

2. **Desativar/Reativar Usuário**
   - Marcar como inativo
   - Impedir login

3. **Validação de Email Único**
   - Verificar se email já existe antes de criar
   - Sugerir alternativas se houver conflito

4. **Geração de Senha Aleatória**
   - Opção de gerar senha automaticamente
   - Enviar senha por email

---

**Última atualização:** 29/04/2026
