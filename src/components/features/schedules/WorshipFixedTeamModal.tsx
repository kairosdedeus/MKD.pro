import { useEffect, useRef, useState } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { TeamFunction, TeamMember } from "@/types";
import {
  worshipFixedTeamService,
  WorshipFixedTeam,
  WorshipFixedTeamMemberInput,
} from "@/services/worshipFixedTeamService";
import { Music, Plus, Search, UserPlus, Users, X } from "lucide-react";

interface WorshipFixedTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  members: TeamMember[];
  functions: TeamFunction[];
  preset?: WorshipFixedTeam | null;
  onSuccess?: () => void;
}

type FunctionAssignments = Map<string, string[]>;

const FUNCTION_COLORS: Record<
  string,
  { bg: string; text: string; border: string; pill: string }
> = {
  Vocal: {
    bg: "bg-primary/5",
    text: "text-primary",
    border: "border-primary/20",
    pill: "bg-primary/10 text-primary border-primary/30",
  },
  BackVocal: {
    bg: "bg-primary/5",
    text: "text-primary",
    border: "border-primary/20",
    pill: "bg-primary/10 text-primary border-primary/30",
  },
  Guitarra: {
    bg: "bg-orange-500/5",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/20",
    pill: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  },
  Baixo: {
    bg: "bg-blue-500/5",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  Bateria: {
    bg: "bg-destructive/5",
    text: "text-destructive",
    border: "border-destructive/20",
    pill: "bg-destructive/10 text-destructive border-destructive/30",
  },
  Teclado: {
    bg: "bg-emerald-500/5",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  Teclado2: {
    bg: "bg-emerald-500/5",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  Projeção: {
    bg: "bg-cyan-500/5",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/20",
    pill: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  },
  Som: {
    bg: "bg-yellow-500/5",
    text: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-500/20",
    pill: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  },
  Transmissão: {
    bg: "bg-pink-500/5",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-500/20",
    pill: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30",
  },
  Ministerial: {
    bg: "bg-violet-500/5",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20",
    pill: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30",
  },
  Ballet: {
    bg: "bg-rose-500/5",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20",
    pill: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
};

function getFunctionStyle(nome: string) {
  return (
    FUNCTION_COLORS[nome] || {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border",
      pill: "bg-muted text-muted-foreground border-border",
    }
  );
}

function sortFunctions(functions: TeamFunction[]) {
  return functions.slice().sort((a, b) => {
    const getPriority = (nome: string) => {
      if (nome === "Vocal") return 0;
      if (nome === "BackVocal") return 1;
      return 2;
    };
    const priorityA = getPriority(a.nome);
    const priorityB = getPriority(b.nome);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
  });
}

interface MemberPickerProps {
  fn: TeamFunction;
  assignedIds: string[];
  allMembers: TeamMember[];
  onAdd: (memberId: string) => void;
  onRemove: (memberId: string) => void;
}

function MemberPicker({
  fn,
  assignedIds,
  allMembers,
  onAdd,
  onRemove,
}: MemberPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const style = getFunctionStyle(fn.nome);

  const assigned = assignedIds
    .map((id) => allMembers.find((member) => member.id === id))
    .filter(Boolean) as TeamMember[];

  const available = allMembers.filter((member) => {
    if (assignedIds.includes(member.id)) return false;
    if (!query.trim()) return true;
    return (member.user?.nome || "")
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!open) return;

    const handler = (event: MouseEvent) => {
      const path = event.composedPath();
      const inTrigger =
        triggerRef.current && path.includes(triggerRef.current);
      const inDropdown =
        dropdownRef.current && path.includes(dropdownRef.current);

      if (!inTrigger && !inDropdown) handleClose();
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <div className="flex min-h-[2.25rem] flex-wrap items-center gap-2">
        {assigned.map((member) => (
          <span
            key={member.id}
            className={`inline-flex max-w-full items-center gap-1.5 rounded-full border py-1 pl-2.5 pr-1.5 text-sm font-medium ${style.pill}`}
          >
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-foreground/60 text-xs font-bold dark:bg-white/20">
              {(member.user?.nome || "?").charAt(0).toUpperCase()}
            </span>
            <span className="truncate">{member.user?.nome}</span>
            <button
              type="button"
              onClick={() => onRemove(member.id)}
              className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/10"
              aria-label={`Remover ${member.user?.nome || "membro"}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? handleClose() : setOpen(true))}
          className={`inline-flex items-center gap-1.5 rounded-full border-2 border-dashed px-3 py-1 text-sm transition-all ${
            open
              ? `${style.bg} ${style.text} ${style.border} border-solid`
              : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          {assigned.length === 0 ? "Adicionar" : "Mais"}
        </button>
      </div>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full z-[9999] mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:w-64"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar membro..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-lg border border-border py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {available.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {query ? "Nenhum resultado" : "Todos já adicionados"}
              </p>
            ) : (
              available.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    onAdd(member.id);
                    handleClose();
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent"
                >
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${style.bg} ${style.text}`}
                  >
                    {(member.user?.nome || "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="block flex-1 truncate text-sm font-medium text-foreground">
                    {member.user?.nome}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
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
  const [assignments, setAssignments] = useState<FunctionAssignments>(
    new Map(),
  );
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
      setAssignments(new Map());
      return;
    }

    const mappedAssignments: FunctionAssignments = new Map();
    preset.members.forEach((item) => {
      const current = mappedAssignments.get(item.function_id) || [];
      if (!current.includes(item.team_member_id)) {
        mappedAssignments.set(item.function_id, [
          ...current,
          item.team_member_id,
        ]);
      }
    });
    setAssignments(mappedAssignments);
  }, [open, preset]);

  const addToFunction = (functionId: string, memberId: string) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      const current = next.get(functionId) || [];
      if (!current.includes(memberId)) {
        next.set(functionId, [...current, memberId]);
      }
      return next;
    });
  };

  const removeFromFunction = (functionId: string, memberId: string) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      const current = next.get(functionId) || [];
      const updated = current.filter((id) => id !== memberId);
      if (updated.length === 0) next.delete(functionId);
      else next.set(functionId, updated);
      return next;
    });
  };

  const buildMembersPayload = (): WorshipFixedTeamMemberInput[] => {
    const memberMap = new Map<string, string[]>();
    assignments.forEach((memberIds, functionId) => {
      memberIds.forEach((memberId) => {
        const current = memberMap.get(memberId) || [];
        if (!current.includes(functionId)) {
          memberMap.set(memberId, [...current, functionId]);
        }
      });
    });

    return Array.from(memberMap.entries()).map(
      ([team_member_id, function_ids]) => ({
        team_member_id,
        function_ids,
      }),
    );
  };

  const totalAssigned = new Set(Array.from(assignments.values()).flat()).size;

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Informe o nome da equipe padrão",
      });
      return;
    }

    const payload = buildMembersPayload();

    if (payload.length === 0) {
      toast({
        variant: "destructive",
        title: "Selecione pelo menos um membro",
      });
      return;
    }

    const membersWithoutFunction = payload.filter(
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
                Membros por função
              </Label>
              {totalAssigned > 0 && (
                <span className="text-xs text-muted-foreground">
                  {totalAssigned} membro{totalAssigned !== 1 ? "s" : ""}{" "}
                  selecionado{totalAssigned !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {members.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
                Adicione membros na equipe de Louvor antes de criar uma equipe
                padrão.
              </div>
            ) : functions.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                <UserPlus className="mx-auto mb-2 h-8 w-8 opacity-40" />
                Nenhuma função cadastrada para esta equipe.
              </div>
            ) : (
              <div className="rounded-xl border border-border divide-y divide-border [&>*:first-child]:rounded-t-xl [&>*:last-child]:rounded-b-xl">
                {sortFunctions(functions).map((fn) => {
                  const style = getFunctionStyle(fn.nome);
                  const assignedIds = assignments.get(fn.id) || [];
                  const isEmpty = assignedIds.length === 0;

                  return (
                    <div
                      key={fn.id}
                      className={`flex flex-col gap-3 px-4 py-3 transition-colors sm:flex-row sm:items-start ${
                        isEmpty ? "bg-background" : style.bg
                      }`}
                    >
                      <div className="flex items-center gap-2 pt-1 sm:w-32 sm:flex-shrink-0">
                        <Music
                          className={`h-4 w-4 flex-shrink-0 ${
                            isEmpty ? "text-muted-foreground" : style.text
                          }`}
                        />
                        <span
                          className={`text-sm font-semibold ${
                            isEmpty ? "text-muted-foreground" : style.text
                          }`}
                        >
                          {fn.nome}
                        </span>
                      </div>

                      <div className="relative min-w-0 flex-1">
                        <MemberPicker
                          fn={fn}
                          assignedIds={assignedIds}
                          allMembers={sortedMembers}
                          onAdd={(memberId) => addToFunction(fn.id, memberId)}
                          onRemove={(memberId) =>
                            removeFromFunction(fn.id, memberId)
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
