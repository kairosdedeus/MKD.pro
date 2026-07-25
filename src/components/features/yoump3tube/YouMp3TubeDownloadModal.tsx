import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { YouMp3TubeDownloadOptionCard } from "./YouMp3TubeDownloadOptionCard";
import { YOUMP3TUBE_DOWNLOAD_OPTIONS } from "@/features/yoump3tube/download-options";

interface YouMp3TubeDownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function YouMp3TubeDownloadModal({
  open,
  onOpenChange,
}: YouMp3TubeDownloadModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Baixe a ferramenta para Android ou desktop</DialogTitle>
          <DialogDescription>
            Escolha a versão compatível com seu dispositivo. A conversão para
            MP3 acontece diretamente no aparelho.
          </DialogDescription>
        </DialogHeader>

        <div data-dialog-body="" className="grid gap-3 px-5 py-5">
          {YOUMP3TUBE_DOWNLOAD_OPTIONS.map((option) => (
            <YouMp3TubeDownloadOptionCard key={option.id} option={option} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
