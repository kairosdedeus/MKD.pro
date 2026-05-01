# 🚀 Deploy — GitHub Pages

## Configuração Inicial (uma vez)

### 1. Criar repositório no GitHub
```bash
git init
git add .
git commit -m "feat: initial commit"
git remote add origin https://github.com/SEU_USUARIO/escalas-ministeriais.git
git push -u origin main
```

### 2. Configurar Secrets no GitHub
Acesse: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|--------|-------|
| `VITE_SUPABASE_URL` | `https://ewuvrindvhjislkrohwh.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (sua chave anon) |

### 3. Habilitar GitHub Pages
Acesse: **Settings → Pages**
- Source: **GitHub Actions**
- Clique em **Save**

---

## Deploy Automático

O deploy acontece automaticamente ao fazer push na branch `main`:

```
push → main
  ↓
✅ Quality Check (lint + type-check + testes)
  ↓
🔨 Build (vite build)
  ↓
🌐 Deploy GitHub Pages
```

**URL do sistema:** `https://SEU_USUARIO.github.io/escalas-ministeriais/`

---

## Deploy Manual

```bash
# Build local
npm run build

# Preview local do build
npm run preview
```

---

## Testes

```bash
# Rodar testes uma vez
npm run test

# Modo watch (desenvolvimento)
npm run test:watch

# Interface visual
npm run test:ui

# Com cobertura
npm run test:coverage
```

---

## Estrutura de Branches

| Branch | Propósito |
|--------|-----------|
| `main` | Produção — deploy automático |
| `develop` | Desenvolvimento |
| `feature/*` | Novas funcionalidades |
| `fix/*` | Correções de bugs |

---

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas nos Secrets
- [ ] GitHub Pages habilitado (Source: GitHub Actions)
- [ ] Testes passando (`npm run test`)
- [ ] Build sem erros (`npm run build`)
- [ ] Push na branch `main`
