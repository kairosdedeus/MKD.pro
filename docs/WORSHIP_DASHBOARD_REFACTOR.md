# Refatoração: WorshipDashboard — UI Limpa e Minimalista

## Objetivo

Substituir a UI verbosa com accordions por uma interface limpa inspirada na imagem de referência:

- Calendário compacto no topo
- Seções colapsáveis simples (sem Radix Accordion)
- Navegação por abas na parte inferior (Início / Agenda)
- Mobile-first

## Status

### ✅ Concluído

- [x] Arquivo placeholder criado (`// placeholder`)
- [x] Lógica de negócio mapeada (serviços, hooks, funções utilitárias)
- [x] Estrutura da nova UI definida

### 🔄 Em andamento

- [ ] Criar novo WorshipDashboard em partes

## Plano de Execução (partes pequenas)

### Parte 1 — Imports + Utilitários (sem JSX)

Arquivo: `src/pages/worship/WorshipDashboard.tsx`

- Imports de React, hooks, serviços
- Funções: normalizeText, getFunctionPriority, getFunctionIcon
- Funções: getScheduleMemberRows, groupSchedulesByWeekend, buildMonthlyWhatsAppText

### Parte 2 — Componentes internos

- `CollapsibleSection` — seção colapsável simples
- `ScheduleCard` — card de escala compacto
- `MemberRow` — linha de membro com funções

### Parte 3 — Estado e lógica do componente principal

- useState, useEffect, handlers
- canManage, loadFixedTeamData

### Parte 4 — JSX: Header + Calendário + Bottom Nav

- Header com título e botões de ação (visíveis só para canManage)
- Calendário compacto
- Bottom navigation fixo (Início / Agenda)

### Parte 5 — JSX: Seções colapsáveis

- Escala do dia selecionado
- Equipes padrão (com botão + Nova)
- Membros da Equipe
- Todas as Escalas do mês

### Parte 6 — Modais e AlertDialogs

- CreateScheduleModal
- ScheduleDetailModal
- WorshipFixedTeamModal
- AlertDialog de exclusão
- Dialog de exportação WhatsApp

## Estrutura Visual

```
┌─────────────────────────────────┐
│  🎵 Louvor    [Exportar] [Gerar]│  ← só para canManage
├─────────────────────────────────┤
│  maio 2026          < >         │
│  DOM SEG TER QUA QUI SEX SÁB   │
│   ...calendário compacto...     │
├─────────────────────────────────┤
│  📅 Escala de 26 de maio   ∨   │  ← colapsável
├─────────────────────────────────┤
│  🎵 Equipes padrão    ∨  +Nova │  ← colapsável
├─────────────────────────────────┤
│  👥 Membros da Equipe    ∨     │  ← colapsável
├─────────────────────────────────┤
│  📅 Todas as Escalas — maio ∨  │  ← colapsável
└─────────────────────────────────┘
│  [🏠 INÍCIO]    [📋 AGENDA]    │  ← bottom nav fixo
```

## Componente CollapsibleSection

```tsx
function CollapsibleSection({
  icon: Icon,
  title,
  badge,
  action,
  children,
  defaultOpen,
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
      >
        <Icon className="h-5 w-5 text-primary flex-shrink-0" />
        <span className="flex-1 font-semibold text-foreground">{title}</span>
        {badge && (
          <span className="text-xs text-muted-foreground">{badge}</span>
        )}
        {action}
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3">{children}</div>
      )}
    </div>
  );
}
```
