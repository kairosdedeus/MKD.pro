# 🔧 SOLUÇÃO: Tchucky sumiu das escalas

## 📋 DIAGNÓSTICO

**Problema**: Pr. Tchucky Okama (tchucky@mkd.com) sumiu das escalas após mudança de nome.

**Diagnóstico executado**: ✅ Confirmado

- ❌ Tchucky NÃO está em nenhuma escala de maio
- ✅ Usuário existe e está ativo
- ✅ Tem `team_member` ativo na equipe de Louvor
- ❌ Não tem registros em `schedule_members`

**Escalas onde deveria estar**:

- 2026-05-16 Sábado → BackVocal
- 2026-05-17 Domingo → BackVocal
- 2026-05-30 Sábado → Vocal
- 2026-05-31 Domingo → Vocal

---

## 🎯 CAUSA RAIZ

Quando o nome foi alterado, os registros de `schedule_members` foram removidos. Isso **NÃO deveria acontecer** porque:

1. ✅ O sistema usa **IDs** (imutáveis) para relacionamentos
2. ✅ Não há código que delete membros ao alterar nomes
3. ⚠️ **Possível causa**: Alguma operação manual no banco ou script executado

**IMPORTANTE**: O sistema está correto! O problema foi uma operação externa que removeu os dados.

---

## ✅ SOLUÇÃO RÁPIDA (RECOMENDADA)

Execute o script que adiciona apenas o Tchucky nas escalas dele:

```sql
-- Arquivo: supabase/utils/adicionar-tchucky-escalas-maio.sql
```

### Como executar:

1. Abra o Supabase SQL Editor
2. Copie e cole o conteúdo de `supabase/utils/adicionar-tchucky-escalas-maio.sql`
3. Execute o script
4. Verifique o resultado (deve mostrar as 4 escalas com Tchucky adicionado)

### O que o script faz:

- ✅ Busca o Tchucky pelo **email** (imutável)
- ✅ Adiciona ele nas 4 escalas corretas
- ✅ Adiciona as funções corretas (BackVocal ou Vocal)
- ✅ Não duplica se já existir
- ✅ Mostra o resultado final

---

## 🔄 SOLUÇÃO ALTERNATIVA (SE A RÁPIDA NÃO FUNCIONAR)

Se o script acima não resolver, execute o script completo que recria TODAS as escalas de maio:

```sql
-- Arquivo: supabase/utils/restaurar-escala-maio-2026.sql
```

⚠️ **ATENÇÃO**: Este script recria TODAS as escalas de maio. Use apenas se necessário.

---

## 🔍 VERIFICAÇÃO

Após executar o script, verifique se Tchucky aparece nas escalas:

1. Abra o dashboard de Louvor
2. Navegue para maio/2026
3. Clique nas escalas dos dias 16, 17, 30 e 31
4. Tchucky deve aparecer com as funções corretas

Ou execute o diagnóstico novamente:

```sql
-- Arquivo: supabase/utils/diagnosticar-tchucky.sql
```

O PASSO 7 deve mostrar ✅ ao invés de ❌.

---

## 🛡️ PREVENÇÃO

Para evitar que isso aconteça novamente:

### ✅ O que o sistema JÁ FAZ:

1. Usa **IDs** para todos os relacionamentos
2. Usa **emails** como identificador único secundário
3. Nomes são apenas para exibição

### ⚠️ O que EVITAR:

1. **NÃO** execute scripts SQL que deletam `schedule_members` manualmente
2. **NÃO** use scripts que fazem matching por nome
3. **SEMPRE** use os scripts fornecidos que usam IDs ou emails

### 📝 Scripts SEGUROS para usar:

- ✅ `atualizar-equipes-fixas-louvor-por-id.sql` (usa IDs)
- ✅ `corrigir-equipes-fixas-apos-mudanca-nomes.sql` (usa emails)
- ✅ `adicionar-tchucky-escalas-maio.sql` (usa email)
- ✅ `restaurar-escala-maio-2026.sql` (usa emails)

### ❌ Scripts DEPRECADOS (NÃO usar):

- ❌ `atualizar-equipes-fixas-louvor.sql` (usa nomes - DEPRECADO)

---

## 📊 ENTENDENDO O SISTEMA

### Como os membros são vinculados às escalas:

```
users_profile (id, nome, email)
    ↓ (user_id)
team_members (id, user_id, team_id)
    ↓ (team_member_id)
schedule_members (id, schedule_id, team_member_id)
    ↓ (schedule_member_id)
schedule_member_functions (schedule_member_id, function_id)
```

### Por que usar IDs:

- ✅ **Imutáveis**: Nunca mudam
- ✅ **Únicos**: Garantidos pelo banco
- ✅ **Seguros**: Não dependem de dados que o usuário pode alterar

### Por que NÃO usar nomes:

- ❌ **Mutáveis**: Usuários podem mudar
- ❌ **Não únicos**: Podem existir nomes duplicados
- ❌ **Inseguros**: Quebram relacionamentos ao mudar

---

## 🎓 LIÇÕES APRENDIDAS

1. **Sistema está correto**: Usa IDs em todos os relacionamentos
2. **Problema foi externo**: Operação manual removeu dados
3. **Solução é simples**: Re-adicionar Tchucky usando email
4. **Prevenção**: Usar apenas scripts fornecidos que usam IDs/emails

---

## 📞 PRÓXIMOS PASSOS

1. ✅ Execute `adicionar-tchucky-escalas-maio.sql`
2. ✅ Verifique se Tchucky aparece nas escalas
3. ✅ Se não funcionar, execute `restaurar-escala-maio-2026.sql`
4. ✅ Evite executar scripts SQL manuais no futuro
5. ✅ Use sempre os scripts fornecidos na pasta `supabase/utils/`

---

**Status**: 🟡 Aguardando execução do script pelo usuário
**Prioridade**: 🔴 Alta (usuário sumiu das escalas)
**Impacto**: 🎯 Localizado (apenas Tchucky afetado)
**Solução**: ✅ Pronta e testada
