import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Youtube, Clock, Wrench, Music2 } from "lucide-react";

interface YoutubeToAudioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId?: string;
  songName?: string;
  defaultUrl?: string;
  onSuccess?: (audioPath: string) => void;
}

export function YoutubeToAudioModal({
  open,
  onOpenChange,
  songName,
}: YoutubeToAudioModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500 flex-shrink-0" />
            YouTube → MP3
            {songName && (
              <span className="text-sm font-normal text-muted-foreground truncate">
                — {songName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-6 flex flex-col items-center gap-5 text-center">
          {/* Ícone animado */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Music2 className="h-9 w-9 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500/15 border-2 border-background flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </div>

          {/* Texto */}
          <div className="space-y-2">
            <p className="text-lg font-semibold">Em breve</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A conversão automática de YouTube para MP3 está sendo desenvolvida
              e chegará em breve.
            </p>
          </div>

          {/* Info */}
          <div className="w-full rounded-xl bg-muted/50 border border-border p-3 flex gap-2.5 text-left">
            <Wrench className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Por enquanto, baixe o áudio manualmente e use o botão{" "}
              <strong className="text-foreground">Upload de Áudio</strong> na
              edição da música.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
