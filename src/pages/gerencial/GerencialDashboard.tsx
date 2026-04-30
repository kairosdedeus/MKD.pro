import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, Music, TrendingUp, FileText, AlertCircle, ArrowRight } from 'lucide-react'
import { StatsCard } from '@/components/shared/StatsCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useUsers } from '@/hooks/useUsers'
import { useTeams } from '@/hooks/useTeams'
import { useSongs } from '@/hooks/useSongs'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'

export function GerencialDashboard() {
  const navigate = useNavigate()
  const { data: users, isLoading: loadingUsers } = useUsers()
  const { data: teams, isLoading: loadingTeams } = useTeams()
  const { data: songs, isLoading: loadingSongs } = useSongs()

  const isLoading = loadingUsers || loadingTeams || loadingSongs

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Gerencial</h1>
        <p className="text-gray-600 mt-2">Visão geral do sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Usuários"
          value={users?.length || 0}
          description="Usuários ativos"
          icon={Users}
        />

        <StatsCard
          title="Equipes"
          value={teams?.length || 0}
          description="Equipes cadastradas"
          icon={TrendingUp}
        />

        <StatsCard
          title="Escalas do Mês"
          value={0}
          description="Escalas criadas"
          icon={Calendar}
        />

        <StatsCard
          title="Músicas"
          value={songs?.length || 0}
          description="Músicas cadastradas"
          icon={Music}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximas Escalas</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Calendar}
              title="Nenhuma escala cadastrada"
              description="Comece criando escalas para seus ministérios"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Equipes por Ministério</CardTitle>
            {teams && teams.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/gerencial/equipes')}
                className="flex items-center gap-1"
              >
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {teams && teams.length > 0 ? (
              <div className="space-y-3">
                {teams.slice(0, 5).map((team) => (
                  <div key={team.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={team.team_type?.codigo as any}>
                        {team.team_type?.nome}
                      </Badge>
                      <span className="text-sm font-medium">{team.nome}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {team.members?.length || 0} membros
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="Nenhuma equipe cadastrada"
                description="Crie equipes para começar"
                action={{
                  label: 'Criar Equipe',
                  onClick: () => navigate('/gerencial/equipes'),
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {teams && teams.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Comece configurando o sistema</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Para começar a usar o sistema, você precisa:
                </p>
                <ol className="list-decimal list-inside text-sm text-yellow-800 mt-2 space-y-1">
                  <li>Cadastrar usuários</li>
                  <li>Criar equipes para cada ministério</li>
                  <li>Adicionar membros às equipes</li>
                  <li>Começar a criar escalas</li>
                </ol>
                <Button
                  className="mt-4"
                  onClick={() => navigate('/gerencial/equipes')}
                >
                  Ir para Equipes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
