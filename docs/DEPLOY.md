# Deploy - GitHub Pages

Este projeto esta configurado para publicar o app Vite/React no GitHub Pages usando GitHub Actions.

## Configuracao no GitHub

1. No repositorio, acesse **Settings > Pages**.
2. Em **Build and deployment**, selecione **GitHub Actions** como source.
3. Em **Settings > Secrets and variables > Actions > Secrets**, crie:

| Secret | Valor |
| --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anon/public do Supabase |

Se preferir, esses mesmos nomes tambem podem ser criados em **Variables**. O workflow aceita os dois, mas secrets e o mais indicado.

## URL base

Por padrao, o workflow usa o nome do repositorio como base path:

```text
https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/
```

Para este repositorio, a base esperada e:

```text
/MKD.pro/
```

Se usar dominio customizado ou publicar em um repositorio de usuario/organizacao, crie a repository variable `VITE_BASE_PATH` com o valor:

```text
/
```

## Deploy automatico

O deploy roda automaticamente em todo push para `main`.

```text
push main -> npm ci -> npm run build:pages -> deploy-pages
```

O script `build:pages` executa o build do Vite e copia `dist/index.html` para `dist/404.html`. Isso permite que rotas internas do React Router continuem funcionando ao recarregar a pagina no GitHub Pages.

## Deploy manual

Tambem e possivel executar o workflow manualmente em **Actions > Deploy GitHub Pages > Run workflow**.

## Validacao local

```bash
npm run build:pages
```

Para simular o caminho do GitHub Pages localmente:

```powershell
$env:VITE_BASE_PATH='/MKD.pro/'
npm run build:pages
```

## Observacao sobre checagens

O workflow de deploy empacota o app com Vite para garantir publicacao no Pages. As checagens estritas de TypeScript, lint e testes continuam no workflow de PR.
