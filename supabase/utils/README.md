# 📁 Scripts Utilitários do Supabase

Esta pasta contém scripts SQL para manutenção e configuração do banco de dados.

---

## 🔧 Scripts Disponíveis

### 1. Equipes Fixas do Louvor

#### ✅ `atualizar-equipes-fixas-nomes-atuais.sql` (RECOMENDADO) 🆕

**Descrição**: Atualiza as equipes fixas do louvor com os nomes ATUAIS dos usuários.

**Quando usar**:

- ✅ **SEMPRE** que precisar ajustar as equipes padrão
- Adicionar ou remover membros das equipes
- Reorganizar funções (Vocal ↔ BackVocal)
- Após adicionar novos membros à equipe

**Como usar**:

1. Execute `listar-usuarios-louvor.sql` para ver usuários disponíveis
2. Edite o script com os emails corretos
3. Execute no SQL Editor do Supabase
4. Verifique o resultado

**Vantagens**:

- ✅ Usa emails (imutáveis)
- ✅ Fácil de editar e manter
- ✅ Mostra resultado e estatísticas
- ✅ Detecta usuários não encontrados

**Documentação**: Ver `GUIA_AJUSTAR_EQUIPES_FIXAS.md`

---

#### 🔍 `listar-usuarios-louvor.sql` (AUXILIAR) 🆕

**Descrição**: Lista todos os usuários ativos da equipe de louvor.

**Quando usar**: Antes de editar as equipes fixas

**O que mostra**:

- 👥 Todos os membros ativos
- 📧 Emails de cada membro
- 🎵 Funções disponíveis
- 📋 Configuração atual das equipes

**Como usar**:

1. Execute no SQL Editor do Supabase
2. Copie os emails que você vai usar
3. Use no script `atualizar-equipes-fixas-nomes-atuais.sql`

---

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

### 2. Restauração de Escalas

#### 🚨 `adicionar-tchucky-escalas-maio.sql` (CORREÇÃO ESPECÍFICA)

**Descrição**: Adiciona Pr. Tchucky Okama nas escalas de maio onde ele deveria estar.

**Quando usar**:

- ✅ **AGORA** - Se Tchucky sumiu das escalas após mudança de nome
- Correção específica para usuário que foi removido das escalas

**Escalas afetadas**:

- 2026-05-16 Sábado → BackVocal
- 2026-05-17 Domingo → BackVocal
- 2026-05-30 Sábado → Vocal
- 2026-05-31 Domingo → Vocal

**Como usar**:

1. Execute diretamente no SQL Editor do Supabase
2. Verifique o resultado (deve mostrar as 4 escalas)
3. Teste no dashboard de Louvor

**Vantagens**:

- ✅ Correção cirúrgica (apenas Tchucky)
- ✅ Usa email (imutável)
- ✅ Não duplica se já existir
- ✅ Mostra resultado final

**Documentação**: Ver `SOLUCAO_TCHUCKY_SUMIU.md`

---

#### 📋 `diagnosticar-tchucky.sql` (DIAGNÓSTICO)

**Descrição**: Diagnóstico completo do usuário Tchucky nas escalas.

**Quando usar**:

- Verificar se Tchucky está nas escalas
- Entender por que ele não aparece
- Validar após executar correção

**O que verifica**:

1. ✅ Usuário existe e está ativo
2. ✅ Tem team_member ativo
3. ✅ Está em escalas
4. ✅ Tem funções configuradas
5. ✅ Query do frontend funciona
6. 📊 Diagnóstico final

**Como usar**:

1. Execute no SQL Editor do Supabase
2. Analise os 7 passos do diagnóstico
3. O PASSO 6 mostra o diagnóstico final

---

#### 🔄 `restaurar-escala-maio-2026.sql` (RESTAURAÇÃO COMPLETA)

**Descrição**: Restaura TODAS as escalas de maio/2026 com todos os membros.

**Quando usar**:

- ⚠️ Apenas se `adicionar-tchucky-escalas-maio.sql` não resolver
- Restauração completa após perda de dados
- Recriar escalas do zero

**O que faz**:

- Cria 10 escalas (5 finais de semana × 2 dias)
- Adiciona todos os membros com suas funções
- Usa emails como identificador

**Como usar**:

1. ⚠️ **BACKUP PRIMEIRO**: Este script recria tudo
2. Execute no SQL Editor do Supabase
3. Verifique todas as escalas no dashboard

**Documentação**: Ver `RESTAURAR_ESCALA_MAIO.md`

---

#### 🔍 `diagnosticar-escalas-sem-membros.sql` (DIAGNÓSTICO GERAL)

**Descrição**: Diagnóstico completo de escalas sem membros ou sem funções.

**Quando usar**:

- Escalas não aparecem membros
- Membros aparecem mas sem funções
- Investigar problemas gerais

**O que verifica**:

1. Escalas sem membros
2. Membros sem funções
3. Membros órfãos
4. Resumo geral

**Como usar**:

1. Execute no SQL Editor do Supabase
2. Analise os 5 passos do diagnóstico

---

### 3. Adicionar Membros ao Louvor

#### `adicionar-membros-louvor.sql`

**Descrição**: Adiciona membros à equipe de louvor.

**Quando usar**:

- Adicionar novos membros à equipe
- Configuração inicial

**Como usar**:

1. Edite o script com os IDs dos usuários
2. Execute no SQL Editor do Supabase

---

### 4. Resetar Senha de Usuário

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

### 5. Scripts de Diagnóstico Rápido

#### 🔍 `EXECUTE-PRIMEIRO-diagnostico-rapido.sql`

**Descrição**: Diagnóstico rápido de escalas sem membros.

**Quando usar**:

- ✅ **PRIMEIRO PASSO** ao investigar problemas
- Escalas não mostram membros
- Visão geral rápida

**O que mostra**:

- Total de escalas
- Total de membros
- Membros sem funções
- Resumo geral

**Como usar**:

1. Execute no SQL Editor do Supabase
2. Analise o resultado
3. Se necessário, execute diagnósticos específicos

---

#### 🔍 `diagnosticar-usuario-sumiu.sql` (TEMPLATE)

**Descrição**: Template para diagnosticar usuário que sumiu das escalas.

**Quando usar**:

- Qualquer usuário sumiu das escalas
- Investigar problema específico de um usuário

**Como usar**:

1. Copie o script
2. Substitua o email do usuário
3. Execute no SQL Editor do Supabase

**Exemplo**: Ver `diagnosticar-tchucky.sql`

---

#### 📊 `verificar-escalas-maio.sql`

**Descrição**: Verifica todas as escalas de maio/2026.

**Quando usar**:

- Validar escalas de maio
- Verificar membros e funções
- Após executar restauração

**O que mostra**:

- Todas as escalas de maio
- Membros de cada escala
- Funções de cada membro
- Total de membros por escala

**Como usar**:

1. Execute no SQL Editor do Supabase
2. Analise os resultados

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

### Problema: "Usuário sumiu das escalas após mudar nome"

**Sintomas**: Usuário não aparece mais nas escalas após alterar nome ou email.

**Causa**: Registros de `schedule_members` foram removidos (não deveria acontecer com IDs).

**Solução**:

1. Execute o diagnóstico: `diagnosticar-usuario-sumiu.sql` (substitua o email)
2. Se confirmar que não está nas escalas, crie script específico baseado em `adicionar-tchucky-escalas-maio.sql`
3. Ou execute `restaurar-escala-maio-2026.sql` para restaurar tudo

**Exemplo**: Ver `SOLUCAO_TCHUCKY_SUMIU.md`

---

### Problema: "Membros aparecem mas sem funções"

**Sintomas**: Escalas mostram membros mas não aparecem no modal.

**Causa**: Registros em `schedule_members` existem mas faltam em `schedule_member_functions`.

**Solução**:

1. Execute `diagnosticar-escalas-sem-membros.sql`
2. Se confirmar "Membros sem funções", execute `adicionar-funcoes-escalas-maio.sql`
3. Ou use `corrigir-escalas-existentes.sql`

**Documentação**: Ver `GUIA_RAPIDO_CORRECAO_ESCALAS.md`

---

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

### 2026-05-07 (Tarde)

- ✅ Criado `atualizar-equipes-fixas-nomes-atuais.sql` (script principal para equipes)
- 🔍 Criado `listar-usuarios-louvor.sql` (auxiliar para listar membros)
- 📋 Criado `GUIA_AJUSTAR_EQUIPES_FIXAS.md` (documentação completa)

### 2026-05-07 (Manhã)

- 🚨 Criado `adicionar-tchucky-escalas-maio.sql` (correção específica)
- 🔍 Criado `diagnosticar-tchucky.sql` (diagnóstico específico)
- 🔍 Criado `diagnosticar-usuario-sumiu.sql` (template)
- 📊 Criado `verificar-escalas-maio.sql` (validação)
- 🔄 Criado `restaurar-escala-maio-2026.sql` (restauração completa)
- 🔧 Criado `adicionar-funcoes-escalas-maio.sql` (correção de funções)
- 📋 Criado `SOLUCAO_TCHUCKY_SUMIU.md` (documentação)
- 📋 Criado `GUIA_RAPIDO_CORRECAO_ESCALAS.md` (guia rápido)

### 2026-05-06

- ✅ Criado `atualizar-equipes-fixas-louvor-por-id.sql`
- ✅ Criado `obter-ids-para-equipes-fixas.sql`
- ⚠️ Deprecado `atualizar-equipes-fixas-louvor.sql`
- ✅ Criado `docs/PROBLEMA_RELACIONAMENTO_POR_NOME.md`
- ✅ Criado este README

---

**Última atualização**: 07 de Maio de 2026 (Tarde)
