import { useEffect, useState, useRef } from "react";
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
} from "@/services/worshipFixedTeamService";
import { Music, Users, Plus, X, Search } from "lucide-react";

interface WorshipFixedTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  members: TeamMember[];
  functions: TeamFunction[];
  preset?: WorshipFixedTeam | null;
  onSuccess?: () => void;
}

// Cores e ícones das funções (mesmo padrão das escalas)
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
  Ministerial: "💃",
  Ballet: "🩰",
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

// ── Componente de seleção de membro para uma função ──────────────────────────
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
    .map((id) => allMembers.find((m) => m.id === id))
    .filter(Boolean) as TeamMember[];
  const available = allMembers.filter((m) => {
    if (assignedIds.includes(m.id)) return false;
    if (!query.trim()) return true;
    return (m.user?.nome || "").toLowerCase().includes(query.toLowerCase());
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const path = e.composedPath();
      const inTrigger = triggerRef.current && path.includes(triggerRef.current);
      const inDropdown =
        dropdownRef.current && path.includes(dropdownRef.current);
      if (!inTrigger && !inDropdown) handleClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 min-h-[2.25rem]">
        {assigned.map((member) => (
          <span
            key={member.id}
            className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-sm font-medium border ${style.pill}`}
          >
            <span className="w-5 h-5 rounded-full bg-primary-foreground/60 dark:bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {(member.user?.nome || "?").charAt(0).toUpperCase()}
            </span>
            {member.user?.nome}
            <button
              type="button"
              onClick={() => onRemove(member.id)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? handleClose() : handleOpen())}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border-2 border-dashed transition-all ${
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
          className="absolute left-0 top-full mt-1 z-[9999] w-64 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar membro..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {query ? "Nenhum resultado" : "Todos já adicionados"}
              </p>
            ) : (
              available.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    onAdd(member.id);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left hover:bg-accent"
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${style.bg} ${style.text}`}
                  >
                    {(member.user?.nome || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground block truncate">
                      {member.user?.nome}
                    </span>
                  </div>
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
  // Novo modelo: mapa de functionId -> [memberId, ...]
  const [assignments, setAssignments] = useState<Map<string, string[]>>(
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
      setAssignments(new Map());
      return;
    }

    // Converter preset.members para o novo formato
    const map = new Map<string, string[]>();
    preset.members.forEach((item) => {
      const current = map.get(item.function_id) || [];
      if (!current.includes(item.team_member_id)) {
        map.set(item.function_id, [...current, item.team_member_id]);
      }
    });
    setAssignments(map);
  }, [open, preset]);

  const addToFunction = (fnId: string, memberId: string) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      const current = next.get(fnId) || [];
      if (!current.includes(memberId)) next.set(fnId, [...current, memberId]);
      return next;
    });
  };

  const removeFromFunction = (fnId: string, memberId: string) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      const current = next.get(fnId) || [];
      const updated = current.filter((id) => id !== memberId);
      if (updated.length === 0) next.delete(fnId);
      else next.set(fnId, updated);
      return next;
    });
  };

  // Converte assignments para o formato WorshipFixedTeamMemberInput
  const buildMembersPayload = () => {
    const memberMap = new Map<string, string[]>();
    assignments.forEach((memberIds, fnId) => {
      memberIds.forEach((memberId) => {
        const current = memberMap.get(memberId) || [];
        if (!current.includes(fnId))
          memberMap.set(memberId, [...current, fnId]);
      });
    });
    return Array.from(memberMap.entries()).map(
      ([team_member_id, function_ids]) => ({
        team_member_id,
        function_ids,
      }),
    );
  };

  // Conta total de membros únicos escalados
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
      <DialogContent className="max-w-3xl sm:max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar equipe padrão" : "Nova equipe padrão"}
          </DialogTitle>
        </DialogHeader>

        <div
          data-dialog-body=""
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 sm:px-6 sm:space-y-5"
        >
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
                Membros por função Membros por função
              </Label>
              <span className="text-xs text-muted-foreground">
                {totalAssigned} membro(s) escalado(s)
              </span>
            </div>

            {members.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
                Adicione membros na equipe de Louvor antes de criar uma equipe
                padrão.
              </div>
            ) : functions.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                <Music className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Nenhuma função cadastrada para este tipo de equipe.
              </div>
            ) : (
              <div className="space-y-3">
                {functions.map((fn) => {
                  const style = getFunctionStyle(fn.nome);
                  const icon = FUNCTION_ICONS[fn.nome] || "🎵";
                  const assignedIds = assignments.get(fn.id) || [];

                  return (
                    <div
                      key={fn.id}
                      className={`rounded-xl border p-4 ${style.bg} ${style.border}`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg leading-none">{icon}</span>
                        <span className={`text-sm font-semibold ${style.text}`}>
                          {fn.nome}
                        </span>
                        {assignedIds.length > 0 && (
                          <span
                            className={`ml-auto text-xs px-2 py-0.5 rounded-full ${style.pill}`}
                          >
                            {assignedIds.length}
                          </span>
                        )}
                      </div>

                      <div className="relative">
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
