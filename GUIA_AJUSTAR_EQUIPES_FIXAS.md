# 🎵 GUIA: Ajustar Equipes Fixas do Louvor

## 📋 OBJETIVO

Atualizar a configuração das equipes fixas (padrão) do louvor com os usuários corretos.

---

## 🚀 PASSO A PASSO

### 1️⃣ LISTAR USUÁRIOS DISPONÍVEIS

Execute o script para ver todos os usuários da equipe de louvor:

```sql
-- Arquivo: supabase/utils/listar-usuarios-louvor.sql
```

**O que você verá**:

- 👥 Lista de todos os membros ativos
- 📧 Emails de cada membro
- 🎵 Funções disponíveis (Vocal, BackVocal, etc)
- 📋 Configuração atual das equipes fixas

**Copie os emails** que você vai usar nas equipes.

---

### 2️⃣ EDITAR O SCRIPT DE ATUALIZAÇÃO

Abra o arquivo:

```
supabase/utils/atualizar-equipes-fixas-nomes-atuais.sql
```

**Localize a seção**:

```sql
official_members(preset_name, member_email, function_name, sort_order) AS (
    VALUES
        -- EQUIPE A-1
        ('Equipe A-1', 'tchucky@mkd.com', 'Vocal', 1),
        ('Equipe A-1', 'madu@mkd.com', 'Vocal', 2),
        ...
```

**Ajuste os emails** conforme necessário:

- ✅ Use os emails que você copiou do passo 1
- ✅ Mantenha as aspas simples: `'email@mkd.com'`
- ✅ Não esqueça as vírgulas entre as linhas
- ✅ Última linha de cada equipe NÃO tem vírgula no final

---

### 3️⃣ EXECUTAR O SCRIPT

1. Abra o **Supabase SQL Editor**
2. Copie TODO o conteúdo de `atualizar-equipes-fixas-nomes-atuais.sql`
3. Cole no SQL Editor
4. Clique em **Run** ou pressione **Ctrl+Enter**

---

### 4️⃣ VERIFICAR O RESULTADO

O script mostrará 3 resultados:

#### ✅ Resultado 1: Equipes Atualizadas

```
✅ EQUIPES FIXAS ATUALIZADAS
Equipe A-1 | Pr. Tchucky Okama | tchucky@mkd.com | Vocal | 1
Equipe A-1 | Maria Eduarda | madu@mkd.com | Vocal | 2
...
```

#### 📊 Resultado 2: Estatísticas

```
📊 ESTATÍSTICAS
total_equipes: 7
total_membros_unicos: 13
total_configuracoes: 33
```

#### ⚠️ Resultado 3: Usuários Não Encontrados

```
⚠️ USUÁRIOS NÃO ENCONTRADOS
(vazio se tudo estiver OK)
```

Se aparecer algum usuário aqui, significa que:

- ❌ Email não existe no sistema
- ❌ Usuário está inativo
- ❌ Usuário não é membro da equipe de louvor

---

## 🎯 ESTRUTURA DAS EQUIPES

### Equipes Disponíveis:

1. **Equipe X** - Primeira semana do mês (5 membros)
2. **Equipe A-1** - Segunda semana (4 membros)
3. **Equipe A-2** - Segunda semana alternativa (4 membros)
4. **Equipe B-1** - Terceira semana (4 membros)
5. **Equipe B-2** - Terceira semana alternativa (4 membros)
6. **Equipe C-1** - Quarta semana (4 membros)
7. **Equipe C-2** - Quarta semana alternativa (4 membros)

### Funções Disponíveis:

- **Vocal** - Ministro/Ministra (líder de louvor)
- **BackVocal** - Backing vocal

---

## 📝 EXEMPLO DE CONFIGURAÇÃO

```sql
official_members(preset_name, member_email, function_name, sort_order) AS (
    VALUES
        -- EQUIPE A-1
        ('Equipe A-1', 'joao@mkd.com', 'Vocal', 1),      -- João será Vocal
        ('Equipe A-1', 'maria@mkd.com', 'Vocal', 2),     -- Maria será Vocal
        ('Equipe A-1', 'pedro@mkd.com', 'BackVocal', 3), -- Pedro será BackVocal
        ('Equipe A-1', 'ana@mkd.com', 'BackVocal', 4),   -- Ana será BackVocal

        -- EQUIPE A-2
        ('Equipe A-2', 'pedro@mkd.com', 'Vocal', 1),     -- Pedro agora é Vocal
        ('Equipe A-2', 'ana@mkd.com', 'Vocal', 2),       -- Ana agora é Vocal
        ('Equipe A-2', 'joao@mkd.com', 'BackVocal', 3),  -- João agora é BackVocal
        ('Equipe A-2', 'maria@mkd.com', 'BackVocal', 4)  -- Maria agora é BackVocal
)
```

**Observações**:

- ✅ Mesma pessoa pode estar em várias equipes
- ✅ Mesma pessoa pode ter funções diferentes em equipes diferentes
- ✅ `sort_order` define a ordem de exibição (1, 2, 3, 4...)

---

## 🔍 VALIDAÇÃO

Após executar o script, valide no sistema:

1. **Abra o Dashboard de Louvor**
2. **Clique em "Criar Escala"**
3. **Selecione "Usar Equipe Fixa"**
4. **Verifique se as equipes aparecem corretamente**
5. **Selecione uma equipe e veja se os membros estão corretos**

---

## ⚠️ TROUBLESHOOTING

### Problema: "Usuário não encontrado"

**Causa**: Email não existe ou usuário inativo.

**Solução**:

1. Execute `listar-usuarios-louvor.sql`
2. Verifique se o email está correto
3. Verifique se o usuário está ativo
4. Corrija o email no script

---

### Problema: "Syntax error"

**Causa**: Erro de sintaxe SQL (vírgula faltando ou sobrando).

**Solução**:

1. Verifique se todas as linhas têm vírgula no final (exceto a última)
2. Verifique se as aspas estão corretas: `'email@mkd.com'`
3. Verifique se os parênteses estão balanceados

---

### Problema: "Equipe não aparece no sistema"

**Causa**: Equipe fixa não foi criada no banco.

**Solução**:

1. Verifique se a equipe existe na tabela `worship_fixed_teams`
2. O nome da equipe no script deve ser EXATAMENTE igual ao nome no banco
3. Exemplos: `'Equipe A-1'`, `'Equipe X'`

---

## 📊 SCRIPTS DISPONÍVEIS

### 1. `listar-usuarios-louvor.sql` 🔍

- Lista todos os usuários da equipe de louvor
- Mostra emails e status
- Mostra configuração atual

### 2. `atualizar-equipes-fixas-nomes-atuais.sql` ✅

- Atualiza as equipes fixas
- Usa emails como identificador
- Mostra resultado e estatísticas

### 3. `corrigir-equipes-fixas-apos-mudanca-nomes.sql` 🔧

- Correção após mudança de nomes
- Mapeamento de nomes antigos → novos
- Usa emails (imutável)

---

## 🎓 BOAS PRÁTICAS

### ✅ SEMPRE Use Emails

```sql
-- ✅ BOM: Usa email (imutável)
('Equipe A-1', 'joao@mkd.com', 'Vocal', 1)

-- ❌ RUIM: Usa nome (mutável)
-- Não faça isso!
```

### ✅ Mantenha a Ordem Lógica

```sql
-- ✅ BOM: Vocais primeiro, depois BackVocals
('Equipe A-1', 'joao@mkd.com', 'Vocal', 1),
('Equipe A-1', 'maria@mkd.com', 'Vocal', 2),
('Equipe A-1', 'pedro@mkd.com', 'BackVocal', 3),
('Equipe A-1', 'ana@mkd.com', 'BackVocal', 4)
```

### ✅ Documente Mudanças

Adicione comentários no script:

```sql
-- EQUIPE A-1
-- Atualizado em: 07/05/2026
-- Mudança: Trocado João por Pedro como Vocal
('Equipe A-1', 'pedro@mkd.com', 'Vocal', 1),
```

---

## 📞 SUPORTE

### Documentação Relacionada:

- 📋 `supabase/utils/README.md` - Guia de scripts SQL
- 📋 `docs/PROBLEMA_RELACIONAMENTO_POR_NOME.md` - Por que usar IDs/emails

### Scripts Relacionados:

- 🔍 `listar-usuarios-louvor.sql`
- ✅ `atualizar-equipes-fixas-nomes-atuais.sql`
- 🔧 `corrigir-equipes-fixas-apos-mudanca-nomes.sql`
- 📋 `obter-ids-para-equipes-fixas.sql`

---

## ✅ CHECKLIST

Antes de executar:

- [ ] Executei `listar-usuarios-louvor.sql`
- [ ] Copiei os emails corretos
- [ ] Editei `atualizar-equipes-fixas-nomes-atuais.sql`
- [ ] Verifiquei a sintaxe SQL
- [ ] Revisei todas as equipes

Após executar:

- [ ] Script executou sem erros
- [ ] Resultado mostra todas as equipes
- [ ] Nenhum usuário "não encontrado"
- [ ] Validei no sistema (Dashboard → Criar Escala)
- [ ] Equipes aparecem corretamente

---

**Status**: ✅ Pronto para uso  
**Última atualização**: 07 de Maio de 2026  
**Dificuldade**: ⭐⭐ Intermediário
