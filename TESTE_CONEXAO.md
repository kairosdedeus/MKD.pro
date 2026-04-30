# 🔍 Guia de Teste de Conexão Supabase

## 🎯 O Que Foi Criado

Um sistema completo de diagnóstico para testar a conexão com o Supabase e identificar problemas rapidamente.

## 🚀 Como Usar

### Opção 1: Via Navegador (Recomendado)

1. **Acesse a página de teste**:
   ```
   http://localhost:5173/test-connection
   ```

2. **Os testes serão executados automaticamente**

3. **Veja os resultados**:
   - ✅ Verde = Funcionando
   - ❌ Vermelho = Erro (precisa corrigir)
   - ⚠️ Amarelo = Aviso (funciona, mas pode melhorar)

4. **Clique em "Ver detalhes"** para mais informações sobre cada teste

### Opção 2: Via Console do Navegador

1. **Abra o Console** (F12)

2. **Execute**:
   ```javascript
   import { testSupabaseConnection } from './src/utils/supabaseTest'
   testSupabaseConnection()
   ```

3. **Veja os resultados no console**

## 📋 O Que É Testado

### 1. Variáveis de Ambiente ✅
- Verifica se `VITE_SUPABASE_URL` está configurada
- Verifica se `VITE_SUPABASE_ANON_KEY` está configurada

### 2. Conexão Básica 🔌
- Testa se consegue conectar ao Supabase
- Verifica se as credenciais estão corretas

### 3. Tabelas Essenciais 📊
Verifica se estas tabelas existem:
- profiles
- users_profile
- user_profiles
- team_types
- teams
- team_members
- schedules
- songs
- cells

### 4. Dados Iniciais 📦
- Verifica se há 12 perfis cadastrados
- Verifica se há 5 tipos de equipe
- Verifica se há funções de equipe cadastradas

### 5. Autenticação 🔐
- Verifica se há usuário logado
- Testa login com credenciais comuns:
  - `admin@igreja.com` / `senha123`
  - `admin@igreja.com` / `Admin@2024`
- Mostra dicas específicas para cada erro

### 6. Row Level Security (RLS) 🔒
- Verifica se RLS está ativo nas tabelas principais
- Garante que dados estão protegidos

### 7. Storage 💾
- Verifica se o bucket `audio-musicas` existe
- Confirma configuração de storage

## 🎨 Interface Visual

A página de teste mostra:

- **Cards de Resumo**: Contadores de sucessos, erros e avisos
- **Lista Detalhada**: Cada teste com ícone colorido
- **Detalhes Expansíveis**: Clique para ver informações técnicas
- **Ações Recomendadas**: Sugestões para corrigir erros
- **Mensagem de Sucesso**: Quando tudo está funcionando

## 🐛 Erros Comuns e Soluções

### ❌ "Invalid login credentials"

**Problema**: Senha incorreta ou usuário não existe

**Solução**:
```sql
-- Execute no SQL Editor
UPDATE auth.users
SET encrypted_password = crypt('senha123', gen_salt('bf')),
    email_confirmed_at = NOW()
WHERE email = 'admin@igreja.com';
```

### ❌ "Email not confirmed"

**Problema**: Usuário não foi confirmado

**Solução**:
- Ao criar usuário, marque "Auto Confirm User"
- Ou execute:
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'admin@igreja.com';
```

### ❌ "Tabela não encontrada"

**Problema**: Schema SQL não foi executado

**Solução**:
- Execute o arquivo `supabase/schema.sql` completo
- Ou siga o guia `supabase/EXECUTAR_EM_ORDEM.md`

### ⚠️ "Dados iniciais faltando"

**Problema**: Perfis ou tipos de equipe não foram criados

**Solução**:
- Execute a Parte 2 do `supabase/EXECUTAR_EM_ORDEM.md`

### ❌ "RLS bloqueou acesso"

**Problema**: Tentando acessar dados sem estar autenticado

**Solução**:
- Isso é normal! RLS está funcionando corretamente
- Faça login primeiro

## 📊 Interpretando os Resultados

### 🎉 Tudo Verde (100% Sucesso)
- Sistema totalmente funcional
- Pode começar a usar normalmente

### ⚠️ Alguns Avisos
- Sistema funcional
- Algumas otimizações podem ser feitas
- Não bloqueia o uso

### ❌ Erros Críticos
- Sistema não funcionará corretamente
- Corrija os erros antes de continuar
- Siga as "Ações Recomendadas"

## 🔄 Quando Executar os Testes

Execute os testes:

1. **Após configurar o Supabase** pela primeira vez
2. **Quando tiver problemas de login**
3. **Após executar o schema SQL**
4. **Quando algo não estiver funcionando**
5. **Antes de fazer deploy**

## 💡 Dicas

1. **Execute os testes regularmente** para garantir que tudo está funcionando

2. **Compartilhe os resultados** se precisar de ajuda - tire um print da tela

3. **Use o botão "Executar Testes Novamente"** após fazer correções

4. **Abra o Console (F12)** para ver logs mais detalhados

5. **Salve os resultados** antes de fazer mudanças no banco

## 🎯 Próximos Passos

Após todos os testes passarem:

1. ✅ Faça login no sistema
2. ✅ Crie equipes de ministérios
3. ✅ Adicione membros
4. ✅ Cadastre músicas
5. ✅ Crie escalas

## 📞 Suporte

Se os testes mostrarem erros que você não consegue resolver:

1. Tire um print da tela de testes
2. Copie os detalhes dos erros
3. Verifique os arquivos de documentação:
   - `SUPABASE_SETUP_GUIDE.md`
   - `CONEXAO_SUPABASE_COMPLETA.md`
   - `supabase/SOLUCAO_SENHA.md`

---

**🔗 Link Rápido**: http://localhost:5173/test-connection

**⏱️ Tempo de execução**: ~5-10 segundos

**🎯 Objetivo**: Garantir que tudo está funcionando antes de usar o sistema!
