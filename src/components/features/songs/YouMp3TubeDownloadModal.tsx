import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { YOUMP3TUBE_DOWNLOADS } from "@/services/youMp3TubeDownloads";
import { Download, Laptop, Smartphone } from "lucide-react";

interface YouMp3TubeDownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const downloadOptions = [
  {
    name: "Android",
    extension: ".apk",
    description: "Celulares e tablets Android",
    href: YOUMP3TUBE_DOWNLOADS.android,
    icon: Smartphone,
    available: true,
  },
  {
    name: "Windows",
    extension: ".exe",
    description: "Computadores com Windows 10 ou superior",
    href: YOUMP3TUBE_DOWNLOADS.windows,
    icon: Laptop,
    available: false,
  },
  {
    name: "macOS",
    extension: ".dmg",
    description: "Computadores Mac",
    href: YOUMP3TUBE_DOWNLOADS.macos,
    icon: Laptop,
    available: true,
  },
] as const;

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
          {downloadOptions.map((option) => {
            const Icon = option.icon;

            return (
              <div
                key={option.name}
                className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {option.name}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {option.extension}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                {option.available ? (
                  <Button asChild size="sm">
                    <a href={option.href} download>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    Em breve
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
