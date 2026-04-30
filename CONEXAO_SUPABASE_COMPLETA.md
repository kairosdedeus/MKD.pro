# ✅ Conexão Supabase - Configuração Completa

## 📋 Informações do Projeto

- **Nome**: escalas-ministeriais
- **ID**: ewuvrindvhjislkrohwh
- **URL**: https://ewuvrinbvhjislkrohwh.supabase.co
- **Status**: ✅ Credenciais configuradas no `.env`

---

## 🎯 PASSO A PASSO COMPLETO

### 📝 PASSO 1: Executar o Schema SQL (Criar Tabelas)

1. **Acesse o SQL Editor**:
   - Link direto: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/sql/new

2. **Copie o Schema**:
   - Abra o arquivo `supabase/schema.sql` deste projeto
   - Selecione TODO o conteúdo (Ctrl+A)
   - Copie (Ctrl+C)

3. **Execute no Supabase**:
   - Cole no SQL Editor (Ctrl+V)
   - Clique em **"Run"** (botão verde)
   - Aguarde a execução (~20 segundos)

4. **Verifique**:
   - Vá em: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/editor
   - Você deve ver estas tabelas:
     - ✅ profiles (12 perfis)
     - ✅ users_profile
     - ✅ user_profiles
     - ✅ team_types (5 tipos)
     - ✅ teams
     - ✅ team_members
     - ✅ team_functions
     - ✅ schedules
     - ✅ schedule_members
     - ✅ songs
     - ✅ schedule_songs
     - ✅ cells
     - ✅ E outras...

---

### 👤 PASSO 2: Criar Primeiro Usuário

#### 2.1 - Criar usuário de autenticação

1. **Acesse Authentication**:
   - Link direto: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/auth/users

2. **Criar novo usuário**:
   - Clique em **"Add user"** → **"Create new user"**
   - Preencha:
     ```
     Email: admin@igreja.com
     Password: senha123
     ```
   - ⚠️ **IMPORTANTE**: Marque a opção **"Auto Confirm User"**
   - Clique em **"Create user"**

3. **Copie o ID do usuário**:
   - Após criar, você verá o usuário na lista
   - Clique no usuário
   - Copie o **ID** (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)

#### 2.2 - Criar perfil do usuário

1. **Volte ao SQL Editor**:
   - Link: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/sql/new

2. **Execute este SQL** (substitua o ID):

```sql
-- COLE O ID DO USUÁRIO NA LINHA ABAIXO (entre as aspas)
DO $$
DECLARE
  v_auth_user_id uuid := 'COLE-O-ID-DO-USUARIO-AQUI';
  v_user_profile_id uuid;
BEGIN
  -- Verificar se o ID foi alterado
  IF v_auth_user_id::text = 'COLE-O-ID-DO-USUARIO-AQUI' THEN
    RAISE EXCEPTION 'Por favor, substitua pelo ID real do usuário!';
  END IF;

  -- Criar perfil do usuário
  INSERT INTO users_profile (auth_user_id, nome, email, ativo)
  VALUES (
    v_auth_user_id,
    'Administrador',
    'admin@igreja.com',
    true
  )
  RETURNING id INTO v_user_profile_id;

  -- Atribuir perfil gerencial
  INSERT INTO user_profiles (user_id, profile_id)
  SELECT 
    v_user_profile_id, 
    p.id 
  FROM profiles p
  WHERE p.codigo = 'gerencial';

  RAISE NOTICE '✅ Usuário criado com sucesso!';
END $$;
```

3. **Clique em "Run"**

4. **Verifique**:
   - Vá em Table Editor → users_profile
   - Você deve ver o usuário "Administrador"

---

### 🚀 PASSO 3: Rodar o Projeto

1. **Abra o terminal** na pasta do projeto

2. **Instale as dependências** (se ainda não instalou):
```bash
npm install
```

3. **Inicie o servidor de desenvolvimento**:
```bash
npm run dev
```

4. **Abra o navegador**:
   - Acesse: http://localhost:5173

5. **Faça login**:
   ```
   Email: admin@igreja.com
   Senha: senha123
   ```

---

## 🎉 Pronto! Você deve ver o Dashboard

Após fazer login com sucesso, você verá:

- ✅ Dashboard Gerencial com estatísticas
- ✅ Menu lateral com todas as opções:
  - Dashboard
  - Usuários
  - Equipes
  - Músicas
  - Louvor
  - Dança
  - Mídia
  - Obreiros
  - Células

---

## 📊 Próximos Passos (Usar o Sistema)

### 1. Criar Equipes de Ministérios

1. Vá em **"Equipes"** no menu lateral
2. Clique em **"Nova Equipe"**
3. Preencha:
   - Nome: "Louvor Principal"
   - Tipo: Louvor
   - Líder: Administrador
   - Membros: (adicione depois)
4. Repita para outros ministérios (Dança, Mídia, Obreiros)

### 2. Adicionar Usuários/Membros

1. Vá em **"Usuários"**
2. Clique em **"Novo Usuário"**
3. Preencha os dados
4. Selecione os perfis apropriados
5. Depois, adicione-os às equipes

### 3. Cadastrar Músicas

1. Vá em **"Músicas"**
2. Clique em **"Nova Música"**
3. Preencha:
   - Nome da música
   - Artista
   - Tom original
   - Link de referência (YouTube, Spotify)
   - Upload de áudio (opcional)

### 4. Criar Escalas

1. Vá em um dashboard de ministério (ex: **"Louvor"**)
2. Você verá um calendário
3. Clique em **"Nova Escala"** ou em uma data específica
4. Selecione:
   - Data
   - Membros da equipe
   - Funções de cada membro
   - Músicas (busque e adicione)
   - Tom de execução
5. Salve!

---

## 🔍 Verificar se Está Tudo Certo

### Checklist de Verificação:

- [ ] ✅ Arquivo `.env` existe na raiz do projeto
- [ ] ✅ Schema SQL executado (tabelas visíveis no Table Editor)
- [ ] ✅ Usuário criado em Authentication
- [ ] ✅ Perfil do usuário criado (visível em users_profile)
- [ ] ✅ Perfil gerencial atribuído (visível em user_profiles)
- [ ] ✅ `npm install` executado sem erros
- [ ] ✅ `npm run dev` rodando
- [ ] ✅ Login funcionando
- [ ] ✅ Dashboard visível

---

## 🐛 Solução de Problemas

### ❌ Erro: "Invalid login credentials"

**Causas possíveis**:
- Usuário não foi confirmado
- Perfil não foi criado
- Email ou senha incorretos

**Solução**:
1. Verifique se marcou "Auto Confirm User"
2. Execute novamente o SQL do Passo 2.2
3. Tente resetar a senha no Supabase

### ❌ Erro: "relation does not exist"

**Causa**: Schema SQL não foi executado

**Solução**:
1. Vá ao SQL Editor
2. Execute novamente o conteúdo de `supabase/schema.sql`
3. Verifique se há erros na execução

### ❌ Erro: "Missing Supabase environment variables"

**Causa**: Arquivo `.env` não está sendo lido

**Solução**:
1. Verifique se o arquivo `.env` está na raiz do projeto
2. Reinicie o servidor (`Ctrl+C` e depois `npm run dev`)
3. Verifique se não há espaços extras nas variáveis

### ❌ Página em branco após login

**Causa**: Perfil do usuário não foi criado corretamente

**Solução**:
1. Abra o Console do navegador (F12)
2. Veja os erros
3. Execute novamente o SQL do Passo 2.2
4. Verifique se o usuário tem perfil em user_profiles

### ❌ Erro ao criar escala/música/equipe

**Causa**: Políticas RLS ou dados iniciais faltando

**Solução**:
1. Execute novamente o schema.sql completo
2. Verifique se os dados iniciais foram criados:
   - profiles (12 perfis)
   - team_types (5 tipos)
   - team_functions (funções por tipo)

---

## 📚 Documentação Adicional

- **Setup Detalhado**: `SUPABASE_SETUP_GUIDE.md`
- **Início Rápido**: `START_HERE.md`
- **Status do Projeto**: `IMPLEMENTATION_STATUS.md`
- **Arquitetura**: `ARCHITECTURE.md`
- **README**: `README.md`

---

## 🔗 Links Úteis do Seu Projeto

- **Dashboard**: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh
- **SQL Editor**: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/sql/new
- **Table Editor**: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/editor
- **Authentication**: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/auth/users
- **Storage**: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/storage/buckets
- **API Docs**: https://supabase.com/dashboard/project/ewuvrinbvhjislkrohwh/api

---

## 💡 Dicas Importantes

1. **Backup**: Sempre faça backup do schema SQL antes de modificar
2. **Desenvolvimento**: Este projeto já está configurado para desenvolvimento
3. **Produção**: Para produção, crie outro projeto Supabase
4. **Segurança**: Nunca compartilhe o arquivo `.env` ou as chaves de API
5. **Logs**: Use F12 (Console do navegador) para ver erros detalhados

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique o Console do navegador (F12)
2. Verifique os logs do terminal
3. Consulte a documentação do Supabase: https://supabase.com/docs
4. Verifique se todas as etapas foram seguidas corretamente

---

## ✅ Status Atual

- ✅ **Projeto Supabase**: Criado e configurado
- ✅ **Credenciais**: Configuradas no `.env`
- ⏳ **Schema SQL**: Aguardando execução
- ⏳ **Primeiro Usuário**: Aguardando criação
- ⏳ **Sistema**: Pronto para rodar

---

**🎯 Próximo passo**: Execute o Schema SQL (Passo 1)

**⏱️ Tempo estimado total**: 10-15 minutos

**💪 Você está quase lá!**
