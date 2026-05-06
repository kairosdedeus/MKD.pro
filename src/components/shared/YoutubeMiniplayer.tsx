import { useEffect, useRef, useState } from "react";
import {
  X,
  Youtube,
  Maximize2,
  Minimize2,
  GripVertical,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface YoutubeMiniplayerProps {
  url: string;
  title?: string;
  onClose: () => void;
  /** Quando true, renderiza inline (dentro de modal). Quando false/omitido, renderiza flutuante. */
  inline?: boolean;
  /** Quando true, desabilita o botão de "soltar" no modo inline. */
  disableDetach?: boolean;
}

function extractYoutubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/,
  );
  return m?.[1] || null;
}

// ── Miniplayer flutuante (arrastrável) ────────────────────────
function FloatingMiniplayer({
  url,
  title,
  onClose,
}: Omit<YoutubeMiniplayerProps, "inline">) {
  const videoId = extractYoutubeId(url);
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState({ x: 16, y: -1 }); // y=-1 = posição inicial calculada
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const playerRef = useRef<HTMLDivElement>(null);

  // Posição inicial: canto inferior direito
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pw = expanded ? 360 : 280;
    const ph = expanded ? 230 : 180;
    setPos({ x: w - pw - 16, y: h - ph - 72 });
  }, []);

  // Atualizar posição ao expandir/recolher para não sair da tela
  useEffect(() => {
    if (pos.y === -1) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pw = expanded ? 360 : 280;
    const ph = expanded ? 230 : 180;
    setPos((p) => ({
      x: Math.min(p.x, w - pw - 8),
      y: Math.min(p.y, h - ph - 8),
    }));
  }, [expanded]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!playerRef.current) return;
    e.preventDefault();
    const rect = playerRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const pw = expanded ? 360 : 280;
      const ph = expanded ? 230 : 180;
      const x = Math.max(0, Math.min(e.clientX - dragOffset.current.x, w - pw));
      const y = Math.max(0, Math.min(e.clientY - dragOffset.current.y, h - ph));
      setPos({ x, y });
    };
    const onUp = () => setDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [dragging, expanded]);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!playerRef.current) return;
    const touch = e.touches[0];
    const rect = playerRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const w = window.innerWidth;
      const h = window.innerHeight;
      const pw = expanded ? 360 : 280;
      const ph = expanded ? 230 : 180;
      const x = Math.max(
        0,
        Math.min(touch.clientX - dragOffset.current.x, w - pw),
      );
      const y = Math.max(
        0,
        Math.min(touch.clientY - dragOffset.current.y, h - ph),
      );
      setPos({ x, y });
    };
    const onEnd = () => setDragging(false);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [dragging, expanded]);

  if (!videoId || pos.y === -1) return null;

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  const width = expanded ? 360 : 280;
  const height = expanded ? 230 : 180;

  return (
    <div
      ref={playerRef}
      className={cn(
        "fixed z-[9999] rounded-xl border border-border bg-card shadow-2xl overflow-hidden select-none",
        dragging
          ? "cursor-grabbing shadow-3xl ring-2 ring-primary/30"
          : "cursor-default",
      )}
      style={{
        left: pos.x,
        top: pos.y,
        width,
        transition: dragging ? "none" : "width 0.2s, height 0.2s",
      }}
    >
      {/* Header — área de drag */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 bg-muted/80 border-b border-border",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <Youtube className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
        <span className="text-xs font-medium text-foreground truncate flex-1 min-w-0">
          {title || "YouTube"}
        </span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Abrir no YouTube"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={() => setExpanded((e) => !e)}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            title={expanded ? "Minimizar" : "Expandir"}
          >
            {expanded ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </button>
          <button
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
            title="Fechar"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Player */}
      <div style={{ height: height - 32, background: "#000" }}>
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || "YouTube player"}
        />
      </div>
    </div>
  );
}

// ── Miniplayer inline (dentro de modal) ───────────────────────
function InlineMiniplayer({
  url,
  title,
  onClose,
  disableDetach,
}: Omit<YoutubeMiniplayerProps, "inline">) {
  const videoId = extractYoutubeId(url);
  const [expanded, setExpanded] = useState(false);
  const [floating, setFloating] = useState(false);

  if (!videoId) return null;
  if (floating && !disableDetach) {
    return <FloatingMiniplayer url={url} title={title} onClose={onClose} />;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 border-b border-border">
        <Youtube className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
        <span className="text-xs font-medium text-foreground truncate flex-1">
          {title || "YouTube"}
        </span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* Botão "soltar" — transforma em flutuante (apenas se não desabilitado) */}
          {!disableDetach && (
            <button
              onClick={() => setFloating(true)}
              className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
              title="Soltar — arrastar livremente"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Abrir no YouTube"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            title={expanded ? "Minimizar" : "Expandir"}
          >
            {expanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
            title="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Player */}
      <div
        className={cn(
          "relative w-full bg-black",
          expanded ? "aspect-video" : "h-40",
        )}
      >
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || "YouTube player"}
        />
      </div>
    </div>
  );
}

// ── Export principal ──────────────────────────────────────────
export function YoutubeMiniplayer({
  url,
  title,
  onClose,
  inline,
  disableDetach,
}: YoutubeMiniplayerProps) {
  if (inline) {
    return (
      <InlineMiniplayer
        url={url}
        title={title}
        onClose={onClose}
        disableDetach={disableDetach}
      />
    );
  }
  return <FloatingMiniplayer url={url} title={title} onClose={onClose} />;
}
