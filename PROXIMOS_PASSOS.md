# 🚀 PRÓXIMOS PASSOS - FINALIZAR CONFIGURAÇÃO

## ⚠️ PROBLEMA ATUAL

O teste de conexão mostra:
- ✅ Conexão estabelecida com sucesso
- ✅ Todas as tabelas existem e estão acessíveis
- ❌ **0 perfis encontrados** (esperado: 12)
- ❌ **0 tipos de equipe encontrados** (esperado: 5)
- ❌ **0 funções de equipe encontradas**
- ❌ **Bucket de storage não encontrado**

## 📋 SOLUÇÃO: EXECUTAR SCRIPT DE DADOS INICIAIS

### Passo 1: Acessar o Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard/project/ewuvrindvhjislkrohwh
2. No menu lateral, clique em **SQL Editor**
3. Clique em **New Query** (ou use uma query existente)

### Passo 2: Executar o Script

1. Abra o arquivo `supabase/inserir-dados-iniciais.sql` neste projeto
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Verificar Resultados

Após executar, você deve ver:

```
=== VERIFICAÇÃO ===
Perfis: 12
Tipos de Equipe: 5
Funções: 11
Storage Buckets: 1

✅ Dados iniciais inseridos com sucesso!
```

### Passo 4: Testar Novamente

1. Volte para o sistema: http://localhost:5173/test-connection
2. Clique em **Executar Testes Novamente**
3. Agora deve mostrar:
   - ✅ Perfis do Sistema: 12 perfis encontrados
   - ✅ Tipos de Equipe: 5 tipos encontrados
   - ✅ Funções de Equipe: 11 funções encontradas
   - ✅ Storage: Bucket encontrado

### Passo 5: Fazer Login

1. Acesse: http://localhost:5173/login
2. Use as credenciais:
   - **Email:** admin@igreja.com
   - **Senha:** Admin@2024
3. Clique em **Entrar**

## 🎯 O QUE ESTE SCRIPT FAZ

O script `inserir-dados-iniciais.sql` insere:

### 1. **12 Perfis do Sistema**
- Gerencial
- Líder de Louvor, Dança, Obreiros, Mídia, Célula
- Auxiliar de Célula
- Membro de Louvor, Dança, Obreiros, Mídia, Célula

### 2. **5 Tipos de Equipe**
- Louvor
- Dança
- Obreiros
- Mídia
- Célula

### 3. **11 Funções de Equipe**

**Louvor (5):**
- Vocal
- Guitarra
- Baixo
- Bateria
- Teclado

**Mídia (3):**
- Projeção
- Som
- Transmissão

**Obreiros (3):**
- Recepção
- Estacionamento
- Segurança

### 4. **Storage Bucket**
- `audio-musicas` - Para armazenar arquivos de áudio das músicas

### 5. **Vincula o Usuário Admin**
- Garante que admin@igreja.com tem perfil Gerencial

## 🔍 TROUBLESHOOTING

### Se aparecer erro "duplicate key"
Significa que alguns dados já existem. Isso é normal! O script usa `ON CONFLICT DO NOTHING` para evitar duplicatas.

### Se o login não funcionar após inserir os dados
Execute este comando no SQL Editor:

```sql
-- Verificar se o usuário existe
SELECT 
    u.email,
    u.confirmed_at,
    up.nome,
    p.nome as perfil
FROM auth.users u
LEFT JOIN users_profile up ON up.auth_user_id = u.id
LEFT JOIN user_profiles upr ON upr.user_id = up.id
LEFT JOIN profiles p ON p.id = upr.profile_id
WHERE u.email = 'admin@igreja.com';
```

Se não aparecer nenhum resultado ou o perfil estiver NULL, execute:

```sql
-- Recriar o usuário admin
\i supabase/criar-usuario-admin.sql
```

### Se o storage bucket não for criado
Execute manualmente:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-musicas', 'audio-musicas', false)
ON CONFLICT DO NOTHING;
```

## ✅ APÓS COMPLETAR ESTES PASSOS

Você terá:
- ✅ Banco de dados totalmente configurado
- ✅ Dados iniciais inseridos
- ✅ Usuário admin funcional
- ✅ Sistema pronto para uso

## 🎉 PRÓXIMAS FUNCIONALIDADES A IMPLEMENTAR

Após o login funcionar, continuaremos com:

1. **Edição e Exclusão de Escalas**
2. **Detecção de Conflitos de Horário**
3. **Gestão de Células com Presença**
4. **Gráficos e Dashboards com Recharts**
5. **Exportação para PDF**
6. **Notificações por Email**

---

**📞 Precisa de Ajuda?**

Se encontrar qualquer problema, me avise e eu ajudo a resolver!
