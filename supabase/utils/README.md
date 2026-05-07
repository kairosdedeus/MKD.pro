# 📁 Scripts Utilitários do Supabase

Esta pasta contém scripts SQL para manutenção e configuração do banco de dados.

---

## 🔧 Scripts Disponíveis

### 1. Equipes Fixas do Louvor

#### 🚨 `corrigir-equipes-fixas-apos-mudanca-nomes.sql` (CORREÇÃO EMERGENCIAL)

**Descrição**: Corrige equipes fixas após usuários mudarem seus nomes. Usa **emails** como identificador.

**Quando usar**:

- ✅ **AGORA** - Se usuários mudaram nomes e membros sumiram das escalas
- Correção emergencial após mudança de nomes
- Restaurar relacionamentos perdidos

**Como usar**:

1. Execute diretamente no SQL Editor do Supabase
2. Verifique o resultado mostrado
3. Teste no sistema

**Vantagens**:

- ✅ Correção automática
- ✅ Usa emails (imutáveis)
- ✅ Mostra mapeamento de nomes antigos → novos
- ✅ Pronto para uso (não precisa editar)

**Documentação**: Ver `docs/CORRECAO_EQUIPES_FIXAS.md`

---

#### ✅ `atualizar-equipes-fixas-louvor-por-id.sql` (RECOMENDADO)

**Descrição**: Atualiza as equipes fixas do louvor usando **IDs** em vez de nomes.

**Quando usar**:

- Configuração inicial das equipes fixas
- Após adicionar novos membros
- Após reorganizar equipes

**Como usar**:

1. Execute `obter-ids-para-equipes-fixas.sql` para obter os IDs
2. Substitua os UUIDs de exemplo pelos IDs reais
3. Execute o script

**Vantagens**:

- ✅ Imutável (não quebra ao mudar nomes)
- ✅ Preciso (sem ambiguidade)
- ✅ Confiável (sempre funciona)

---

#### 📊 `obter-ids-para-equipes-fixas.sql` (AUXILIAR)

**Descrição**: Script auxiliar que retorna todos os IDs necessários para configurar as equipes fixas.

**Quando usar**: Antes de executar `atualizar-equipes-fixas-louvor-por-id.sql`

**O que retorna**:

1. ID da equipe de louvor
2. IDs dos membros (team_member_id)
3. IDs das funções (function_id)
4. IDs das equipes fixas (preset_id)
5. Configuração atual
6. Template para copiar e colar

**Como usar**:

1. Execute no SQL Editor do Supabase
2. Copie os IDs retornados
3. Cole no script `atualizar-equipes-fixas-louvor-por-id.sql`

---

#### ⚠️ `atualizar-equipes-fixas-louvor.sql` (DEPRECADO)

**Status**: ⚠️ **NÃO USE MAIS ESTE SCRIPT**

**Problema**: Usa matching por **nome** em vez de IDs, causando perda de relacionamento quando usuários mudam seus nomes.

**Solução**: Use `atualizar-equipes-fixas-louvor-por-id.sql`

**Documentação**: Ver `docs/PROBLEMA_RELACIONAMENTO_POR_NOME.md`

---

### 2. Adicionar Membros ao Louvor

#### `adicionar-membros-louvor.sql`

**Descrição**: Adiciona membros à equipe de louvor.

**Quando usar**:

- Adicionar novos membros à equipe
- Configuração inicial

**Como usar**:

1. Edite o script com os IDs dos usuários
2. Execute no SQL Editor do Supabase

---

### 3. Resetar Senha de Usuário

#### `resetar-senha.sql` (se existir)

**Descrição**: Reseta a senha de um usuário específico.

**Quando usar**:

- Usuário esqueceu a senha
- Necessidade de acesso emergencial

**Como usar**:

1. Edite o script com o email do usuário
2. Defina a nova senha
3. Execute no SQL Editor do Supabase

---

## 📚 Documentação Relacionada

- **Problema de Relacionamento por Nome**: `docs/PROBLEMA_RELACIONAMENTO_POR_NOME.md`
- **Estrutura do Banco**: `docs/PROJECT_STATUS_FINAL.md`
- **Guia de Deploy**: `docs/DEPLOY.md`

---

## 🎯 Boas Práticas

### ✅ Sempre Use IDs

```sql
-- ✅ BOM: Relacionamento por ID
INSERT INTO worship_fixed_team_members (preset_id, team_member_id, function_id)
VALUES ('uuid-preset', 'uuid-member', 'uuid-function');

-- ❌ RUIM: Matching por nome
SELECT * FROM users_profile WHERE nome LIKE '%João%';
```

### ✅ Valide Antes de Executar

```sql
-- Sempre verifique se os IDs existem antes de inserir
SELECT id, nome FROM users_profile WHERE id = 'uuid-aqui';
```

### ✅ Use Transações

```sql
BEGIN;
  -- Suas operações aqui
  INSERT INTO ...
  UPDATE ...
COMMIT;
-- Se algo der errado, execute: ROLLBACK;
```

### ✅ Faça Backup

Antes de executar scripts que modificam dados:

```sql
-- Backup da tabela
CREATE TABLE worship_fixed_team_members_backup AS
SELECT * FROM worship_fixed_team_members;
```

---

## 🚨 Troubleshooting

### Problema: "Membro não aparece nas escalas"

**Causa**: Relacionamento por nome quebrou após mudança de nome.

**Solução**:

1. Execute `obter-ids-para-equipes-fixas.sql`
2. Verifique se o `team_member_id` está correto
3. Execute `atualizar-equipes-fixas-louvor-por-id.sql` com IDs corretos

---

### Problema: "FK constraint violation"

**Causa**: ID não existe na tabela referenciada.

**Solução**:

1. Verifique se o usuário existe: `SELECT * FROM users_profile WHERE id = 'uuid'`
2. Verifique se o membro existe: `SELECT * FROM team_members WHERE id = 'uuid'`
3. Verifique se a função existe: `SELECT * FROM team_functions WHERE id = 'uuid'`

---

### Problema: "Duplicate key violation"

**Causa**: Tentativa de inserir registro que já existe.

**Solução**:

1. Use `ON CONFLICT DO NOTHING` ou `ON CONFLICT DO UPDATE`
2. Ou limpe os registros antigos antes de inserir

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique a documentação em `docs/`
2. Execute os scripts auxiliares para obter informações
3. Verifique os logs do Supabase
4. Consulte `docs/PROBLEMA_RELACIONAMENTO_POR_NOME.md`

---

## 📝 Histórico de Mudanças

### 2026-05-06

- ✅ Criado `atualizar-equipes-fixas-louvor-por-id.sql`
- ✅ Criado `obter-ids-para-equipes-fixas.sql`
- ⚠️ Deprecado `atualizar-equipes-fixas-louvor.sql`
- ✅ Criado `docs/PROBLEMA_RELACIONAMENTO_POR_NOME.md`
- ✅ Criado este README

---

**Última atualização**: 06 de Maio de 2026
