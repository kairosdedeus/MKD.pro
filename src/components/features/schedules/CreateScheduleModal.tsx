import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { scheduleService } from '@/services/scheduleService'
import { teamService } from '@/services/teamService'
import { songService } from '@/services/songService'
import { worshipFixedTeamService, WorshipFixedTeam } from '@/services/worshipFixedTeamService'
import { ScheduleFormData, TeamMember, TeamFunction, Song, ScheduleStatus, Schedule } from '@/types'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { X, Search, Music, GripVertical, UserPlus, Check, ChevronDown, Plus, Save } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface CreateScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
  selectedDate?: string
  initialFixedTeamId?: string | null
  schedule?: Schedule | null
  onSuccess?: () => void
}

interface SelectedMember {
  team_member_id: string
  member_name: string
  function_ids: string[]
  notes?: string
}

interface SelectedSong {
  song_id: string
  song_name: string
  artist?: string
  original_key?: string
  execution_key?: string
  order_index: number
  notes?: string
}

const FUNCTION_COLORS: Record<string, string> = {
  'Vocal':       'bg-purple-100 text-purple-700 border-purple-300',
  'BackVocal':   'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300',
  'Guitarra':    'bg-orange-100 text-orange-700 border-orange-300',
  'Baixo':       'bg-blue-100 text-blue-700 border-blue-300',
  'Bateria':     'bg-red-100 text-red-700 border-red-300',
  'Teclado':     'bg-green-100 text-green-700 border-green-300',
  'Projeção':    'bg-cyan-100 text-cyan-700 border-cyan-300',
  'Som':         'bg-yellow-100 text-yellow-700 border-yellow-300',
  'Transmissão': 'bg-pink-100 text-pink-700 border-pink-300',
}

function getFunctionColor(nome: string) {
  return FUNCTION_COLORS[nome] || 'bg-gray-100 text-gray-700 border-gray-300'
}

export function CreateScheduleModal({
  open,
  onOpenChange,
  teamId,
  selectedDate,
  initialFixedTeamId,
  schedule,
  onSuccess,
}: CreateScheduleModalProps) {
  const { toast } = useToast()
  const isEditing = !!schedule
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Form fields
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(selectedDate || '')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<ScheduleStatus>('draft')

  // Data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamFunctions, setTeamFunctions] = useState<TeamFunction[]>([])
  const [fixedTeams, setFixedTeams] = useState<WorshipFixedTeam[]>([])

  // Selections
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([])
  const [selectedSongs, setSelectedSongs] = useState<SelectedSong[]>([])

  // Song search
  const [songSearchQuery, setSongSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Song[]>([])
  const [showNoResults, setShowNoResults] = useState(false)

  // Quick create song
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [quickSongName, setQuickSongName] = useState('')
  const [quickSongArtist, setQuickSongArtist] = useState('')
  const [quickSongKey, setQuickSongKey] = useState('')
  const [savingQuickSong, setSavingQuickSong] = useState(false)

  // UI state
  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dateConflict, setDateConflict] = useState(false)
  const [showFixedTeamForm, setShowFixedTeamForm] = useState(false)
  const [fixedTeamName, setFixedTeamName] = useState('')
  const [savingFixedTeam, setSavingFixedTeam] = useState(false)

  useEffect(() => {
    if (open) loadData()
    else resetForm()
  }, [open, teamId])

  useEffect(() => {
    if (schedule && open) {
      setTitle(schedule.title || '')
      setDate(schedule.date)
      setNotes(schedule.notes || '')
      setStatus(schedule.status)

      if (schedule.members) {
        setSelectedMembers(schedule.members.map(m => ({
          team_member_id: m.team_member_id,
          member_name: m.team_member?.user?.nome || '',
          // m.functions já é array plano de TeamFunction após normalização
          function_ids: (m.functions || []).map((f: any) => f.id).filter(Boolean),
          notes: m.notes || undefined,
        })))
      }

      if (schedule.songs) {
        setSelectedSongs(schedule.songs
          .sort((a, b) => a.order_index - b.order_index)
          .map(s => ({
            song_id: s.song_id,
            song_name: s.song?.name || '',
            artist: s.song?.artist || undefined,
            original_key: s.song?.original_key || undefined,
            execution_key: s.execution_key || undefined,
            order_index: s.order_index,
          })))
      }
    }
  }, [schedule, open])

  useEffect(() => {
    if (selectedDate && !schedule) setDate(selectedDate)
  }, [selectedDate, schedule])

  // Verificar conflito de data ao mudar a data (só no modo criação)
  useEffect(() => {
    if (!date || isEditing || !teamId) { setDateConflict(false); return }
    scheduleService.getScheduleByDate(teamId, date).then(existing => {
      setDateConflict(!!existing)
    }).catch(() => setDateConflict(false))
  }, [date, teamId, isEditing])

  const loadData = async () => {
    try {
      setLoadingData(true)
      const [members, team, presets] = await Promise.all([
        teamService.getTeamMembers(teamId),
        teamService.getTeamById(teamId),
        worshipFixedTeamService.getByTeamId(teamId),
      ])
      setTeamMembers(members)
      setFixedTeams(presets)
      if (initialFixedTeamId && !schedule) {
        const preset = presets.find(item => item.id === initialFixedTeamId)
        if (preset) {
          const grouped = new Map<string, SelectedMember>()

          preset.members.forEach(item => {
            const member = members.find(tm => tm.id === item.team_member_id)
            if (!member) return

            const current = grouped.get(item.team_member_id) || {
              team_member_id: item.team_member_id,
              member_name: member.user?.nome || '',
              function_ids: [],
            }

            if (!current.function_ids.includes(item.function_id)) {
              current.function_ids.push(item.function_id)
            }

            grouped.set(item.team_member_id, current)
          })

          setSelectedMembers(Array.from(grouped.values()))
          setTitle(prev => prev || preset.nome)
          toast({ title: `${preset.nome} selecionada na escala` })
        }
      }
      // Buscar funções pelo team_type_id
      if (team?.team_type_id) {
        const fns = await teamService.getTeamFunctions(team.team_type_id)
        setTeamFunctions(fns)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDate(selectedDate || '')
    setNotes('')
    setStatus('draft')
    setSelectedMembers([])
    setSelectedSongs([])
    setSongSearchQuery('')
    setSearchResults([])
    setShowNoResults(false)
    setShowQuickCreate(false)
    setQuickSongName('')
    setQuickSongArtist('')
    setQuickSongKey('')
    setExpandedMember(null)
    setShowFixedTeamForm(false)
    setFixedTeamName('')
  }

  // ── Membros ──────────────────────────────────────────────────────────────

  const isMemberSelected = (memberId: string) =>
    selectedMembers.some(m => m.team_member_id === memberId)

  const toggleMember = (member: TeamMember) => {
    if (isMemberSelected(member.id)) {
      setSelectedMembers(prev => prev.filter(m => m.team_member_id !== member.id))
      if (expandedMember === member.id) setExpandedMember(null)
    } else {
      const newMember: SelectedMember = {
        team_member_id: member.id,
        member_name: member.user?.nome || '',
        function_ids: member.functions?.length === 1 ? [member.functions[0].id] : [],
      }
      setSelectedMembers(prev => [...prev, newMember])
      // Auto-expandir para escolher função
      if (teamFunctions.length > 1) setExpandedMember(member.id)
    }
  }

  const toggleFunction = (memberId: string, fnId: string) => {
    setSelectedMembers(prev => prev.map(m => {
      if (m.team_member_id !== memberId) return m
      const has = m.function_ids.includes(fnId)
      return {
        ...m,
        function_ids: has
          ? m.function_ids.filter(id => id !== fnId)
          : [...m.function_ids, fnId],
      }
    }))
  }

  const applySelectedMembers = (members: SelectedMember[], presetName: string) => {
    if (members.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Equipe fixa sem membros encontrados',
        description: 'Confira se os usuarios existem e estao cadastrados como membros da equipe de Louvor.',
      })
      return
    }

    setSelectedMembers(members)
    setExpandedMember(null)
    toast({ title: `${presetName} selecionada na escala` })
  }

  const applySavedFixedTeam = (preset: WorshipFixedTeam) => {
    const grouped = new Map<string, SelectedMember>()

    preset.members.forEach(item => {
      const member = teamMembers.find(tm => tm.id === item.team_member_id)
      if (!member) return

      const current = grouped.get(item.team_member_id) || {
        team_member_id: item.team_member_id,
        member_name: member.user?.nome || '',
        function_ids: [],
      }

      if (!current.function_ids.includes(item.function_id)) {
        current.function_ids.push(item.function_id)
      }

      grouped.set(item.team_member_id, current)
    })

    applySelectedMembers(Array.from(grouped.values()), preset.nome)
  }

  const handleSaveFixedTeam = async () => {
    if (!fixedTeamName.trim()) {
      toast({ variant: 'destructive', title: 'Informe o nome da equipe fixa' })
      return
    }
    if (selectedMembers.length === 0) {
      toast({ variant: 'destructive', title: 'Selecione membros antes de salvar' })
      return
    }
    if (selectedMembers.some(member => member.function_ids.length === 0)) {
      toast({ variant: 'destructive', title: 'Todos os membros precisam ter função' })
      return
    }

    try {
      setSavingFixedTeam(true)
      await worshipFixedTeamService.create(teamId, fixedTeamName, selectedMembers)
      const presets = await worshipFixedTeamService.getByTeamId(teamId)
      setFixedTeams(presets)
      setShowFixedTeamForm(false)
      setFixedTeamName('')
      toast({ title: 'Equipe fixa salva!' })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar equipe fixa',
        description: error.message,
      })
    } finally {
      setSavingFixedTeam(false)
    }
  }

  // ── Músicas ───────────────────────────────────────────────────────────────

  const handleSearchSongs = async (query: string) => {
    setSongSearchQuery(query)
    setShowQuickCreate(false)
    setShowNoResults(false)
    if (query.length < 2) { setSearchResults([]); return }
    try {
      const results = await songService.searchSongs(query)
      setSearchResults(results)
      setShowNoResults(results.length === 0)
    } catch { setSearchResults([]) }
  }

  const addSong = (song: Song) => {
    if (selectedSongs.find(s => s.song_id === song.id)) {
      toast({ title: 'Música já adicionada' })
      return
    }
    setSelectedSongs(prev => [...prev, {
      song_id: song.id,
      song_name: song.name,
      artist: song.artist || undefined,
      original_key: song.original_key || undefined,
      execution_key: song.original_key || undefined,
      order_index: prev.length,
    }])
    setSongSearchQuery('')
    setSearchResults([])
    setShowNoResults(false)
    setShowQuickCreate(false)
  }

  const handleQuickCreateSong = async () => {
    if (!quickSongName.trim()) {
      toast({ variant: 'destructive', title: 'Nome da música é obrigatório' })
      return
    }
    try {
      setSavingQuickSong(true)
      const newSong = await songService.createSong({
        name: quickSongName.trim(),
        artist: quickSongArtist.trim() || undefined,
        original_key: quickSongKey.trim() || undefined,
        has_virtual_instruments: false,
      })
      // Adicionar automaticamente à escala
      addSong(newSong)
      toast({ title: `🎵 "${newSong.name}" criada e adicionada!` })
      // Limpar form de criação rápida
      setQuickSongName('')
      setQuickSongArtist('')
      setQuickSongKey('')
      setShowQuickCreate(false)
      setSongSearchQuery('')
    } catch (error) {
      console.error(error)
      toast({ variant: 'destructive', title: 'Erro ao criar música' })
    } finally {
      setSavingQuickSong(false)
    }
  }

  const removeSong = (songId: string) =>
    setSelectedSongs(prev => prev.filter(s => s.song_id !== songId))

  const updateSongKey = (songId: string, key: string) =>
    setSelectedSongs(prev => prev.map(s =>
      s.song_id === songId ? { ...s, execution_key: key } : s
    ))

  // Drag and drop para reordenar músicas
  const handleDragStart = (index: number) => setDragIndex(index)
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    setSelectedSongs(prev => {
      const updated = [...prev]
      const [moved] = updated.splice(dragIndex, 1)
      updated.splice(dropIndex, 0, moved)
      return updated.map((s, i) => ({ ...s, order_index: i }))
    })
    setDragIndex(null)
    setDragOverIndex(null)
  }
  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!date) {
      toast({ variant: 'destructive', title: 'Data obrigatória' })
      return
    }
    if (selectedMembers.length === 0) {
      toast({ variant: 'destructive', title: 'Adicione pelo menos um membro' })
      return
    }
    try {
      setLoading(true)

      // Verificar se já existe escala nessa data (apenas ao criar)
      if (!isEditing) {
        const existing = await scheduleService.getScheduleByDate(teamId, date)
        if (existing) {
          toast({
            variant: 'destructive',
            title: '⚠️ Já existe uma escala nesta data',
            description: `A escala "${existing.title || format(parseISO(existing.date), "dd/MM/yyyy")}" já foi criada para este dia. Use o botão Editar para alterá-la.`,
          })
          setLoading(false)
          return
        }
      }

      const formData: ScheduleFormData = {
        team_id: teamId,
        date,
        title: title || undefined,
        notes: notes || undefined,
        status,
        members: selectedMembers.map(m => ({
          team_member_id: m.team_member_id,
          function_ids: m.function_ids,
          notes: m.notes,
        })),
        songs: selectedSongs.map(s => ({
          song_id: s.song_id,
          execution_key: s.execution_key,
          order_index: s.order_index,
        })),
      }

      if (isEditing && schedule) {
        await scheduleService.updateSchedule(schedule.id, formData)
        toast({ title: '✅ Escala atualizada!' })
      } else {
        await scheduleService.createSchedule(formData)
        toast({ title: '✅ Escala criada!' })
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar escala',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">
            {isEditing ? '✏️ Editar Escala' : '🎵 Nova Escala'}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="px-6 py-5 space-y-6">

            {/* ── Informações básicas ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className={dateConflict ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {dateConflict && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    ⚠️ Já existe uma escala nesta data. Escolha outra data ou edite a escala existente.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={v => setStatus(v as ScheduleStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">📝 Rascunho</SelectItem>
                    <SelectItem value="published">✅ Publicada</SelectItem>
                    <SelectItem value="completed">🏁 Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Título (opcional)</Label>
              <Input
                placeholder="Ex: Culto de Celebração"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações gerais..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-3 rounded-xl border border-purple-200 bg-purple-50/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Label className="text-base font-semibold">Equipes fixas do Louvor</Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Clique em uma equipe para preencher automaticamente ministros e BackVocals.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFixedTeamForm(prev => !prev)}
                  className="gap-2 bg-white w-full sm:w-auto"
                >
                  <Save className="h-4 w-4" />
                  Salvar atual
                </Button>
              </div>

              {fixedTeams.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                    Cadastradas no dashboard
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {fixedTeams.map(preset => (
                      <Button
                        key={preset.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applySavedFixedTeam(preset)}
                        className="bg-white hover:bg-purple-100 max-w-full whitespace-normal text-left"
                      >
                        {preset.nome}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-white/70 p-3 text-sm text-gray-500">
                  Nenhuma equipe fixa cadastrada. Crie no Dashboard do Louvor ou use o botão "Salvar atual" depois de selecionar os membros.
                </div>
              )}

              {showFixedTeamForm && (
                <div className="grid gap-2 rounded-lg border bg-white p-3 sm:grid-cols-[1fr_auto]">
                  <Input
                    placeholder="Nome da equipe fixa. Ex: Equipe D-1"
                    value={fixedTeamName}
                    onChange={e => setFixedTeamName(e.target.value)}
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    onClick={handleSaveFixedTeam}
                    disabled={savingFixedTeam}
                    className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                  >
                    {savingFixedTeam ? 'Salvando...' : 'Salvar equipe'}
                  </Button>
                </div>
              )}
            </div>

            {/* ── Membros ── */}
            <div className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <Label className="text-base font-semibold">
                  👥 Membros da Escala
                </Label>
                <span className="text-sm text-gray-400">
                  {selectedMembers.length} de {teamMembers.length} selecionados
                </span>
              </div>

              {teamMembers.length === 0 ? (
                <div className="border-2 border-dashed rounded-xl p-6 text-center text-gray-400">
                  <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum membro na equipe</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map(member => {
                    const selected = selectedMembers.find(m => m.team_member_id === member.id)
                    const isExpanded = expandedMember === member.id
                    const initial = member.user?.nome?.charAt(0).toUpperCase() || '?'

                    return (
                      <div
                        key={member.id}
                        className={`border-2 rounded-xl transition-all ${
                          selected
                            ? 'border-purple-300 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {/* Linha principal do membro */}
                        <div className="flex items-center gap-3 p-3">
                          {/* Avatar + checkbox visual */}
                          <button
                            type="button"
                            onClick={() => toggleMember(member)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all flex-shrink-0 ${
                              selected
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            {selected ? <Check className="h-5 w-5" /> : initial}
                          </button>

                          {/* Nome */}
                          <div className="flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleMember(member)}
                              className="text-left w-full"
                            >
                              <p className={`font-medium text-sm ${selected ? 'text-purple-900' : 'text-gray-700'}`}>
                                {member.user?.nome}
                              </p>
                            </button>

                            {/* Funções selecionadas (badges) */}
                            {selected && selected.function_ids.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selected.function_ids.map(fId => {
                                  const fn = teamFunctions.find(f => f.id === fId)
                                  return fn ? (
                                    <span
                                      key={fId}
                                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getFunctionColor(fn.nome)}`}
                                    >
                                      {fn.nome}
                                    </span>
                                  ) : null
                                })}
                              </div>
                            )}

                            {/* Aviso se selecionado sem função */}
                            {selected && selected.function_ids.length === 0 && teamFunctions.length > 0 && (
                              <p className="text-xs text-amber-600 mt-0.5">
                                ⚠️ Selecione uma função
                              </p>
                            )}
                          </div>

                          {/* Botão expandir funções */}
                          {selected && teamFunctions.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                              className="text-purple-500 hover:text-purple-700 p-1 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>

                        {/* Painel de funções expandido */}
                        {selected && isExpanded && teamFunctions.length > 0 && (
                          <div className="px-4 pb-3 pt-1 border-t border-purple-200">
                            <p className="text-xs text-purple-600 font-medium mb-2">
                              Selecione a(s) função(ões):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {teamFunctions.map(fn => {
                                const isActive = selected.function_ids.includes(fn.id)
                                return (
                                  <button
                                    key={fn.id}
                                    type="button"
                                    onClick={() => toggleFunction(member.id, fn.id)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                                      isActive
                                        ? `${getFunctionColor(fn.nome)} border-current shadow-sm scale-105`
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                    }`}
                                  >
                                    {isActive && <Check className="inline h-3 w-3 mr-1" />}
                                    {fn.nome}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Músicas ── */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">🎵 Músicas</Label>

              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar músicas por nome ou artista..."
                  value={songSearchQuery}
                  onChange={e => handleSearchSongs(e.target.value)}
                  className="pl-9"
                  autoComplete="off"
                />

                {/* Dropdown de resultados */}
                {searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map(song => (
                      <button
                        key={song.id}
                        type="button"
                        onClick={() => addSong(song)}
                        className="w-full px-4 py-2.5 text-left hover:bg-purple-50 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Music className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{song.name}</p>
                          {song.artist && (
                            <p className="text-xs text-gray-400 truncate">{song.artist}</p>
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

                {/* Nenhum resultado — opção de criar */}
                {showNoResults && !showQuickCreate && (
                  <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-lg">
                    <div className="px-4 py-3 text-center">
                      <p className="text-sm text-gray-500 mb-2">
                        Nenhuma música encontrada para <strong>"{songSearchQuery}"</strong>
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 gap-2"
                        onClick={() => {
                          setQuickSongName(songSearchQuery)
                          setShowQuickCreate(true)
                          setShowNoResults(false)
                          setSearchResults([])
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Criar "{songSearchQuery}"
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Painel de criação rápida de música */}
              {showQuickCreate && (
                <div className="border-2 border-purple-300 rounded-xl p-4 bg-purple-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Criar nova música
                    </p>
                    <button
                      type="button"
                      onClick={() => { setShowQuickCreate(false); setSongSearchQuery('') }}
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
                        onChange={e => setQuickSongName(e.target.value)}
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
                          onChange={e => setQuickSongArtist(e.target.value)}
                          autoComplete="off"
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tom Original</Label>
                        <Input
                          placeholder="Ex: A, Bb, C#"
                          value={quickSongKey}
                          onChange={e => setQuickSongKey(e.target.value)}
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
                      onClick={() => { setShowQuickCreate(false); setSongSearchQuery('') }}
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
                      {savingQuickSong ? 'Criando...' : '✅ Criar e Adicionar'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Lista de músicas selecionadas */}
              {selectedSongs.length > 0 ? (
                <div className="border rounded-xl divide-y overflow-hidden">
                  {selectedSongs.map((song, index) => (
                    <div
                      key={song.song_id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={e => handleDragOver(e, index)}
                      onDrop={e => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 bg-white transition-all cursor-grab active:cursor-grabbing ${
                        dragOverIndex === index && dragIndex !== index
                          ? 'border-t-2 border-purple-400 bg-purple-50'
                          : 'hover:bg-gray-50'
                      } ${dragIndex === index ? 'opacity-40' : ''}`}
                    >
                      <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{song.song_name}</p>
                        {song.artist && (
                          <p className="text-xs text-gray-400 truncate">{song.artist}</p>
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
                            value={song.execution_key || ''}
                            onChange={e => updateSongKey(song.song_id, e.target.value)}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || loadingData || (!isEditing && dateConflict)}
            className="bg-purple-600 hover:bg-purple-700 min-w-[140px]"
          >
            {loading
              ? 'Salvando...'
              : isEditing
                ? '💾 Salvar Alterações'
                : '✅ Criar Escala'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
