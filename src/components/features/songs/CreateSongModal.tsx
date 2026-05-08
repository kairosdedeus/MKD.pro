import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { KeySelector } from "@/components/ui/key-selector";
import { useToast } from "@/components/ui/use-toast";
import { songService } from "@/services/songService";
import { SongFormData } from "@/types";
import { Upload, X } from "lucide-react";

interface CreateSongModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateSongModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateSongModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [artist, setArtist] = useState("");
  const [originalKey, setOriginalKey] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [hasVirtualInstruments, setHasVirtualInstruments] = useState(false);
  const [notes, setNotes] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const resetForm = () => {
    setName("");
    setArtist("");
    setOriginalKey("");
    setReferenceUrl("");
    setHasVirtualInstruments(false);
    setNotes("");
    setAudioFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"].includes(file.type)
    ) {
      toast({
        variant: "destructive",
        title: "Arquivo inválido",
        description: "Use MP3, WAV ou OGG",
      });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "Máximo 50MB",
      });
      return;
    }
    setAudioFile(file);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Nome obrigatório" });
      return;
    }
    try {
      setLoading(true);
      const formData: SongFormData = {
        name: name.trim(),
        artist: artist.trim() || undefined,
        original_key: originalKey || undefined,
        reference_url: referenceUrl.trim() || undefined,
        has_virtual_instruments: hasVirtualInstruments,
        notes: notes.trim() || undefined,
        audio_file: audioFile || undefined,
      };
      await songService.createSong(formData);
      toast({ title: "✅ Música criada!" });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast({ variant: "destructive", title: "Erro ao criar música" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🎵 Nova Música</DialogTitle>
        </DialogHeader>

        <div data-dialog-body="" className="space-y-4 px-4 py-4 sm:px-5">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label>Nome da Música *</Label>
            <Input
              placeholder="Ex: Oceans"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Artista */}
          <div className="space-y-1.5">
            <Label>Artista / Banda</Label>
            <Input
              placeholder="Ex: Hillsong"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Tom — seletor visual */}
          <KeySelector
            value={originalKey}
            onChange={setOriginalKey}
            label="Tom Original"
            allowEmpty
          />

          {/* Link de referência */}
          <div className="space-y-1.5">
            <Label>Link de Referência</Label>
            <Input
              placeholder="YouTube, Spotify..."
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Áudio */}
          <div className="space-y-1.5">
            <Label>Arquivo de Áudio</Label>
            <div className="flex items-center gap-2">
              <input
                id="audioFileCreate"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() =>
                  document.getElementById("audioFileCreate")?.click()
                }
              >
                <Upload className="h-4 w-4 mr-2" />
                {audioFile ? audioFile.name : "Selecionar arquivo"}
              </Button>
              {audioFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setAudioFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              MP3, WAV, OGG — máximo 50MB
            </p>
          </div>

          {/* Instrumentos sampleados */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="hasVI"
              checked={hasVirtualInstruments}
              onCheckedChange={(v) => setHasVirtualInstruments(v as boolean)}
            />
            <Label htmlFor="hasVI" className="cursor-pointer">
              Possui VS
            </Label>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações sobre a música"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {loading ? "Criando..." : "Criar Música"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
