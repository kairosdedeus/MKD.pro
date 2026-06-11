import { FormEvent, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { youtubeService } from "@/services/youtubeService";
import {
  CheckCircle2,
  Download,
  Loader2,
  Music2,
  Youtube,
} from "lucide-react";

interface YoutubeToAudioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId?: string;
  songName?: string;
  defaultUrl?: string;
  onSuccess?: (audioPath: string) => void;
}

const YOUTUBE_URL_PATTERN =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]+/i;

export function YoutubeToAudioModal({
  open,
  onOpenChange,
  songId,
  songName,
  defaultUrl = "",
  onSuccess,
}: YoutubeToAudioModalProps) {
  const { toast } = useToast();
  const [url, setUrl] = useState(defaultUrl);
  const [converting, setConverting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUrl(defaultUrl);
      setDownloadUrl(null);
    }
  }, [defaultUrl, open]);

  const handleConvert = async (event: FormEvent) => {
    event.preventDefault();
    const youtubeUrl = url.trim();

    if (!YOUTUBE_URL_PATTERN.test(youtubeUrl)) {
      toast({
        variant: "destructive",
        title: "Link do YouTube inválido",
        description: "Cole o endereço completo do vídeo.",
      });
      return;
    }

    try {
      setConverting(true);
      setDownloadUrl(null);

      const serviceStatus = await youtubeService.testConnection();
      if (!serviceStatus.ok) {
        throw new Error(
          serviceStatus.error || "O serviço de conversão está indisponível.",
        );
      }

      const result = await youtubeService.convertToAudio(youtubeUrl, songId);

      onSuccess?.(result.audio_path);
      if (result.download_url) setDownloadUrl(result.download_url);

      toast({
        title: "Áudio convertido com sucesso",
        description: songId
          ? "O MP3 foi vinculado à música."
          : "O MP3 está pronto para download.",
      });

      if (songId) onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Não foi possível converter",
        description:
          error instanceof Error ? error.message : "Tente novamente mais tarde.",
      });
    } finally {
      setConverting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!converting) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex min-w-0 items-center gap-2">
            <Youtube className="h-5 w-5 flex-shrink-0 text-red-500" />
            <span>YouTube para MP3</span>
            {songName && (
              <span className="truncate text-sm font-normal text-muted-foreground">
                - {songName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleConvert}>
          <div data-dialog-body="" className="space-y-5 px-5 py-5">
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <div className="flex gap-3">
                <Music2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  {songId
                    ? "O vídeo será convertido em MP3 e salvo diretamente nesta música."
                    : "O vídeo será convertido em MP3 e ficará disponível para download."}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtube-url">Link do vídeo no YouTube</Label>
              <Input
                id="youtube-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={converting}
                autoFocus
              />
            </div>

            {converting && (
              <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <div>
                  <p className="font-medium">Convertendo o áudio...</p>
                  <p className="text-xs text-muted-foreground">
                    No primeiro uso, o servidor gratuito pode levar cerca de um
                    minuto para iniciar. Não feche esta janela.
                  </p>
                </div>
              </div>
            )}

            {downloadUrl && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <div className="flex min-w-0 items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">MP3 pronto</span>
                </div>
                <Button asChild size="sm">
                  <a href={downloadUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </a>
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={converting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={converting || !url.trim()}>
              {converting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Convertendo...
                </>
              ) : (
                <>
                  <Youtube className="mr-2 h-4 w-4" />
                  Converter para MP3
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
