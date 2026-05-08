import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useUsers } from "@/hooks/useUsers";
import { teamService } from "@/services/teamService";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Team, TeamFunction } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { Crown, ChevronDown, ChevronUp, Music } from "lucide-react";

interface MemberState {
  userId: string;
  nome: string;
  functionIds: string[];
  expanded: boolean;
  isNew?: boolean;
  toRemove?: boolean;
}

interface EditTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  onSuccess?: () => void;
}

export function EditTeamModal({
  open,
  onOpenChange,
  team,
  onSuccess,
}: EditTeamModalProps) {
  const { toast } = useToast();
  const { data: allUsers, isLoading: loadingUsers } = useUsers();

  const [nome, setNome] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [members, setMembers] = useState<MemberState[]>([]);
  const [teamFunctions, setTeamFunctions] = useState<TeamFunction[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!team || !open) return;
    setNome(team.nome);
    setLeaderId(team.leader_id || "");

    // Carregar membros atuais com funções
    const currentMembers: MemberState[] = (team.members || []).map((m) => ({
      userId: m.user_id,
      nome: m.user?.nome || "",
      functionIds: (m.functions || []).map((f: any) => f.id),
      expanded: false,
    }));
    setMembers(currentMembers);

    // Carregar funções do tipo de equipe
    if ((team as any).team_type_id) {
      teamService
        .getTeamFunctions((team as any).team_type_id)
        .then(setTeamFunctions)
        .catch(() => {});
    }
  }, [team, open]);

  const toggleMember = (user: { id: string; nome: string }) => {
    const exists = members.find((m) => m.userId === user.id);
    if (exists) {
      if (user.id === leaderId) return; // Não pode remover o líder
      setMembers((prev) => prev.filter((m) => m.userId !== user.id));
    } else {
      setMembers((prev) => [
        ...prev,
        {
          userId: user.id,
          nome: user.nome,
          functionIds: [],
          expanded: false,
          isNew: true,
        },
      ]);
    }
  };

  const toggleFunction = (userId: string, fnId: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.userId !== userId) return m;
        const has = m.functionIds.includes(fnId);
        return {
          ...m,
          functionIds: has
            ? m.functionIds.filter((id) => id !== fnId)
            : [...m.functionIds, fnId],
        };
      }),
    );
  };

  const toggleExpand = (userId: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.userId === userId ? { ...m, expanded: !m.expanded } : m,
      ),
    );
  };

  // Garantir que o líder está sempre na lista
  useEffect(() => {
    if (!leaderId) return;
    const leaderUser = (allUsers as any[])?.find((u: any) => u.id === leaderId);
    if (!leaderUser) return;
    setMembers((prev) => {
      if (prev.find((m) => m.userId === leaderId)) return prev;
      return [
        ...prev,
        {
          userId: leaderId,
          nome: leaderUser.nome,
          functionIds: [],
          expanded: false,
          isNew: true,
        },
      ];
    });
  }, [leaderId]);

  const handleSave = async () => {
    if (!team) return;
    if (!nome.trim()) {
      toast({ variant: "destructive", title: "Nome obrigatório" });
      return;
    }
    if (!leaderId) {
      toast({ variant: "destructive", title: "Selecione um líder" });
      return;
    }

    try {
      setSaving(true);

      // 1. Atualizar nome e líder
      await teamService.updateTeam(team.id, { nome, leader_id: leaderId });

      // 2. Buscar membros atuais no banco
      const { data: currentTMs } = await (supabase as any)
        .from("team_members")
        .select("id, user_id")
        .eq("team_id", team.id);

      const currentUserIds = (currentTMs || []).map((tm: any) => tm.user_id);
      const newUserIds = members.map((m) => m.userId);

      // 3. Remover membros que saíram
      const toRemove = currentUserIds.filter(
        (id: string) => !newUserIds.includes(id),
      );
      for (const userId of toRemove) {
        const tm = currentTMs?.find((t: any) => t.user_id === userId);
        if (tm) {
          await (supabase as any)
            .from("team_member_functions")
            .delete()
            .eq("team_member_id", tm.id);
          await (supabase as any).from("team_members").delete().eq("id", tm.id);
        }
      }

      // 4. Adicionar novos membros
      const toAdd = newUserIds.filter((id) => !currentUserIds.includes(id));
      for (const userId of toAdd) {
        await (supabase as any)
          .from("team_members")
          .upsert(
            { team_id: team.id, user_id: userId, ativo: true },
            { onConflict: "team_id,user_id", ignoreDuplicates: true },
          );
      }

      // 5. Atualizar funções de todos os membros
      const { data: updatedTMs } = await (supabase as any)
        .from("team_members")
        .select("id, user_id")
        .eq("team_id", team.id);

      for (const member of members) {
        const tm = updatedTMs?.find((t: any) => t.user_id === member.userId);
        if (tm) {
          await teamService.updateMemberFunctions(tm.id, member.functionIds);
        }
      }

      toast({ title: "✅ Equipe atualizada com sucesso!" });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar equipe",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingUsers) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <LoadingSpinner />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ✏️ Editar Equipe
          </DialogTitle>
          <DialogDescription>
            Atualize os dados, membros e funções da equipe
          </DialogDescription>
        </DialogHeader>

        <div
          data-dialog-body=""
          className="space-y-4 px-4 py-4 sm:space-y-5 sm:px-5"
        >
          {/* Nome */}
          <div className="space-y-2">
            <Label>Nome da Equipe *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Líder */}
          <div className="space-y-2">
            <Label>Líder da Equipe *</Label>
            <Select value={leaderId} onValueChange={setLeaderId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o líder" />
              </SelectTrigger>
              <SelectContent>
                {(allUsers as any[])?.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Membros */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Membros</Label>
              <span className="text-xs text-muted-foreground">
                {members.length} selecionado(s)
              </span>
            </div>

            <div className="border rounded-2xl divide-y max-h-72 overflow-y-auto sm:rounded-lg">
              {(allUsers as any[])?.map((user: any) => {
                const isLeader = user.id === leaderId;
                const member = members.find((m) => m.userId === user.id);
                const isSelected = !!member;

                return (
                  <div
                    key={user.id}
                    className={`p-3 ${isLeader ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      {isLeader ? (
                        <div className="w-5 h-5 rounded bg-primary flex items-center justify-center flex-shrink-0">
                          <Crown className="h-3 w-3 text-primary-foreground" />
                        </div>
                      ) : (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleMember(user)}
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${isLeader ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                          >
                            {user.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">
                            {user.nome}
                          </span>
                          {isLeader && (
                            <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                              Líder
                            </span>
                          )}
                        </div>
                        {isSelected && member!.functionIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 ml-9">
                            {member!.functionIds.map((fId) => {
                              const fn = teamFunctions.find(
                                (f) => f.id === fId,
                              );
                              return fn ? (
                                <span
                                  key={fId}
                                  className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                                >
                                  {fn.nome}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                      {isSelected && teamFunctions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(user.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {member!.expanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {isSelected &&
                      member!.expanded &&
                      teamFunctions.length > 0 && (
                        <div className="mt-2 p-2 bg-muted rounded-xl sm:ml-10 sm:rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">
                            Funções:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {teamFunctions.map((fn) => (
                              <label
                                key={fn.id}
                                className="flex items-center gap-1.5 text-sm cursor-pointer"
                              >
                                <Checkbox
                                  checked={member!.functionIds.includes(fn.id)}
                                  onCheckedChange={() =>
                                    toggleFunction(user.id, fn.id)
                                  }
                                />
                                <span className="flex items-center gap-1">
                                  <Music className="h-3 w-3 text-primary" />
                                  {fn.nome}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
            {teamFunctions.length > 0 && (
              <p className="text-xs text-muted-foreground">
                💡 Clique na seta ▼ para atribuir funções ao membro
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
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
            className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
          >
            {saving ? "Salvando..." : "💾 Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
