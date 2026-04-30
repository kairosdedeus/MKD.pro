# 🚨 LEIA PRIMEIRO - AÇÃO NECESSÁRIA

## ⚠️ STATUS ATUAL

Seu sistema está **quase pronto**, mas falta **1 passo crítico** para funcionar.

---

## 🔍 O PROBLEMA

O teste de conexão mostra:
- ✅ Conexão com Supabase: **OK**
- ✅ Todas as tabelas criadas: **OK**
- ❌ Dados iniciais: **FALTANDO**

**Resultado:** Você não consegue fazer login porque faltam os dados básicos do sistema.

---

## ✅ A SOLUÇÃO (5 minutos)

### Passo 1: Abrir o Supabase
1. Acesse: https://supabase.com/dashboard/project/ewuvrindvhjislkrohwh
2. Clique em **SQL Editor** no menu lateral

### Passo 2: Executar o Script
1. Clique em **New Query**
2. Abra o arquivo `supabase/inserir-dados-iniciais.sql` no VS Code
3. Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
4. Cole no SQL Editor do Supabase (Ctrl+V)
5. Clique em **Run** (ou Ctrl+Enter)

### Passo 3: Verificar
Você deve ver:
```
Perfis: 12
Tipos de Equipe: 5
Funções: 11
Storage Buckets: 1
✅ Dados iniciais inseridos com sucesso!
```

### Passo 4: Testar
1. Volte para: http://localhost:5173/test-connection
2. Clique em **Executar Testes Novamente**
3. Agora deve mostrar tudo verde ✅

### Passo 5: Fazer Login
1. Acesse: http://localhost:5173/login
2. Email: **admin@igreja.com**
3. Senha: **Admin@2024**
4. Clique em **Entrar**

---

## 📚 DOCUMENTAÇÃO COMPLETA

Se precisar de mais detalhes:

1. **[PROXIMOS_PASSOS.md](PROXIMOS_PASSOS.md)** - Explicação completa do problema e solução
2. **[GUIA_VISUAL_EXECUTAR_SQL.md](GUIA_VISUAL_EXECUTAR_SQL.md)** - Guia passo a passo com imagens
3. **[CHECKLIST_CONFIGURACAO.md](CHECKLIST_CONFIGURACAO.md)** - Acompanhe seu progresso

---

## 🎯 DEPOIS DE FAZER LOGIN

Você terá acesso a:
- ✅ Dashboard Gerencial
- ✅ Gestão de Equipes
- ✅ Gestão de Usuários
- ✅ Gestão de Músicas
- ✅ Gestão de Escalas
- ✅ Dashboards de todos os ministérios

---

## 🚨 PROBLEMAS?

### "duplicate key" ao executar o script
**Normal!** Significa que alguns dados já existem. Continue normalmente.

### Login não funciona após executar
Execute este comando no SQL Editor:
```sql
-- Resetar senha
UPDATE auth.users 
SET encrypted_password = crypt('Admin@2024', gen_salt('bf'))
WHERE email = 'admin@igreja.com';
```

### Outros problemas
Leia o [GUIA_VISUAL_EXECUTAR_SQL.md](GUIA_VISUAL_EXECUTAR_SQL.md) - seção Troubleshooting

---

## 📞 PRECISA DE AJUDA?

Me avise e eu ajudo a resolver!

---

**⏱️ Tempo estimado:** 5 minutos
**🎯 Resultado:** Sistema 100% funcional

---

**Última atualização:** 29/04/2026
