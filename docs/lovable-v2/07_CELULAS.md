# Prompt 07 — Células

Implemente Células reutilizando as tabelas `"Equipe"`, `"EquipeMembro"`, `"Escala"` e `"Presenca"`.

Uma célula é uma equipe com `"Ministerio" = 'Celula'`. Use os campos de local, dia da semana e horário da própria equipe. Um encontro é uma escala dessa equipe.

Crie:

- `PainelCelulas`;
- listagem de células;
- detalhes da célula;
- líder, auxiliares e membros;
- agenda de encontros;
- criação e edição de encontro;
- chamada de presença;
- histórico por encontro;
- indicadores simples de presença.

Não crie tabelas específicas para célula, membro ou encontro. Use somente `"Presenca"` como complemento necessário.

Somente gerencial, líder e auxiliar da célula podem alterar encontros e presenças. Membros visualizam sua célula e agenda.

Trate presença como dado pessoal: acesso restrito, sem exposição em logs e sem ranking público.

Critério de conclusão: uma célula pode ser criada como equipe, receber membros, agendar encontros e registrar presença com RLS.

