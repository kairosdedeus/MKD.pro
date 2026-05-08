# Sistema de Notificações de Escalas

## O que foi implementado

- Persistência em banco para notificações e destinatários.
- Leitura, marcar como lida e limpar notificações por usuário.
- Realtime via Supabase ouvindo `app_notification_recipients`.
- Notificações automáticas ao criar, atualizar, publicar e remover escalas.
- Destinatários automáticos:
  - membros escalados;
  - líder da equipe;
  - usuários com perfil `gerencial`.
- Fallback seguro: se a migration ainda não foi aplicada, a UI não quebra e apenas mostra lista vazia.

## Migration

Execute no Supabase SQL Editor:

```sql
supabase/migrations/005_notifications.sql
```

Ela cria:

- `app_notifications`
- `app_notification_recipients`
- índices de leitura por usuário/data
- políticas RLS básicas para leitura/atualização por destinatário

## Fluxo

1. Uma escala é criada/editada/removida por `scheduleService`.
2. O service chama `notificationService` em modo não bloqueante.
3. O `notificationService` calcula os destinatários e grava no banco.
4. O hook `useNotifications` carrega as notificações do usuário atual.
5. O Supabase Realtime atualiza o sino automaticamente quando chegar algo novo.

## Observação

O salvamento da escala nunca depende da notificação. Se houver falha na criação da notificação, a escala continua salva e um warning é enviado para o console.
