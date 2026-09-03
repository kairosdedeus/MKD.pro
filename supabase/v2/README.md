# Banco de dados MKD V2

Esta pasta contém o modelo inicial de um projeto MKD V2 novo e independente. Ele não mantém compatibilidade de código ou schema com a V1.

## Objetivos

- Reduzir o modelo atual para 16 tabelas de domínio.
- Usar nomes claros em português.
- Usar `PascalCase` em tabelas, colunas, tipos e funções.
- Usar `integer identity` como ID legível.
- Manter UUID apenas em `"Usuario"."AuthId"`, porque `auth.users.id` do Supabase é UUID.
- Derivar acesso ministerial da liderança e da participação real em equipes.
- Reaproveitar `"Equipe"` e `"Escala"` para Células.
- Consolidar regras variáveis do rodízio em JSONB validado pela aplicação.

## Arquivos

- `schema_v2.sql`: estrutura nova, índices, integridade, helpers de autorização e RLS inicial.
- `IMPORTACAO_DADOS_LEGADOS.md`: importação opcional e única de dados selecionados da V1.

## Atenção ao PascalCase no PostgreSQL

O PostgreSQL transforma identificadores sem aspas em minúsculas. Por isso, todo nome em PascalCase precisa ser escrito com aspas duplas:

```sql
select "Id", "Nome"
from public."Usuario"
where "Ativo" = true;
```

Isso melhora a leitura visual pedida para a V2, mas exige disciplina em todo SQL, migration, RPC e integração.

## Como iniciar o projeto novo

1. Criar um projeto Supabase vazio.
2. Executar `schema_v2.sql`.
3. Gerar os tipos do banco.
4. Criar a aplicação consumindo somente contratos da V2.
5. Alimentar os dados iniciais.
6. Se necessário, importar dados antigos pelo processo opcional documentado.

O novo repositório não deve copiar serviços, componentes ou migrações da V1. Regras de negócio comprovadas podem ser reimplementadas com os contratos da V2.
