# Prompt 03 — equipes e permissões

Implemente equipes usando `"Equipe"`, `"EquipeMembro"`, `"Funcao"` e `"EquipeMembroFuncao"`.

Ministérios disponíveis:

- Louvor;
- Dança;
- Mídia;
- Obreiros;
- Célula.

Papéis na equipe:

- Líder;
- Auxiliar;
- Membro.

Crie páginas e diálogos para listar, criar, editar e desativar equipes. Permita adicionar membros, definir o papel e selecionar várias funções compatíveis com o ministério.

Regras:

- gerencial possui acesso total;
- líder administra sua equipe;
- auxiliar pode ajudar na gestão, conforme RLS;
- membro visualiza apenas equipes em que está ativo;
- menus e rotas devem refletir a mesma permissão;
- o banco é a autoridade final por meio de RLS.

Use nomes em português, IDs inteiros e formulários validados. Não execute consultas Supabase diretamente nos componentes; use serviços e ganchos do domínio.

Critério de conclusão: a matriz gerencial/líder/auxiliar/membro funciona na interface e no banco, sem permitir acesso por URL a equipes não autorizadas.

