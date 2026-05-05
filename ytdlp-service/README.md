# yt-dlp Audio Service

Microserviço Node.js que converte YouTube → MP3 128kbps usando yt-dlp.
Suporta cookies do YouTube Premium para evitar bloqueios.

## Deploy no Railway (gratuito)

### 1. Criar repositório no GitHub

Coloque os arquivos `server.js`, `package.json`, `Dockerfile` e `railway.toml`
num repositório GitHub (pode ser privado).

### 2. Deploy no Railway

1. Acesse https://railway.app → **New Project**
2. **Deploy from GitHub repo** → selecione seu repositório
3. Railway detecta o Dockerfile automaticamente

### 3. Configurar variáveis de ambiente

No Railway → seu projeto → **Variables**:

| Variável      | Valor                                      | Obrigatório |
| ------------- | ------------------------------------------ | ----------- |
| `API_KEY`     | Uma senha forte (ex: `mkd-ytdlp-2024-xyz`) | ✅          |
| `COOKIES_B64` | Conteúdo do cookies.txt em base64          | Recomendado |
| `PORT`        | `3000`                                     | Automático  |

### 4. Pegar a URL do serviço

Railway gera uma URL tipo:

```
https://ytdlp-service-production-xxxx.up.railway.app
```

### 5. Configurar na Edge Function

No Supabase Dashboard → Edge Functions → youtube-to-audio → **Secrets**:

| Secret              | Valor                    |
| ------------------- | ------------------------ |
| `YTDLP_SERVICE_URL` | URL do Railway           |
| `YTDLP_API_KEY`     | Mesma API_KEY do Railway |

---

## Como exportar cookies do YouTube Premium

Os cookies permitem que o yt-dlp acesse vídeos como se fosse você logado.

### Método 1: Extensão do browser (mais fácil)

1. Instale a extensão **"Get cookies.txt LOCALLY"**:
   - Chrome: https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/

2. Acesse https://www.youtube.com e **faça login** com sua conta Premium

3. Clique na extensão → **Export** → salve como `cookies.txt`

4. Converter para base64:

**Windows (PowerShell):**

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\caminho\cookies.txt")) | Set-Clipboard
```

**Mac/Linux:**

```bash
base64 -i cookies.txt | pbcopy   # Mac
base64 -w 0 cookies.txt          # Linux (copie a saída)
```

5. Cole o resultado na variável `COOKIES_B64` do Railway

### Método 2: yt-dlp direto (se tiver instalado localmente)

```bash
yt-dlp --cookies-from-browser chrome --cookies cookies.txt "https://youtube.com/watch?v=qualquer"
```

---

## Testar localmente

```bash
# Instalar dependências
pip install yt-dlp
npm install  # não tem dependências, mas garante o package.json

# Configurar variáveis
export API_KEY=teste123
export COOKIES_B64=$(base64 -w 0 cookies.txt)  # opcional

# Rodar
node server.js

# Testar
curl http://localhost:3000/health

curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -H "x-api-key: teste123" \
  -d '{"youtube_url": "https://youtube.com/watch?v=CmM1pcHohdI"}'
```

---

## Segurança

- O `API_KEY` protege o endpoint — sem ele, ninguém de fora consegue usar
- Os cookies ficam apenas no servidor Railway, nunca expostos ao frontend
- A Edge Function do Supabase é o único cliente que chama este serviço
- Mantenha o repositório **privado** se incluir cookies no código

---

## Atualizar yt-dlp (quando o YouTube bloquear)

O YouTube muda frequentemente. Se parar de funcionar:

```bash
# No Railway, adicione um cron job ou rode manualmente:
pip install -U yt-dlp
```

Ou no Railway → **Redeploy** (o Dockerfile sempre instala a versão mais recente).
