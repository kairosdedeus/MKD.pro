# Prompt 10 — acessibilidade e qualidade final

Revise todo o MKD V2 para WCAG 2.2 nível AA, segurança, desempenho e consistência.

Garanta:

- navegação completa por teclado;
- foco visível e não encoberto;
- contraste adequado;
- alvos de toque confortáveis;
- alternativa a arrastar;
- `aria-live` para operações assíncronas;
- diálogos com título, foco preso e retorno do foco;
- zoom de 200%;
- preferência por movimento reduzido;
- formulários com label, erro específico e foco no primeiro erro.

Adicione:

- testes unitários das permissões, conflitos e rodízio;
- testes de integração dos serviços;
- testes E2E de login, usuários, equipes e escalas;
- testes automatizados de RLS;
- auditoria de dependências;
- medição de LCP, INP e CLS;
- paginação no servidor;
- seleção apenas das colunas usadas;
- limites globais e por rota para erros.

Não registrar dados pessoais em logs. Não expor `service_role`. Exigir MFA para gerencial.

Critério de conclusão: lint, type-check, testes e build passam; fluxos críticos funcionam por teclado, celular e desktop.

