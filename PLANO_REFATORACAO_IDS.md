# 🔧 PLANO DE REFATORAÇÃO: Sistema 100% Baseado em IDs

## 📋 OBJETIVO

Eliminar TODAS as dependências de nome e email, usando apenas IDs para relacionamentos.

---

## 🔍 AUDITORIA COMPLETA

### ✅ CÓDIGO TYPESCRIPT/REACT - OK

- ✅ Todos os services usam IDs
- ✅ Componentes usam IDs
- ✅ Nenhuma consulta por nome ou email encontrada

### ⚠️ SCRIPTS SQL - PROBLEMAS ENCONTRADOS

#### Scripts que usam EMAIL (apenas para diagnóstico - OK):

- `diagnosticar-tchucky.sql` - ✅ OK (diagnóstico)
- `diagnosticar-usuario-sumiu.sql` - ✅ OK (template)
- `adicionar-tchucky-escalas-maio.sql` - ⚠️ Usa email para correção
- `adicionar-membros-faltantes-louvor.sql` - ⚠️ Usa email para correção

#### Scripts que usam NOME (PROBLEMA):

- `adicionar-membros-manualmente.sql` - ❌ Usa `WHERE t.nome = 'MKD-Music'`

---

## 🎯 IMPLEMENTAÇÃO IMEDIATA

Vou criar os scripts SQL agora para você executar.

---

**Status**: 📋 Em implementação  
**Prioridade**: 🔴 Alta  
**Tempo estimado**: Executando agora
