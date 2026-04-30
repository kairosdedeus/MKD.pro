# 🔍 DIAGNÓSTICO: Dados Não Foram Inseridos

## ⚠️ PROBLEMA

O script `inserir-dados-iniciais.sql` foi executado, mas o teste ainda mostra:
- ❌ 0 perfis (esperado: 12)
- ❌ 0 tipos de equipe (esperado: 5)
- ❌ 0 funções (esperado: 11)

## 🔍 POSSÍVEIS CAUSAS

### 1. Script executou mas deu erro silencioso
O Supabase pode ter mostrado "sucesso" mas alguma parte falhou.

### 2. Transação foi revertida
Se houve algum erro, a transação pode ter sido revertida.

### 3. Permissões insuficientes
O usuário pode não ter permissão para inserir dados.

---

## ✅ SOLUÇÃO: Executar em 2 Etapas

### ETAPA 1: Verificar o que existe

1. Acesse: https://supabase.com/dashboard/project/ewuvrindvhjislkrohwh/sql/new
2. Copie e execute o conteúdo de: `supabase/verificar-dados-inseridos.sql`
3. Veja os resultados

**O que você deve ver:**
- Se mostrar 0 em tudo: Os dados não foram inseridos
- Se mostrar números: Os dados existem mas o teste não está encontrando

---

### ETAPA 2: Forçar Inserção

Se a ETAPA 1 mostrou 0 em tudo:

1. Acesse: https://supabase.com/dashboard/project/ewuvrindvhjislkrohwh/sql/new
2. Copie e execute o conteúdo de: `supabase/forcar-insercao-dados.sql`
3. Este script vai:
   - Deletar dados existentes (se houver)
   - Inserir todos os dados novamente
   - Mostrar os resultados

**Resultado esperado:**
```
=== VERIFICAÇÃO ===
Perfis: 12
Tipos de Equipe: 5
Funções: 11
Storage Buckets: 1

✅ Dados inseridos com sucesso!

=== PERFIS ===
auxiliar_celula | Auxiliar de Célula
gerencial | Gerencial
lider_celula | Líder de Célula
...

=== TIPOS DE EQUIPE ===
celula | Célula
danca | Dança
louvor | Louvor
...

=== FUNÇÕES ===
Louvor | Baixo
Louvor | Bateria
Louvor | Guitarra
...
```

---

## 🧪 ETAPA 3: Testar Novamente

Após executar o script de forçar inserção:

1. Volte para: http://localhost:5173/test-connection
2. Clique em **"Executar Testes Novamente"**
3. Agora deve mostrar:
   - ✅ Perfis: 12
   - ✅ Tipos de Equipe: 5
   - ✅ Funções: 11
   - ✅ Storage: 1 bucket

---

## 🚨 SE AINDA NÃO FUNCIONAR

### Opção A: Verificar Permissões

Execute no SQL Editor:

```sql
-- Verificar se você tem permissão
SELECT current_user, current_database();

-- Tentar inserir um perfil de teste
INSERT INTO profiles (nome, codigo) 
VALUES ('Teste', 'teste');

-- Se deu erro, copie a mensagem de erro completa
```

### Opção B: Verificar se as tabelas existem

Execute no SQL Editor:

```sql
-- Listar todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Deve mostrar:**
- cells
- profiles
- schedules
- songs
- team_functions
- team_members
- team_types
- teams
- user_profiles
- users_profile

### Opção C: Recriar as tabelas

Se as tabelas não existirem ou estiverem corrompidas:

1. Execute: `supabase/schema.sql` (todo o conteúdo)
2. Execute: `supabase/desabilitar-rls-temporario.sql`
3. Execute: `supabase/forcar-insercao-dados.sql`

---

## 📊 CHECKLIST DE DIAGNÓSTICO

Execute na ordem:

- [ ] 1. Executar `verificar-dados-inseridos.sql`
- [ ] 2. Anotar os resultados (quantos perfis, tipos, funções)
- [ ] 3. Executar `forcar-insercao-dados.sql`
- [ ] 4. Verificar se mostrou "✅ Dados inseridos com sucesso!"
- [ ] 5. Testar em http://localhost:5173/test-connection
- [ ] 6. Se ainda não funcionar, copiar mensagens de erro

---

## 💡 DICA IMPORTANTE

Ao executar SQL no Supabase:
- ✅ Sempre role a página até o final para ver TODOS os resultados
- ✅ Procure por mensagens de erro em vermelho
- ✅ Verifique se apareceu "COMMIT" no final
- ✅ Se aparecer "ROLLBACK", algo deu errado

---

## 📞 PRÓXIMOS PASSOS

1. Execute `verificar-dados-inseridos.sql`
2. Me mostre os resultados
3. Vou ajudar a identificar o problema exato

---

**Última atualização:** 29/04/2026
