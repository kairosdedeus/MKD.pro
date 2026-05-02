import { useState, useEffect, useRef } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { scheduleService } from "@/services/scheduleService";
import { teamService } from "@/services/teamService";
import { songService } from "@/services/songService";
import {
  worshipFixedTeamService,
  WorshipFixedTeam,
} from "@/services/worshipFixedTeamService";
import {
  ScheduleFormData,
  TeamMember,
  TeamFunction,
  Song,
  Schedule,
} from "@/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  X,
  Search,
  Music,
  GripVertical,
  UserPlus,
  Plus,
  Save,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface CreateScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  selectedDate?: string;
  initialFixedTeamId?: string | null;
  schedule?: Schedule | null;
  onSuccess?: () => void;
}

// Mapa: functionId -> array de team_member_ids atribuídos
type FunctionAssignments = Map<string, string[]>;

interface SelectedSong {
  song_id: string;
  song_name: string;
  artist?: string;
  original_key?: string;
  execution_key?: string;
  order_index: number;
  notes?: string;
}

const FUNCTION_COLORS: Record<
  string,
  { bg: string; text: string; border: string; pill: string }
> = {
  Vocal: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    pill: "bg-purple-100 text-purple-700 border-purple-300",
  },
  BackVocal: {
    bg: "bg-fuchsia-50",
    text: "text-fuchsia-700",
    border: "border-fuchsia-200",
    pill: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300",
  },
  Guitarra: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    pill: "bg-orange-100 text-orange-700 border-orange-300",
  },
  Baixo: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    pill: "bg-blue-100 text-blue-700 border-blue-300",
  },
  Bateria: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    pill: "bg-red-100 text-red-700 border-red-300",
  },
  Teclado: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    pill: "bg-green-100 text-green-700 border-green-300",
  },
  Projeção: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    pill: "bg-cyan-100 text-cyan-700 border-cyan-300",
  },
  Som: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    pill: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  Transmissão: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
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

function getFunctionStyle(nome: string) {
  return (
    FUNCTION_COLORS[nome] || {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      pill: "bg-gray-100 text-gray-700 border-gray-300",
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
  const ref = useRef<HTMLDivElement>(null);
  const style = getFunctionStyle(fn.nome);

  const assigned = assignedIds
    .map((id) => allMembers.find((m) => m.id === id))
    .filter(Boolean) as TeamMember[];
  const available = allMembers.filter((m) => {
    if (assignedIds.includes(m.id)) return false;
    if (!query.trim()) return true;
    return (m.user?.nome || "").toLowerCase().includes(query.toLowerCase());
  });

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {/* Chips dos membros atribuídos + botão adicionar */}
      <div className="flex flex-wrap items-center gap-2 min-h-[2.25rem]">
        {assigned.map((member) => (
          <span
            key={member.id}
            className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-sm font-medium border ${style.pill} group`}
          >
            <span className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {(member.user?.nome || "?").charAt(0).toUpperCase()}
            </span>
            {member.user?.nome}
            <button
              type="button"
              onClick={() => onRemove(member.id)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"
              aria-label={`Remover ${member.user?.nome}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Botão + adicionar */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border-2 border-dashed transition-all
            ${
              open
                ? `${style.bg} ${style.text} ${style.border} border-solid`
                : "border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600"
            }`}
        >
          <Plus className="h-3.5 w-3.5" />
          {assigned.length === 0 ? "Adicionar" : "Mais"}
        </button>
      </div>

      {/* Dropdown de busca */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar membro..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {available.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${style.bg} ${style.text}`}
                  >
                    {(member.user?.nome || "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {member.user?.nome}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────
export function CreateScheduleModal({
  open,
  onOpenChange,
  teamId,
  selectedDate,
  initialFixedTeamId,
  schedule,
  onSuccess,
}: CreateScheduleModalProps) {
  const { toast } = useToast();
  const isEditing = !!schedule;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Form fields
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(selectedDate || "");
  const [notes, setNotes] = useState("");

  // Data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamFunctions, setTeamFunctions] = useState<TeamFunction[]>([]);
  const [fixedTeams, setFixedTeams] = useState<WorshipFixedTeam[]>([]);

  // Novo modelo: mapa de functionId -> [memberId, ...]
  const [assignments, setAssignments] = useState<FunctionAssignments>(
    new Map(),
  );

  // Songs
  const [selectedSongs, setSelectedSongs] = useState<SelectedSong[]>([]);
  const [songSearchQuery, setSongSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [showNoResults, setShowNoResults] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickSongName, setQuickSongName] = useState("");
  const [quickSongArtist, setQuickSongArtist] = useState("");
  const [quickSongKey, setQuickSongKey] = useState("");
  const [savingQuickSong, setSavingQuickSong] = useState(false);

  // UI
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dateConflict, setDateConflict] = useState(false);
  const [showFixedTeamForm, setShowFixedTeamForm] = useState(false);
  const [fixedTeamName, setFixedTeamName] = useState("");
  const [savingFixedTeam, setSavingFixedTeam] = useState(false);

  useEffect(() => {
    if (open) loadData();
    else resetForm();
  }, [open, teamId]);

  // Preencher ao editar
  useEffect(() => {
    if (schedule && open && teamFunctions.length > 0) {
      setTitle(schedule.title || "");
      setDate(schedule.date);
      setNotes(schedule.notes || "");

      if (schedule.members) {
        const map: FunctionAssignments = new Map();
        schedule.members.forEach((m) => {
          const fns = (m.functions || []) as any[];
          fns.forEach((f) => {
            const fnId = f.id || f.function_id;
            if (!fnId) return;
            const current = map.get(fnId) || [];
            if (!current.includes(m.team_member_id)) {
              map.set(fnId, [...current, m.team_member_id]);
            }
          });
        });
        setAssignments(map);
      }

      if (schedule.songs) {
        setSelectedSongs(
          schedule.songs
            .sort((a, b) => a.order_index - b.order_index)
            .map((s) => ({
              song_id: s.song_id,
              song_name: s.song?.name || "",
              artist: s.song?.artist || undefined,
              original_key: s.song?.original_key || undefined,
              execution_key: s.execution_key || undefined,
              order_index: s.order_index,
            })),
        );
      }
    }
  }, [schedule, open, teamFunctions]);

  useEffect(() => {
    if (selectedDate && !schedule) setDate(selectedDate);
  }, [selectedDate, schedule]);

  useEffect(() => {
    if (!date || isEditing || !teamId) {
      setDateConflict(false);
      return;
    }
    scheduleService
      .getScheduleByDate(teamId, date)
      .then((existing) => setDateConflict(!!existing))
      .catch(() => setDateConflict(false));
  }, [date, teamId, isEditing]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [members, team, presets] = await Promise.all([
        teamService.getTeamMembers(teamId),
        teamService.getTeamById(teamId),
        worshipFixedTeamService.getByTeamId(teamId),
      ]);
      setTeamMembers(members);
      setFixedTeams(presets);

      let teamFns: TeamFunction[] = [];
      if (team?.team_type_id) {
        teamFns = await teamService.getTeamFunctions(team.team_type_id);
        setTeamFunctions(teamFns);
      }

      // Aplicar equipe fixa inicial (modo criação)
      if (initialFixedTeamId && !schedule) {
        const preset = presets.find((p) => p.id === initialFixedTeamId);
        if (preset) applyPreset(preset, members);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDate(selectedDate || "");
    setNotes("");
    setAssignments(new Map());
    setSelectedSongs([]);
    setSongSearchQuery("");
    setSearchResults([]);
    setShowNoResults(false);
    setShowQuickCreate(false);
    setQuickSongName("");
    setQuickSongArtist("");
    setQuickSongKey("");
    setShowFixedTeamForm(false);
    setFixedTeamName("");
  };

  // ── Assignments ───────────────────────────────────────────────────────────

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

  // Converte assignments para o formato ScheduleFormData.members
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

  // ── Equipes fixas ─────────────────────────────────────────────────────────

  const applyPreset = (preset: WorshipFixedTeam, members?: TeamMember[]) => {
    const memberList = members || teamMembers;

    // Criar mapa com os membros da equipe fixa
    const presetMap: FunctionAssignments = new Map();
    preset.members.forEach((item) => {
      const member = memberList.find((m) => m.id === item.team_member_id);
      if (!member) return;
      const current = presetMap.get(item.function_id) || [];
      if (!current.includes(item.team_member_id)) {
        presetMap.set(item.function_id, [...current, item.team_member_id]);
      }
    });

    if (presetMap.size === 0) {
      toast({
        variant: "destructive",
        title: "Equipe fixa sem membros encontrados",
        description: "Confira se os membros estão cadastrados na equipe.",
      });
      return;
    }

    // Fazer merge: manter funções que não estão na equipe fixa
    // e substituir apenas as funções que existem na equipe fixa
    setAssignments((prevAssignments) => {
      const mergedMap = new Map(prevAssignments);

      // Para cada função na equipe fixa, substituir na escala atual
      presetMap.forEach((memberIds, functionId) => {
        mergedMap.set(functionId, memberIds);
      });

      return mergedMap;
    });

    setTitle(preset.nome);

    // Mensagem informativa sobre o merge
    const functionsUpdated = Array.from(presetMap.keys())
      .map((fnId) => teamFunctions.find((f) => f.id === fnId)?.nome)
      .filter(Boolean)
      .join(", ");

    toast({
      title: `${preset.nome} aplicada`,
      description: functionsUpdated
        ? `Funções atualizadas: ${functionsUpdated}`
        : undefined,
    });
  };

  const handleSaveFixedTeam = async () => {
    if (!fixedTeamName.trim()) {
      toast({ variant: "destructive", title: "Informe o nome da equipe fixa" });
      return;
    }
    const members = buildMembersPayload();
    if (members.length === 0) {
      toast({
        variant: "destructive",
        title: "Adicione membros antes de salvar",
      });
      return;
    }
    if (members.some((m) => m.function_ids.length === 0)) {
      toast({
        variant: "destructive",
        title: "Todos os membros precisam ter função",
      });
      return;
    }
    try {
      setSavingFixedTeam(true);
      await worshipFixedTeamService.create(teamId, fixedTeamName, members);
      const presets = await worshipFixedTeamService.getByTeamId(teamId);
      setFixedTeams(presets);
      setShowFixedTeamForm(false);
      setFixedTeamName("");
      toast({ title: "Equipe fixa salva!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar equipe fixa",
        description: error.message,
      });
    } finally {
      setSavingFixedTeam(false);
    }
  };

  // ── Músicas ───────────────────────────────────────────────────────────────

  const handleSearchSongs = async (query: string) => {
    setSongSearchQuery(query);
    setShowQuickCreate(false);
    setShowNoResults(false);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await songService.searchSongs(query);
      setSearchResults(results);
      setShowNoResults(results.length === 0);
    } catch {
      setSearchResults([]);
    }
  };

  const addSong = (song: Song) => {
    if (selectedSongs.find((s) => s.song_id === song.id)) {
      toast({ title: "Música já adicionada" });
      return;
    }
    setSelectedSongs((prev) => [
      ...prev,
      {
        song_id: song.id,
        song_name: song.name,
        artist: song.artist || undefined,
        original_key: song.original_key || undefined,
        execution_key: song.original_key || undefined,
        order_index: prev.length,
      },
    ]);
    setSongSearchQuery("");
    setSearchResults([]);
    setShowNoResults(false);
    setShowQuickCreate(false);
  };

  const handleQuickCreateSong = async () => {
    if (!quickSongName.trim()) {
      toast({ variant: "destructive", title: "Nome da música é obrigatório" });
      return;
    }
    try {
      setSavingQuickSong(true);
      const newSong = await songService.createSong({
        name: quickSongName.trim(),
        artist: quickSongArtist.trim() || undefined,
        original_key: quickSongKey.trim() || undefined,
        has_virtual_instruments: false,
      });
      addSong(newSong);
      toast({ title: `🎵 "${newSong.name}" criada e adicionada!` });
      setQuickSongName("");
      setQuickSongArtist("");
      setQuickSongKey("");
      setShowQuickCreate(false);
      setSongSearchQuery("");
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao criar música" });
    } finally {
      setSavingQuickSong(false);
    }
  };

  const removeSong = (songId: string) =>
    setSelectedSongs((prev) => prev.filter((s) => s.song_id !== songId));

  const updateSongKey = (songId: string, key: string) =>
    setSelectedSongs((prev) =>
      prev.map((s) =>
        s.song_id === songId ? { ...s, execution_key: key } : s,
      ),
    );

  const handleDragStart = (index: number) => setDragIndex(index);
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
    setSelectedSongs((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, moved);
      return updated.map((s, i) => ({ ...s, order_index: i }));
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!date) {
      toast({ variant: "destructive", title: "Data obrigatória" });
      return;
    }
    const members = buildMembersPayload();
    if (members.length === 0) {
      toast({ variant: "destructive", title: "Adicione pelo menos um membro" });
      return;
    }
    try {
      setLoading(true);
      if (!isEditing) {
        const existing = await scheduleService.getScheduleByDate(teamId, date);
        if (existing) {
          toast({
            variant: "destructive",
            title: "⚠️ Já existe uma escala nesta data",
            description: `A escala "${existing.title || format(parseISO(existing.date), "dd/MM/yyyy")}" já foi criada para este dia.`,
          });
          setLoading(false);
          return;
        }
      }

      const formData: ScheduleFormData = {
        team_id: teamId,
        date,
        title: title || undefined,
        notes: notes || undefined,
        status: "published",
        members,
        songs: selectedSongs.map((s) => ({
          song_id: s.song_id,
          execution_key: s.execution_key,
          order_index: s.order_index,
        })),
      };

      if (isEditing && schedule) {
        await scheduleService.updateSchedule(schedule.id, formData);
        toast({ title: "✅ Escala atualizada!" });
      } else {
        await scheduleService.createSchedule(formData);
        toast({ title: "✅ Escala criada!" });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar escala",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">
            {isEditing ? "✏️ Editar Escala" : "🎵 Nova Escala"}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="px-6 py-5 space-y-6">
            {/* ── Informações básicas ── */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={
                    dateConflict
                      ? "border-red-400 focus-visible:ring-red-400"
                      : ""
                  }
                />
                {dateConflict && (
                  <p className="text-xs text-red-600">
                    ⚠️ Já existe uma escala nesta data.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações gerais sobre a escala..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* ── Equipes fixas ── */}
            <div className="space-y-3 rounded-xl border border-purple-200 bg-purple-50/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Label className="text-base font-semibold">
                    Equipes fixas
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Clique para preencher automaticamente as funções.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFixedTeamForm((prev) => !prev)}
                  className="gap-2 bg-white w-full sm:w-auto"
                >
                  <Save className="h-4 w-4" />
                  Salvar atual
                </Button>
              </div>

              {fixedTeams.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {fixedTeams.map((preset) => (
                    <Button
                      key={preset.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="bg-white hover:bg-purple-100 max-w-full whitespace-normal text-left"
                    >
                      {preset.nome}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-white/70 p-3 text-sm text-gray-500">
                  Nenhuma equipe fixa cadastrada.
                </div>
              )}

              {showFixedTeamForm && (
                <div className="space-y-2 rounded-lg border bg-white p-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Nome da equipe padrão *
                    </Label>
                    <Input
                      placeholder="Ex: Equipe D-1"
                      value={fixedTeamName}
                      onChange={(e) => setFixedTeamName(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleSaveFixedTeam}
                    disabled={savingFixedTeam}
                    className="bg-purple-600 hover:bg-purple-700 w-full"
                  >
                    {savingFixedTeam ? "Salvando..." : "Salvar equipe padrão"}
                  </Button>
                </div>
              )}
            </div>

            {/* ── Membros por Função ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  👥 Membros da Escala
                </Label>
                {totalAssigned > 0 && (
                  <span className="text-sm text-gray-400">
                    {totalAssigned} membro{totalAssigned !== 1 ? "s" : ""}{" "}
                    escalado{totalAssigned !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {teamFunctions.length === 0 ? (
                <div className="border-2 border-dashed rounded-xl p-6 text-center text-gray-400">
                  <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">
                    Nenhuma função cadastrada para esta equipe
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                  {teamFunctions
                    .slice()
                    .sort((a, b) => {
                      // Ordem: Vocal (0), BackVocal (1), demais (2+)
                      const getPriority = (nome: string) => {
                        if (nome === "Vocal") return 0;
                        if (nome === "BackVocal") return 1;
                        return 2;
                      };
                      const priorityA = getPriority(a.nome);
                      const priorityB = getPriority(b.nome);
                      if (priorityA !== priorityB) return priorityA - priorityB;
                      // Mesma prioridade: ordem alfabética
                      return a.nome.localeCompare(b.nome);
                    })
                    .map((fn) => {
                      const style = getFunctionStyle(fn.nome);
                      const icon = FUNCTION_ICONS[fn.nome] || "🎵";
                      const assignedIds = assignments.get(fn.id) || [];
                      const isEmpty = assignedIds.length === 0;

                      return (
                        <div
                          key={fn.id}
                          className={`flex items-start gap-4 px-4 py-3 transition-colors ${
                            isEmpty ? "bg-white" : style.bg
                          }`}
                        >
                          {/* Função label */}
                          <div className="flex items-center gap-2 w-32 flex-shrink-0 pt-1">
                            <span className="text-base leading-none">
                              {icon}
                            </span>
                            <span
                              className={`text-sm font-semibold ${isEmpty ? "text-gray-500" : style.text}`}
                            >
                              {fn.nome}
                            </span>
                          </div>

                          {/* Picker de membros */}
                          <div className="flex-1 min-w-0">
                            <MemberPicker
                              fn={fn}
                              assignedIds={assignedIds}
                              allMembers={teamMembers}
                              onAdd={(memberId) =>
                                addToFunction(fn.id, memberId)
                              }
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

            {/* ── Músicas ── */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">🎵 Músicas</Label>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar músicas por nome ou artista..."
                  value={songSearchQuery}
                  onChange={(e) => handleSearchSongs(e.target.value)}
                  className="pl-9"
                  autoComplete="off"
                />

                {searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((song) => (
                      <button
                        key={song.id}
                        type="button"
                        onClick={() => addSong(song)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Music className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {song.name}
                          </p>
                          {song.artist && (
                            <p className="text-xs text-gray-400 truncate">
                              {song.artist}
                            </p>
                          )}
                        </div>
                        {song.original_key && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">
                            {song.original_key}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {showNoResults && !showQuickCreate && (
                  <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-lg">
                    <div className="px-4 py-3 text-center">
                      <p className="text-sm text-gray-500 mb-2">
                        Nenhuma música encontrada para{" "}
                        <strong>"{songSearchQuery}"</strong>
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 gap-2"
                        onClick={() => {
                          setQuickSongName(songSearchQuery);
                          setShowQuickCreate(true);
                          setShowNoResults(false);
                          setSearchResults([]);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Criar "{songSearchQuery}"
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {showQuickCreate && (
                <div className="border-2 border-purple-300 rounded-xl p-4 bg-purple-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Criar nova música
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickCreate(false);
                        setSongSearchQuery("");
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome da Música *</Label>
                      <Input
                        placeholder="Ex: Oceans"
                        value={quickSongName}
                        onChange={(e) => setQuickSongName(e.target.value)}
                        autoComplete="off"
                        className="bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Artista / Banda</Label>
                        <Input
                          placeholder="Ex: Hillsong"
                          value={quickSongArtist}
                          onChange={(e) => setQuickSongArtist(e.target.value)}
                          autoComplete="off"
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tom Original</Label>
                        <Input
                          placeholder="Ex: A, Bb, C#"
                          value={quickSongKey}
                          onChange={(e) => setQuickSongKey(e.target.value)}
                          autoComplete="off"
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowQuickCreate(false);
                        setSongSearchQuery("");
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleQuickCreateSong}
                      disabled={savingQuickSong || !quickSongName.trim()}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {savingQuickSong ? "Criando..." : "✅ Criar e Adicionar"}
                    </Button>
                  </div>
                </div>
              )}

              {selectedSongs.length > 0 ? (
                <div className="border rounded-xl divide-y overflow-hidden">
                  {selectedSongs.map((song, index) => (
                    <div
                      key={song.song_id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 bg-white transition-all cursor-grab active:cursor-grabbing ${
                        dragOverIndex === index && dragIndex !== index
                          ? "border-t-2 border-purple-400 bg-purple-50"
                          : "hover:bg-gray-50"
                      } ${dragIndex === index ? "opacity-40" : ""}`}
                    >
                      <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {song.song_name}
                        </p>
                        {song.artist && (
                          <p className="text-xs text-gray-400 truncate">
                            {song.artist}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {song.original_key && (
                          <span className="text-xs text-gray-400">
                            Original: <strong>{song.original_key}</strong>
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Tom:</span>
                          <Input
                            value={song.execution_key || ""}
                            onChange={(e) =>
                              updateSongKey(song.song_id, e.target.value)
                            }
                            className="w-16 h-7 text-xs text-center px-1"
                            placeholder="C"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSong(song.song_id)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-xl p-4 text-center text-gray-400">
                  <Music className="h-6 w-6 mx-auto mb-1 opacity-40" />
                  <p className="text-sm">Busque e adicione músicas acima</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-gray-50 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || loadingData || (!isEditing && dateConflict)}
            className="bg-purple-600 hover:bg-purple-700 min-w-[140px]"
          >
            {loading
              ? "Salvando..."
              : isEditing
                ? "💾 Salvar Alterações"
                : "✅ Criar Escala"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
