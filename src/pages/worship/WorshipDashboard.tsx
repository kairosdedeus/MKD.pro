import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, Users, Music, ChevronLeft, ChevronRight, Pencil, Trash2, Eye, MoreVertical } from 'lucide-react'
import { CreateScheduleModal } from '@/components/features/schedules/CreateScheduleModal'
import { ScheduleDetailModal } from '@/components/features/schedules/ScheduleDetailModal'
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
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { format, parseISO, addMonths, subMonths, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Schedule } from '@/types'
import { useToast } from '@/components/ui/use-toast'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Rascunho',  color: 'bg-gray-100 text-gray-700' },
  published: { label: 'Publicada', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Concluída', color: 'bg-blue-100 text-blue-700' },
}

export function WorshipDashboard() {
  const { toast } = useToast()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null)

  const { teams, loading: loadingTeams } = useTeams()
  const worshipTeam = teams.find(t => t.team_type?.codigo === 'louvor')

  const { schedules, loading: loadingSchedules, refetch } = useSchedules(
    worshipTeam?.id || '',
    currentMonth
  )

  const deleteSchedule = useDeleteSchedule()

  // Gerar dias do calendário
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startWeekday = getDay(monthStart) // 0=Dom, 1=Seg...

  const getSchedulesForDay = (day: Date) =>
    schedules.filter(s => s.date === format(day, 'yyyy-MM-dd'))

  const selectedDaySchedules = schedules.filter(
    s => s.date === format(selectedDate, 'yyyy-MM-dd')
  )

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-purple-900">🎵 Louvor</h1>
          <p className="text-gray-500 mt-1">
            {worshipTeam.nome} · {worshipTeam.members?.length || 0} membros
          </p>
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
          onClick={() => { setEditingSchedule(null); setShowCreateModal(true) }}
        >
          <Plus className="h-4 w-4" />
          Nova Escala
        </Button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-purple-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">{schedules.length}</p>
                <p className="text-xs text-gray-500">Escalas este mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">{worshipTeam.members?.length || 0}</p>
                <p className="text-xs text-gray-500">Membros na equipe</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Music className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  {schedules.reduce((acc, s) => acc + (s.songs?.length || 0), 0)}
                </p>
                <p className="text-xs text-gray-500">Músicas escaladas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Calendário</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-36 text-center capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7 gap-1">
              {/* Células vazias antes do primeiro dia */}
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
                      relative aspect-square flex flex-col items-center justify-start pt-1 rounded-lg text-sm transition-all
                      ${isSelected ? 'bg-purple-600 text-white' : 'hover:bg-purple-50'}
                      ${isToday && !isSelected ? 'border-2 border-purple-400 font-bold' : ''}
                    `}
                  >
                    <span>{format(day, 'd')}</span>
                    {hasSchedule && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                        {daySchedules.slice(0, 3).map(s => (
                          <div
                            key={s.id}
                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-purple-500'}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Botão criar escala para o dia selecionado */}
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={() => { setEditingSchedule(null); setShowCreateModal(true) }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar escala para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Escalas do dia selecionado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSchedules ? (
              <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : selectedDaySchedules.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">Nenhuma escala para este dia</div>
            ) : (
              <div className="space-y-3">
                {selectedDaySchedules.map(schedule => {
                  const status = STATUS_LABELS[schedule.status] || STATUS_LABELS.draft
                  return (
                    <div key={schedule.id} className="border border-purple-100 rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {schedule.title || 'Escala sem título'}
                          </p>
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 text-xs text-gray-500">
                        <span>{schedule.members?.length || 0} membros</span>
                        {(schedule.songs?.length || 0) > 0 && (
                          <span>· {schedule.songs!.length} músicas</span>
                        )}
                      </div>
                      <div className="flex gap-1 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-purple-600 hover:bg-purple-50"
                          onClick={() => handleViewSchedule(schedule)}
                        >
                          <Eye className="h-3 w-3 mr-1" /> Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50"
                          onClick={() => handleEditSchedule(schedule)}
                        >
                          <Pencil className="h-3 w-3 mr-1" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteSchedule(schedule)}
                        >
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
      </div>

      {/* Membros da equipe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-purple-600" />
            Membros da Equipe — {worshipTeam.nome}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!worshipTeam.members || worshipTeam.members.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Adicione membros à equipe de louvor em Gerencial → Equipes
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {worshipTeam.members.map(member => (
                <div key={member.id} className="border border-purple-100 rounded-lg p-3 hover:bg-purple-50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-semibold text-sm">
                      {member.user?.nome?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <p className="font-medium text-sm truncate">{member.user?.nome}</p>
                  </div>
                  {member.functions && member.functions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {member.functions.map(f => (
                        <span key={f.id} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
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
              <Calendar className="h-5 w-5 text-purple-600" />
              Todas as Escalas — {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {schedules.map(schedule => {
                const status = STATUS_LABELS[schedule.status] || STATUS_LABELS.draft
                return (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[48px]">
                        <p className="text-xs text-gray-400 uppercase">
                          {format(parseISO(schedule.date), 'EEE', { locale: ptBR })}
                        </p>
                        <p className="text-lg font-bold text-purple-700">
                          {format(parseISO(schedule.date), 'dd')}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{schedule.title || 'Escala sem título'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {schedule.members?.length || 0} membros
                            {(schedule.songs?.length || 0) > 0 && ` · ${schedule.songs!.length} músicas`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewSchedule(schedule)}>
                            <Eye className="h-4 w-4 mr-2 text-purple-600" /> Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditSchedule(schedule)}>
                            <Pencil className="h-4 w-4 mr-2 text-blue-600" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeletingSchedule(schedule)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal criar/editar escala */}
      <CreateScheduleModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open)
          if (!open) setEditingSchedule(null)
        }}
        teamId={worshipTeam.id}
        selectedDate={format(selectedDate, 'yyyy-MM-dd')}
        schedule={editingSchedule}
        onSuccess={() => { refetch(); setEditingSchedule(null) }}
      />

      {/* Modal de detalhes */}
      {selectedSchedule && (
        <ScheduleDetailModal
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          schedule={selectedSchedule}
          onEdit={() => {
            setShowDetailModal(false)
            handleEditSchedule(selectedSchedule)
          }}
          onDelete={() => {
            setShowDetailModal(false)
            setDeletingSchedule(selectedSchedule)
          }}
        />
      )}

      {/* AlertDialog de confirmação de exclusão */}
      <AlertDialog open={!!deletingSchedule} onOpenChange={open => !open && setDeletingSchedule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir escala?</AlertDialogTitle>
            <AlertDialogDescription>
              A escala <strong>"{deletingSchedule?.title || (deletingSchedule ? format(parseISO(deletingSchedule.date), "dd/MM/yyyy") : '')}"</strong> será excluída permanentemente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingSchedule && handleDeleteSchedule(deletingSchedule)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
