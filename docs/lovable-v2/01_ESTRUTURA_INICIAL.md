# Prompt 01 — estrutura inicial

Crie um projeto novo chamado MKD V2 usando React, TypeScript, Vite, Tailwind CSS, Supabase e TanStack Query.

Todo código autoral deve usar português do Brasil. Organize `src` em:

```text
aplicacao/
dominios/
compartilhado/
paginas/
testes/
```

Crie os domínios `autenticacao`, `usuarios`, `equipes`, `escalas`, `musicas`, `louvor`, `celulas`, `notificacoes` e `conteudo-inicial`.

Configure:

- cliente Supabase;
- provedor do TanStack Query;
- React Router;
- limite global de erros;
- tema claro e escuro;
- layout autenticado com cabeçalho e menu lateral responsivo;
- página de carregamento, erro, acesso negado e página não encontrada;
- variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`;
- lint proibindo `any`;
- testes com Vitest.

Não implemente funcionalidades de negócio ainda. Não crie tabelas por conta própria: utilize o arquivo `schema_v2.sql` anexado como contrato do banco.

Critério de conclusão: o projeto compila, abre a página inicial vazia, alterna o tema e possui navegação responsiva sem erros.
