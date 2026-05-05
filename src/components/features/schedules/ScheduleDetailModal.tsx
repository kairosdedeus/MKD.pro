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
} from "lucide-react";
import { Schedule } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { ptBR } from "date-fns/locale";
import { songService } from "@/services/songService";
import { AudioPlayer, AudioTrack } from "@/components/shared/AudioPlayer";
import { cn } from "@/lib/utils";

interface ScheduleDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule;
  onEdit: () => void;
  onDelete: () => void;
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
};

export function ScheduleDetailModal({
  open,
  onOpenChange,
  schedule,
  onEdit,
  onDelete,
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

  // Fechar player ao fechar modal
  useEffect(() => {
    if (!open) {
      setCurrentTrackId(null);
      setPlayerTracks([]);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="truncate">
              {schedule.title || "Escala sem título"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-5 px-5 py-4">
          {/* Info básica */}
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl">
            <div>
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="font-semibold text-foreground">
                {format(
                  parseISO(schedule.date),
                  "EEEE, dd 'de' MMMM 'de' yyyy",
                  { locale: ptBR },
                )}
              </p>
            </div>
            <div className="ml-auto">
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </div>

          {/* Observações */}
          {schedule.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4" />
                Observações
              </div>
              <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                {schedule.notes}
              </p>
            </div>
          )}

          {/* Membros por Função */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Membros da Escala
            </div>
            {sortedFunctions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhum membro escalado
              </p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {sortedFunctions.map(
                  ({ functionName, members, icon, color }) => (
                    <div
                      key={functionName}
                      className={`flex flex-col sm:flex-row items-start gap-3 sm:gap-4 px-3 sm:px-4 py-3 ${color.bg}`}
                    >
                      <div className="flex items-center gap-2 w-full sm:w-32 flex-shrink-0">
                        <span className="text-base leading-none">{icon}</span>
                        <span className={`text-sm font-semibold ${color.text}`}>
                          {functionName}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-wrap items-center gap-2">
                          {members.map((memberName, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1.5 pl-2.5 pr-2.5 py-1 rounded-full text-sm font-medium border ${color.pill}`}
                            >
                              <span className="w-5 h-5 rounded-full bg-primary-foreground/60 dark:bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {memberName.charAt(0).toUpperCase()}
                              </span>
                              {memberName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Músicas */}
          {sortedSongs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Music className="h-4 w-4 text-primary" />
                  Músicas ({sortedSongs.length})
                </div>
                {songsWithAudio.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Headphones className="h-3.5 w-3.5" />
                    {songsWithAudio.length} com áudio
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
                        "flex items-center gap-2 sm:gap-3 p-2.5 border rounded-xl transition-colors",
                        isPlaying
                          ? "bg-primary/5 border-primary/20"
                          : "border-border hover:bg-accent/50",
                      )}
                    >
                      {/* Número / Play */}
                      <button
                        onClick={() => hasAudio && handlePlay(scheduleSong.id)}
                        disabled={!hasAudio}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                          hasAudio
                            ? "bg-primary/10 hover:bg-primary/20 cursor-pointer"
                            : "bg-muted cursor-default",
                        )}
                        title={hasAudio ? "Reproduzir" : "Sem áudio"}
                      >
                        {isLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <span
                            className={cn(
                              "text-xs font-bold",
                              hasAudio
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          >
                            {hasAudio ? (
                              <Play className="h-3.5 w-3.5" />
                            ) : (
                              index + 1
                            )}
                          </span>
                        )}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-medium truncate">
                            {scheduleSong.song?.name || "Música"}
                          </p>
                          {/* Ícone de áudio */}
                          {hasAudio && (
                            <span
                              title="Possui áudio"
                              className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                            >
                              <Headphones className="h-3 w-3" />
                            </span>
                          )}
                          {/* Ícone VS */}
                          {scheduleSong.song?.has_virtual_instruments && (
                            <span
                              title="Virtual Sample"
                              className="flex items-center justify-center w-5 h-5 rounded-md bg-muted text-muted-foreground flex-shrink-0"
                            >
                              <Laptop className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        {scheduleSong.song?.artist && (
                          <p className="text-xs text-muted-foreground truncate">
                            {scheduleSong.song.artist}
                          </p>
                        )}
                      </div>

                      {/* Tom + Link + Download */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {scheduleSong.song?.original_key && (
                          <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md font-medium">
                            {scheduleSong.song.original_key}
                          </span>
                        )}
                        {scheduleSong.execution_key &&
                          scheduleSong.execution_key !==
                            scheduleSong.song?.original_key && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium">
                              {scheduleSong.execution_key}
                            </span>
                          )}
                        {scheduleSong.song?.reference_url && (
                          <a
                            href={scheduleSong.song.reference_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="Abrir referência"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {hasAudio && (
                          <button
                            onClick={() => handleDownload(scheduleSong.id)}
                            disabled={downloadingId === scheduleSong.id}
                            className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
                            title="Baixar áudio"
                          >
                            {downloadingId === scheduleSong.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Player embutido na modal */}
              {currentTrackId && playerTracks.length > 0 && (
                <div className="mt-3 rounded-xl border border-primary/20 overflow-hidden">
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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
          <Button
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            onClick={() => {
              const text = buildWeekendWhatsAppText(
                [schedule],
                schedule.team?.nome || "MKD - Louvor",
              );
              setWhatsAppText(text);
              setShowWhatsAppPreview(true);
            }}
          >
            <FileText className="h-4 w-4" />
            Exportar Dia
          </Button>
          <Button
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10 w-full sm:w-auto"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* WhatsApp preview */}
      <Dialog open={showWhatsAppPreview} onOpenChange={setShowWhatsAppPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Exportar WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 px-5 py-4">
            <textarea
              className="w-full h-64 sm:h-80 p-3 border rounded resize-y font-mono text-xs sm:text-sm"
              value={whatsAppText}
              onChange={(e) => setWhatsAppText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Edite o texto se necessário e clique em Copiar.
            </p>
          </div>
          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowWhatsAppPreview(false)}
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>
            <Button
              className="gap-2 w-full sm:w-auto"
              onClick={handleCopyFromPreview}
            >
              <FileText className="h-4 w-4" />
              Copiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
