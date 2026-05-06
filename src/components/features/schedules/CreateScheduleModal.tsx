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
import { KeySelector } from "@/components/ui/key-selector";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  Laptop,
  Upload,
  Headphones,
  Download,
  Play,
  Pause,
  Youtube,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { AudioPlayer, AudioTrack } from "@/components/shared/AudioPlayer";
import { YoutubeMiniplayer } from "@/components/shared/YoutubeMiniplayer";

interface CreateScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  selectedDate?: string;
  initialFixedTeamId?: string | null;
  schedule?: Schedule | null;
  onSuccess?: () => void;
  /** Músicas do Louvor para o mesmo dia — exibidas como referência (Dança) */
  worshipSongs?: Array<{
    order_index: number;
    execution_key: string | null;
    song: {
      id: string;
      name: string;
      artist: string | null;
      original_key: string | null;
      has_virtual_instruments: boolean;
      audio_path: string | null;
      reference_url: string | null;
    };
  }>;
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
  audio_path?: string | null;
  has_virtual_instruments?: boolean;
}

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
  conflicts?: Record<string, string>; // team_member_id -> nome da equipe
}

function MemberPicker({
  fn,
  assignedIds,
  allMembers,
  onAdd,
  onRemove,
  conflicts = {},
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
        {assigned.map((member) => {
          const hasConflict = !!conflicts[member.id];
          return (
            <span
              key={member.id}
              className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-sm font-medium border ${
                hasConflict
                  ? "bg-destructive/10 text-destructive border-destructive/30"
                  : style.pill
              }`}
              title={
                hasConflict
                  ? `⚠️ Já escalado em "${conflicts[member.id]}"`
                  : undefined
              }
            >
              <span className="w-5 h-5 rounded-full bg-primary-foreground/60 dark:bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {(member.user?.nome || "?").charAt(0).toUpperCase()}
              </span>
              {member.user?.nome}
              {hasConflict && <span className="text-xs">⚠️</span>}
              <button
                type="button"
                onClick={() => onRemove(member.id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}

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
              available.map((member) => {
                const hasConflict = !!conflicts[member.id];
                const conflictTeam = conflicts[member.id];
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      onAdd(member.id);
                      setQuery("");
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left ${
                      hasConflict
                        ? "hover:bg-destructive/5 opacity-70"
                        : "hover:bg-accent"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        hasConflict
                          ? "bg-destructive/10 text-destructive"
                          : `${style.bg} ${style.text}`
                      }`}
                    >
                      {(member.user?.nome || "?").charAt(0).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground block truncate">
                        {member.user?.nome}
                      </span>
                      {hasConflict && (
                        <span className="text-xs text-destructive block truncate">
                          ⚠️ Escalado em "{conflictTeam}"
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
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
  worshipSongs,
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

  // Player de áudio das músicas do Louvor
  const [worshipPlayerTracks, setWorshipPlayerTracks] = useState<AudioTrack[]>(
    [],
  );
  const [worshipCurrentTrackId, setWorshipCurrentTrackId] = useState<
    string | null
  >(null);
  const [worshipLoadingId, setWorshipLoadingId] = useState<string | null>(null);
  const [youtubePlayerUrl, setYoutubePlayerUrl] = useState<string | null>(null);
  const [youtubePlayerTitle, setYoutubePlayerTitle] = useState<
    string | undefined
  >();
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
  const [quickSongVS, setQuickSongVS] = useState(false);
  const [quickSongUrl, setQuickSongUrl] = useState("");
  const [quickSongAudio, setQuickSongAudio] = useState<File | null>(null);
  const [savingQuickSong, setSavingQuickSong] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // UI
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dateConflict, setDateConflict] = useState(false);
  const [showFixedTeamForm, setShowFixedTeamForm] = useState(false);
  const [fixedTeamName, setFixedTeamName] = useState("");
  const [savingFixedTeam, setSavingFixedTeam] = useState(false);
  // Conflitos: mapa team_member_id -> nome da equipe onde já está escalado
  const [memberConflicts, setMemberConflicts] = useState<
    Record<string, string>
  >({});

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
              audio_path: s.song?.audio_path || null,
              has_virtual_instruments: s.song?.has_virtual_instruments,
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

  // Verificar conflitos de membros em outras equipes na mesma data
  useEffect(() => {
    if (!date || !teamId || teamMembers.length === 0) {
      setMemberConflicts({});
      return;
    }
    // Pegar user_ids de todos os membros da equipe
    const userIds = teamMembers
      .map((m) => m.user?.id)
      .filter(Boolean) as string[];
    if (!userIds.length) return;

    scheduleService
      .checkMembersConflicts(userIds, date, teamId)
      .then((conflicts) => {
        // Converter user_id -> team_member_id para usar no mapa de assignments
        const byMemberId: Record<string, string> = {};
        teamMembers.forEach((m) => {
          if (m.user?.id && conflicts[m.user.id]) {
            byMemberId[m.id] = conflicts[m.user.id];
          }
        });
        setMemberConflicts(byMemberId);
      })
      .catch(() => setMemberConflicts({}));
  }, [date, teamId, teamMembers]);

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
    setQuickSongVS(false);
    setQuickSongUrl("");
    setQuickSongAudio(null);
    setShowFixedTeamForm(false);
    setFixedTeamName("");
  };

  // ── Assignments ───────────────────────────────────────────────────────────

  const addToFunction = (fnId: string, memberId: string) => {
    // Bloquear se o membro já está escalado em outra equipe neste dia
    if (memberConflicts[memberId]) {
      const teamName = memberConflicts[memberId];
      const member = teamMembers.find((m) => m.id === memberId);
      const memberName = member?.user?.nome?.split(" ")[0] || "Este membro";
      toast({
        variant: "destructive",
        title: `⚠️ Conflito de escala`,
        description: `${memberName} já está escalado(a) em "${teamName}" neste dia.`,
      });
      return;
    }
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
        audio_path: song.audio_path || null,
        has_virtual_instruments: song.has_virtual_instruments,
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
        has_virtual_instruments: quickSongVS,
        reference_url: quickSongUrl.trim() || undefined,
        audio_file: quickSongAudio || undefined,
      });
      addSong(newSong);
      toast({ title: `🎵 "${newSong.name}" criada e adicionada!` });
      setQuickSongName("");
      setQuickSongArtist("");
      setQuickSongKey("");
      setQuickSongVS(false);
      setQuickSongUrl("");
      setQuickSongAudio(null);
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

  // ── Player músicas do Louvor ──────────────────────────────────────────────

  const handleWorshipPlay = async (songId: string, audioPath: string) => {
    const existing = worshipPlayerTracks.find((t) => t.id === songId);
    if (existing?.audioUrl) {
      setWorshipCurrentTrackId(songId);
      return;
    }
    try {
      setWorshipLoadingId(songId);
      const url = await songService.getAudioUrl(audioPath);
      const allTracks: AudioTrack[] = (worshipSongs || [])
        .filter((ss) => ss.song.audio_path)
        .map((ss) => ({
          id: ss.song.id,
          name: ss.song.name,
          artist: ss.song.artist || undefined,
          audioUrl: ss.song.id === songId ? url : "",
          key: ss.execution_key || ss.song.original_key || undefined,
        }));
      setWorshipPlayerTracks(allTracks);
      setWorshipCurrentTrackId(songId);
    } catch {
      toast({ variant: "destructive", title: "Erro ao reproduzir áudio" });
    } finally {
      setWorshipLoadingId(null);
    }
  };

  const handleWorshipTrackChange = async (id: string | null) => {
    if (!id) {
      setWorshipCurrentTrackId(null);
      return;
    }
    const track = worshipPlayerTracks.find((t) => t.id === id);
    if (track?.audioUrl) {
      setWorshipCurrentTrackId(id);
      return;
    }
    const ws = (worshipSongs || []).find((ss) => ss.song.id === id);
    if (!ws?.song.audio_path) return;
    try {
      const url = await songService.getAudioUrl(ws.song.audio_path);
      setWorshipPlayerTracks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, audioUrl: url } : t)),
      );
      setWorshipCurrentTrackId(id);
    } catch {
      toast({ variant: "destructive", title: "Erro ao carregar faixa" });
    }
  };

  // ── Download de áudio ─────────────────────────────────────────────────────

  const handleDownload = async (song: SelectedSong) => {
    if (!song.audio_path) return;
    try {
      setDownloadingId(song.song_id);
      const ext = song.audio_path.split(".").pop() || "mp3";
      const fileName = `${song.song_name}${song.artist ? ` - ${song.artist}` : ""}.${ext}`;
      await songService.downloadAudio(song.audio_path, fileName);
    } catch {
      toast({ variant: "destructive", title: "Erro ao baixar áudio" });
    } finally {
      setDownloadingId(null);
    }
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

    // Bloquear se algum membro já escalado tem conflito em outra equipe
    const conflictedMembers = members
      .filter((m) => memberConflicts[m.team_member_id])
      .map((m) => {
        const member = teamMembers.find((tm) => tm.id === m.team_member_id);
        const name = member?.user?.nome?.split(" ")[0] || "Membro";
        const team = memberConflicts[m.team_member_id];
        return `${name} (${team})`;
      });

    if (conflictedMembers.length > 0) {
      toast({
        variant: "destructive",
        title: "⚠️ Conflito de escala",
        description: `${conflictedMembers.join(", ")} já ${conflictedMembers.length === 1 ? "está escalado" : "estão escalados"} em outra equipe neste dia. Remova-${conflictedMembers.length === 1 ? "o" : "os"} antes de salvar.`,
      });
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
        notes: notes.trim() || null,
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
      <DialogContent className="max-w-3xl">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? "✏️ Editar Escala" : "🎵 Nova Escala"}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-16 flex-1">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="px-5 py-4 space-y-5 sm:space-y-6">
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
                  <p className="text-xs text-destructive">
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
            <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4">
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="min-w-0">
                  <Label className="text-sm sm:text-base font-semibold">
                    Equipes fixas
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Clique para preencher automaticamente as funções.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFixedTeamForm((prev) => !prev)}
                  className="gap-2 bg-card w-full"
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
                      className="bg-card hover:bg-accent max-w-full whitespace-normal text-left"
                    >
                      {preset.nome}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-card/70 p-3 text-sm text-muted-foreground">
                  Nenhuma equipe fixa cadastrada.
                </div>
              )}

              {showFixedTeamForm && (
                <div className="space-y-2 rounded-lg border bg-card p-3">
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
                    className="bg-primary hover:bg-primary/90 w-full"
                  >
                    {savingFixedTeam ? "Salvando..." : "Salvar equipe padrão"}
                  </Button>
                </div>
              )}
            </div>

            {/* ── Membros por Função ── */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                <Label className="text-sm sm:text-base font-semibold">
                  👥 Membros da Escala
                </Label>
                {totalAssigned > 0 && (
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {totalAssigned} membro{totalAssigned !== 1 ? "s" : ""}{" "}
                    escalado{totalAssigned !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {teamFunctions.length === 0 ? (
                <div className="border-2 border-dashed rounded-xl p-6 text-center text-muted-foreground">
                  <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">
                    Nenhuma função cadastrada para esta equipe
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border divide-y divide-border [&>*:first-child]:rounded-t-xl [&>*:last-child]:rounded-b-xl">
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
                            isEmpty ? "bg-background" : style.bg
                          }`}
                        >
                          {/* Função label */}
                          <div className="flex items-center gap-2 w-32 flex-shrink-0 pt-1">
                            <span className="text-base leading-none">
                              {icon}
                            </span>
                            <span
                              className={`text-sm font-semibold ${isEmpty ? "text-muted-foreground" : style.text}`}
                            >
                              {fn.nome}
                            </span>
                          </div>

                          {/* Picker de membros */}
                          <div className="flex-1 min-w-0 relative">
                            <MemberPicker
                              fn={fn}
                              assignedIds={assignedIds}
                              allMembers={teamMembers}
                              conflicts={memberConflicts}
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
              <Label className="text-sm sm:text-base font-semibold">
                🎵 Músicas
              </Label>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar músicas..."
                  value={songSearchQuery}
                  onChange={(e) => handleSearchSongs(e.target.value)}
                  className="pl-9"
                  autoComplete="off"
                />

                {searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((song) => (
                      <button
                        key={song.id}
                        type="button"
                        onClick={() => addSong(song)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent text-left transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Music className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {song.name}
                          </p>
                          {song.artist && (
                            <p className="text-xs text-muted-foreground truncate">
                              {song.artist}
                            </p>
                          )}
                        </div>
                        {song.original_key && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex-shrink-0">
                            {song.original_key}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {showNoResults && !showQuickCreate && (
                  <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-xl shadow-lg">
                    <div className="px-4 py-3 text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Nenhuma música encontrada para{" "}
                        <strong>"{songSearchQuery}"</strong>
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-primary hover:bg-primary/90 gap-2"
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
                <div className="border-2 border-primary/30 rounded-xl p-4 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Criar nova música
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickCreate(false);
                        setSongSearchQuery("");
                      }}
                      className="text-muted-foreground hover:text-foreground"
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
                        className="bg-card"
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
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <KeySelector
                          value={quickSongKey}
                          onChange={setQuickSongKey}
                          label="Tom Original"
                          allowEmpty
                        />
                      </div>

                      {/* VS — Virtual Sample */}
                      <div className="col-span-2 flex items-center gap-2 pt-1">
                        <Checkbox
                          id="quickSongVS"
                          checked={quickSongVS}
                          onCheckedChange={(v) => setQuickSongVS(v as boolean)}
                        />
                        <Label
                          htmlFor="quickSongVS"
                          className="cursor-pointer flex items-center gap-1.5 text-sm"
                        >
                          <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
                          Possui VS
                        </Label>
                      </div>

                      {/* Link de referência */}
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Link de Referência</Label>
                        <Input
                          placeholder="YouTube, Spotify..."
                          value={quickSongUrl}
                          onChange={(e) => setQuickSongUrl(e.target.value)}
                          autoComplete="off"
                          className="bg-card text-sm h-8"
                        />
                      </div>

                      {/* Upload de áudio */}
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Áudio (opcional)</Label>
                        <div className="flex items-center gap-2">
                          <input
                            id="quickAudioFile"
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 50 * 1024 * 1024) {
                                toast({
                                  variant: "destructive",
                                  title: "Arquivo muito grande",
                                  description: "Máximo 50MB",
                                });
                                return;
                              }
                              setQuickSongAudio(file);
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs gap-1.5 bg-card"
                            onClick={() =>
                              document.getElementById("quickAudioFile")?.click()
                            }
                          >
                            <Upload className="h-3.5 w-3.5" />
                            {quickSongAudio
                              ? quickSongAudio.name
                              : "Selecionar áudio"}
                          </Button>
                          {quickSongAudio && (
                            <button
                              type="button"
                              onClick={() => setQuickSongAudio(null)}
                              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          MP3, WAV, OGG — máximo 50MB
                        </p>
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
                      className="flex-1"
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
                      className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 bg-card transition-all cursor-grab active:cursor-grabbing ${
                        dragOverIndex === index && dragIndex !== index
                          ? "border-t-2 border-primary/50 bg-primary/5"
                          : "hover:bg-accent"
                      } ${dragIndex === index ? "opacity-40" : ""}`}
                    >
                      <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 min-w-0">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-medium text-sm truncate">
                              {song.song_name}
                            </p>
                            {/* Ícone áudio */}
                            {song.audio_path && (
                              <span
                                title="Possui áudio"
                                className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                              >
                                <Headphones className="h-3 w-3" />
                              </span>
                            )}
                            {/* Ícone VS */}
                            {song.has_virtual_instruments && (
                              <span
                                title="Virtual Sample"
                                className="flex items-center justify-center w-5 h-5 rounded-md bg-muted text-muted-foreground flex-shrink-0"
                              >
                                <Laptop className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          {song.artist && (
                            <p className="text-xs text-muted-foreground truncate">
                              {song.artist}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto pl-9 sm:pl-0">
                        {song.original_key && (
                          <span className="text-xs text-muted-foreground">
                            Original: <strong>{song.original_key}</strong>
                          </span>
                        )}
                        <div className="flex items-center gap-1 flex-1 sm:flex-initial">
                          <span className="text-xs text-muted-foreground">
                            Tom:
                          </span>
                          <Input
                            value={song.execution_key || ""}
                            onChange={(e) =>
                              updateSongKey(song.song_id, e.target.value)
                            }
                            className="w-16 h-7 text-xs text-center px-1"
                            placeholder="C"
                          />
                        </div>
                        {/* Download */}
                        {song.audio_path && (
                          <button
                            type="button"
                            onClick={() => handleDownload(song)}
                            disabled={downloadingId === song.song_id}
                            className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1 disabled:opacity-50"
                            title="Baixar áudio"
                          >
                            {downloadingId === song.song_id ? (
                              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeSong(song.song_id)}
                          className="text-muted-foreground/40 hover:text-destructive transition-colors p-1 ml-auto sm:ml-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-xl p-4 text-center text-muted-foreground">
                  <Music className="h-6 w-6 mx-auto mb-1 opacity-40" />
                  <p className="text-sm">Busque e adicione músicas acima</p>
                </div>
              )}
            </div>

            {/* ── Músicas do Louvor (referência para a Dança) ── */}
            {worshipSongs && worshipSongs.length > 0 && (
              <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      🎵 Músicas do Louvor
                    </Label>
                    <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-0.5">
                      Referência para a coreografia
                    </p>
                  </div>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {worshipSongs.length} música
                    {worshipSongs.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Player de áudio */}
                {worshipCurrentTrackId && worshipPlayerTracks.length > 0 && (
                  <div className="rounded-xl border border-amber-500/30 overflow-hidden">
                    <AudioPlayer
                      tracks={worshipPlayerTracks}
                      currentTrackId={worshipCurrentTrackId}
                      onTrackChange={handleWorshipTrackChange}
                      onClose={() => {
                        setWorshipCurrentTrackId(null);
                        setWorshipPlayerTracks([]);
                      }}
                      embedded
                    />
                  </div>
                )}

                {/* Miniplayer YouTube */}
                {youtubePlayerUrl && (
                  <div className="mb-4">
                    <YoutubeMiniplayer
                      inline
                      disableDetach
                      url={youtubePlayerUrl}
                      title={youtubePlayerTitle}
                      onClose={() => {
                        setYoutubePlayerUrl(null);
                        setYoutubePlayerTitle(undefined);
                      }}
                    />
                  </div>
                )}

                {/* Lista de músicas */}
                <div className="space-y-1">
                  {[...worshipSongs]
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((ss, index) => {
                      const song = ss.song;
                      const key = ss.execution_key || song.original_key;
                      const hasAudio = !!song.audio_path;
                      const hasYoutube =
                        !!song.reference_url?.includes("youtube") ||
                        !!song.reference_url?.includes("youtu.be");
                      const isPlaying = worshipCurrentTrackId === song.id;
                      const isLoading = worshipLoadingId === song.id;

                      return (
                        <div
                          key={`worship-${song.id}-${index}`}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-amber-500/10 hover:border-amber-500/30 transition-colors"
                        >
                          {/* Play áudio */}
                          <button
                            type="button"
                            onClick={() =>
                              hasAudio &&
                              handleWorshipPlay(song.id, song.audio_path!)
                            }
                            disabled={!hasAudio}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                              hasAudio
                                ? "bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer"
                                : "bg-muted cursor-default"
                            }`}
                            title={hasAudio ? "Reproduzir áudio" : "Sem áudio"}
                          >
                            {isLoading ? (
                              <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            ) : isPlaying ? (
                              <Pause className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Play
                                className={`h-3 w-3 ${hasAudio ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
                              />
                            )}
                          </button>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-amber-600/60 dark:text-amber-500/60 flex-shrink-0">
                                {index + 1}.
                              </span>
                              <p className="text-sm font-medium truncate">
                                {song.name}
                              </p>
                              {hasAudio && (
                                <span
                                  title="Possui áudio"
                                  className="flex items-center justify-center w-4 h-4 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                                >
                                  <Headphones className="h-2.5 w-2.5" />
                                </span>
                              )}
                              {song.has_virtual_instruments && (
                                <span
                                  title="Virtual Sample"
                                  className="flex items-center justify-center w-4 h-4 rounded bg-muted text-muted-foreground flex-shrink-0"
                                >
                                  <Laptop className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                            {song.artist && (
                              <p className="text-xs text-muted-foreground truncate">
                                {song.artist}
                              </p>
                            )}
                          </div>

                          {/* Tom + YouTube */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {key && (
                              <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                                {key}
                              </span>
                            )}
                            {song.reference_url && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (hasYoutube) {
                                    setYoutubePlayerUrl(song.reference_url!);
                                    setYoutubePlayerTitle(song.name);
                                  } else {
                                    window.open(song.reference_url!, "_blank");
                                  }
                                }}
                                className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                                  hasYoutube
                                    ? "text-red-500 hover:bg-red-500/10"
                                    : "text-muted-foreground hover:text-primary hover:bg-accent"
                                }`}
                                title={
                                  hasYoutube
                                    ? "Abrir no miniplayer"
                                    : "Abrir referência"
                                }
                              >
                                {hasYoutube ? (
                                  <Youtube className="h-3.5 w-3.5" />
                                ) : (
                                  <Music className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || loadingData || (!isEditing && dateConflict)}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto sm:min-w-[140px]"
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
