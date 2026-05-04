import { useState, useEffect } from "react";
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
import { useCreateTeam, useTeamTypes } from "@/hooks/useTeams";
import { useUsers } from "@/hooks/useUsers";
import { teamService } from "@/services/teamService";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { TeamFunction } from "@/types";
import { Music, Users, ChevronDown, ChevronUp } from "lucide-react";

interface MemberWithFunctions {
  userId: string;
  nome: string;
  functionIds: string[];
  expanded: boolean;
}

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MINISTRY_COLORS: Record<string, string> = {
  louvor: "text-purple-700 bg-purple-50 border-purple-200",
  danca: "text-pink-700 bg-pink-50 border-pink-200",
  midia: "text-blue-700 bg-blue-50 border-blue-200",
  obreiros: "text-green-700 bg-green-50 border-green-200",
  celula: "text-orange-700 bg-orange-50 border-orange-200",
};

export function CreateTeamModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateTeamModalProps) {
  const { toast } = useToast();
  const { data: teamTypes, isLoading: loadingTypes } = useTeamTypes();
  const { data: users, isLoading: loadingUsers } = useUsers();
  const createTeam = useCreateTeam();

  const [nome, setNome] = useState("");
  const [teamTypeId, setTeamTypeId] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [members, setMembers] = useState<MemberWithFunctions[]>([]);
  const [teamFunctions, setTeamFunctions] = useState<TeamFunction[]>([]);
  const [loadingFunctions, setLoadingFunctions] = useState(false);

  const selectedType = teamTypes?.find((t) => t.id === teamTypeId);

  // Carregar funções quando o tipo de equipe mudar
  useEffect(() => {
    if (!teamTypeId) {
      setTeamFunctions([]);
      return;
    }
    loadFunctions(teamTypeId);
  }, [teamTypeId]);

  // Quando o líder muda, garantir que ele está na lista de membros
  useEffect(() => {
    if (!leaderId) return;
    const leaderUser = users?.find((u) => u.id === leaderId);
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
        },
      ];
    });
  }, [leaderId, users]);

  // Resetar ao fechar
  useEffect(() => {
    if (!open) {
      setNome("");
      setTeamTypeId("");
      setLeaderId("");
      setMembers([]);
      setTeamFunctions([]);
    }
  }, [open]);

  const loadFunctions = async (typeId: string) => {
    try {
      setLoadingFunctions(true);
      const fns = await teamService.getTeamFunctions(typeId);
      setTeamFunctions(fns);
    } catch {
      setTeamFunctions([]);
    } finally {
      setLoadingFunctions(false);
    }
  };

  const toggleMember = (user: { id: string; nome: string }) => {
    const exists = members.find((m) => m.userId === user.id);
    if (exists) {
      setMembers(members.filter((m) => m.userId !== user.id));
    } else {
      setMembers([
        ...members,
        { userId: user.id, nome: user.nome, functionIds: [], expanded: false },
      ]);
    }
  };

  const toggleMemberFunction = (userId: string, fnId: string) => {
    setMembers(
      members.map((m) => {
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
    setMembers(
      members.map((m) =>
        m.userId === userId ? { ...m, expanded: !m.expanded } : m,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!nome.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Informe o nome da equipe.",
      });
      return;
    }
    if (!teamTypeId) {
      toast({
        variant: "destructive",
        title: "Tipo obrigatório",
        description: "Selecione o tipo de equipe.",
      });
      return;
    }
    try {
      const team = await createTeam.mutateAsync({
        nome,
        team_type_id: teamTypeId,
        leader_id: leaderId || null,
        member_ids: members.map((m) => m.userId),
      });

      // Atribuir funções aos membros
      if (
        teamFunctions.length > 0 &&
        members.some((m) => m.functionIds.length > 0)
      ) {
        // Buscar os team_members criados
        const { data: teamMembers } = await import("@/lib/supabaseClient").then(
          ({ supabase }) =>
            supabase
              .from("team_members")
              .select("id, user_id")
              .eq("team_id", team.id),
        );

        if (teamMembers) {
          for (const member of members) {
            if (member.functionIds.length === 0) continue;
            const tm = teamMembers.find(
              (tm: any) => tm.user_id === member.userId,
            );
            if (tm) {
              await teamService.updateMemberFunctions(
                tm.id,
                member.functionIds,
              );
            }
          }
        }
      }

      toast({
        title: "Equipe criada!",
        description: `A equipe "${nome}" foi criada com sucesso.`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar equipe",
        description: error.message || "Tente novamente mais tarde.",
      });
    }
  };

  const colorClass = selectedType
    ? MINISTRY_COLORS[selectedType.codigo] || ""
    : "";

  if (loadingTypes || loadingUsers) {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nova Equipe
          </DialogTitle>
          <DialogDescription>
            Crie uma equipe e adicione membros com suas funções
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Equipe *</Label>
            <Input
              id="nome"
              placeholder="Ex: Equipe Principal de Louvor"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Tipo de equipe */}
          <div className="space-y-2">
            <Label>Tipo de Equipe *</Label>
            <Select value={teamTypeId} onValueChange={setTeamTypeId}>
              <SelectTrigger className={teamTypeId ? colorClass : ""}>
                <SelectValue placeholder="Selecione o ministério" />
              </SelectTrigger>
              <SelectContent>
                {teamTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <span className="flex items-center gap-2">{type.nome}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Líder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Líder da Equipe</Label>
              {leaderId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={() => setLeaderId("")}
                >
                  Remover líder
                </Button>
              )}
            </div>
            <Select value={leaderId} onValueChange={setLeaderId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o líder (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
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
              <Label>Membros da Equipe</Label>
              <span className="text-xs text-gray-400">
                {members.length} selecionado(s)
              </span>
            </div>

            <div className="border rounded-lg divide-y max-h-72 overflow-y-auto">
              {users?.map((user) => {
                const isLeader = user.id === leaderId;
                const member = members.find((m) => m.userId === user.id);
                // Líder é sempre incluído automaticamente
                const isSelected = isLeader || !!member;

                return (
                  <div
                    key={user.id}
                    className={`p-3 ${isLeader ? "bg-purple-50" : ""}`}
                  >
                    {/* Linha do membro */}
                    <div className="flex items-center gap-3">
                      {isLeader ? (
                        // Líder: sempre selecionado, não pode desmarcar
                        <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
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
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${isLeader ? "bg-purple-200 text-purple-700" : "bg-gray-200 text-gray-600"}`}
                          >
                            {user.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">
                            {user.nome}
                          </span>
                          {isLeader && (
                            <span className="text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded-full">
                              Líder
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Funções selecionadas (resumo) */}
                      {isSelected &&
                        (isLeader
                          ? members.find((m) => m.userId === user.id)
                          : member
                        )?.functionIds?.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {(isLeader
                              ? members.find((m) => m.userId === user.id)
                              : member)!.functionIds.map((fId) => {
                              const fn = teamFunctions.find(
                                (f) => f.id === fId,
                              );
                              return fn ? (
                                <span
                                  key={fId}
                                  className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded"
                                >
                                  {fn.nome}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}

                      {/* Botão expandir funções */}
                      {isSelected && teamFunctions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(user.id)}
                          className="text-gray-400 hover:text-gray-600 ml-1"
                        >
                          {(isLeader
                            ? members.find((m) => m.userId === user.id)
                            : member
                          )?.expanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Funções expandidas */}
                    {isSelected &&
                      (isLeader
                        ? members.find((m) => m.userId === user.id)
                        : member
                      )?.expanded &&
                      teamFunctions.length > 0 && (
                        <div className="mt-2 ml-10 p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-2">Funções:</p>
                          <div className="flex flex-wrap gap-2">
                            {loadingFunctions ? (
                              <span className="text-xs text-gray-400">
                                Carregando...
                              </span>
                            ) : (
                              teamFunctions.map((fn) => (
                                <label
                                  key={fn.id}
                                  className="flex items-center gap-1.5 text-sm cursor-pointer"
                                >
                                  <Checkbox
                                    checked={(isLeader
                                      ? members.find(
                                          (m) => m.userId === user.id,
                                        )
                                      : member
                                    )?.functionIds.includes(fn.id)}
                                    onCheckedChange={() =>
                                      toggleMemberFunction(user.id, fn.id)
                                    }
                                  />
                                  <span className="flex items-center gap-1">
                                    <Music className="h-3 w-3 text-purple-500" />
                                    {fn.nome}
                                  </span>
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}

              {!users?.length && (
                <div className="p-4 text-center text-sm text-gray-400">
                  Nenhum usuário disponível. Crie usuários primeiro.
                </div>
              )}
            </div>

            {teamFunctions.length > 0 && (
              <p className="text-xs text-gray-400">
                💡 Clique na seta ▼ ao lado do membro para atribuir funções. Se
                houver líder, ele será adicionado automaticamente.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createTeam.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {createTeam.isPending ? "Criando..." : "Criar Equipe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
