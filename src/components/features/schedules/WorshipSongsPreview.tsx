import { useState } from "react";
import { ExternalLink, Pause, Play, Youtube } from "lucide-react";
import { AudioPlayer, AudioTrack } from "@/components/shared/AudioPlayer";
import { YoutubeMiniplayer } from "@/components/shared/YoutubeMiniplayer";
import { useToast } from "@/components/ui/use-toast";
import { songService } from "@/services/songService";
import { cn } from "@/lib/utils";

interface WorshipSong {
  order_index: number;
  execution_key: string | null;
  song: {
    id: string;
    name: string;
    artist: string | null;
    original_key: string | null;
    audio_path: string | null;
    reference_url: string | null;
  };
}

interface WorshipSongsPreviewProps {
  songs: WorshipSong[];
}

export function WorshipSongsPreview({ songs }: WorshipSongsPreviewProps) {
  const { toast } = useToast();
  const [playerTracks, setPlayerTracks] = useState<AudioTrack[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [audioPaths, setAudioPaths] = useState<Record<number, string | null>>(
    {},
  );
  const [youtubePlayerUrl, setYoutubePlayerUrl] = useState<string | null>(null);
  const [youtubePlayerTitle, setYoutubePlayerTitle] = useState<
    string | undefined
  >();

  const getAudioPath = async (index: number) => {
    const item = songs[index];
    if (!item) return null;
    if (item.song.audio_path) return item.song.audio_path;
    if (index in audioPaths) return audioPaths[index];

    const song = await songService.getSongById(item.song.id);
    setAudioPaths((previous) => ({
      ...previous,
      [index]: song.audio_path,
    }));
    return song.audio_path;
  };

  const handlePlay = async (songId: string) => {
    const itemIndex = Number(songId);
    const item = songs[itemIndex];
    if (!item) return;

    const existing = playerTracks.find((track) => track.id === songId);
    if (existing?.audioUrl) {
      setCurrentTrackId(songId);
      return;
    }

    try {
      setLoadingAudioId(songId);
      const audioPath = await getAudioPath(itemIndex);
      if (!audioPath) {
        toast({ title: "Esta música não possui áudio" });
        return;
      }
      const url = await songService.getAudioUrl(audioPath);
      setPlayerTracks(
        songs.map((song, index) => ({
          id: String(index),
          name: song.song.name,
          artist: song.song.artist || undefined,
          audioUrl: String(index) === songId ? url : "",
          key: song.execution_key || song.song.original_key || undefined,
        })),
      );
      setCurrentTrackId(songId);
    } catch {
      toast({ variant: "destructive", title: "Erro ao reproduzir áudio" });
    } finally {
      setLoadingAudioId(null);
    }
  };

  const handleTrackChange = async (songId: string | null) => {
    if (!songId) {
      setCurrentTrackId(null);
      return;
    }

    const track = playerTracks.find((item) => item.id === songId);
    if (track?.audioUrl) {
      setCurrentTrackId(songId);
      return;
    }

    const itemIndex = Number(songId);
    const item = songs[itemIndex];
    if (!item) return;

    try {
      const audioPath = await getAudioPath(itemIndex);
      if (!audioPath) return;
      const url = await songService.getAudioUrl(audioPath);
      setPlayerTracks((previous) =>
        previous.map((trackItem) =>
          trackItem.id === songId ? { ...trackItem, audioUrl: url } : trackItem,
        ),
      );
      setCurrentTrackId(songId);
    } catch {
      toast({ variant: "destructive", title: "Erro ao carregar faixa" });
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        {songs.map((item, index) => {
          const itemId = String(index);
          const isPlaying = currentTrackId === itemId;
          const isLoading = loadingAudioId === itemId;
          const songKey = item.execution_key || item.song.original_key;

          return (
            <div
              key={itemId}
              className={cn(
                "flex items-center gap-2 rounded-lg border border-amber-500/10 bg-card/80 px-2.5 py-2",
                isPlaying && "border-amber-500/30 bg-amber-500/10",
              )}
            >
              <button
                type="button"
                onClick={() => handlePlay(itemId)}
                aria-label={`Ouvir ${item.song.name}`}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
              >
                {isLoading ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isPlaying ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.song.name}
                </p>
                {item.song.artist && (
                  <p className="truncate text-xs text-muted-foreground">
                    {item.song.artist}
                  </p>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center gap-1.5">
                {songKey && (
                  <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {songKey}
                  </span>
                )}
                {item.song.reference_url &&
                  (() => {
                    const url = item.song.reference_url;
                    const isYoutube =
                      url.includes("youtube") || url.includes("youtu.be");

                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (isYoutube) {
                            setYoutubePlayerUrl(url);
                            setYoutubePlayerTitle(item.song.name);
                          } else {
                            window.open(url, "_blank");
                          }
                        }}
                        title={
                          isYoutube ? "Abrir no miniplayer" : "Abrir referência"
                        }
                        aria-label={
                          isYoutube
                            ? `Abrir vídeo de ${item.song.name}`
                            : `Abrir referência de ${item.song.name}`
                        }
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded transition-colors",
                          isYoutube
                            ? "text-red-500 hover:bg-red-500/10"
                            : "text-muted-foreground hover:bg-accent hover:text-primary",
                        )}
                      >
                        {isYoutube ? (
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

      {currentTrackId && playerTracks.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-xl border border-amber-500/20">
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

      {youtubePlayerUrl && (
        <div className="mt-2">
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
    </>
  );
}
