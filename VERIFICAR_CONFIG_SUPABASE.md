# 🔧 Verificar Configurações do Supabase

## 📋 Checklist de Configurações

### 1. ✅ Verificar URL e Chaves

Acesse: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/settings/api

**Verifique**:

#### Project URL
Deve ser exatamente:
```
https://ewuvrinbvhjislkrohwh.supabase.co
```

#### API Keys
- **anon/public key**: Começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **service_role key**: NÃO use esta no frontend!

**Compare com seu `.env`**:
```env
VITE_SUPABASE_URL=https://ewuvrinbvhjislkrohwh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dXZyaW5kdmhqaXNsa3JvaHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTY1MzksImV4cCI6MjA5MzA3MjUzOX0.uVJYeFluasgxlJvSTmKef_YkLEPQNKY3ix5aKJb0jtU
```

---

### 2. 🌐 Verificar Configuração de API

Acesse: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/settings/api

**Verifique**:

#### API Settings
- ✅ **Auto API Documentation**: Enabled
- ✅ **API URL**: `https://ewuvrinbvhjislkrohwh.supabase.co`

#### Rate Limiting
- Não deve estar bloqueando seu IP

---

### 3. 🔒 Verificar Configuração de Autenticação

Acesse: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/auth/providers

**Verifique**:

#### Email Provider
- ✅ **Enable Email provider**: ON
- ✅ **Enable Email Confirmations**: OFF (para desenvolvimento)
- ✅ **Secure Email Change**: OFF (para desenvolvimento)

#### Site URL
Acesse: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/auth/url-configuration

Deve ter:
```
Site URL: http://localhost:5173
```

#### Redirect URLs
Adicione:
```
http://localhost:5173
http://localhost:5173/**
http://localhost:3000
http://localhost:3000/**
```

---

### 4. 🔐 Verificar Row Level Security (RLS)

Acesse: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/editor

**Para cada tabela, verifique**:

#### Tabelas que DEVEM ter RLS HABILITADO:
- ✅ users_profile
- ✅ user_profiles
- ✅ teams
- ✅ team_members
- ✅ schedules
- ✅ schedule_members
- ✅ songs
- ✅ cells

#### Tabelas que podem ter RLS DESABILITADO (para testes):
- profiles (dados públicos)
- team_types (dados públicos)
- team_functions (dados públicos)

**Como verificar**:
1. Clique na tabela
2. Veja se tem um ícone de cadeado 🔒
3. Se tiver, RLS está ativo

**Como desabilitar temporariamente** (para testes):
```sql
-- Execute no SQL Editor
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_functions DISABLE ROW LEVEL SECURITY;
```

---

### 5. 🌍 Verificar CORS

Acesse: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/settings/api

**Allowed Origins**:

Deve incluir:
```
http://localhost:5173
http://localhost:3000
```

Se não tiver, adicione!

---

### 6. 📊 Verificar Database

Acesse: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/database/tables

**Verifique se estas tabelas existem**:
- ✅ profiles
- ✅ users_profile
- ✅ user_profiles
- ✅ team_types
- ✅ teams
- ✅ team_members
- ✅ team_functions
- ✅ schedules
- ✅ songs
- ✅ cells

**Se não existirem**: Execute o `supabase/schema.sql`

---

### 7. 🔌 Verificar Status do Projeto

Acesse: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh

**Verifique**:
- ✅ Status: **Active** (não Paused)
- ✅ Database: **Healthy**
- ✅ API: **Operational**

---

### 8. 🧪 Teste Rápido via SQL Editor

Acesse: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/sql/new

Execute:
```sql
-- Teste 1: Verificar se tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Teste 2: Verificar dados iniciais
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_team_types FROM team_types;

-- Teste 3: Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Resultados esperados**:
- Teste 1: Deve listar ~17 tabelas
- Teste 2: 12 profiles, 5 team_types
- Teste 3: Mostra quais tabelas têm RLS ativo

---

### 9. 🔑 Verificar Políticas RLS

Execute no SQL Editor:
```sql
-- Ver todas as políticas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Deve mostrar várias políticas** para cada tabela.

**Se não mostrar nada**: Execute a parte de políticas do `schema.sql`

---

### 10. 🌐 Teste de Conectividade Externa

**Teste 1: Ping**
```bash
ping ewuvrinbvhjislkrohwh.supabase.co
```

**Teste 2: Curl**
```bash
curl https://ewuvrinbvhjislkrohwh.supabase.co/rest/v1/
```

**Teste 3: Navegador**
Abra: https://ewuvrinbvhjislkrohwh.supabase.co/rest/v1/

**Resultado esperado**: 
- Deve retornar JSON ou erro 401/403
- NÃO deve dar timeout ou "não foi possível acessar"

---

## 🔧 Configurações Recomendadas para Desenvolvimento

### Authentication Settings
```
Enable Email Confirmations: OFF
Enable Email OTP: OFF
Secure Email Change: OFF
Secure Password Change: OFF
```

### URL Configuration
```
Site URL: http://localhost:5173
Redirect URLs: 
  - http://localhost:5173/**
  - http://localhost:3000/**
```

### API Settings
```
Enable Auto API Documentation: ON
Enable Realtime: ON (opcional)
```

---

## 🐛 Problemas Comuns

### Erro: "Failed to fetch"
**Causa**: CORS ou URL incorreta
**Solução**: Adicione `http://localhost:5173` nas Allowed Origins

### Erro: "Invalid API key"
**Causa**: Chave incorreta no .env
**Solução**: Copie novamente do dashboard

### Erro: "relation does not exist"
**Causa**: Tabelas não foram criadas
**Solução**: Execute o schema.sql

### Erro: "row-level security"
**Causa**: RLS bloqueando acesso
**Solução**: Desabilite RLS temporariamente ou faça login

---

## ✅ Checklist Final

Marque conforme verificar:

- [ ] URL do projeto está correta
- [ ] API Key está correta
- [ ] Email provider está habilitado
- [ ] Email confirmations está OFF
- [ ] Site URL configurada (localhost:5173)
- [ ] Redirect URLs configuradas
- [ ] CORS configurado (localhost:5173)
- [ ] Tabelas existem no database
- [ ] Dados iniciais foram inseridos
- [ ] RLS está configurado
- [ ] Políticas RLS existem
- [ ] Projeto está Active
- [ ] Teste de ping funciona
- [ ] Teste de curl funciona
- [ ] Teste no navegador funciona

---

## 🎯 Próximo Passo

Depois de verificar tudo:

1. **Reinicie o servidor**:
   ```bash
   # Pare (Ctrl+C)
   npm run dev
   ```

2. **Teste novamente**: http://localhost:5173/test-connection

3. **Se ainda não funcionar**: Compartilhe os resultados dos testes SQL acima

---

**Link rápido para configurações**: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/settings/api
