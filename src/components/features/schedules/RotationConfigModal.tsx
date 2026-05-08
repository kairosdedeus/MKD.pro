/**
 * Modal de Configuração de Rodízio de Equipes
 *
 * Permite configurar:
 * - Qual equipe é a do 1º final de semana
 * - Ordem de rodízio das demais equipes (drag & drop)
 * - Ativar/desativar equipes do rodízio
 */

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  worshipRotationService,
  RotationTeam,
} from "@/services/worshipRotationService";
import {
  GripVertical,
  Calendar,
  RotateCw,
  Check,
  AlertCircle,
  Save,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

interface RotationConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onSuccess?: () => void;
}

export function RotationConfigModal({
  open,
  onOpenChange,
  teamId,
  onSuccess,
}: RotationConfigModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstWeekendTeamId, setFirstWeekendTeamId] = useState<string>("");
  const [rotationTeams, setRotationTeams] = useState<RotationTeam[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) loadData();
  }, [open, teamId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const sequence = await worshipRotationService.getRotationSequence(teamId);

      setFirstWeekendTeamId(sequence.firstWeekendTeam?.id || "");
      setRotationTeams(sequence.rotationTeams);
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configuração",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    setRotationTeams((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, moved);
      return updated;
    });

    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const toggleTeamActive = (teamId: string) => {
    setRotationTeams((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? { ...team, is_active_rotation: !team.is_active_rotation }
          : team,
      ),
    );
  };

  const handleSave = async () => {
    if (!firstWeekendTeamId) {
      toast({
        variant: "destructive",
        title: "Selecione a equipe do 1º final de semana",
      });
      return;
    }

    const activeTeams = rotationTeams.filter((t) => t.is_active_rotation);
    if (activeTeams.length === 0) {
      toast({
        variant: "destructive",
        title: "Ative pelo menos uma equipe no rodízio",
      });
      return;
    }

    try {
      setSaving(true);

      // 1. Definir equipe do 1º final de semana
      await worshipRotationService.setFirstWeekendTeam(firstWeekendTeamId);

      // 2. Atualizar ordem e status das equipes de rodízio
      const updates = rotationTeams.map((team, index) => ({
        id: team.id,
        order_index: index + 1, // Começa em 1 (0 é reservado para equipe X)
      }));
      await worshipRotationService.updateRotationOrder(updates);

      // 3. Atualizar status ativo/inativo
      await Promise.all(
        rotationTeams.map((team) =>
          worshipRotationService.toggleTeamRotation(
            team.id,
            team.is_active_rotation,
          ),
        ),
      );

      toast({
        title: "✅ Configuração salva!",
        description: "O rodízio foi atualizado com sucesso.",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar configuração",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const allTeams = [
    ...(firstWeekendTeamId
      ? rotationTeams.filter((t) => t.id === firstWeekendTeamId)
      : []),
    ...rotationTeams.filter((t) => t.id !== firstWeekendTeamId),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCw className="h-5 w-5 text-primary" />
            Configurar Rodízio de Equipes
          </DialogTitle>
          <DialogDescription>
            Configure a ordem de rodízio das equipes fixas. A equipe do 1º final
            de semana sempre será escalada primeiro, as demais seguem a
            sequência configurada.
          </DialogDescription>
        </DialogHeader>

        <div
          data-dialog-body=""
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 sm:px-6 sm:space-y-6"
        >
          {/* Equipe do 1º Final de Semana */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <Label className="text-base font-semibold">
                Equipe do 1º Final de Semana
              </Label>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Esta equipe sempre será escalada no primeiro final de semana de
                cada mês.
              </p>
              <RadioGroup
                value={firstWeekendTeamId}
                onValueChange={setFirstWeekendTeamId}
              >
                {allTeams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <RadioGroupItem value={team.id} id={`first-${team.id}`} />
                    <Label
                      htmlFor={`first-${team.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-medium">{team.nome}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({team.codigo})
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Sequência de Rodízio */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RotateCw className="h-4 w-4 text-primary" />
              <Label className="text-base font-semibold">
                Sequência de Rodízio
              </Label>
            </div>
            <div className="rounded-xl border p-4 space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                Arraste para reordenar. As equipes serão escaladas nesta ordem
                nos demais finais de semana.
              </p>

              {rotationTeams.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  Nenhuma equipe disponível para rodízio
                </div>
              ) : (
                rotationTeams.map((team, index) => {
                  const isDragging = dragIndex === index;
                  const isDragOver = dragOverIndex === index;
                  const isFirstWeekend = team.id === firstWeekendTeamId;

                  // Não permitir arrastar a equipe do 1º final de semana
                  if (isFirstWeekend) return null;

                  return (
                    <div
                      key={team.id}
                      draggable={!isFirstWeekend}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        isDragging
                          ? "opacity-50 scale-95"
                          : isDragOver
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:bg-accent/50"
                      } ${!team.is_active_rotation ? "opacity-60" : ""}`}
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0" />

                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{team.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.codigo}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Label
                          htmlFor={`active-${team.id}`}
                          className="text-sm text-muted-foreground cursor-pointer"
                        >
                          {team.is_active_rotation ? "Ativa" : "Inativa"}
                        </Label>
                        <Switch
                          id={`active-${team.id}`}
                          checked={team.is_active_rotation}
                          onCheckedChange={() => toggleTeamActive(team.id)}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Preview da Sequência */}
          <div className="rounded-xl border border-muted bg-muted/30 p-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Preview da Sequência
            </p>
            <div className="flex flex-wrap gap-2">
              {firstWeekendTeamId && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/30">
                  <Calendar className="h-3 w-3" />
                  {allTeams.find((t) => t.id === firstWeekendTeamId)?.nome}
                </span>
              )}
              {rotationTeams
                .filter(
                  (t) => t.is_active_rotation && t.id !== firstWeekendTeamId,
                )
                .map((team, index) => (
                  <span
                    key={team.id}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-muted text-foreground border"
                  >
                    {index + 1}. {team.nome}
                  </span>
                ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Configuração
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
