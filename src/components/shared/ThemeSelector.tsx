import { useTheme, THEMES, ThemeId } from '@/hooks/useTheme'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Palette, Check } from 'lucide-react'

const THEME_ICONS: Record<ThemeId, string> = {
  light:    '☀️',
  dark:     '🌙',
  midnight: '🌌',
  sepia:    '🍂',
}

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          title="Escolher tema"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 p-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Tema da Interface
        </p>

        <div className="grid grid-cols-2 gap-2">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`
                relative flex flex-col items-start gap-2 p-3 rounded-xl border-2 transition-all text-left
                hover:scale-[1.02] active:scale-[0.98]
                ${theme === t.id
                  ? 'border-primary shadow-md shadow-primary/20'
                  : 'border-border hover:border-muted-foreground/30'
                }
              `}
              style={{ background: t.preview[0] }}
            >
              {/* Preview de cores */}
              <div className="flex gap-1 w-full">
                <div className="h-3 flex-1 rounded-sm" style={{ background: t.preview[0] }} />
                <div className="h-3 w-5 rounded-sm" style={{ background: t.preview[1] }} />
                <div className="h-3 w-3 rounded-sm" style={{ background: t.preview[2] }} />
              </div>

              {/* Nome */}
              <div>
                <p className="text-xs font-semibold leading-none" style={{ color: t.preview[2] }}>
                  {THEME_ICONS[t.id]} {t.name}
                </p>
                <p className="text-[10px] mt-0.5 opacity-60" style={{ color: t.preview[2] }}>
                  {t.description}
                </p>
              </div>

              {/* Check ativo */}
              {theme === t.id && (
                <div
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: t.preview[1] }}
                >
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground mt-3 text-center">
          Preferência salva automaticamente
        </p>
      </PopoverContent>
    </Popover>
  )
}
