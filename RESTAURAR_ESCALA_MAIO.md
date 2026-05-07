# ✅ Restaurar Escala de Maio/2026

**Status**: ✅ **PRONTO PARA EXECUTAR**

---

## 🚀 Ação Imediata

Execute este script no **SQL Editor do Supabase**:

```
supabase/utils/restaurar-escala-maio-2026.sql
```

**Tempo**: 5 segundos  
**Resultado**: Todas as escalas de maio restauradas com membros corretos ✅

---

## 📋 O que o script faz:

1. ✅ **Limpa** todas as escalas antigas de maio/2026
2. ✅ **Recria** as 10 escalas (5 finais de semana × 2 dias)
3. ✅ **Adiciona** todos os membros corretos usando emails
4. ✅ **Configura** as funções de cada membro
5. ✅ **Mostra** o resultado final

---

## 🗓️ Escalas que serão criadas:

### 02-03 Maio (Equipe X)

- **Ministros**: Michael, Vinicius
- **Backs**: Wallesca, Alice, João
- **Teclado**: Michael
- **Guitarra**: Vinicius
- **Bateria**: Nilson
- **Baixo**: Daniel

### 09-10 Maio (Equipe B-2)

- **Ministros**: Gabriela, Maria
- **Backs**: Alice, Jhonata
- **Teclado**: Michael
- **Guitarra**: Vinicius
- **Bateria**: Isadora
- **Baixo**: Ari

### 16-17 Maio (Equipe A-2)

- **Ministros**: Jhonata, Lais
- **Backs**: Tchucky, Madu
- **Teclado**: Michael
- **Guitarra**: Vinicius
- **Bateria**: Thiago
- **Baixo**: Nilson

### 23-24 Maio (Equipe C-2)

- **Ministros**: Lucas, Isabel
- **Backs**: Wallesca, João
- **Teclado**: Michael
- **Guitarra**: Vinicius
- **Bateria**: Thiago
- **Baixo**: Daniel

### 30-31 Maio (Equipe A-1)

- **Ministros**: Tchucky, Madu
- **Backs**: Jhonata, Lais
- **Teclado**: Michael
- **Guitarra**: Vinicius
- **Bateria**: Isadora
- **Baixo**: Ari

---

## ⚠️ Atenção

Este script vai:

- ❌ **Deletar** todas as escalas de maio/2026 existentes
- ✅ **Recriar** com os dados corretos
- ✅ **Preservar** escalas de outros meses

**Se você tiver músicas adicionadas às escalas de maio, elas serão perdidas!**

---

## 🔍 Verificação

Após executar, o script mostrará uma tabela como esta:

```
resultado                              | data       | titulo        | total_membros | membros
---------------------------------------|------------|---------------|---------------|------------------
✅ ESCALAS DE MAIO/2026 RESTAURADAS   | 2026-05-02 | Culto Sábado  | 9             | Alice, Daniel, ...
✅ ESCALAS DE MAIO/2026 RESTAURADAS   | 2026-05-03 | Culto Domingo | 9             | Alice, Daniel, ...
...
```

---

## 🎯 Próximos Passos

1. **Execute o script** (5 segundos)
2. **Verifique o resultado** (1 minuto)
3. **Teste no sistema** (2 minutos)
4. **Confirme que os membros aparecem** ✅

---

## 📝 Notas Técnicas

### Como funciona:

1. **Usa emails** como identificador único (imutável)
2. **Mapeia** emails → team_member_id
3. **Cria** schedules com status "published"
4. **Adiciona** schedule_members
5. **Configura** schedule_member_functions

### Por que funciona:

- ✅ Emails nunca mudam
- ✅ Relacionamentos por ID (correto)
- ✅ Dados exatos da escala original

---

## 🔧 Se algo der errado:

### Erro: "Email não encontrado"

**Causa**: Algum usuário não existe no banco.

**Solução**: Verifique se todos os usuários estão cadastrados:

```sql
SELECT nome, email FROM users_profile
WHERE email IN (
    'melhorlider@mkd.com',
    'vinizoiazul@mkd.com',
    'maralakeuri@mkd.com',
    -- ... outros emails
)
ORDER BY nome;
```

### Erro: "Função não encontrada"

**Causa**: Alguma função não existe.

**Solução**: Verifique as funções:

```sql
SELECT nome FROM team_functions
WHERE team_type_id = (
    SELECT id FROM team_types WHERE codigo = 'louvor'
);
```

---

## ✅ Resultado Esperado

Após executar:

1. ✅ **10 escalas criadas** (5 sábados + 5 domingos)
2. ✅ **Todos os membros aparecem** corretamente
3. ✅ **Funções configuradas** (Vocal, BackVocal, Teclado, etc)
4. ✅ **Sistema funciona** normalmente

---

**Execute agora**: `restaurar-escala-maio-2026.sql`

E me confirme se funcionou!
