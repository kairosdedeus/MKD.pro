# Configuração das Equipes de Louvor

Este guia explica como configurar os membros e equipes fixas do Louvor no sistema.

## 📋 Pré-requisitos

1. Ter a equipe de Louvor criada no sistema (tipo: `louvor`)
2. Ter as funções `Vocal` e `BackVocal` cadastradas para o tipo Louvor
3. Acesso ao SQL Editor do Supabase

## 🚀 Passo a Passo

### 1️⃣ Adicionar Membros ao Sistema

Execute o script `adicionar-membros-louvor.sql` no SQL Editor do Supabase.

Este script irá:

- Criar usuários para todos os membros necessários (se ainda não existirem)
- Adicionar os usuários como membros da equipe de Louvor
- Mostrar um resumo do que foi criado

**Membros que serão adicionados:**

- Tchucky, Madu, Jhonata, Lais
- Alice, Gabriela, Maria
- Wallesca, João, Lucas, Isabel
- Michael, Vinicius
- Daniel, Ari, Nilson, Thiago, Isadora

### 2️⃣ Criar/Atualizar Equipes Fixas

Execute o script `atualizar-equipes-fixas-louvor.sql` no SQL Editor do Supabase.

Este script irá:

- Limpar as configurações antigas das equipes fixas
- Configurar as 7 equipes padrão com os membros corretos
- Mostrar o resultado final organizado

**Equipes configuradas:**

#### 🔹 EQUIPE A

- **A-1**: Ministros → Tchucky, Madu | Backs → Jhonata, Lais
- **A-2**: Ministros → Jhonata, Lais | Backs → Tchucky, Madu

#### 🔹 EQUIPE B

- **B-1**: Ministros → Alice, Jhonata | Backs → Gabriela, Maria
- **B-2**: Ministros → Gabriela, Maria | Backs → Alice, Jhonata

#### 🔹 EQUIPE C

- **C-1**: Ministros → Wallesca, João | Backs → Lucas, Isabel
- **C-2**: Ministros → Lucas, Isabel | Backs → Wallesca, João

#### 🔹 EQUIPE X (Primeira semana do mês)

- Ministros → Michael, Vinicius
- Backs → João, Wallesca, Alice

### 3️⃣ Verificar no Sistema

Após executar os scripts:

1. Acesse o Dashboard do Louvor no sistema
2. Verifique a seção "Equipes fixas do Louvor"
3. Confirme que todas as 7 equipes aparecem com os membros corretos
4. Teste criar uma escala usando uma equipe fixa

## 🔄 Rodízio Automático

O sistema usa as seguintes regras para escala mensal automática:

### Equipes

- **1ª semana do mês**: Equipe X (fixa)
- **Demais semanas**: Rodízio A-1 → B-1 → C-1 → A-2 → B-2 → C-2 → A-1...

### Bateristas

- **1ª semana (Equipe X)**: Nilson (fixo)
- **Demais semanas**: Rodízio Thiago ↔ Isadora

### Baixistas

- **1ª semana (Equipe X)**: Daniel (fixo)
- **Demais semanas**: Rodízio Daniel → Ari → Nilson → Daniel...
- **Regra especial**: Se Nilson estiver na bateria, pula para o próximo baixista

### Instrumentistas Fixos

- **Teclado**: Michael (sempre)
- **Guitarra**: Vinicius (sempre)

## 🛠️ Solução de Problemas

### Membros não aparecem nas equipes fixas

1. Verifique se os usuários foram criados:

```sql
SELECT nome, email FROM users_profile
WHERE nome IN ('Tchucky', 'Madu', 'Jhonata', 'Lais', 'Alice', 'Gabriela', 'Maria', 'Wallesca', 'João', 'Lucas', 'Isabel', 'Michael', 'Vinicius');
```

2. Verifique se são membros da equipe de Louvor:

```sql
SELECT up.nome
FROM team_members tm
JOIN users_profile up ON up.id = tm.user_id
JOIN teams t ON t.id = tm.team_id
JOIN team_types tt ON tt.id = t.team_type_id
WHERE tt.codigo = 'louvor' AND tm.ativo = true;
```

3. Execute novamente o script `atualizar-equipes-fixas-louvor.sql`

### Nomes não fazem match

O sistema usa busca flexível (ignora acentos e maiúsculas). Se um nome não for encontrado:

1. Verifique a grafia exata no banco:

```sql
SELECT nome FROM users_profile WHERE nome LIKE '%nome_parcial%';
```

2. Ajuste o nome no script `atualizar-equipes-fixas-louvor.sql` se necessário

## 📝 Notas

- Os scripts são idempotentes (podem ser executados múltiplas vezes sem duplicar dados)
- Emails gerados automaticamente seguem o padrão: `nome@mkd.com.br`
- Para adicionar novos membros, edite o script `adicionar-membros-louvor.sql`
- Para alterar a composição das equipes, edite o script `atualizar-equipes-fixas-louvor.sql`
