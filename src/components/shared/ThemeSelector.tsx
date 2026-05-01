import { useTheme, PALETTES, ModeId, PaletteId } from '@/hooks/useTheme'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Palette, Sun, Moon, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeSelector() {
  const { mode, palette, setMode, setPalette } = useTheme()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative"
          title="Aparência"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 p-4 shadow-xl"
      >
        {/* ── Modo Claro / Escuro ─────────────────────────── */}
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
            Modo
          </p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'light' as ModeId, label: 'Claro',  Icon: Sun  },
              { id: 'dark'  as ModeId, label: 'Escuro', Icon: Moon },
            ]).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all',
                  mode === id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
                {mode === id && <Check className="h-3.5 w-3.5 ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Divisor */}
        <div className="h-px bg-border mb-4" />

        {/* ── Paleta de Cor ───────────────────────────────── */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
            Cor de Destaque
          </p>
          <div className="flex gap-2 flex-wrap">
            {PALETTES.map(p => (
              <button
                key={p.id}
                onClick={() => setPalette(p.id)}
                title={p.name}
                className={cn(
                  'relative w-9 h-9 rounded-full transition-all',
                  'hover:scale-110 active:scale-95',
                  palette === p.id
                    ? 'ring-2 ring-offset-2 ring-offset-background scale-110'
                    : 'ring-1 ring-black/10 dark:ring-white/10'
                )}
                style={{
                  backgroundColor: p.color,
                  ringColor: p.color,
                }}
              >
                {palette === p.id && (
                  <Check
                    className="h-4 w-4 absolute inset-0 m-auto"
                    style={{ color: p.id === 'amber' ? '#1a1a1a' : '#fff' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Nome da paleta ativa */}
          <p className="text-xs text-muted-foreground mt-2.5">
            {PALETTES.find(p => p.id === palette)?.name}
          </p>
        </div>

        {/* ── Preview ─────────────────────────────────────── */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted">
            <div
              className="w-8 h-8 rounded-full flex-shrink-0"
              style={{ backgroundColor: PALETTES.find(p => p.id === palette)?.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="h-2.5 rounded-full bg-foreground/20 w-3/4 mb-1.5" />
              <div className="h-2 rounded-full bg-foreground/10 w-1/2" />
            </div>
            <div
              className="text-[10px] font-semibold px-2 py-1 rounded-md text-white"
              style={{ backgroundColor: PALETTES.find(p => p.id === palette)?.color }}
            >
              Ação
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mt-3 text-center">
          Salvo automaticamente
        </p>
      </PopoverContent>
    </Popover>
  )
}
