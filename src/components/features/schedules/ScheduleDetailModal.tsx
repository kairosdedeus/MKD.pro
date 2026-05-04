import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Calendar, Users, Music, FileText } from "lucide-react";
import { Schedule } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { ptBR } from "date-fns/locale";

interface ScheduleDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Rascunho", variant: "secondary" },
  published: { label: "Publicada", variant: "default" },
  completed: { label: "Concluída", variant: "outline" },
};

export function ScheduleDetailModal({
  open,
  onOpenChange,
  schedule,
  onEdit,
  onDelete,
}: ScheduleDetailModalProps) {
  const status = STATUS_LABELS[schedule.status] || STATUS_LABELS.draft;
  const { toast } = useToast();

  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
  const [whatsAppText, setWhatsAppText] = useState("");

  function buildWeekendWhatsAppText(schedules: Schedule[], teamName: string) {
    const lines: string[] = [];
    lines.push(
      `📍 *${teamName.toUpperCase()}* ${schedule.title ? `🎤 *${schedule.title}*` : ""}`,
    );
    lines.push("");

    const ordered = [...schedules].sort((a, b) => a.date.localeCompare(b.date));
    ordered.forEach((s) => {
      lines.push(`🗓 ${format(parseISO(s.date), "EEEE dd", { locale: ptBR })}`);
      const songs = (s.songs || []).sort(
        (a, b) => a.order_index - b.order_index,
      );
      songs.forEach((ss, idx) => {
        const key = ss.execution_key || ss.song?.original_key || "";
        lines.push(
          `${idx + 1} - ${ss.song?.name || "Música"}${key ? " - " + key : ""}`,
        );
      });
      lines.push("");
    });

    return lines.join("\n").trim();
  }

  const handleCopyFromPreview = async () => {
    try {
      await navigator.clipboard.writeText(whatsAppText);
      toast({ title: "Texto copiado para a área de transferência" });
      setShowWhatsAppPreview(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Não foi possível copiar",
        description: "Copie manualmente.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
            <span className="truncate">
              {schedule.title || "Escala sem título"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-5 px-5 py-4">
          {/* Info básica */}
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl">
            <div>
              <p className="text-sm text-gray-500">Data</p>
              <p className="font-semibold text-purple-900">
                {format(
                  parseISO(schedule.date),
                  "EEEE, dd 'de' MMMM 'de' yyyy",
                  { locale: ptBR },
                )}
              </p>
            </div>
            <div className="ml-auto">
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </div>

          {/* Observações */}
          {schedule.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4" />
                Observações
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {schedule.notes}
              </p>
            </div>
          )}

          {/* Membros por Função */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="h-4 w-4 text-purple-600" />
              Membros da Escala
            </div>
            {!schedule.members || schedule.members.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                Nenhum membro escalado
              </p>
            ) : (
              <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {(() => {
                  // Agrupar membros por função
                  const functionMap = new Map<
                    string,
                    {
                      functionName: string;
                      members: string[];
                      icon: string;
                      color: { bg: string; text: string; pill: string };
                    }
                  >();

                  const FUNCTION_COLORS: Record<
                    string,
                    { bg: string; text: string; pill: string }
                  > = {
                    Vocal: {
                      bg: "bg-purple-50",
                      text: "text-purple-700",
                      pill: "bg-purple-100 text-purple-700 border-purple-300",
                    },
                    BackVocal: {
                      bg: "bg-fuchsia-50",
                      text: "text-fuchsia-700",
                      pill: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300",
                    },
                    Guitarra: {
                      bg: "bg-orange-50",
                      text: "text-orange-700",
                      pill: "bg-orange-100 text-orange-700 border-orange-300",
                    },
                    Baixo: {
                      bg: "bg-blue-50",
                      text: "text-blue-700",
                      pill: "bg-blue-100 text-blue-700 border-blue-300",
                    },
                    Bateria: {
                      bg: "bg-red-50",
                      text: "text-red-700",
                      pill: "bg-red-100 text-red-700 border-red-300",
                    },
                    Teclado: {
                      bg: "bg-green-50",
                      text: "text-green-700",
                      pill: "bg-green-100 text-green-700 border-green-300",
                    },
                    Projeção: {
                      bg: "bg-cyan-50",
                      text: "text-cyan-700",
                      pill: "bg-cyan-100 text-cyan-700 border-cyan-300",
                    },
                    Som: {
                      bg: "bg-yellow-50",
                      text: "text-yellow-700",
                      pill: "bg-yellow-100 text-yellow-700 border-yellow-300",
                    },
                    Transmissão: {
                      bg: "bg-pink-50",
                      text: "text-pink-700",
                      pill: "bg-pink-100 text-pink-700 border-pink-300",
                    },
                  };

                  const FUNCTION_ICONS: Record<string, string> = {
                    Vocal: "🎤",
                    BackVocal: "🎙️",
                    Guitarra: "🎸",
                    Baixo: "🎸",
                    Bateria: "🥁",
                    Teclado: "🎹",
                    Projeção: "📽️",
                    Som: "🔊",
                    Transmissão: "📡",
                  };

                  schedule.members.forEach((member) => {
                    const memberName =
                      member.team_member?.user?.nome || "Sem nome";
                    (member.functions || []).forEach((fn) => {
                      if (!functionMap.has(fn.id)) {
                        functionMap.set(fn.id, {
                          functionName: fn.nome,
                          members: [],
                          icon: FUNCTION_ICONS[fn.nome] || "🎵",
                          color: FUNCTION_COLORS[fn.nome] || {
                            bg: "bg-gray-50",
                            text: "text-gray-700",
                            pill: "bg-gray-100 text-gray-700 border-gray-300",
                          },
                        });
                      }
                      functionMap.get(fn.id)!.members.push(memberName);
                    });
                  });

                  // Ordenar funções: Vocal, BackVocal, demais
                  const sortedFunctions = Array.from(functionMap.values()).sort(
                    (a, b) => {
                      const getPriority = (nome: string) => {
                        if (nome === "Vocal") return 0;
                        if (nome === "BackVocal") return 1;
                        return 2;
                      };
                      const priorityA = getPriority(a.functionName);
                      const priorityB = getPriority(b.functionName);
                      if (priorityA !== priorityB) return priorityA - priorityB;
                      return a.functionName.localeCompare(b.functionName);
                    },
                  );

                  return sortedFunctions.map(
                    ({ functionName, members, icon, color }) => (
                      <div
                        key={functionName}
                        className={`flex flex-col sm:flex-row items-start gap-3 sm:gap-4 px-3 sm:px-4 py-3 ${color.bg}`}
                      >
                        {/* Função label */}
                        <div className="flex items-center gap-2 w-full sm:w-32 flex-shrink-0">
                          <span className="text-base leading-none">{icon}</span>
                          <span
                            className={`text-sm font-semibold ${color.text}`}
                          >
                            {functionName}
                          </span>
                        </div>

                        {/* Membros */}
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-wrap items-center gap-2">
                            {members.map((memberName, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-1.5 pl-2.5 pr-2.5 py-1 rounded-full text-sm font-medium border ${color.pill}`}
                              >
                                <span className="w-5 h-5 rounded-full bg-primary-foreground/60 dark:bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {memberName.charAt(0).toUpperCase()}
                                </span>
                                {memberName}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ),
                  );
                })()}
              </div>
            )}
          </div>

          {/* Músicas */}
          {schedule.songs && schedule.songs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Music className="h-4 w-4 text-purple-600" />
                Músicas ({schedule.songs.length})
              </div>
              <div className="space-y-1">
                {schedule.songs
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((scheduleSong, index) => (
                    <div
                      key={scheduleSong.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2 border rounded-lg"
                    >
                      <span className="text-xs text-gray-400 w-5 text-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0 w-full">
                        <p className="text-sm font-medium">
                          {scheduleSong.song?.name || "Música"}
                        </p>
                        {scheduleSong.song?.artist && (
                          <p className="text-xs text-gray-400">
                            {scheduleSong.song.artist}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs text-gray-500 flex-wrap">
                        {scheduleSong.song?.original_key && (
                          <span>
                            Original:{" "}
                            <strong>{scheduleSong.song.original_key}</strong>
                          </span>
                        )}
                        {scheduleSong.execution_key &&
                          scheduleSong.execution_key !==
                            scheduleSong.song?.original_key && (
                            <span className="text-purple-600">
                              Execução:{" "}
                              <strong>{scheduleSong.execution_key}</strong>
                            </span>
                          )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
          <Button
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            id="export-whatsapp-single-day"
            onClick={() => {
              const text = buildWeekendWhatsAppText(
                [schedule],
                schedule.team?.nome || "MKD - Louvor",
              );
              setWhatsAppText(text);
              setShowWhatsAppPreview(true);
            }}
          >
            <FileText className="h-4 w-4" />
            Exportar Dia
          </Button>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
      {/* WhatsApp preview dialog */}
      <Dialog open={showWhatsAppPreview} onOpenChange={setShowWhatsAppPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Exportar WhatsApp</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 px-5 py-4">
            <textarea
              className="w-full h-64 sm:h-80 p-3 border rounded resize-y font-mono text-xs sm:text-sm"
              value={whatsAppText}
              onChange={(e) => setWhatsAppText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Edite o texto se necessário e clique em Copiar.
            </p>
          </div>

          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowWhatsAppPreview(false)}
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>
            <Button
              className="gap-2 w-full sm:w-auto"
              id="export-whatsapp-copy"
              onClick={handleCopyFromPreview}
            >
              <FileText className="h-4 w-4" />
              Copiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
