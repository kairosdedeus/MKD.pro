# Supabase Database Schema

Este diretório contém o schema SQL completo do banco de dados Supabase.

## 📁 Arquivos

- `schema.sql` - Schema completo do banco de dados

## 🗄️ Estrutura do Banco

### Tabelas Principais

1. **users_profile** - Perfis de usuários
2. **profiles** - Tipos de perfis (gerencial, líder, membro)
3. **user_profiles** - Relacionamento usuário-perfil (N:N)
4. **team_types** - Tipos de equipe (louvor, dança, etc)
5. **teams** - Equipes
6. **team_members** - Membros das equipes
7. **team_functions** - Funções por tipo de equipe
8. **team_member_functions** - Funções dos membros
9. **schedules** - Escalas
10. **schedule_members** - Membros escalados
11. **schedule_member_functions** - Funções na escala
12. **songs** - Músicas
13. **schedule_songs** - Músicas na escala
14. **cells** - Células
15. **cell_members** - Membros de células
16. **cell_meetings** - Reuniões de células
17. **cell_attendance** - Presença nas reuniões

### Relacionamentos

```
users_profile (1) ─── (N) user_profiles (N) ─── (1) profiles
users_profile (1) ─── (N) team_members (N) ─── (1) teams (N) ─── (1) team_types
team_members (1) ─── (N) team_member_functions (N) ─── (1) team_functions
teams (1) ─── (N) schedules
schedules (1) ─── (N) schedule_members (1) ─── (N) schedule_member_functions
schedules (1) ─── (N) schedule_songs (N) ─── (1) songs
users_profile (1) ─── (N) cells
cells (1) ─── (N) cell_members
cells (1) ─── (N) cell_meetings (1) ─── (N) cell_attendance
```

## 🔐 Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com políticas específicas:

### Funções Auxiliares

- `is_gerencial()` - Verifica se usuário é gerencial
- `is_team_leader(team_uuid)` - Verifica se usuário é líder da equipe
- `is_team_member(team_uuid)` - Verifica se usuário é membro da equipe
- `is_cell_leader(cell_uuid)` - Verifica se usuário é líder da célula

### Políticas Principais

- **Gerencial**: Acesso total
- **Líderes**: Gerenciam suas equipes
- **Membros**: Visualizam suas equipes

## 📊 Dados Iniciais

O schema inclui dados iniciais:

### Perfis
- gerencial
- lider_louvor
- lider_danca
- lider_obreiros
- lider_midia
- lider_celula
- auxiliar_celula
- membro_louvor
- membro_danca
- membro_obreiro
- membro_midia
- membro_celula

### Tipos de Equipe
- Louvor (permite múltiplas)
- Dança (permite múltiplas)
- Obreiros (única)
- Mídia (permite múltiplas)
- Célula (permite múltiplas)

### Funções por Tipo

#### Louvor
- Ministro
- Back Vocal
- Tecladista
- Guitarrista
- Violonista
- Baixista
- Baterista

#### Dança
- Dança lenta
- Dança agitada
- Coreografia
- Apoio

#### Mídia
- Projeção
- Câmera
- Fotografia
- Transmissão
- Mesa de som
- Iluminação

#### Obreiros
- Recepção
- Apoio
- Organização
- Segurança
- Ceia
- Oferta

## 🚀 Como Executar

### 1. No Dashboard do Supabase

1. Acesse seu projeto no [Supabase](https://supabase.com)
2. Vá em **SQL Editor**
3. Clique em **New query**
4. Copie todo o conteúdo de `schema.sql`
5. Cole no editor
6. Clique em **Run** (ou Ctrl+Enter)
7. Aguarde a execução (10-20 segundos)

### 2. Via CLI do Supabase

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref seu-projeto-ref

# Executar migration
supabase db push
```

## 🔧 Manutenção

### Criar Nova Migration

```bash
# Criar migration
supabase migration new nome_da_migration

# Editar arquivo criado em supabase/migrations/

# Aplicar migration
supabase db push
```

### Backup

```bash
# Fazer backup
supabase db dump -f backup.sql

# Restaurar backup
supabase db reset
```

### Reset Database

```bash
# ⚠️ CUIDADO: Isso apaga todos os dados
supabase db reset
```

## 📝 Modificações Comuns

### Adicionar Nova Função

```sql
-- Adicionar função para tipo de equipe existente
INSERT INTO team_functions (nome, team_type_id)
VALUES ('Nova Função', (SELECT id FROM team_types WHERE codigo = 'louvor'));
```

### Adicionar Novo Tipo de Equipe

```sql
-- 1. Adicionar tipo
INSERT INTO team_types (nome, codigo, permite_multiplas)
VALUES ('Novo Ministério', 'novo_ministerio', true);

-- 2. Adicionar funções
INSERT INTO team_functions (nome, team_type_id)
SELECT 'Função 1', id FROM team_types WHERE codigo = 'novo_ministerio'
UNION ALL
SELECT 'Função 2', id FROM team_types WHERE codigo = 'novo_ministerio';

-- 3. Adicionar perfis
INSERT INTO profiles (nome, codigo)
VALUES 
  ('Líder Novo Ministério', 'lider_novo_ministerio'),
  ('Membro Novo Ministério', 'membro_novo_ministerio');
```

### Adicionar Novo Perfil

```sql
INSERT INTO profiles (nome, codigo)
VALUES ('Novo Perfil', 'novo_perfil');
```

## 🔍 Queries Úteis

### Ver Todos os Usuários com Perfis

```sql
SELECT 
  u.nome,
  u.email,
  array_agg(p.nome) as perfis
FROM users_profile u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN profiles p ON up.profile_id = p.id
GROUP BY u.id, u.nome, u.email;
```

### Ver Equipes com Membros

```sql
SELECT 
  t.nome as equipe,
  tt.nome as tipo,
  l.nome as lider,
  count(tm.id) as total_membros
FROM teams t
JOIN team_types tt ON t.team_type_id = tt.id
LEFT JOIN users_profile l ON t.leader_id = l.id
LEFT JOIN team_members tm ON t.id = tm.team_id
GROUP BY t.id, t.nome, tt.nome, l.nome;
```

### Ver Escalas do Mês

```sql
SELECT 
  s.date,
  t.nome as equipe,
  tt.nome as tipo,
  s.status,
  count(sm.id) as total_membros
FROM schedules s
JOIN teams t ON s.team_id = t.id
JOIN team_types tt ON t.team_type_id = tt.id
LEFT JOIN schedule_members sm ON s.id = sm.schedule_id
WHERE s.date >= date_trunc('month', CURRENT_DATE)
  AND s.date < date_trunc('month', CURRENT_DATE) + interval '1 month'
GROUP BY s.id, s.date, t.nome, tt.nome, s.status
ORDER BY s.date;
```

### Ver Músicas Mais Usadas

```sql
SELECT 
  s.name,
  s.artist,
  count(ss.id) as vezes_usada
FROM songs s
JOIN schedule_songs ss ON s.id = ss.song_id
GROUP BY s.id, s.name, s.artist
ORDER BY vezes_usada DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### Erro: "permission denied"

Verifique se o RLS está configurado corretamente:

```sql
-- Ver policies de uma tabela
SELECT * FROM pg_policies WHERE tablename = 'teams';

-- Desabilitar RLS temporariamente (apenas para debug)
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
```

### Erro: "violates foreign key constraint"

Verifique se os dados relacionados existem:

```sql
-- Verificar se o team_type_id existe
SELECT * FROM team_types WHERE id = 'uuid-aqui';
```

### Erro: "duplicate key value"

Verifique constraints UNIQUE:

```sql
-- Ver constraints de uma tabela
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'teams'::regclass;
```

## 📚 Recursos

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🆘 Suporte

Para problemas com o schema:
1. Verifique os logs do Supabase
2. Consulte a documentação
3. Abra uma issue no GitHub

---

**Última atualização**: Criação inicial
