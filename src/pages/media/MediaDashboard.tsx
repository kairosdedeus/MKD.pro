import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, Users } from 'lucide-react'
import { SimpleCalendar } from '@/components/shared/SimpleCalendar'
import { CreateScheduleModal } from '@/components/features/schedules/CreateScheduleModal'
import { useSchedules } from '@/hooks/useSchedules'
import { useTeams } from '@/hooks/useTeams'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function MediaDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDateStr, setSelectedDateStr] = useState<string>()
  
  const { teams, loading: loadingTeams } = useTeams()
  const mediaTeam = teams.find(t => t.team_type?.codigo === 'midia')
  
  const { schedules, loading: loadingSchedules, refetch } = useSchedules(
    mediaTeam?.id || '',
    selectedDate
  )

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleCreateSchedule = (date?: Date) => {
    if (date) {
      setSelectedDateStr(format(date, 'yyyy-MM-dd'))
    }
    setShowCreateModal(true)
  }

  const scheduleDates = schedules.map(s => parseISO(s.date))

  if (loadingTeams) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (!mediaTeam) {
    return (
      <EmptyState
        icon={Users}
        title="Equipe não encontrada"
        description="Nenhuma equipe de mídia foi encontrada. Crie uma equipe primeiro."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mídia</h1>
          <p className="text-gray-600 mt-2">Gerencie as escalas de mídia</p>
        </div>
        <Button
          className="flex items-center gap-2 bg-media hover:bg-media/90"
          onClick={() => handleCreateSchedule()}
        >
          <Plus className="h-4 w-4" />
          Nova Escala
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendário de Escalas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              highlightedDates={scheduleDates}
            />
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={() => handleCreateSchedule(selectedDate)}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar escala para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSchedules ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : schedules.filter(s => s.date === format(selectedDate, 'yyyy-MM-dd')).length === 0 ? (
              <EmptyState
                title="Sem escalas"
                description="Nenhuma escala para este dia"
                size="sm"
              />
            ) : (
              <div className="space-y-3">
                {schedules
                  .filter(s => s.date === format(selectedDate, 'yyyy-MM-dd'))
                  .map(schedule => (
                    <div key={schedule.id} className="border rounded-lg p-3">
                      <h4 className="font-medium">{schedule.title || 'Sem título'}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {schedule.members?.length || 0} membros
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mediaTeam.members && mediaTeam.members.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {mediaTeam.members.map(member => (
                <div key={member.id} className="border rounded-lg p-3">
                  <p className="font-medium">{member.user?.nome}</p>
                  {member.functions && member.functions.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {member.functions.map(f => f.nome).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sem membros"
              description="Adicione membros à equipe de mídia"
              size="sm"
            />
          )}
        </CardContent>
      </Card>

      <CreateScheduleModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        teamId={mediaTeam.id}
        selectedDate={selectedDateStr}
        onSuccess={refetch}
      />
    </div>
  )
}
