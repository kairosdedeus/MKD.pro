import { Button } from "@/components/ui/button";
import type { YouMp3TubeDownloadOption } from "@/features/yoump3tube/download-options";
import { Download, Laptop, Smartphone } from "lucide-react";

interface YouMp3TubeDownloadOptionCardProps {
  option: YouMp3TubeDownloadOption;
}

export function YouMp3TubeDownloadOptionCard({
  option,
}: YouMp3TubeDownloadOptionCardProps) {
  const PlatformIcon = option.id === "android" ? Smartphone : Laptop;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <PlatformIcon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {option.name}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            {option.extension}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">{option.description}</p>
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
}
