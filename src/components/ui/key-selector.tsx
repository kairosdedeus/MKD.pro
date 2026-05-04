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
  const base = rest[0]?.toUpperCase() as BaseNote;
  if (BASE_NOTES.includes(base)) {
    note = base;
    rest = rest.slice(1);
  }
  if (rest.startsWith("#")) {
    modifier = "#";
    rest = rest.slice(1);
  } else if (rest.startsWith("b")) {
    modifier = "b";
    rest = rest.slice(1);
  }
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

// Classes base reutilizáveis
const btnBase = "rounded-xl border transition-all font-medium";
const btnActive =
  "bg-primary/10 border-primary text-primary ring-1 ring-primary/30";
const btnInactive =
  "bg-background border-border text-muted-foreground hover:bg-accent hover:text-foreground";
const btnDisabled = "opacity-30 cursor-not-allowed pointer-events-none";

export function KeySelector({
  value,
  onChange,
  label = "Tom",
  allowEmpty = false,
}: KeySelectorProps) {
  const { note, modifier, mode } = parseKey(value);

  const setNote = (n: BaseNote) => {
    if (n === note && allowEmpty) {
      onChange("");
      return;
    }
    onChange(buildKey(n, modifier, mode));
  };

  const setModifier = (m: Modifier) => {
    if (!note) return;
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
              btnBase,
              "h-11 text-sm",
              note === n ? btnActive : btnInactive,
            )}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Modificadores ♭ e # */}
      <div className="grid grid-cols-2 gap-1.5">
        {(["b", "#"] as Modifier[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModifier(m)}
            disabled={!note}
            className={cn(
              btnBase,
              "h-10 text-base",
              modifier === m ? btnActive : btnInactive,
              !note && btnDisabled,
            )}
          >
            {m === "b" ? "♭" : "#"}
          </button>
        ))}
      </div>

      {/* Modo: Maior / Menor */}
      <div className="grid grid-cols-2 gap-1.5">
        {(["maior", "menor"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            disabled={!note}
            className={cn(
              btnBase,
              "h-10 text-sm",
              mode === m && note ? btnActive : btnInactive,
              !note && btnDisabled,
            )}
          >
            {m === "maior" ? "Maior" : "Menor"}
          </button>
        ))}
      </div>

      {/* Preview */}
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
