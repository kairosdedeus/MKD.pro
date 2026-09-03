# Prompt 09 — site institucional

Implemente uma rota pública para o site da igreja e um editor autenticado usando `"ConteudoSite"`.

A página pública deve apresentar:

- banner principal;
- sobre a igreja;
- missão e visão;
- horários fixos;
- eventos especiais;
- ministérios;
- galerias;
- endereço e contatos;
- botão para entrar no sistema.

Crie `PaginaInicial` e `EditorConteudoInicial`. O editor permite alterar textos, cores, links, imagens, eventos e galerias.

Mídias institucionais ficam em bucket público próprio. Validar formato, tamanho e dimensões antes do upload. Não permitir SVG não sanitizado.

Somente gerencial e responsáveis autorizados da Mídia podem editar. O visitante consulta somente conteúdo publicado.

Otimize imagens com tamanhos responsivos, dimensões declaradas e carregamento tardio fora da primeira dobra.

Critério de conclusão: a rota pública funciona sem login, o editor publica alterações e usuários comuns não conseguem modificar o conteúdo.

