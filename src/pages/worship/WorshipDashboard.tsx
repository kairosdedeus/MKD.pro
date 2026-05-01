import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, Users, Music, ChevronLeft, ChevronRight, Pencil, Trash2, Eye, MoreVertical } from 'lucide-react'
import { CreateScheduleModal } from '@/components/features/schedules/CreateScheduleModal'
import { ScheduleDetailModal } from '@/components/features/schedules/ScheduleDetailModal'
import { WorshipFixedTeamModal } from '@/components/features/schedules/WorshipFixedTeamModal'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSchedules, useDeleteSchedule } from '@/hooks/useSchedules'
import { useTeams } from '@/hooks/useTeams'
import { teamService } from '@/services/teamService'
import { worshipFixedTeamService, WorshipFixedTeam } from '@/services/worshipFixedTeamService'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { format, parseISO, addMonths, subMonths, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Schedule, TeamFunction, TeamMember } from '@/types'
import { useToast } from '@/components/ui/use-toast'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Rascunho',  color: 'bg-muted text-muted-foreground' },
  published: { label: 'Publicada', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  completed: { label: 'Concluída', color: 'bg-primary/15 text-primary' },
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getFunctionPriority(functionName: string) {
  const normalized = normalizeText(functionName)
  if (normalized === 'vocal') return 0
  if (normalized === 'backvocal' || normalized === 'back vocal') return 1
  return 2
}

function getPresetMemberRows(
  preset: WorshipFixedTeam,
  teamMembers: TeamMember[] = [],
  teamFunctions: TeamFunction[] = []
) {
  return Array.from(new Set(preset.members.map(member => member.team_member_id)))
    .map(memberId => {
      const member = teamMembers.find(item => item.id === memberId)
      const functions = preset.members
        .filter(item => item.team_member_id === memberId)
        .map(item => teamFunctions.find(fn => fn.id === item.function_id))
        .filter(Boolean) as TeamFunction[]

      const sortedFunctions = functions.sort((a, b) => {
        const priorityDiff = getFunctionPriority(a.nome) - getFunctionPriority(b.nome)
        if (priorityDiff !== 0) return priorityDiff
        return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
      })

      return {
        memberId,
        memberName: member?.user?.nome || 'Membro removido',
        functions: sortedFunctions,
        priority: sortedFunctions[0] ? getFunctionPriority(sortedFunctions[0].nome) : 99,
      }
    })
    .sort((a, b) => {
      const priorityDiff = a.priority - b.priority
      if (priorityDiff !== 0) return priorityDiff
      return a.memberName.localeCompare(b.memberName, 'pt-BR', { sensitivity: 'base' })
    })
}

export function WorshipDashboard() {
  const { toast } = useToast()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showFixedTeamModal, setShowFixedTeamModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null)
  const [fixedTeams, setFixedTeams] = useState<WorshipFixedTeam[]>([])
  const [teamFunctions, setTeamFunctions] = useState<TeamFunction[]>([])
  const [editingFixedTeam, setEditingFixedTeam] = useState<WorshipFixedTeam | null>(null)
  const [deletingFixedTeam, setDeletingFixedTeam] = useState<WorshipFixedTeam | null>(null)
  const [loadingFixedTeams, setLoadingFixedTeams] = useState(false)

  const { teams, loading: loadingTeams } = useTeams()
  const worshipTeam = teams.find(t => t.team_type?.codigo === 'louvor')

  const { schedules, loading: loadingSchedules, refetch } = useSchedules(
    worshipTeam?.id || '',
    currentMonth
  )

  const deleteSchedule = useDeleteSchedule()

  const loadFixedTeamData = async () => {
    if (!worshipTeam) return

    try {
      setLoadingFixedTeams(true)
      const [presets, functions] = await Promise.all([
        worshipFixedTeamService.getByTeamId(worshipTeam.id),
        worshipTeam.team_type_id ? teamService.getTeamFunctions(worshipTeam.team_type_id) : Promise.resolve([]),
      ])
      setFixedTeams(presets)
      setTeamFunctions(functions)
    } catch (error) {
      console.error('Erro ao carregar equipes padrão:', error)
      toast({ variant: 'destructive', title: 'Erro ao carregar equipes padrão' })
    } finally {
      setLoadingFixedTeams(false)
    }
  }

  useEffect(() => {
    loadFixedTeamData()
  }, [worshipTeam?.id])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startWeekday = getDay(monthStart)

  const getSchedulesForDay = (day: Date) =>
    schedules.filter(s => s.date === format(day, 'yyyy-MM-dd'))

  const selectedDaySchedules = schedules.filter(
    s => s.date === format(selectedDate, 'yyyy-MM-dd')
  )

  const sortedFixedTeams = [...fixedTeams].sort((a, b) => {
    const firstA = getPresetMemberRows(a, worshipTeam?.members || [], teamFunctions)[0]?.memberName || a.nome
    const firstB = getPresetMemberRows(b, worshipTeam?.members || [], teamFunctions)[0]?.memberName || b.nome
    const firstDiff = firstA.localeCompare(firstB, 'pt-BR', { sensitivity: 'base' })
    if (firstDiff !== 0) return firstDiff
    return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
  })

  const handleDeleteSchedule = async (schedule: Schedule) => {
    try {
      await deleteSchedule.mutateAsync(schedule.id)
      toast({ title: 'Escala excluída com sucesso!' })
      setDeletingSchedule(null)
      refetch()
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao excluir escala' })
    }
  }

  const handleDeleteFixedTeam = async (preset: WorshipFixedTeam) => {
    try {
      await worshipFixedTeamService.delete(preset.id)
      toast({ title: 'Equipe padrão excluída!' })
      setDeletingFixedTeam(null)
      loadFixedTeamData()
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao excluir equipe padrão' })
    }
  }

  const handleViewSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setShowDetailModal(true)
  }

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setShowCreateModal(true)
  }

  if (loadingTeams) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>
  }

  if (!worshipTeam) {
    return (
      <EmptyState
        icon={Users}
        title="Equipe de Louvor não encontrada"
        description="Crie uma equipe do tipo Louvor em Gerencial → Equipes para começar."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">🎵 Louvor</h1>
          <p className="text-muted-foreground mt-1">
            {worshipTeam.nome} · {worshipTeam.members?.length || 0} membros
          </p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={() => { setEditingSchedule(null); setShowCreateModal(true) }}>
          <Plus className="h-4 w-4" />
          Nova Escala
        </Button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { icon: Calendar, value: schedules.length, label: 'Escalas este mês' },
          { icon: Users, value: worshipTeam.members?.length || 0, label: 'Membros na equipe' },
          { icon: Music, value: schedules.reduce((acc, s) => acc + (s.songs?.length || 0), 0), label: 'Músicas escaladas' },
        ].map(({ icon: Icon, value, label }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">Calendário</CardTitle>
              <div className="flex items-center justify-between gap-2 sm:justify-start">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium flex-1 sm:w-36 sm:flex-none text-center capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startWeekday }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {days.map(day => {
                const daySchedules = getSchedulesForDay(day)
                const isSelected = isSameDay(day, selectedDate)
                const isToday = isSameDay(day, new Date())
                const hasSchedule = daySchedules.length > 0

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      group relative aspect-square flex flex-col items-center justify-start pt-1 rounded-lg text-sm transition-all
                      ${isSelected ? 'bg-primary text-primary-foreground shadow-md scale-[1.03]' : 'hover:bg-accent hover:shadow-sm'}
                      ${isToday && !isSelected ? 'ring-2 ring-primary font-bold' : ''}
                      ${hasSchedule && !isSelected ? 'bg-primary/5' : ''}
                    `}
                    title={`${format(day, "dd 'de' MMMM", { locale: ptBR })}${hasSchedule ? ` - ${daySchedules.length} escala(s)` : ''}`}
                  >
                    <span className="leading-none">{format(day, 'd')}</span>
                    {hasSchedule && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {daySchedules.slice(0, 3).map(s => (
                          <div
                            key={s.id}
                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary group-hover:scale-125 transition-transform'}`}
                          />
                        ))}
                        {daySchedules.length > 3 && (
                          <span className={`text-[9px] leading-none ${isSelected ? 'text-primary-foreground' : 'text-primary'}`}>
                            +{daySchedules.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setEditingSchedule(null); setShowCreateModal(true) }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar escala para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Escalas do dia selecionado */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
                <Button
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => { setEditingSchedule(null); setShowCreateModal(true) }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Escala
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSchedules ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : selectedDaySchedules.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">Nenhuma escala neste dia</p>
                  <p className="text-xs text-muted-foreground mt-1">Escolha uma equipe padrão ou crie a escala manualmente.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDaySchedules.map(schedule => {
                    const status = STATUS_LABELS[schedule.status] || STATUS_LABELS.draft
                    return (
                      <div key={schedule.id} className="border border-border rounded-lg p-3 space-y-2 hover:bg-accent/40 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {schedule.title || 'Escala sem título'}
                          </p>
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex gap-1 text-xs text-muted-foreground">
                          <span>{schedule.members?.length || 0} membros</span>
                          {(schedule.songs?.length || 0) > 0 && (
                            <span>· {schedule.songs!.length} músicas</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                            onClick={() => handleViewSchedule(schedule)}>
                            <Eye className="h-3 w-3 mr-1" /> Ver
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                            onClick={() => handleEditSchedule(schedule)}>
                            <Pencil className="h-3 w-3 mr-1" /> Editar
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => setDeletingSchedule(schedule)}>
                            <Trash2 className="h-3 w-3 mr-1" /> Excluir
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Music className="h-5 w-5 text-primary" />
                  Equipes padrão
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => {
                    setEditingFixedTeam(null)
                    setShowFixedTeamModal(true)
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nova
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingFixedTeams ? (
                <div className="flex justify-center py-6"><LoadingSpinner /></div>
              ) : fixedTeams.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-sm font-medium text-foreground">Nenhuma equipe padrão</p>
                  <p className="text-xs text-muted-foreground mt-1">Cadastre formações fixas para montar escalas mais rápido.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedFixedTeams.map(preset => {
                    const rows = getPresetMemberRows(preset, worshipTeam.members || [], teamFunctions)
                    const vocalSummary = rows
                      .filter(row => row.priority <= 1)
                      .slice(0, 3)
                      .map(row => row.memberName)
                      .join(', ')

                    return (
                      <div key={preset.id} className="rounded-lg border border-border p-3 space-y-2 hover:bg-accent/40 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => { setEditingSchedule(null); setShowCreateModal(true) }}
                            className="min-w-0 flex-1 text-left"
                            title="Criar escala usando esta equipe no modal de escala"
                          >
                            <p className="font-semibold text-sm truncate">{preset.nome}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {vocalSummary || `${rows.length} membro(s)`}
                            </p>
                          </button>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingFixedTeam(preset)
                                setShowFixedTeamModal(true)
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeletingFixedTeam(preset)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {rows.slice(0, 4).map(row => (
                            <span key={row.memberId} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                              {row.functions[0]?.nome || 'Função'}: {row.memberName}
                            </span>
                          ))}
                          {rows.length > 4 && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                              +{rows.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Membros da equipe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Membros da Equipe — {worshipTeam.nome}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!worshipTeam.members || worshipTeam.members.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Adicione membros à equipe de louvor em Gerencial → Equipes
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {worshipTeam.members.map(member => (
                <div key={member.id} className="border border-border rounded-lg p-3 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm">
                      {member.user?.nome?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <p className="font-medium text-sm truncate">{member.user?.nome}</p>
                  </div>
                  {member.functions && member.functions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {member.functions.map(f => (
                        <span key={f.id} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {f.nome}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        </Card>

      {/* Lista de todas as escalas do mês */}
      {schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-primary" />
              Todas as Escalas — {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {schedules.map(schedule => {
                const status = STATUS_LABELS[schedule.status] || STATUS_LABELS.draft
                return (
                  <div key={schedule.id}
                    className="flex flex-col gap-3 p-3 border border-border rounded-lg hover:bg-accent transition-colors sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-center min-w-[48px]">
                        <p className="text-xs text-muted-foreground uppercase">
                          {format(parseISO(schedule.date), 'EEE', { locale: ptBR })}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {format(parseISO(schedule.date), 'dd')}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{schedule.title || 'Escala sem título'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {schedule.members?.length || 0} membros
                            {(schedule.songs?.length || 0) > 0 && ` · ${schedule.songs!.length} músicas`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewSchedule(schedule)}>
                          <Eye className="h-4 w-4 mr-2" /> Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditSchedule(schedule)}>
                          <Pencil className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingSchedule(schedule)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <CreateScheduleModal
        open={showCreateModal}
        onOpenChange={(open) => { setShowCreateModal(open); if (!open) setEditingSchedule(null) }}
        teamId={worshipTeam.id}
        selectedDate={format(selectedDate, 'yyyy-MM-dd')}
        schedule={editingSchedule}
        onSuccess={() => { refetch(); setEditingSchedule(null) }}
      />

      <WorshipFixedTeamModal
        open={showFixedTeamModal}
        onOpenChange={(open) => {
          setShowFixedTeamModal(open)
          if (!open) setEditingFixedTeam(null)
        }}
        teamId={worshipTeam.id}
        members={worshipTeam.members || []}
        functions={teamFunctions}
        preset={editingFixedTeam}
        onSuccess={loadFixedTeamData}
      />

      {selectedSchedule && (
        <ScheduleDetailModal
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          schedule={selectedSchedule}
          onEdit={() => { setShowDetailModal(false); handleEditSchedule(selectedSchedule) }}
          onDelete={() => { setShowDetailModal(false); setDeletingSchedule(selectedSchedule) }}
        />
      )}

      <AlertDialog open={!!deletingSchedule} onOpenChange={open => !open && setDeletingSchedule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir escala?</AlertDialogTitle>
            <AlertDialogDescription>
              A escala <strong>"{deletingSchedule?.title || (deletingSchedule ? format(parseISO(deletingSchedule.date), "dd/MM/yyyy") : '')}"</strong> será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
              onClick={() => deletingSchedule && handleDeleteSchedule(deletingSchedule)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingFixedTeam} onOpenChange={open => !open && setDeletingFixedTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipe padrão?</AlertDialogTitle>
            <AlertDialogDescription>
              A equipe <strong>{deletingFixedTeam?.nome}</strong> será removida das opções rápidas de escala.
              As escalas já criadas não serão alteradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deletingFixedTeam && handleDeleteFixedTeam(deletingFixedTeam)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
