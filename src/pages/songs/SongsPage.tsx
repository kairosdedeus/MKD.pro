import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { KeySelector } from "@/components/ui/key-selector";
import {
  Plus,
  Search,
  Music2,
  Play,
  Pause,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  ArrowUpDown,
  X,
  ChevronDown,
  SlidersHorizontal,
  Laptop,
  Download,
  Headphones,
  Youtube,
  Settings,
} from "lucide-react";
import { useSongs } from "@/hooks/useSongs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { CreateSongModal } from "@/components/features/songs/CreateSongModal";
import { EditSongModal } from "@/components/features/songs/EditSongModal";
import { YoutubeToAudioModal } from "@/components/features/songs/YoutubeToAudioModal";
import { YoutubeSettingsModal } from "@/components/features/songs/YoutubeSettingsModal";
import { AudioPlayer, AudioTrack } from "@/components/shared/AudioPlayer";
import { YoutubeMiniplayer } from "@/components/shared/YoutubeMiniplayer";
import { songService } from "@/services/songService";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { isGerencial } from "@/lib/permissions";
import { Song } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

type SortField = "name" | "artist" | "original_key";
type SortDir = "asc" | "desc";

const KEYS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
  "Cm",
  "Dm",
  "Em",
  "Fm",
  "Gm",
  "Am",
  "Bm",
];

// ── Seção colapsável (mesma proposta do Louvor) ───────────────
function Section({
  icon: Icon,
  title,
  badge,
  action,
  children,
  defaultOpen = true,
}: {
  icon: React.ElementType;
  title: string;
  badge?: string | number;
  action?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card sm:rounded-2xl">
      <div className="flex w-full items-center gap-3 px-4 py-3.5 sm:py-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-3 text-left min-w-0"
        >
          <Icon className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="flex-1 truncate text-base font-semibold text-foreground">
            {title}
          </span>
          {badge !== undefined && (
            <span className="text-xs text-muted-foreground mr-1">{badge}</span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
              open && "rotate-180",
            )}
          />
        </button>
        {action && (
          <div className="hidden flex-shrink-0 sm:block">{action}</div>
        )}
      </div>
      {open && (
        <div className="border-t border-border px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

export function SongsPage() {
  const { toast } = useToast();
  const { profiles } = useAuthStore();
  const canManage = isGerencial(profiles || []);
  const { songs, loading, refetch } = useSongs();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKey, setFilterKey] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [deletingSong, setDeletingSong] = useState<Song | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [youtubeSong, setYoutubeSong] = useState<Song | null>(null);

  // Player
  const [playerTracks, setPlayerTracks] = useState<AudioTrack[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [youtubePlayerUrl, setYoutubePlayerUrl] = useState<string | null>(null);
  const [youtubePlayerTitle, setYoutubePlayerTitle] = useState<
    string | undefined
  >();

  const filtered = songs
    .filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        (!q ||
          s.name.toLowerCase().includes(q) ||
          s.artist?.toLowerCase().includes(q)) &&
        (filterKey === "all" || s.original_key === filterKey)
      );
    })
    .sort((a, b) => {
      const va = (a[sortField] || "").toLowerCase();
      const vb = (b[sortField] || "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const isYoutubeUrl = (url?: string | null) =>
    !!url && (url.includes("youtube") || url.includes("youtu.be"));

  const handlePlay = async (song: Song) => {
    if (!song.audio_path) return;

    // Se já está na playlist, só muda a faixa atual
    const existing = playerTracks.find((t) => t.id === song.id);
    if (existing) {
      setCurrentTrackId(song.id);
      return;
    }

    try {
      setLoadingAudioId(song.id);
      const url = await songService.getAudioUrl(song.audio_path);

      // Monta playlist com todas as músicas que têm áudio
      const allTracks: AudioTrack[] = songs
        .filter((s) => s.audio_path)
        .map((s) => ({
          id: s.id,
          name: s.name,
          artist: s.artist || undefined,
          audioUrl: s.id === song.id ? url : "", // URL lazy para as outras
          key: s.original_key || undefined,
        }));

      // Garante que a faixa clicada tem a URL correta
      const trackIndex = allTracks.findIndex((t) => t.id === song.id);
      if (trackIndex >= 0) allTracks[trackIndex].audioUrl = url;

      setPlayerTracks(allTracks);
      setCurrentTrackId(song.id);
    } catch {
      toast({ variant: "destructive", title: "Erro ao reproduzir áudio" });
    } finally {
      setLoadingAudioId(null);
    }
  };

  const handlePrimaryPlay = (song: Song) => {
    if (song.audio_path) {
      handlePlay(song);
      return;
    }

    if (isYoutubeUrl(song.reference_url)) {
      setYoutubePlayerUrl(song.reference_url!);
      setYoutubePlayerTitle(song.name);
    }
  };

  // Quando o player muda de faixa, carrega a URL se necessário
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

    // Carregar URL da faixa
    const song = songs.find((s) => s.id === id);
    if (!song?.audio_path) return;

    try {
      const url = await songService.getAudioUrl(song.audio_path);
      setPlayerTracks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, audioUrl: url } : t)),
      );
      setCurrentTrackId(id);
    } catch {
      toast({ variant: "destructive", title: "Erro ao carregar faixa" });
    }
  };

  const handleDownload = async (song: Song) => {
    if (!song.audio_path) return;
    try {
      setDownloadingId(song.id);
      const ext = song.audio_path.split(".").pop() || "mp3";
      const fileName = `${song.name}${song.artist ? ` - ${song.artist}` : ""}.${ext}`;
      await songService.downloadAudio(song.audio_path, fileName);
    } catch {
      toast({ variant: "destructive", title: "Erro ao baixar áudio" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingSong) return;
    try {
      setDeleting(true);
      const { data: inSchedule } = await supabase
        .from("schedule_songs")
        .select("id")
        .eq("song_id", deletingSong.id)
        .limit(1);
      if (inSchedule && inSchedule.length > 0) {
        toast({
          variant: "destructive",
          title: "Não é possível excluir",
          description: "Esta música está em uso em escalas.",
        });
        setDeletingSong(null);
        return;
      }
      await supabase.from("songs").delete().eq("id", deletingSong.id);
      toast({ title: "✅ Música excluída!" });
      setDeletingSong(null);
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* ── Header compacto ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Music2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold leading-tight text-foreground">
              Músicas
            </h1>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {songs.length} no repertório
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {canManage && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1.5 rounded-full px-2.5 text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-600 sm:rounded-md sm:px-3"
                onClick={() => {
                  setYoutubeSong(null);
                  setShowYoutubeModal(true);
                }}
                title="Converter YouTube para MP3"
              >
                <Youtube className="h-4 w-4" />
                <span className="hidden sm:inline">YouTube → MP3</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 w-9 rounded-full p-0 text-muted-foreground sm:rounded-md"
                onClick={() => setShowSettingsModal(true)}
                title="Configurações YouTube"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            size="sm"
            className="h-10 gap-1.5 rounded-full px-4 text-base sm:h-9 sm:rounded-md sm:px-3 sm:text-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4" /> Nova
          </Button>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-[1_1_220px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou artista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-full border-border bg-background pl-10 text-base sm:h-9 sm:rounded-md sm:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtro de tom — seletor visual */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-1.5 rounded-full px-4 text-base sm:h-9 sm:rounded-md sm:px-3 sm:text-sm"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {filterKey !== "all" ? (
                <span className="font-semibold text-primary">{filterKey}</span>
              ) : (
                <span>Tom</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-4">
            <KeySelector
              value={filterKey === "all" ? "" : filterKey}
              onChange={(k) => setFilterKey(k || "all")}
              label="Filtrar por Tom"
              allowEmpty
            />
            {filterKey !== "all" && (
              <button
                onClick={() => setFilterKey("all")}
                className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpar filtro de tom
              </button>
            )}
          </PopoverContent>
        </Popover>

        <Select
          value={`${sortField}-${sortDir}`}
          onValueChange={(v) => {
            const [f, d] = v.split("-");
            setSortField(f as SortField);
            setSortDir(d as SortDir);
          }}
        >
          <SelectTrigger className="h-10 w-36 rounded-full bg-background text-base sm:h-9 sm:w-36 sm:rounded-md sm:text-sm">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Nome A→Z</SelectItem>
            <SelectItem value="name-desc">Nome Z→A</SelectItem>
            <SelectItem value="artist-asc">Artista A→Z</SelectItem>
            <SelectItem value="artist-desc">Artista Z→A</SelectItem>
            <SelectItem value="original_key-asc">Tom A→Z</SelectItem>
          </SelectContent>
        </Select>

        {(searchQuery || filterKey !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 rounded-full sm:h-9 sm:rounded-md"
            onClick={() => {
              setSearchQuery("");
              setFilterKey("all");
            }}
          >
            <X className="h-4 w-4 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* ── Lista de músicas ── */}
      <Section
        icon={Music2}
        title="Repertório"
        badge={
          filtered.length !== songs.length
            ? `${filtered.length} de ${songs.length}`
            : songs.length
        }
        action={
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-3 w-3" /> Nova
          </Button>
        }
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Music2}
            title={
              searchQuery || filterKey !== "all"
                ? "Nenhuma música encontrada"
                : "Nenhuma música cadastrada"
            }
            description={
              searchQuery || filterKey !== "all"
                ? "Tente outros filtros"
                : "Adicione músicas ao repertório"
            }
            action={
              !searchQuery && filterKey === "all"
                ? {
                    label: "Nova Música",
                    onClick: () => setShowCreateModal(true),
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-1 sm:space-y-1">
            {filtered.map((song) => {
              const canPrimaryPlay =
                !!song.audio_path || isYoutubeUrl(song.reference_url);

              return (
                <div
                  key={song.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 rounded-2xl border px-2.5 py-2.5 transition-colors sm:flex-nowrap sm:rounded-xl sm:p-3",
                    currentTrackId === song.id
                      ? "bg-primary/5 border-primary/20"
                      : "hover:bg-accent border-transparent",
                  )}
                >
                  {/* Play button */}
                  <button
                    onClick={() => canPrimaryPlay && handlePrimaryPlay(song)}
                    className={cn(
                      "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl transition-colors sm:h-9 sm:w-9 sm:rounded-xl",
                      canPrimaryPlay
                        ? "bg-primary/10 hover:bg-primary/20 cursor-pointer"
                        : "bg-muted cursor-default",
                    )}
                    title={
                      song.audio_path
                        ? "Reproduzir áudio"
                        : isYoutubeUrl(song.reference_url)
                          ? "Abrir no miniplayer"
                          : "Sem áudio ou referência do YouTube"
                    }
                  >
                    {loadingAudioId === song.id ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : currentTrackId === song.id ? (
                      <Pause className="h-4 w-4 text-primary" />
                    ) : (
                      <Play
                        className={cn(
                          "h-4 w-4",
                          canPrimaryPlay
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      />
                    )}
                  </button>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold leading-tight text-foreground sm:text-sm sm:font-medium">
                      {song.name}
                    </p>
                    {song.artist && (
                      <p className="mt-1 truncate text-sm text-muted-foreground sm:mt-0 sm:text-xs">
                        {song.artist}
                      </p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="order-3 ml-14 flex w-[calc(100%-3.5rem)] flex-shrink-0 items-center gap-1.5 sm:order-none sm:ml-0 sm:w-auto">
                    {song.original_key && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {song.original_key}
                      </span>
                    )}
                    {song.audio_path && (
                      <span
                        title="Possui áudio"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 sm:h-6 sm:w-6 sm:rounded-lg"
                      >
                        <Headphones className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {song.has_virtual_instruments && (
                      <span
                        title="Virtual Sample"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground sm:h-6 sm:w-6 sm:rounded-lg"
                      >
                        <Laptop className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {song.audio_path && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(song);
                        }}
                        disabled={downloadingId === song.id}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-600 disabled:opacity-50 dark:hover:text-emerald-400 sm:h-6 sm:w-6 sm:rounded-lg"
                        title="Baixar áudio"
                      >
                        {downloadingId === song.id ? (
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    {song.reference_url &&
                      (() => {
                        const url = song.reference_url!;
                        const isYt =
                          url.includes("youtube") || url.includes("youtu.be");
                        return (
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full sm:h-6 sm:w-6 sm:rounded-lg ${isYt ? "text-red-500" : "text-muted-foreground"}`}
                            title={
                              isYt
                                ? "Referência do YouTube"
                                : "Possui referência externa"
                            }
                          >
                            {isYt ? (
                              <Youtube className="h-3.5 w-3.5" />
                            ) : (
                              <ExternalLink className="h-3.5 w-3.5" />
                            )}
                          </span>
                        );
                      })()}
                  </div>

                  {/* Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 flex-shrink-0 rounded-full"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingSong(song)}>
                        <Pencil className="h-4 w-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      {canManage && (
                        <DropdownMenuItem
                          onClick={() => {
                            setYoutubeSong(song);
                            setShowYoutubeModal(true);
                          }}
                          className="text-red-500 focus:text-red-600"
                        >
                          <Youtube className="h-4 w-4 mr-2" />
                          YouTube → MP3
                        </DropdownMenuItem>
                      )}
                      {song.audio_path && (
                        <DropdownMenuItem
                          onClick={() => handleDownload(song)}
                          disabled={downloadingId === song.id}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {downloadingId === song.id
                            ? "Baixando..."
                            : "Baixar áudio"}
                        </DropdownMenuItem>
                      )}
                      {song.reference_url &&
                        (() => {
                          const url = song.reference_url!;
                          const isYt =
                            url.includes("youtube") || url.includes("youtu.be");
                          return (
                            <DropdownMenuItem
                              onClick={() => {
                                if (isYt) {
                                  setYoutubePlayerUrl(url);
                                  setYoutubePlayerTitle(song.name);
                                } else {
                                  window.open(url, "_blank");
                                }
                              }}
                            >
                              {isYt ? (
                                <Youtube className="h-4 w-4 mr-2 text-red-500" />
                              ) : (
                                <ExternalLink className="h-4 w-4 mr-2" />
                              )}
                              {isYt
                                ? "Abrir no miniplayer"
                                : "Abrir referência"}
                            </DropdownMenuItem>
                          );
                        })()}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeletingSong(song)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Player global */}
      {currentTrackId && playerTracks.length > 0 && (
        <AudioPlayer
          tracks={playerTracks}
          currentTrackId={currentTrackId}
          onTrackChange={handleTrackChange}
          onClose={() => {
            setCurrentTrackId(null);
            setPlayerTracks([]);
          }}
        />
      )}

      {/* Miniplayer YouTube — fixo na parte inferior */}
      {youtubePlayerUrl && (
        <div className="fixed bottom-16 left-0 right-0 z-50 px-2 pb-1 sm:bottom-0 sm:px-4 sm:pb-4 md:left-56">
          <div className="mx-auto max-w-lg">
            <YoutubeMiniplayer
              url={youtubePlayerUrl}
              title={youtubePlayerTitle}
              onClose={() => {
                setYoutubePlayerUrl(null);
                setYoutubePlayerTitle(undefined);
              }}
            />
          </div>
        </div>
      )}

      {/* Modais */}
      <CreateSongModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={refetch}
      />
      <EditSongModal
        open={!!editingSong}
        onOpenChange={(o) => !o && setEditingSong(null)}
        song={editingSong}
        onSuccess={refetch}
      />
      <YoutubeToAudioModal
        open={showYoutubeModal}
        onOpenChange={setShowYoutubeModal}
        songId={youtubeSong?.id}
        songName={youtubeSong?.name}
        defaultUrl={youtubeSong?.reference_url || ""}
        onSuccess={() => refetch()}
      />
      <YoutubeSettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />

      <AlertDialog
        open={!!deletingSong}
        onOpenChange={(o) => !o && setDeletingSong(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir música?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deletingSong?.name}"</strong> será excluída
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
