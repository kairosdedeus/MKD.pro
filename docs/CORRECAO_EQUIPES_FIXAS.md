# 🔧 Correção de Equipes Fixas Após Mudança de Nomes

**Data**: 06 de Maio de 2026  
**Status**: ✅ **SOLUÇÃO PRONTA**

---

## 📋 Problema

Usuários mudaram seus nomes no sistema e as equipes fixas pararam de funcionar. Os membros não aparecem mais nas escalas.

### Nomes Alterados

| Nome Antigo      | Nome Novo         | Email (Imutável)      |
| ---------------- | ----------------- | --------------------- |
| Tchucky Okama    | Pr. Tchucky Okama | tchucky@mkd.com       |
| Madu Cantora     | Maria Eduarda     | madu@mkd.com          |
| Jhonata Cantor   | Jhonata nemmer    | jhonata@mkd.com       |
| Lais Cantora     | Lais do Cris      | lais@mkd.com          |
| Alice Cantora    | Alice Silva       | alicesilva@mkd.com    |
| Maria Cantora    | Maria do Nilson   | mariadonilson@mkd.com |
| Wallesca cantora | Wallesca do Bruno | maralakeuri@mkd.com   |
| João Cantor      | João Vitor        | joaovitor@mkd.com     |

---

## ✅ Solução Rápida

### Passo 1: Execute o Script de Correção

No **SQL Editor do Supabase**, execute:

```sql
-- Arquivo: supabase/utils/corrigir-equipes-fixas-apos-mudanca-nomes.sql
```

Este script:

1. ✅ Limpa os relacionamentos antigos (baseados em nomes)
2. ✅ Recria os relacionamentos usando **emails** (imutáveis)
3. ✅ Mostra o resultado com os nomes atuais
4. ✅ Exibe o mapeamento de nomes antigos → novos

### Passo 2: Verifique o Resultado

O script mostrará uma tabela como esta:

```
equipe_fixa | nome_atual          | email              | funcao    | ordem | status
------------|---------------------|--------------------|-----------| ------|----------------
Equipe A-1  | Pr. Tchucky Okama   | tchucky@mkd.com    | Vocal     | 1     | ✅ Configurado
Equipe A-1  | Maria Eduarda       | madu@mkd.com       | Vocal     | 2     | ✅ Configurado
Equipe A-1  | Jhonata nemmer      | jhonata@mkd.com    | BackVocal | 3     | ✅ Configurado
Equipe A-1  | Lais do Cris        | lais@mkd.com       | BackVocal | 4     | ✅ Configurado
...
```

### Passo 3: Teste no Sistema

1. Acesse o dashboard de Louvor
2. Crie uma nova escala
3. Verifique se os membros aparecem corretamente
4. Verifique se as equipes fixas estão funcionando

---

## 🔍 Por Que Isso Aconteceu?

### Problema Original

O script antigo (`atualizar-equipes-fixas-louvor.sql`) usava **matching por nome**:

```sql
-- ❌ CÓDIGO PROBLEMÁTICO
JOIN users_profile up
  ON up.id = tm.user_id
 AND (
    lower(unaccent(up.nome)) = lower(unaccent(om.member_name))
    OR lower(unaccent(up.nome)) LIKE '%' || lower(unaccent(om.member_name)) || '%'
 )
```

**Quando o nome mudou**, o match falhou e o relacionamento foi perdido.

### Solução Implementada

O novo script usa **matching por email**:

```sql
-- ✅ CÓDIGO CORRETO
JOIN users_profile up
  ON up.id = tm.user_id
 AND lower(up.email) = lower(om.member_email)
```

**Emails são únicos e imutáveis**, então o relacionamento sempre funciona.

---

## 📊 Composição das Equipes Fixas

### Equipe A-1

1. **Pr. Tchucky Okama** - Vocal
2. **Maria Eduarda** - Vocal
3. **Jhonata nemmer** - BackVocal
4. **Lais do Cris** - BackVocal

### Equipe A-2

1. **Jhonata nemmer** - Vocal
2. **Lais do Cris** - Vocal
3. **Pr. Tchucky Okama** - BackVocal
4. **Maria Eduarda** - BackVocal

### Equipe B-1

1. **Alice Silva** - Vocal
2. **Jhonata nemmer** - Vocal
3. **Gabriela Sena** - BackVocal
4. **Maria do Nilson** - BackVocal

### Equipe B-2

1. **Gabriela Sena** - Vocal
2. **Maria do Nilson** - Vocal
3. **Alice Silva** - BackVocal
4. **Jhonata nemmer** - BackVocal

### Equipe C-1

1. **Wallesca do Bruno** - Vocal
2. **João Vitor** - Vocal
3. **Lucas Tchucky** - BackVocal
4. **Isabel Cabrera** - BackVocal

### Equipe C-2

1. **Lucas Tchucky** - Vocal
2. **Isabel Cabrera** - Vocal
3. **Wallesca do Bruno** - BackVocal
4. **João Vitor** - BackVocal

### Equipe X (Primeira Semana)

1. **Michael Cabrera** - Vocal
2. **Vinicius Guitarra** - Vocal
3. **João Vitor** - BackVocal
4. **Wallesca do Bruno** - BackVocal
5. **Alice Silva** - BackVocal

---

## 🎯 Prevenção Futura

### Regra de Ouro

> **SEMPRE use identificadores imutáveis (IDs ou emails) para relacionamentos.**
> **NUNCA use nomes para relacionamentos.**

### Hierarquia de Identificadores

1. **🥇 Melhor: UUID (ID)**
   - Imutável
   - Único
   - Performático
   - Exemplo: `team_member_id`

2. **🥈 Bom: Email**
   - Imutável (na maioria dos casos)
   - Único
   - Legível
   - Exemplo: `user.email`

3. **🥉 Aceitável: Código/Slug**
   - Imutável (por convenção)
   - Único
   - Legível
   - Exemplo: `team_type.codigo`

4. **❌ Ruim: Nome**
   - Mutável
   - Pode duplicar
   - Sensível a formatação
   - Exemplo: `user.nome`

### Scripts Recomendados

Para configurações futuras, use:

1. **`obter-ids-para-equipes-fixas.sql`** - Obter IDs
2. **`atualizar-equipes-fixas-louvor-por-id.sql`** - Configurar por ID

Para correções emergenciais:

1. **`corrigir-equipes-fixas-apos-mudanca-nomes.sql`** - Corrigir por email

---

## 🚨 Troubleshooting

### Problema: "Alguns membros ainda não aparecem"

**Causa**: Email pode estar diferente do esperado.

**Solução**:

```sql
-- Verificar emails dos usuários
SELECT id, nome, email FROM users_profile WHERE ativo = true ORDER BY nome;

-- Comparar com os emails no script
```

---

### Problema: "Função não encontrada"

**Causa**: Nome da função pode estar diferente.

**Solução**:

```sql
-- Verificar funções disponíveis
SELECT id, nome FROM team_functions
WHERE team_type_id = (
    SELECT id FROM team_types WHERE codigo = 'louvor'
);
```

---

### Problema: "Equipe fixa não existe"

**Causa**: Equipe fixa pode não ter sido criada.

**Solução**:

```sql
-- Verificar equipes fixas
SELECT id, nome, ativo FROM worship_fixed_teams
WHERE team_id = (
    SELECT id FROM teams t
    JOIN team_types tt ON tt.id = t.team_type_id
    WHERE tt.codigo = 'louvor' AND t.ativo = true
    LIMIT 1
);
```

---

## 📝 Checklist de Verificação

Após executar o script, verifique:

- [ ] Todas as 7 equipes fixas têm membros
- [ ] Equipe X tem 5 membros
- [ ] Equipes A, B e C têm 4 membros cada
- [ ] Nomes estão atualizados (novos nomes)
- [ ] Emails estão corretos
- [ ] Funções estão corretas (Vocal/BackVocal)
- [ ] Ordem está correta (sort_order)
- [ ] Sistema mostra membros nas escalas

---

## 📚 Documentação Relacionada

- **Problema Original**: `docs/PROBLEMA_RELACIONAMENTO_POR_NOME.md`
- **Scripts Disponíveis**: `supabase/utils/README.md`
- **Solução por ID**: `supabase/utils/atualizar-equipes-fixas-louvor-por-id.sql`
- **Obter IDs**: `supabase/utils/obter-ids-para-equipes-fixas.sql`

---

## ✅ Resultado Esperado

Após executar o script:

1. ✅ **Equipes fixas restauradas** com nomes atuais
2. ✅ **Membros aparecem nas escalas** corretamente
3. ✅ **Sistema funciona normalmente** mesmo com mudanças de nome
4. ✅ **Relacionamentos baseados em email** (mais confiável que nome)

---

**Status**: ✅ **PRONTO PARA USO**

Execute o script `corrigir-equipes-fixas-apos-mudanca-nomes.sql` e o problema será resolvido imediatamente.

---

**Criado por**: Kiro AI  
**Data**: 06 de Maio de 2026  
**Versão**: 1.0.0
