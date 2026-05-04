import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { TeamFunction, TeamMember } from "@/types";
import {
  worshipFixedTeamService,
  WorshipFixedTeam,
  WorshipFixedTeamMemberInput,
} from "@/services/worshipFixedTeamService";
import { Check, Music, Users } from "lucide-react";

interface WorshipFixedTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  members: TeamMember[];
  functions: TeamFunction[];
  preset?: WorshipFixedTeam | null;
  onSuccess?: () => void;
}

interface MemberSelection {
  team_member_id: string;
  function_ids: string[];
}

export function WorshipFixedTeamModal({
  open,
  onOpenChange,
  teamId,
  members,
  functions,
  preset,
  onSuccess,
}: WorshipFixedTeamModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<MemberSelection[]>([]);
  const [saving, setSaving] = useState(false);

  const isEditing = !!preset;
  const sortedMembers = [...(members || [])].sort((a, b) =>
    (a.user?.nome || "").localeCompare(b.user?.nome || "", "pt-BR", {
      sensitivity: "base",
    }),
  );

  useEffect(() => {
    if (!open) return;

    setName(preset?.nome || "");
    if (!preset) {
      setSelectedMembers([]);
      return;
    }

    const grouped = new Map<string, MemberSelection>();
    preset.members.forEach((item) => {
      const current = grouped.get(item.team_member_id) || {
        team_member_id: item.team_member_id,
        function_ids: [],
      };
      if (!current.function_ids.includes(item.function_id)) {
        current.function_ids.push(item.function_id);
      }
      grouped.set(item.team_member_id, current);
    });
    setSelectedMembers(Array.from(grouped.values()));
  }, [open, preset]);

  const isMemberSelected = (memberId: string) =>
    selectedMembers.some((member) => member.team_member_id === memberId);

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) => {
      if (prev.some((member) => member.team_member_id === memberId)) {
        return prev.filter((member) => member.team_member_id !== memberId);
      }

      const member = members.find((item) => item.id === memberId);
      const defaultFunctionId =
        member?.functions?.length === 1 ? member.functions[0].id : undefined;

      return [
        ...prev,
        {
          team_member_id: memberId,
          function_ids: defaultFunctionId ? [defaultFunctionId] : [],
        },
      ];
    });
  };

  const toggleFunction = (memberId: string, functionId: string) => {
    setSelectedMembers((prev) =>
      prev.map((member) => {
        if (member.team_member_id !== memberId) return member;
        const hasFunction = member.function_ids.includes(functionId);
        return {
          ...member,
          function_ids: hasFunction
            ? member.function_ids.filter((id) => id !== functionId)
            : [...member.function_ids, functionId],
        };
      }),
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Informe o nome da equipe padrão",
      });
      return;
    }

    if (selectedMembers.length === 0) {
      toast({
        variant: "destructive",
        title: "Selecione pelo menos um membro",
      });
      return;
    }

    const membersWithoutFunction = selectedMembers.filter(
      (member) => member.function_ids.length === 0,
    );
    if (membersWithoutFunction.length > 0) {
      toast({
        variant: "destructive",
        title: "Defina a função de todos os membros",
      });
      return;
    }

    try {
      setSaving(true);
      const payload: WorshipFixedTeamMemberInput[] = selectedMembers.map(
        (member) => ({
          team_member_id: member.team_member_id,
          function_ids: member.function_ids,
        }),
      );

      if (isEditing && preset) {
        await worshipFixedTeamService.update(preset.id, name, payload);
        toast({ title: "Equipe padrão atualizada!" });
      } else {
        await worshipFixedTeamService.create(teamId, name, payload);
        toast({ title: "Equipe padrão criada!" });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar equipe padrão",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar equipe padrão" : "Nova equipe padrão"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label>Nome da equipe *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Equipe A-1"
              autoComplete="off"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-base font-semibold">
                Membros e funções
              </Label>
              <span className="text-xs text-muted-foreground">
                {selectedMembers.length} selecionado(s)
              </span>
            </div>

            {members.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Adicione membros na equipe de Louvor antes de criar uma equipe
                padrão.
              </div>
            ) : (
              <div className="space-y-2">
                {sortedMembers.map((member) => {
                  const selected = selectedMembers.find(
                    (item) => item.team_member_id === member.id,
                  );
                  const initial =
                    member.user?.nome?.charAt(0).toUpperCase() || "?";

                  return (
                    <div
                      key={member.id}
                      className={`rounded-lg border p-3 transition-colors ${
                        selected
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={!!selected}
                          onCheckedChange={() => toggleMember(member.id)}
                        />
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {selected ? <Check className="h-4 w-4" /> : initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {member.user?.nome}
                          </p>
                          {member.functions && member.functions.length > 0 && (
                            <p className="text-xs text-muted-foreground break-words">
                              Funções cadastradas:{" "}
                              {member.functions.map((fn) => fn.nome).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      {selected && (
                        <div className="mt-3 pl-0 sm:pl-12">
                          <p className="text-xs font-medium text-primary mb-2">
                            Função nesta equipe padrão
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {functions.map((fn) => {
                              const active = selected.function_ids.includes(
                                fn.id,
                              );
                              return (
                                <button
                                  key={fn.id}
                                  type="button"
                                  onClick={() =>
                                    toggleFunction(member.id, fn.id)
                                  }
                                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    active
                                      ? "border-primary/50 bg-primary/10 text-primary"
                                      : "border-border bg-background text-muted-foreground hover:bg-accent"
                                  }`}
                                >
                                  {active && <Check className="h-3 w-3" />}
                                  <Music className="h-3 w-3" />
                                  {fn.nome}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {" "}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving
              ? "Salvando..."
              : isEditing
                ? "Salvar alterações"
                : "Criar equipe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
