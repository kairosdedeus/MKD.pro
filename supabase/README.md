# 📁 Supabase — Scripts SQL

## Estrutura

```
supabase/
├── setup/                    ← Execute na ordem ao configurar
│   ├── schema.sql            ← 1. Criar todas as tabelas
│   ├── dados-iniciais.sql    ← 2. Inserir dados base (perfis, tipos, funções)
│   └── permissoes-dev.sql    ← 3. Desabilitar RLS para desenvolvimento
│
├── functions/                ← Funções SQL registradas no banco
│   └── criar-usuario.sql     ← Função create_user_with_auth()
│
└── utils/                    ← Utilitários para manutenção
    ├── resetar-senha.sql     ← Resetar senha de um usuário
    └── remover-usuario.sql   ← Remover usuário completamente
```

## 🚀 Configuração Inicial (ordem)

1. Execute `setup/schema.sql`
2. Execute `setup/dados-iniciais.sql`
3. Execute `setup/permissoes-dev.sql`
4. Execute `functions/criar-usuario.sql`

## 🔑 Credenciais

- **URL:** https://ewuvrindvhjislkrohwh.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/ewuvrindvhjislkrohwh
- **Admin:** admin@igreja.com / Admin@2024
