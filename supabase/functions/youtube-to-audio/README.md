# Edge Function: youtube-to-audio

Converte um link do YouTube em áudio MP3 128kbps e salva no bucket `audio-musicas`.

## Deploy

### Via Supabase Dashboard (sem CLI)

1. Acesse: https://supabase.com/dashboard/project/ewuvrindvhjislkrohwh/functions
2. Clique em **"Deploy a new function"**
3. Nome: `youtube-to-audio`
4. Cole o conteúdo de `index.ts`
5. Clique em **Deploy**

### Via Supabase CLI (se instalado)

```bash
supabase functions deploy youtube-to-audio --project-ref ewuvrindvhjislkrohwh
```

## Variáveis de Ambiente (Secrets)

Configure em: Dashboard → Edge Functions → youtube-to-audio → Secrets

| Variável         | Valor padrão               | Descrição         |
| ---------------- | -------------------------- | ----------------- |
| `COBALT_API_URL` | `https://api.cobalt.tools` | URL da API cobalt |

> `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetados automaticamente.

## Trocar a API cobalt

Se o cobalt.tools mudar ou ficar indisponível:

1. Acesse o modal de configuração em **Músicas → ⚙️ Configurações YouTube**
2. Altere a URL da API
3. Clique em **Testar conexão**
4. Se OK, salve

Alternativas compatíveis com a mesma API:

- `https://api.cobalt.tools` (oficial)
- Instância própria: https://github.com/imputnet/cobalt

## Endpoint

```
POST /functions/v1/youtube-to-audio
Authorization: Bearer <user_jwt>
Content-Type: application/json

{
  "youtube_url": "https://youtube.com/watch?v=...",
  "song_id": "uuid-opcional",     // se fornecido, atualiza audio_path da música
  "api_url": "https://..."        // opcional, sobrescreve COBALT_API_URL
}
```

### Resposta de sucesso (200)

```json
{
  "audio_path": "user-id/1234567890-abc.mp3",
  "file_name": "1234567890-abc.mp3",
  "size_bytes": 4194304,
  "cobalt_filename": "titulo-do-video.mp3"
}
```

### Erros comuns

| Status | Mensagem                | Solução                             |
| ------ | ----------------------- | ----------------------------------- |
| 400    | URL do YouTube inválida | Verificar formato da URL            |
| 401    | Não autorizado          | Usuário não logado                  |
| 413    | Arquivo muito grande    | Vídeo muito longo (>50MB)           |
| 502    | Cobalt API retornou 4xx | API cobalt fora do ar ou URL errada |
