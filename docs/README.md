# 📚 Documentação do Sistema

## 📖 Documentação Principal

### Funcionalidades Implementadas

- **[Sistema de Rodízio de Equipes](SISTEMA_RODIZIO_EQUIPES.md)** - Sistema automático de rodízio de equipes fixas
- **[Acesso de Líderes e Usuários](ACESSO_LIDERES_USUARIOS.md)** - Controle de acesso por perfil
- **[Melhorias Aplicadas](MELHORIAS_APLICADAS.md)** - Histórico de melhorias
- **[Status do Projeto](PROJECT_STATUS_FINAL.md)** - Status atual do projeto

### Guias Técnicos

- **[Deploy](DEPLOY.md)** - Guia de deploy para produção
- **[Resumo do Projeto](RESUMO_PROJETO.md)** - Visão geral do sistema
- **[Checklist de Implementação](IMPLEMENTATION_CHECKLIST.md)** - Checklist de features
- **[Status de Implementação](IMPLEMENTATION_STATUS.md)** - Status detalhado

### Problemas Resolvidos

- **[Problema de Relacionamento por Nome](PROBLEMA_RELACIONAMENTO_POR_NOME.md)** - Migração para IDs
- **[Correção de Equipes Fixas](CORRECAO_EQUIPES_FIXAS.md)** - Correções aplicadas
- **[Refatoração Concluída](REFATORACAO_CONCLUIDA.md)** - Refatorações realizadas

## 🗄️ Arquivo

Documentação temporária e scripts de debug foram movidos para:

- `docs/archive/` - Documentação temporária
- `supabase/utils/archive/` - Scripts SQL de debug/teste

## 🔧 Scripts SQL Úteis

### Validação e Diagnóstico

- `supabase/utils/validar-sequencia-rodizio.sql` - Valida sequência de rodízio
- `supabase/utils/validar-sistema-ids.sql` - Valida sistema de IDs
- `supabase/utils/verificar-escalas-louvor.sql` - Verifica escalas cadastradas
- `supabase/utils/diagnostico-equipes.sql` - Diagnóstico de equipes
- `supabase/utils/diagnostico-storage.sql` - Diagnóstico de storage

### Gerenciamento

- `supabase/utils/listar-usuarios-louvor.sql` - Lista usuários de louvor
- `supabase/utils/ver-membros-agora.sql` - Ver membros ativos
- `supabase/utils/verificar-membros-equipe.sql` - Verificar membros de equipe
- `supabase/utils/obter-ids-para-equipes-fixas.sql` - Obter IDs para configuração

### Manutenção

- `supabase/utils/limpar-equipe-antiga.sql` - Limpar equipes antigas
- `supabase/utils/limpar-usuario-inativo.sql` - Limpar usuários inativos
- `supabase/utils/remover-usuario.sql` - Remover usuário
- `supabase/utils/resetar-senha.sql` - Resetar senha de usuário

### Criação

- `supabase/utils/criar-equipe-louvor.sql` - Criar equipe de louvor
- `supabase/utils/criar-equipes-fixas-louvor.sql` - Criar equipes fixas

## 📋 Migrations

As migrations estão em ordem cronológica:

1. `001_criar_tabelas_regras_rodizio.sql` - Tabelas de regras de rodízio
2. `002_popular_regras_iniciais.sql` - Dados iniciais
3. `003_popular_regras_com_ids.sql` - População com IDs reais
4. `004_sistema_rodizio_equipes.sql` - Sistema de rodízio de equipes

## 🚀 Início Rápido

1. **Configurar banco:** Execute as migrations em ordem
2. **Validar sistema:** Execute os scripts de validação
3. **Criar equipes:** Use os scripts de criação
4. **Testar rodízio:** Gere escalas automáticas no sistema

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação específica de cada funcionalidade.
