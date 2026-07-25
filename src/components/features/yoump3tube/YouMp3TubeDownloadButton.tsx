import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface YouMp3TubeDownloadButtonProps {
  onClick: () => void;
}

export function YouMp3TubeDownloadButton({
  onClick,
}: YouMp3TubeDownloadButtonProps) {
  return (
    <Button
      size="sm"
      variant="outline"
      className="h-9 gap-1.5 rounded-full border-red-500/30 px-2.5 text-red-500 hover:bg-red-500/10 hover:text-red-600 sm:rounded-md sm:px-3"
      onClick={onClick}
      title="Baixe a ferramenta para Android ou desktop"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Baixe a ferramenta</span>
    </Button>
  );
}
