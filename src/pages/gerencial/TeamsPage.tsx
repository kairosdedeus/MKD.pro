import { useState } from 'react'
import { Plus, Users as UsersIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { CreateTeamModal } from '@/components/features/teams/CreateTeamModal'
import { useTeams } from '@/hooks/useTeams'

export function TeamsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const { data: teams, isLoading } = useTeams()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipes</h1>
          <p className="text-gray-600 mt-2">Gerencie as equipes dos ministérios</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Equipe
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Equipes</CardTitle>
        </CardHeader>
        <CardContent>
          {teams && teams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ministério</TableHead>
                  <TableHead>Líder</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.nome}</TableCell>
                    <TableCell>
                      <Badge variant={team.team_type?.codigo as any}>
                        {team.team_type?.nome}
                      </Badge>
                    </TableCell>
                    <TableCell>{team.leader?.nome || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{team.members?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={team.ativo ? 'default' : 'secondary'}>
                        {team.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={UsersIcon}
              title="Nenhuma equipe cadastrada"
              description="Crie sua primeira equipe para começar"
              action={{
                label: 'Nova Equipe',
                onClick: () => setCreateModalOpen(true),
              }}
            />
          )}
        </CardContent>
      </Card>

      <CreateTeamModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {}}
      />
    </div>
  )
}
