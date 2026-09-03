# MKD V2 — ordem dos prompts no Lovable

Use um arquivo por vez e aguarde a conclusão antes de enviar o próximo.

No primeiro envio, anexe também `supabase/v2/schema_v2.sql`. Se a Lovable não aceitar o arquivo, execute o schema diretamente no Supabase e conecte o projeto antes de continuar.

1. `01_ESTRUTURA_INICIAL.md`
2. `02_AUTENTICACAO_E_USUARIOS.md`
3. `03_EQUIPES_E_PERMISSOES.md`
4. `04_ESCALAS.md`
5. `05_LOUVOR_E_MUSICAS.md`
6. `06_DANCA_MIDIA_E_OBREIROS.md`
7. `07_CELULAS.md`
8. `08_NOTIFICACOES.md`
9. `09_SITE_INSTITUCIONAL.md`
10. `10_ACESSIBILIDADE_E_QUALIDADE.md`

Regras para todos os prompts:

- Projeto novo, sem reutilizar código da V1.
- Código autoral e nomes de domínio em português do Brasil.
- Componentes em PascalCase; funções e variáveis em camelCase.
- Ganchos React usam `use` + nome em português, como `useEscalas`.
- Banco com nomes PascalCase em português e IDs inteiros.
- UUID somente no vínculo obrigatório com Supabase Auth.
- Interface responsiva, acessível e mobile-first.
- Não usar `any`.
- Não criar dados simulados permanentes.
- Preservar tudo que já estiver funcionando ao executar o prompt seguinte.
