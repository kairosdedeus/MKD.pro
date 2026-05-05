import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  X,
  Music2,
  Repeat,
  Shuffle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AudioTrack {
  id: string;
  name: string;
  artist?: string;
  audioUrl: string;
  key?: string;
}

interface AudioPlayerProps {
  tracks: AudioTrack[];
  currentTrackId: string | null;
  onTrackChange: (id: string | null) => void;
  onClose: () => void;
  /** Quando true, renderiza inline (sem position fixed) — para uso dentro de modais */
  embedded?: boolean;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({
  tracks,
  currentTrackId,
  onTrackChange,
  onClose,
  embedded = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentIndex = tracks.findIndex((t) => t.id === currentTrackId);
  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null;

  // Carregar nova faixa
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    setLoading(true);
    setCurrentTime(0);
    setDuration(0);
    audio.src = currentTrack.audioUrl;
    audio.volume = volume;
    audio.muted = muted;
    audio.load();

    const onCanPlay = () => {
      setLoading(false);
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    };
    audio.addEventListener("canplay", onCanPlay, { once: true });
    return () => audio.removeEventListener("canplay", onCanPlay);
  }, [currentTrack?.id, currentTrack?.audioUrl]);

  // Eventos do audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNext();
      }
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
    };
  }, [repeat, shuffle, tracks, currentTrackId]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  const handleNext = useCallback(() => {
    if (tracks.length === 0) return;
    if (shuffle) {
      const others = tracks.filter((t) => t.id !== currentTrackId);
      if (others.length === 0) return;
      const next = others[Math.floor(Math.random() * others.length)];
      onTrackChange(next.id);
    } else {
      const nextIndex = (currentIndex + 1) % tracks.length;
      onTrackChange(tracks[nextIndex].id);
    }
  }, [tracks, currentIndex, currentTrackId, shuffle, onTrackChange]);

  const handlePrev = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Se passou mais de 3s, volta ao início
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (tracks.length === 0) return;
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    onTrackChange(tracks[prevIndex].id);
  }, [tracks, currentIndex, onTrackChange]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    audio.currentTime = ratio * duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (v > 0) setMuted(false);
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
  };

  const VolumeIcon =
    muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentTrack) return null;

  return (
    <div
      className={cn(
        embedded
          ? "w-full"
          : "fixed bottom-16 left-0 right-0 z-50 px-2 pb-1 sm:bottom-0 sm:px-0",
      )}
    >
      <div
        className={cn(
          "bg-card border border-border shadow-2xl overflow-hidden",
          embedded
            ? "rounded-none"
            : "mx-auto max-w-2xl sm:max-w-full sm:rounded-none rounded-2xl",
        )}
      >
        {/* Barra de progresso — clicável */}
        <div
          ref={progressRef}
          onClick={handleSeek}
          className="relative h-1.5 bg-muted cursor-pointer group"
        >
          <div
            className="h-full bg-primary transition-none"
            style={{ width: `${progress}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          {/* Info da faixa */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Music2 className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">
                {currentTrack.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.artist || "—"}
                {currentTrack.key && (
                  <span className="ml-1.5 text-primary font-medium">
                    {currentTrack.key}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Controles centrais */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Shuffle */}
            <button
              onClick={() => setShuffle((s) => !s)}
              className={cn(
                "p-1.5 rounded-lg transition-colors hidden sm:flex",
                shuffle
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
              title="Aleatório"
            >
              <Shuffle className="h-3.5 w-3.5" />
            </button>

            {/* Anterior */}
            <button
              onClick={handlePrev}
              disabled={tracks.length <= 1}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30"
              title="Anterior"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md"
              title={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>

            {/* Próxima */}
            <button
              onClick={handleNext}
              disabled={tracks.length <= 1}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30"
              title="Próxima"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            {/* Repetir */}
            <button
              onClick={() => setRepeat((r) => !r)}
              className={cn(
                "p-1.5 rounded-lg transition-colors hidden sm:flex",
                repeat
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
              title="Repetir"
            >
              <Repeat className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Tempo + Volume + Fechar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Tempo */}
            <span className="text-xs text-muted-foreground tabular-nums hidden sm:block w-20 text-right">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={handleToggleMute}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title={muted ? "Ativar som" : "Silenciar"}
              >
                <VolumeIcon className="h-4 w-4" />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 accent-primary cursor-pointer"
                title={`Volume: ${Math.round(volume * 100)}%`}
              />
            </div>

            {/* Fechar */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Fechar player"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tempo mobile */}
        <div className="flex justify-between px-4 pb-2 text-xs text-muted-foreground sm:hidden">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <audio ref={audioRef} preload="metadata" />
    </div>
  );
}
