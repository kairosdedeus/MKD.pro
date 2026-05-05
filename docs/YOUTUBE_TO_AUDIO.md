# YouTube → MP3: Guia Completo

## Como funciona

```
Usuário cola link YouTube
        ↓
Frontend chama Supabase Edge Function
        ↓
Edge Function chama cobalt.tools API
        ↓
cobalt.tools retorna URL do áudio
        ↓
Edge Function baixa o áudio (MP3 128kbps)
        ↓
Upload para bucket audio-musicas
        ↓
Atualiza audio_path da música no banco
        ↓
Frontend exibe confirmação
```

## Setup inicial (uma vez só)

### 1. Criar função exec_sql no banco

Execute no SQL Editor do Supabase:

```
supabase/setup/migrations/000_exec_sql_function.sql
```

### 2. Aplicar migration system_settings

Pelo app: **Músicas → ⚙️ → Migrations → Aplicar 001**

Ou pelo SQL Editor:

```
supabase/setup/migrations/001_system_settings.sql
```

### 3. Deploy da Edge Function

**Via Dashboard (sem CLI):**

1. https://supabase.com/dashboard/project/ewuvrindvhjislkrohwh/functions
2. "Deploy a new function" → nome: `youtube-to-audio`
3. Cole o conteúdo de `supabase/functions/youtube-to-audio/index.ts`
4. Deploy

**Via CLI:**

```bash
supabase functions deploy youtube-to-audio --project-ref ewuvrindvhjislkrohwh
```

### 4. Testar

**Músicas → ⚙️ → API cobalt → Testar conexão**

Se retornar "Conexão OK", está pronto.

---

## Trocar a API cobalt (se ficar fora do ar)

### Opção A: Usar instância própria do cobalt

1. Faça deploy do cobalt: https://github.com/imputnet/cobalt
2. No app: **Músicas → ⚙️ → API cobalt**
3. Altere a URL para sua instância
4. Clique em "Testar" → "Salvar"

### Opção B: Atualizar a Edge Function

Se a API do cobalt mudar o formato de request/response:

1. Edite `supabase/functions/youtube-to-audio/index.ts`
2. Ajuste o `CobaltRequest` e `CobaltResponse` interfaces
3. Redeploy: **Dashboard → Functions → youtube-to-audio → Redeploy**

### Campos que podem mudar na API cobalt

```typescript
// Request (POST /)
interface CobaltRequest {
  url: string; // URL do YouTube
  downloadMode: "audio"; // sempre "audio"
  audioFormat: "mp3"; // formato
  audioBitrate: "128"; // qualidade em kbps
}

// Response
interface CobaltResponse {
  status: "tunnel" | "redirect" | "picker" | "error";
  url?: string; // URL para download do áudio
  filename?: string; // nome sugerido do arquivo
  error?: { code: string };
}
```

---

## Troubleshooting

| Problema                       | Causa                   | Solução                        |
| ------------------------------ | ----------------------- | ------------------------------ |
| "Edge Function não encontrada" | Função não deployada    | Fazer deploy (passo 3)         |
| "Cobalt API inacessível"       | cobalt.tools fora do ar | Trocar URL da API              |
| "URL do YouTube inválida"      | Formato incorreto       | Usar URL completa do YouTube   |
| "Arquivo muito grande"         | Vídeo > ~40min          | Usar vídeo mais curto          |
| "Token inválido"               | Sessão expirada         | Fazer logout e login novamente |

---

## Segurança

- A Edge Function valida o JWT do usuário antes de processar
- Apenas usuários autenticados podem converter
- O botão YouTube → MP3 só aparece para perfil **gerencial**
- Arquivos são salvos na pasta do usuário: `{auth_user_id}/arquivo.mp3`
