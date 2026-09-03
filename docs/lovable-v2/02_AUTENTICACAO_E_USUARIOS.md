# Prompt 02 — autenticação e usuários

Implemente autenticação por e-mail e senha usando Supabase Auth.

Use a tabela `"Usuario"` do schema V2. O campo `"AuthId"` relaciona o cadastro ao Supabase Auth; o `"Id"` inteiro identifica o usuário dentro do sistema.

Crie:

- `PaginaEntrar`;
- formulário acessível de login;
- recuperação e alteração de senha;
- encerramento de sessão;
- proteção de rotas;
- `PaginaUsuarios`;
- `DialogoCriarUsuario`;
- `DialogoEditarUsuario`;
- busca, paginação, ativação e desativação;
- edição do próprio nome, sobrenome, e-mail e telefone.

O usuário gerencial pode administrar todos os usuários. Usuários comuns visualizam apenas os dados necessários ao próprio contexto.

Operações administrativas devem ocorrer no servidor ou em função segura do banco. Não usar chave `service_role` no navegador. Não revelar se um e-mail existe. Não registrar senha, token, telefone ou e-mail completo em logs.

Critério de conclusão: login, logout, sessão persistida, rota protegida e gestão gerencial de usuários funcionando com estados de carregamento, vazio, sucesso e erro.

