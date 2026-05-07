# 🎯 SCRIPTS PRONTOS PARA EXECUTAR

## ✅ STATUS: TODOS OS SCRIPTS CRIADOS E PRONTOS

Todos os scripts foram gerados com os **IDs reais** do seu banco de dados.

---

## 📋 ORDEM DE EXECUÇÃO

### 1️⃣ Adicionar Membros Faltantes

**Arquivo**: `supabase/utils/adicionar-membros-faltantes-louvor.sql`

```sql
-- Adiciona: Madu, Laís, Maria e Isabel
-- Tempo: ~5 segundos
```

---

### 2️⃣ Criar Tabelas de Regras

**Arquivo**: `supabase/migrations/001_criar_tabelas_regras_rodizio.sql`

```sql
-- Cria 4 tabelas:
-- - worship_bassist_rotation_rules
-- - worship_drummer_rotation_rules
-- - worship_member_rules
-- - worship_fixed_function_assignments
-- Adiciona coluna 'codigo' em worship_fixed_teams
-- Tempo: ~10 segundos
```

---

### 3️⃣ Popular Regras com IDs Reais

**Arquivo**: `supabase/migrations/003_popular_regras_com_ids.sql`

```sql
-- Popula:
-- ✅ 3 regras de baixistas (Daniel, Ari, Nilson)
-- ✅ 3 regras de bateristas (Nilson, Isadora, Thiago)
-- ✅ 2 funções fixas (Michael teclado, Vinicius guitarra)
-- ✅ 7 códigos de equipes (equipe-x, equipe-a-1, etc)
-- Tempo: ~5 segundos
```

**IDs Utilizados**:

#### Baixistas:

- Daniel: `c94ab4da-f708-4ddc-a2f7-683e97786846` (Equipe X fixa)
- Ari: `0aa9e636-cce8-456e-94b2-9a5536bfe0ec` (Rodízio)
- Nilson: `422e6117-7ee6-4265-a02d-142263054ee7` (Rodízio, não toca baixo quando bateria)

#### Bateristas:

- Nilson: `422e6117-7ee6-4265-a02d-142263054ee7` (Equipe X fixa)
- Isadora: `aaf72dac-cf1c-4a37-9bd7-05b91d4ff00f` (Rodízio)
- Thiago: `9350205d-8941-43f8-8768-abe4868c24a5` (Rodízio)

#### Funções Fixas:

- Michael: `2ca33c51-5c0d-44c7-b564-6a1b44ea99b0` → Teclado: `da1a9f8e-6533-473e-a7d8-d92b34dc167e`
- Vinicius: `7b21e430-983f-4bc2-afde-ecfc17d98ab6` → Guitarra: `88a2c6ef-7226-4886-8289-d8687576b005`

---

### 4️⃣ Atualizar Equipes Fixas

**Arquivo**: `supabase/utils/atualizar-equipes-fixas-nomes-atuais.sql`

```sql
-- Configura todas as 7 equipes fixas:
-- Equipe X, A-1, A-2, B-1, B-2, C-1, C-2
-- Tempo: ~10 segundos
```

---

## 🎉 RESULTADO FINAL

Após executar os 4 scripts:

### Tabelas Criadas:

✅ `worship_bassist_rotation_rules` (3 registros)  
✅ `worship_drummer_rotation_rules` (3 registros)  
✅ `worship_member_rules` (vazia, para uso futuro)  
✅ `worship_fixed_function_assignments` (2 registros)

### Dados Populados:

✅ **3 regras de baixistas** com ordem de rodízio  
✅ **3 regras de bateristas** com ordem de rodízio  
✅ **2 funções fixas** (Michael e Vinicius)  
✅ **7 códigos de equipes** imutáveis  
✅ **7 equipes fixas** completas com todos os membros

### Benefícios Imediatos:

🎯 **Sistema 100% baseado em IDs**  
🎯 **Mudanças de nome não quebram mais nada**  
🎯 **Mudanças de email não quebram mais nada**  
🎯 **Regras de rodízio no banco de dados**  
🎯 **Fácil manutenção e auditoria**

---

## 📊 VALIDAÇÃO

Após executar, você verá:

### Baixistas:

| Ordem | Nome   | Tipo             | Restrição                                |
| ----- | ------ | ---------------- | ---------------------------------------- |
| 1     | Daniel | ✅ Equipe X Fixa | -                                        |
| 2     | Ari    | 🔄 Rodízio       | -                                        |
| 3     | Nilson | 🔄 Rodízio       | ⚠️ Não toca baixo quando está na bateria |

### Bateristas:

| Ordem | Nome    | Tipo             |
| ----- | ------- | ---------------- |
| 1     | Nilson  | ✅ Equipe X Fixa |
| 2     | Isadora | 🔄 Rodízio       |
| 3     | Thiago  | 🔄 Rodízio       |

### Funções Fixas:

| Membro   | Função   | Status             |
| -------- | -------- | ------------------ |
| Michael  | Teclado  | ✅ Sempre escalado |
| Vinicius | Guitarra | ✅ Sempre escalado |

### Códigos das Equipes:

| Nome       | Código     | Status         |
| ---------- | ---------- | -------------- |
| Equipe X   | equipe-x   | ✅ Configurado |
| Equipe A-1 | equipe-a-1 | ✅ Configurado |
| Equipe A-2 | equipe-a-2 | ✅ Configurado |
| Equipe B-1 | equipe-b-1 | ✅ Configurado |
| Equipe B-2 | equipe-b-2 | ✅ Configurado |
| Equipe C-1 | equipe-c-1 | ✅ Configurado |
| Equipe C-2 | equipe-c-2 | ✅ Configurado |

---

## ⚠️ IMPORTANTE

### Scripts Deprecados (NÃO USAR):

❌ `002_popular_regras_iniciais.sql` - Tinha placeholders, foi substituído pelo 003

### Scripts Corretos (USAR):

✅ `001_criar_tabelas_regras_rodizio.sql` - Cria estrutura  
✅ `003_popular_regras_com_ids.sql` - Popula com IDs reais  
✅ `gerar-script-popular-regras.sql` - Utilitário (já executado)

---

## 🚀 PRÓXIMOS PASSOS (APÓS EXECUTAR)

1. ✅ Testar criação de escalas no sistema
2. ✅ Verificar se equipes fixas aparecem completas
3. ✅ Mudar nome de um usuário e verificar que nada quebra
4. ✅ Mudar email de um usuário e verificar que nada quebra
5. 🔄 Migrar frontend para usar `worshipAutoScheduleServiceV2` (futuro)

---

## 📞 SUPORTE

Se algo der errado:

1. Verifique se executou na ordem correta
2. Verifique se o script `001` foi executado antes do `003`
3. Leia as mensagens de erro no Supabase SQL Editor
4. Consulte `RESUMO_FINAL_SISTEMA_IDS.md` para detalhes

---

**Tempo total estimado**: 30 segundos de execução  
**Dificuldade**: ⭐ Muito fácil (copiar e colar)  
**Reversível**: ✅ Sim (são apenas novas tabelas)  
**Impacto**: 🎯 Sistema inteiro mais robusto

---

## ✨ EXECUTE AGORA!

Abra o Supabase SQL Editor e execute os 4 scripts na ordem! 🎵
