# 📸 GUIA VISUAL: Como Executar SQL no Supabase

## 🎯 Objetivo
Executar o script `supabase/inserir-dados-iniciais.sql` para inserir os dados necessários no banco.

---

## 📋 PASSO A PASSO COM IMAGENS

### 1️⃣ Acessar o Dashboard do Supabase

1. Abra seu navegador
2. Acesse: **https://supabase.com/dashboard**
3. Faça login se necessário
4. Você verá a lista de projetos

### 2️⃣ Selecionar o Projeto

1. Procure pelo projeto: **escalas-ministeriiais**
2. Ou procure pelo ID: **ewuvrindvhjislkrohwh**
3. Clique no projeto para abrir

### 3️⃣ Abrir o SQL Editor

1. No menu lateral esquerdo, procure por **"SQL Editor"**
2. Clique em **SQL Editor**
3. Você verá a interface do editor SQL

### 4️⃣ Criar Nova Query

1. Clique no botão **"New Query"** (canto superior direito)
2. Ou use uma query existente se preferir
3. Uma nova aba será aberta com o editor vazio

### 5️⃣ Copiar o Script

1. Abra o arquivo `supabase/inserir-dados-iniciais.sql` no VS Code
2. Selecione **TODO o conteúdo** (Ctrl+A)
3. Copie (Ctrl+C)

**Conteúdo do arquivo:**
```sql
-- ============================================
-- INSERIR DADOS INICIAIS
-- ============================================

-- 1. Inserir perfis do sistema
INSERT INTO profiles (nome, codigo) VALUES
    ('Gerencial', 'gerencial'),
    ('Líder de Louvor', 'lider_louvor'),
    -- ... (todo o resto do arquivo)
```

### 6️⃣ Colar no SQL Editor

1. Volte para o SQL Editor do Supabase
2. Clique na área de texto do editor
3. Cole o conteúdo (Ctrl+V)
4. Você deve ver todo o script no editor

### 7️⃣ Executar o Script

1. Clique no botão **"Run"** (canto inferior direito)
2. Ou pressione **Ctrl+Enter** (Windows/Linux) ou **Cmd+Enter** (Mac)
3. Aguarde alguns segundos

### 8️⃣ Verificar Resultados

Após executar, você verá na parte inferior:

**✅ Resultado Esperado:**
```
=== VERIFICAÇÃO ===
Perfis: 12
Tipos de Equipe: 5
Funções: 11
Storage Buckets: 1

✅ Dados iniciais inseridos com sucesso!
```

**Se aparecer erro "duplicate key":**
- Isso é NORMAL! Significa que alguns dados já existem
- O script usa `ON CONFLICT DO NOTHING` para evitar duplicatas
- Continue para o próximo passo

---

## 🔍 VERIFICAÇÃO MANUAL (Opcional)

Se quiser verificar manualmente se os dados foram inseridos:

### Verificar Perfis
```sql
SELECT * FROM profiles ORDER BY codigo;
```
**Deve retornar 12 linhas**

### Verificar Tipos de Equipe
```sql
SELECT * FROM team_types ORDER BY codigo;
```
**Deve retornar 5 linhas:** louvor, danca, obreiros, midia, celula

### Verificar Funções
```sql
SELECT 
    tf.nome as funcao,
    tt.nome as tipo_equipe
FROM team_functions tf
JOIN team_types tt ON tt.id = tf.team_type_id
ORDER BY tt.nome, tf.nome;
```
**Deve retornar 11 linhas**

### Verificar Storage
```sql
SELECT * FROM storage.buckets WHERE name = 'audio-musicas';
```
**Deve retornar 1 linha**

### Verificar Usuário Admin
```sql
SELECT 
    u.email,
    up.nome,
    p.nome as perfil
FROM auth.users u
JOIN users_profile up ON up.auth_user_id = u.id
JOIN user_profiles upr ON upr.user_id = up.id
JOIN profiles p ON p.id = upr.profile_id
WHERE u.email = 'admin@igreja.com';
```
**Deve retornar:** admin@igreja.com | Administrador | Gerencial

---

## ✅ APÓS EXECUTAR O SCRIPT

### 1. Testar Conexão Novamente

1. Volte para o sistema: http://localhost:5173/test-connection
2. Clique em **"Executar Testes Novamente"**
3. Agora deve mostrar:
   - ✅ Perfis do Sistema: **12 perfis encontrados**
   - ✅ Tipos de Equipe: **5 tipos encontrados**
   - ✅ Funções de Equipe: **11 funções encontradas**
   - ✅ Storage: **Bucket encontrado**

### 2. Fazer Login

1. Acesse: http://localhost:5173/login
2. Digite:
   - **Email:** admin@igreja.com
   - **Senha:** Admin@2024
3. Clique em **Entrar**
4. Você deve ser redirecionado para o Dashboard Gerencial

---

## 🚨 TROUBLESHOOTING

### Problema: "permission denied for table profiles"

**Solução:** Execute primeiro o script de desabilitar RLS:
```sql
-- Copie e execute o conteúdo de: supabase/desabilitar-rls-temporario.sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile DISABLE ROW LEVEL SECURITY;
-- ... (resto do arquivo)
```

### Problema: "relation 'profiles' does not exist"

**Solução:** Execute primeiro o schema completo:
```sql
-- Copie e execute o conteúdo de: supabase/schema.sql
```

### Problema: Login não funciona após inserir dados

**Solução 1:** Resetar senha do usuário
```sql
-- Copie e execute: supabase/resetar-senha-corrigido.sql
```

**Solução 2:** Recriar usuário do zero
```sql
-- Copie e execute: supabase/criar-usuario-admin.sql
```

### Problema: "bucket already exists"

**Solução:** Isso é normal! O bucket já foi criado. Continue normalmente.

---

## 📞 PRECISA DE AJUDA?

Se encontrar qualquer problema:

1. **Tire um print da tela** mostrando o erro
2. **Copie a mensagem de erro completa**
3. **Me avise** e eu ajudo a resolver!

---

## 🎉 PRÓXIMO PASSO

Após executar com sucesso:
- ✅ Dados iniciais inseridos
- ✅ Teste de conexão passando
- ✅ Login funcionando

**Continuaremos com as próximas funcionalidades:**
1. Edição e exclusão de escalas
2. Detecção de conflitos
3. Gestão de células
4. Gráficos e dashboards
5. Exportação para PDF

---

**Última atualização:** 29/04/2026
