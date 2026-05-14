import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Trash2,
  Calendar,
  Users,
  Music,
  FileText,
  Play,
  Pause,
  Headphones,
  Laptop,
  ExternalLink,
  Download,
  Youtube,
} from "lucide-react";
import { Schedule } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { ptBR } from "date-fns/locale";
import { songService } from "@/services/songService";
import { AudioPlayer, AudioTrack } from "@/components/shared/AudioPlayer";
import { YoutubeMiniplayer } from "@/components/shared/YoutubeMiniplayer";
import { cn } from "@/lib/utils";

interface ScheduleDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule;
  onEdit: () => void;
  onDelete: () => void;
  /** Músicas do Louvor para o mesmo dia (exibidas na modal da Dança) */
  worshipSongs?: Array<{
    order_index: number;
    execution_key: string | null;
    song: {
      id: string;
      name: string;
      artist: string | null;
      original_key: string | null;
      has_virtual_instruments: boolean;
      audio_path: string | null;
      reference_url: string | null;
    };
  }>;
}

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Rascunho", variant: "secondary" },
  published: { label: "Publicada", variant: "default" },
  completed: { label: "Concluída", variant: "outline" },
};

const FUNCTION_COLORS: Record<
  string,
  { bg: string; text: string; pill: string }
> = {
  Vocal: {
    bg: "bg-primary/5",
    text: "text-primary",
    pill: "bg-primary/10 text-primary border-primary/30",
  },
  BackVocal: {
    bg: "bg-primary/5",
    text: "text-primary",
    pill: "bg-primary/10 text-primary border-primary/30",
  },
  Guitarra: {
    bg: "bg-orange-500/5",
    text: "text-orange-600 dark:text-orange-400",
    pill: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  },
  Baixo: {
    bg: "bg-blue-500/5",
    text: "text-blue-600 dark:text-blue-400",
    pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  Bateria: {
    bg: "bg-destructive/5",
    text: "text-destructive",
    pill: "bg-destructive/10 text-destructive border-destructive/30",
  },
  Teclado: {
    bg: "bg-emerald-500/5",
    text: "text-emerald-600 dark:text-emerald-400",
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  Teclado2: {
    bg: "bg-emerald-500/5",
    text: "text-emerald-600 dark:text-emerald-400",
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  Ministerial: {
    bg: "bg-violet-500/5",
    text: "text-violet-600 dark:text-violet-400",
    pill: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30",
  },
  Ballet: {
    bg: "bg-rose-500/5",
    text: "text-rose-600 dark:text-rose-400",
    pill: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
  Fotos: {
    bg: "bg-sky-500/5",
    text: "text-sky-600 dark:text-sky-400",
    pill: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
  },
  Videomaker: {
    bg: "bg-indigo-500/5",
    text: "text-indigo-600 dark:text-indigo-400",
    pill: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  },
  Storymaker: {
    bg: "bg-fuchsia-500/5",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    pill: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30",
  },
};

const FUNCTION_ICONS: Record<string, string> = {
  Vocal: "🎤",
  BackVocal: "🎙️",
  Guitarra: "🎸",
  Baixo: "🎸",
  Bateria: "🥁",
  Teclado: "🎹",
  Projeção: "📽️",
  Som: "🔊",
  Transmissão: "📡",
  Fotos: "📷",
  Videomaker: "🎥",
  Storymaker: "📱",
  Ministerial: "💃",
  Ballet: "🩰",
};

export function ScheduleDetailModal({
  open,
  onOpenChange,
  schedule,
  onEdit,
  onDelete,
  worshipSongs,
}: ScheduleDetailModalProps) {
  const status = STATUS_LABELS[schedule.status] || STATUS_LABELS.draft;
  const { toast } = useToast();

  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
  const [whatsAppText, setWhatsAppText] = useState("");

  // ── Player ────────────────────────────────────────────────────
  const [playerTracks, setPlayerTracks] = useState<AudioTrack[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [youtubePlayerUrl, setYoutubePlayerUrl] = useState<string | null>(null);
  const [youtubePlayerTitle, setYoutubePlayerTitle] = useState<
    string | undefined
  >();

  // Fechar player ao fechar modal
  useEffect(() => {
    if (!open) {
      setCurrentTrackId(null);
      setPlayerTracks([]);
      setYoutubePlayerUrl(null);
    }
  }, [open]);

  const songsWithAudio = (schedule.songs || [])
    .filter((ss) => ss.song?.audio_path)
    .sort((a, b) => a.order_index - b.order_index);

  const handlePlay = async (scheduleSongId: string) => {
    const scheduleSong = schedule.songs?.find((ss) => ss.id === scheduleSongId);
    if (!scheduleSong?.song?.audio_path) return;

    // Se já está na playlist, só muda a faixa
    const existing = playerTracks.find((t) => t.id === scheduleSongId);
    if (existing?.audioUrl) {
      setCurrentTrackId(scheduleSongId);
      return;
    }

    try {
      setLoadingAudioId(scheduleSongId);
      const url = await songService.getAudioUrl(scheduleSong.song.audio_path);

      // Monta playlist com todas as músicas da escala que têm áudio
      const tracks: AudioTrack[] = songsWithAudio.map((ss) => ({
        id: ss.id,
        name: ss.song?.name || "Música",
        artist: ss.song?.artist || undefined,
        audioUrl: ss.id === scheduleSongId ? url : "",
        key: ss.execution_key || ss.song?.original_key || undefined,
      }));

      setPlayerTracks(tracks);
      setCurrentTrackId(scheduleSongId);
    } catch {
      toast({ variant: "destructive", title: "Erro ao reproduzir áudio" });
    } finally {
      setLoadingAudioId(null);
    }
  };

  const handleTrackChange = async (id: string | null) => {
    if (!id) {
      setCurrentTrackId(null);
      return;
    }

    const track = playerTracks.find((t) => t.id === id);
    if (!track) return;

    if (track.audioUrl) {
      setCurrentTrackId(id);
      return;
    }

    const scheduleSong = schedule.songs?.find((ss) => ss.id === id);
    if (!scheduleSong?.song?.audio_path) return;

    try {
      const url = await songService.getAudioUrl(scheduleSong.song.audio_path);
      setPlayerTracks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, audioUrl: url } : t)),
      );
      setCurrentTrackId(id);
    } catch {
      toast({ variant: "destructive", title: "Erro ao carregar faixa" });
    }
  };

  const handleDownload = async (scheduleSongId: string) => {
    const scheduleSong = schedule.songs?.find((ss) => ss.id === scheduleSongId);
    if (!scheduleSong?.song?.audio_path) return;
    try {
      setDownloadingId(scheduleSongId);
      const song = scheduleSong.song;
      const ext = song.audio_path!.split(".").pop() || "mp3";
      const fileName = `${song.name}${song.artist ? ` - ${song.artist}` : ""}.${ext}`;
      await songService.downloadAudio(song.audio_path!, fileName);
    } catch {
      toast({ variant: "destructive", title: "Erro ao baixar áudio" });
    } finally {
      setDownloadingId(null);
    }
  };

  // ── WhatsApp ──────────────────────────────────────────────────
  function buildWeekendWhatsAppText(schedules: Schedule[], teamName: string) {
    const lines: string[] = [];
    lines.push(
      `📍 *${teamName.toUpperCase()}* ${schedule.title ? `🎤 *${schedule.title}*` : ""}`,
    );
    lines.push("");
    const ordered = [...schedules].sort((a, b) => a.date.localeCompare(b.date));
    ordered.forEach((s) => {
      lines.push(`🗓 ${format(parseISO(s.date), "EEEE dd", { locale: ptBR })}`);
      const songs = (s.songs || []).sort(
        (a, b) => a.order_index - b.order_index,
      );
      songs.forEach((ss, idx) => {
        const key = ss.execution_key || ss.song?.original_key || "";
        lines.push(
          `${idx + 1} - ${ss.song?.name || "Música"}${key ? " - " + key : ""}`,
        );
      });
      lines.push("");
    });
    return lines.join("\n").trim();
  }

  const handleCopyFromPreview = async () => {
    try {
      await navigator.clipboard.writeText(whatsAppText);
      toast({ title: "Texto copiado para a área de transferência" });
      setShowWhatsAppPreview(false);
    } catch {
      toast({
        variant: "destructive",
        title: "Não foi possível copiar",
        description: "Copie manualmente.",
      });
    }
  };

  // ── Membros agrupados por função ──────────────────────────────
  const functionMap = new Map<
    string,
    {
      functionName: string;
      members: string[];
      icon: string;
      color: { bg: string; text: string; pill: string };
    }
  >();
  (schedule.members || []).forEach((member) => {
    const memberName = member.team_member?.user?.nome || "Sem nome";
    (member.functions || []).forEach((fn) => {
      if (!functionMap.has(fn.id)) {
        functionMap.set(fn.id, {
          functionName: fn.nome,
          members: [],
          icon: FUNCTION_ICONS[fn.nome] || "🎵",
          color: FUNCTION_COLORS[fn.nome] || {
            bg: "bg-muted",
            text: "text-muted-foreground",
            pill: "bg-muted text-muted-foreground border-border",
          },
        });
      }
      functionMap.get(fn.id)!.members.push(memberName);
    });
  });
  const sortedFunctions = Array.from(functionMap.values()).sort((a, b) => {
    const p = (n: string) => (n === "Vocal" ? 0 : n === "BackVocal" ? 1 : 2);
    return (
      p(a.functionName) - p(b.functionName) ||
      a.functionName.localeCompare(b.functionName)
    );
  });

  const sortedSongs = [...(schedule.songs || [])].sort(
    (a, b) => a.order_index - b.order_index,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88dvh] flex flex-col p-0 gap-0 rounded-2xl">
        {/* Header compacto */}
        <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="truncate">{schedule.title || "Escala"}</span>
            <Badge
              variant={status.variant}
              className="ml-auto text-xs py-0 h-5 flex-shrink-0"
            >
              {status.label}
            </Badge>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(parseISO(schedule.date), "EEE, dd MMM yyyy", {
              locale: ptBR,
            })}
          </p>
        </DialogHeader>

        <div
          data-dialog-body=""
          className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
        >
          {/* Observações */}

          {/* Observações */}
          {schedule.notes && (
            <div className="flex gap-2 p-2.5 bg-muted/50 rounded-lg">
              <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {schedule.notes}
              </p>
            </div>
          )}

          {/* Membros por Função */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Users className="h-3.5 w-3.5" />
              Membros
            </div>
            {sortedFunctions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                Nenhum membro escalado
              </p>
            ) : (
              <div className="rounded-xl border overflow-hidden divide-y">
                {sortedFunctions.map(
                  ({ functionName, members, icon, color }) => (
                    <div
                      key={functionName}
                      className={`flex items-center gap-2.5 px-3 py-2 ${color.bg}`}
                    >
                      <span className="text-sm leading-none w-5 text-center flex-shrink-0">
                        {icon}
                      </span>
                      <span
                        className={`text-xs font-semibold w-20 flex-shrink-0 ${color.text}`}
                      >
                        {functionName}
                      </span>
                      <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                        {members.map((name, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color.pill}`}
                          >
                            <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </span>
                            {name.split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Músicas */}
          {sortedSongs.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <Music className="h-3.5 w-3.5" />
                  Músicas ({sortedSongs.length})
                </div>
                {songsWithAudio.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Headphones className="h-3 w-3" />
                    {songsWithAudio.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {sortedSongs.map((scheduleSong, index) => {
                  const hasAudio = !!scheduleSong.song?.audio_path;
                  const isPlaying = currentTrackId === scheduleSong.id;
                  const isLoading = loadingAudioId === scheduleSong.id;

                  return (
                    <div
                      key={scheduleSong.id}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-2 border rounded-lg transition-colors",
                        isPlaying
                          ? "bg-primary/5 border-primary/20"
                          : "border-border hover:bg-accent/40",
                      )}
                    >
                      <button
                        onClick={() => hasAudio && handlePlay(scheduleSong.id)}
                        disabled={!hasAudio}
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                          hasAudio
                            ? "bg-primary/10 hover:bg-primary/20 cursor-pointer"
                            : "bg-muted cursor-default",
                        )}
                      >
                        {isLoading ? (
                          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="h-3 w-3 text-primary" />
                        ) : hasAudio ? (
                          <Play className="h-3 w-3 text-primary" />
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {index + 1}
                          </span>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {scheduleSong.song?.name || "Música"}
                        </p>
                        {scheduleSong.song?.artist && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {scheduleSong.song.artist}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {scheduleSong.execution_key && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                            {scheduleSong.execution_key}
                          </span>
                        )}
                        {hasAudio && (
                          <span className="w-5 h-5 flex items-center justify-center rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Headphones className="h-2.5 w-2.5" />
                          </span>
                        )}
                        {scheduleSong.song?.reference_url &&
                          (() => {
                            const url = scheduleSong.song.reference_url!;
                            const isYt =
                              url.includes("youtube") ||
                              url.includes("youtu.be");
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isYt) {
                                    setYoutubePlayerUrl(url);
                                    setYoutubePlayerTitle(
                                      scheduleSong.song?.name,
                                    );
                                  } else window.open(url, "_blank");
                                }}
                                className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${isYt ? "text-red-500 hover:bg-red-500/10" : "text-muted-foreground hover:text-primary hover:bg-accent"}`}
                              >
                                {isYt ? (
                                  <Youtube className="h-2.5 w-2.5" />
                                ) : (
                                  <ExternalLink className="h-2.5 w-2.5" />
                                )}
                              </button>
                            );
                          })()}
                        {hasAudio && (
                          <button
                            onClick={() => handleDownload(scheduleSong.id)}
                            disabled={downloadingId === scheduleSong.id}
                            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-emerald-600 transition-colors disabled:opacity-50"
                          >
                            {downloadingId === scheduleSong.id ? (
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="h-2.5 w-2.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {currentTrackId && playerTracks.length > 0 && (
                <div className="mt-2 rounded-xl border border-primary/20 overflow-hidden">
                  <AudioPlayer
                    tracks={playerTracks}
                    currentTrackId={currentTrackId}
                    onTrackChange={handleTrackChange}
                    onClose={() => {
                      setCurrentTrackId(null);
                      setPlayerTracks([]);
                    }}
                    embedded
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Músicas do Louvor (apenas quando passadas via prop) ── */}
          {worshipSongs && worshipSongs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Music className="h-4 w-4 text-amber-500" />
                <span>Músicas do Louvor</span>
                <span className="text-xs text-muted-foreground">
                  ({worshipSongs.length})
                </span>
              </div>
              <div className="space-y-1">
                {[...worshipSongs]
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((ss, index) => {
                    const song = ss.song;
                    const key = ss.execution_key || song.original_key;
                    return (
                      <div
                        key={`${song.id}-${index}`}
                        className="flex items-center gap-2 sm:gap-3 p-2.5 border border-amber-500/20 bg-amber-500/5 rounded-xl"
                      >
                        <span className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-medium truncate">
                              {song.name}
                            </p>
                            {song.audio_path && (
                              <span
                                title="Possui áudio"
                                className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                              >
                                <Headphones className="h-3 w-3" />
                              </span>
                            )}
                            {song.has_virtual_instruments && (
                              <span
                                title="Virtual Sample"
                                className="flex items-center justify-center w-5 h-5 rounded-md bg-muted text-muted-foreground flex-shrink-0"
                              >
                                <Laptop className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          {song.artist && (
                            <p className="text-xs text-muted-foreground truncate">
                              {song.artist}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {key && (
                            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-medium">
                              {key}
                            </span>
                          )}
                          {song.reference_url &&
                            (() => {
                              const url = song.reference_url!;
                              const isYt =
                                url.includes("youtube") ||
                                url.includes("youtu.be");
                              return (
                                <button
                                  onClick={() => {
                                    if (isYt) {
                                      setYoutubePlayerUrl(url);
                                      setYoutubePlayerTitle(song.name);
                                    } else {
                                      window.open(url, "_blank");
                                    }
                                  }}
                                  className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${isYt ? "text-red-500 hover:bg-red-500/10" : "text-muted-foreground hover:text-primary hover:bg-accent"}`}
                                  title={
                                    isYt
                                      ? "Abrir no miniplayer"
                                      : "Abrir referência"
                                  }
                                >
                                  {isYt ? (
                                    <Youtube className="h-3.5 w-3.5" />
                                  ) : (
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              );
                            })()}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Aviso quando Louvor tem escala mas sem músicas */}
          {worshipSongs && worshipSongs.length === 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-center gap-2.5">
              <Music className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                O Louvor tem escala neste dia mas ainda não adicionou músicas.
              </p>
            </div>
          )}

          {/* Miniplayer YouTube */}
          {youtubePlayerUrl && (
            <div className="mb-4">
              <YoutubeMiniplayer
                inline
                disableDetach
                url={youtubePlayerUrl}
                title={youtubePlayerTitle}
                onClose={() => {
                  setYoutubePlayerUrl(null);
                  setYoutubePlayerTitle(undefined);
                }}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center gap-2 px-4 py-3">
          {/* Fechar — outline visível */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 text-sm"
          >
            Fechar
          </Button>

          {/* Exportar — outline com ícone */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 text-sm gap-2"
            onClick={() => {
              const text = buildWeekendWhatsAppText(
                [schedule],
                schedule.team?.nome || "MKD - Louvor",
              );
              setWhatsAppText(text);
              setShowWhatsAppPreview(true);
            }}
          >
            <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>

          <div className="flex-1" />

          {/* Excluir — outline destrutivo */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 text-sm gap-2 border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Excluir</span>
          </Button>

          {/* Editar — primário sólido */}
          <Button
            size="sm"
            className="h-9 px-4 text-sm gap-2 font-semibold"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* WhatsApp preview */}
      <Dialog open={showWhatsAppPreview} onOpenChange={setShowWhatsAppPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-500" />
              Exportar WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div data-dialog-body="" className="space-y-3 px-4 py-4">
            <Textarea
              className="font-mono text-xs sm:text-sm resize-y min-h-[200px] bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              value={whatsAppText}
              onChange={(e) => setWhatsAppText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Edite o texto se necessário e clique em Copiar.
            </p>
          </div>
          <DialogFooter className="flex-row items-center gap-2 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWhatsAppPreview(false)}
              className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              Fechar
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              className="h-9 px-4 text-sm gap-2 font-medium"
              onClick={handleCopyFromPreview}
            >
              <FileText className="h-3.5 w-3.5" />
              Copiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
