# Prompt 08 — notificações

Implemente notificações com `"Notificacao"` e `"NotificacaoDestinatario"`.

Gerar notificações quando:

- uma escala for criada;
- atualizada;
- publicada;
- cancelada;
- um membro for adicionado;
- a confirmação do membro mudar.

Crie uma central com:

- contador de não lidas;
- filtros “Não lidas” e “Todas”;
- marcar uma como lida;
- marcar todas como lidas;
- dispensar;
- link direto para a escala permitida;
- agrupamento de eventos repetidos.

Cada destinatário possui seu próprio estado de leitura e dispensa. O usuário nunca pode consultar notificações de outra pessoa.

Criação em massa deve ocorrer no servidor, dentro da operação que altera a escala. Falha de notificação deve ser observável, mas não pode corromper a escala.

Critério de conclusão: notificações aparecem para os destinatários corretos, atualizam sem recarregar toda a página e respeitam RLS.

