import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Calendar, Users, Music, FileText, Download } from 'lucide-react'
import { Schedule } from '@/types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { exportScheduleToPdf } from '@/lib/exportPdf'

interface ScheduleDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: Schedule
  onEdit: () => void
  onDelete: () => void
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft:     { label: 'Rascunho',  variant: 'secondary' },
  published: { label: 'Publicada', variant: 'default' },
  completed: { label: 'Concluída', variant: 'outline' },
}

export function ScheduleDetailModal({
  open,
  onOpenChange,
  schedule,
  onEdit,
  onDelete,
}: ScheduleDetailModalProps) {
  const status = STATUS_LABELS[schedule.status] || STATUS_LABELS.draft

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            {schedule.title || 'Escala sem título'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Info básica */}
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Data</p>
              <p className="font-semibold text-purple-900">
                {format(parseISO(schedule.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="ml-auto">
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </div>

          {/* Observações */}
          {schedule.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4" />
                Observações
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{schedule.notes}</p>
            </div>
          )}

          {/* Membros */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="h-4 w-4 text-purple-600" />
              Membros ({schedule.members?.length || 0})
            </div>
            {!schedule.members || schedule.members.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Nenhum membro escalado</p>
            ) : (
              <div className="space-y-2">
                {schedule.members.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-2 border rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-semibold text-sm">
                      {member.team_member?.user?.nome?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{member.team_member?.user?.nome || 'Sem nome'}</p>
                      {member.functions && member.functions.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {member.functions.map(f => (
                            <span key={f.id} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                              {f.nome}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {member.notes && (
                      <p className="text-xs text-gray-400 italic">{member.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Músicas */}
          {schedule.songs && schedule.songs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Music className="h-4 w-4 text-purple-600" />
                Músicas ({schedule.songs.length})
              </div>
              <div className="space-y-1">
                {schedule.songs
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((scheduleSong, index) => (
                    <div key={scheduleSong.id} className="flex items-center gap-3 p-2 border rounded-lg">
                      <span className="text-xs text-gray-400 w-5 text-center">{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{scheduleSong.song?.name || 'Música'}</p>
                        {scheduleSong.song?.artist && (
                          <p className="text-xs text-gray-400">{scheduleSong.song.artist}</p>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs text-gray-500">
                        {scheduleSong.song?.original_key && (
                          <span>Original: <strong>{scheduleSong.song.original_key}</strong></span>
                        )}
                        {scheduleSong.execution_key && scheduleSong.execution_key !== scheduleSong.song?.original_key && (
                          <span className="text-purple-600">Execução: <strong>{scheduleSong.execution_key}</strong></span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            variant="outline"
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
            onClick={() => exportScheduleToPdf(schedule, schedule.team?.nome || 'Louvor')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
