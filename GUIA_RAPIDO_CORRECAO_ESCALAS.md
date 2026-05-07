# 🚨 Guia Rápido: Escalas Não Mostram Membros

**Problema**: Escalas cadastradas não estão mostrando os membros após mudança de nomes.

---

## 🔍 PASSO 1: Diagnóstico (2 minutos)

Execute no **SQL Editor do Supabase**:

```sql
-- Arquivo: supabase/utils/EXECUTE-PRIMEIRO-diagnostico-rapido.sql
```

Este script vai mostrar:

- ✅ Quantas escalas existem
- ✅ Quantos membros existem
- ❌ Quantos estão órfãos (problema)
- 📋 Lista de escalas com problemas
- 🎯 Próximo passo recomendado

---

## 🔧 PASSO 2: Correção (depende do diagnóstico)

### Se o diagnóstico mostrar "schedule_members órfãos":

**Causa**: Os `team_member_id` nas escalas apontam para registros que não existem mais.

**Solução**: Execute:

```sql
-- Arquivo: supabase/utils/corrigir-escalas-existentes.sql
-- Descomente a OPÇÃO 1 (linhas 30-50)
```

Isso vai:

1. Fazer backup dos dados
2. Remover schedule_members órfãos
3. Você precisará recriar as escalas manualmente

---

### Se o diagnóstico mostrar "team_members inativos":

**Causa**: Os membros foram desativados mas ainda estão nas escalas.

**Solução**: Reativar os membros:

```sql
-- Reativar todos os team_members do louvor
UPDATE team_members
SET ativo = true
WHERE team_id IN (
    SELECT t.id FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor'
);
```

---

### Se o diagnóstico mostrar "users inativos":

**Causa**: Os usuários foram desativados mas ainda estão nas escalas.

**Solução**: Reativar os usuários:

```sql
-- Reativar usuários específicos
UPDATE users_profile
SET ativo = true
WHERE email IN (
    'tchucky@mkd.com',
    'madu@mkd.com',
    'jhonata@mkd.com',
    -- adicione outros emails conforme necessário
);
```

---

## 🎯 PASSO 3: Verificação (1 minuto)

Após a correção, execute novamente:

```sql
-- Arquivo: supabase/utils/EXECUTE-PRIMEIRO-diagnostico-rapido.sql
```

Deve mostrar: **"✅ TUDO OK!"**

---

## 📊 Entendendo o Problema

### Estrutura de Relacionamento

```
schedules (escalas)
    ↓ (schedule_id)
schedule_members (membros na escala)
    ↓ (team_member_id)
team_members (membros da equipe)
    ↓ (user_id)
users_profile (usuários)
```

### O que pode dar errado:

1. **Órfãos**: `schedule_members.team_member_id` aponta para ID que não existe
2. **Inativos**: `team_members.ativo = false` mas ainda usado em escalas
3. **Users inativos**: `users_profile.ativo = false` mas ainda usado

---

## 🔄 Fluxo Completo de Correção

```
1. Execute: EXECUTE-PRIMEIRO-diagnostico-rapido.sql
   ↓
2. Identifique o problema
   ↓
3. Execute a correção apropriada
   ↓
4. Verifique novamente com o diagnóstico
   ↓
5. Teste no sistema
```

---

## 💡 Dica Importante

Se você não souber quem eram os membros originais das escalas órfãs, você tem 2 opções:

### Opção A: Limpar e Recriar

1. Remover schedule_members órfãos
2. Recriar as escalas manualmente no sistema

### Opção B: Tentar Recuperar

1. Verificar backups do banco
2. Identificar os team_member_id originais
3. Mapear para os novos team_members

---

## 📞 Próximos Passos

1. **Execute o diagnóstico** e me mostre o resultado
2. Baseado no resultado, vou criar a correção específica
3. Executamos a correção
4. Verificamos se funcionou

---

**Execute agora**: `EXECUTE-PRIMEIRO-diagnostico-rapido.sql`

E me mostre o que apareceu no resultado!
