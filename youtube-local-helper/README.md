# YouMp3Tube — macOS e Windows

Aplicativo instalável que usa a sessão já conectada no YouTube
sem exportar ou enviar cookies para o servidor.

## Para clientes

1. Entre no YouTube pelo Chrome.
2. Instale `YouMp3Tube-mac-x64.dmg` no macOS ou
   `YouMp3Tube-win-x64.exe` no Windows.
3. Abra o **YouMp3Tube**.
4. Cole o link autorizado e clique em converter.

No macOS, o build local sem certificado Apple pode exigir clicar no aplicativo
com o botão direito e escolher **Abrir** na primeira execução.

O serviço escuta exclusivamente em `127.0.0.1:43921`. Os cookies do navegador
não saem do computador.

## Desenvolvimento

```bash
npm install
npm run prepare:binary
npm run desktop
```

Gerar instalador macOS:

```bash
npm run dist:mac
```

O instalador Windows é gerado pelo workflow
`.github/workflows/build-yoump3tube.yml` em um runner Windows.

Para selecionar outro navegador durante o desenvolvimento:

```bash
YOUMP3TUBE_BROWSER=edge npm run desktop
```
