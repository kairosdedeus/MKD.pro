import { cn } from "@/lib/utils";

const BASE_NOTES = ["C", "D", "E", "F", "G", "A", "B"] as const;
type BaseNote = (typeof BASE_NOTES)[number];
type Modifier = "" | "#" | "b";
type Mode = "maior" | "menor";

interface KeySelectorProps {
  value: string;
  onChange: (key: string) => void;
  label?: string;
  allowEmpty?: boolean;
}

function parseKey(key: string): {
  note: BaseNote | null;
  modifier: Modifier;
  mode: Mode;
} {
  if (!key) return { note: null, modifier: "", mode: "maior" };

  let rest = key;
  let note: BaseNote | null = null;
  let modifier: Modifier = "";
  let mode: Mode = "maior";

  // Nota base
  const base = rest[0]?.toUpperCase() as BaseNote;
  if (BASE_NOTES.includes(base)) {
    note = base;
    rest = rest.slice(1);
  }

  // Modificador
  if (rest.startsWith("#")) {
    modifier = "#";
    rest = rest.slice(1);
  } else if (rest.startsWith("b")) {
    modifier = "b";
    rest = rest.slice(1);
  }

  // Modo
  if (rest.toLowerCase() === "m") mode = "menor";

  return { note, modifier, mode };
}

function buildKey(
  note: BaseNote | null,
  modifier: Modifier,
  mode: Mode,
): string {
  if (!note) return "";
  return `${note}${modifier}${mode === "menor" ? "m" : ""}`;
}

export function KeySelector({
  value,
  onChange,
  label = "Tom",
  allowEmpty = false,
}: KeySelectorProps) {
  const { note, modifier, mode } = parseKey(value);

  const setNote = (n: BaseNote) => {
    // Se clicar na mesma nota e allowEmpty, limpa
    if (n === note && allowEmpty) {
      onChange("");
      return;
    }
    onChange(buildKey(n, modifier, mode));
  };

  const setModifier = (m: Modifier) => {
    if (!note) return;
    // Toggle: se já está selecionado, remove
    onChange(buildKey(note, modifier === m ? "" : m, mode));
  };

  const setMode = (m: Mode) => {
    if (!note) return;
    onChange(buildKey(note, modifier, m));
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}

      {/* Notas base */}
      <div className="grid grid-cols-7 gap-1.5">
        {BASE_NOTES.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNote(n)}
            className={cn(
              "h-11 rounded-xl border text-sm font-semibold transition-all",
              note === n
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Modificadores ♭ e # */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setModifier("b")}
          disabled={!note}
          className={cn(
            "h-10 rounded-xl border text-base font-medium transition-all",
            modifier === "b"
              ? "bg-primary/15 border-primary/40 text-primary"
              : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
            !note && "opacity-30 cursor-not-allowed",
          )}
        >
          ♭
        </button>
        <button
          type="button"
          onClick={() => setModifier("#")}
          disabled={!note}
          className={cn(
            "h-10 rounded-xl border text-base font-medium transition-all",
            modifier === "#"
              ? "bg-primary/15 border-primary/40 text-primary"
              : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
            !note && "opacity-30 cursor-not-allowed",
          )}
        >
          #
        </button>
      </div>

      {/* Modo: Maior / Menor */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setMode("maior")}
          disabled={!note}
          className={cn(
            "h-10 rounded-xl border text-sm font-semibold transition-all",
            mode === "maior" && note
              ? "bg-primary/15 border-primary/40 text-primary"
              : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
            !note && "opacity-30 cursor-not-allowed",
          )}
        >
          Maior
        </button>
        <button
          type="button"
          onClick={() => setMode("menor")}
          disabled={!note}
          className={cn(
            "h-10 rounded-xl border text-sm font-semibold transition-all",
            mode === "menor" && note
              ? "bg-primary/15 border-primary/40 text-primary"
              : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
            !note && "opacity-30 cursor-not-allowed",
          )}
        >
          Menor
        </button>
      </div>

      {/* Preview do tom selecionado */}
      {value && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            Tom selecionado:
          </span>
          <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-0.5 rounded-full">
            {value}
          </span>
        </div>
      )}
    </div>
  );
}
