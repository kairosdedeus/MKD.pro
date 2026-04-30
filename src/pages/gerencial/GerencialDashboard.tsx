import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, Music, TrendingUp, ArrowRight, AlertCircle } from 'lucide-react'
import { StatsCard } from '@/components/shared/StatsCard'
import { SkeletonCard } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUsers } from '@/hooks/useUsers'
import { useTeams } from '@/hooks/useTeams'
import { useSongs } from '@/hooks/useSongs'
import { useSchedules } from '@/hooks/useSchedules'
import { useNavigate } from 'react-router-dom'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isFuture, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

const MINISTRY_COLORS: Record<string, string> = {
  louvor:   '#9333ea',
  danca:    '#ec4899',
  midia:    '#3b82f6',
  obreiros: '#22c55e',
  celula:   '#f97316',
}

export function GerencialDashboard() {
  const navigate = useNavigate()
  const { data: users, isLoading: loadingUsers } = useUsers()
  const { teams, loading: loadingTeams } = useTeams()
  const { songs, loading: loadingSongs } = useSongs()

  // Buscar escalas do mês atual para a equipe de louvor
  const worshipTeam = (teams as any[]).find((t: any) => t.team_type?.codigo === 'louvor')
  const { schedules, loading: loadingSchedules } = useSchedules(worshipTeam?.id || '', new Date())

  const isLoading = loadingUsers || loadingTeams || loadingSongs

  // Próximas escalas (hoje + futuras)
  const upcomingSchedules = useMemo(() => {
    return schedules
      .filter(s => isToday(parseISO(s.date)) || isFuture(parseISO(s.date)))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
  }, [schedules])

  // Dados para gráfico de equipes por ministério
  const teamsByMinistry = useMemo(() => {
    const map: Record<string, number> = {}
    ;(teams as any[]).forEach((t: any) => {
      const tipo = t.team_type?.nome || 'Outros'
      map[tipo] = (map[tipo] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [teams])

  // Dados para gráfico de escalas por semana do mês
  const schedulesByWeek = useMemo(() => {
    const weeks: Record<string, number> = { 'Sem 1': 0, 'Sem 2': 0, 'Sem 3': 0, 'Sem 4': 0 }
    schedules.forEach(s => {
      const day = parseInt(format(parseISO(s.date), 'd'))
      if (day <= 7) weeks['Sem 1']++
      else if (day <= 14) weeks['Sem 2']++
      else if (day <= 21) weeks['Sem 3']++
      else weeks['Sem 4']++
    })
    return Object.entries(weeks).map(([name, escalas]) => ({ name, escalas }))
  }, [schedules])

  // Membros mais escalados
  const topMembers = useMemo(() => {
    const map: Record<string, { nome: string; count: number }> = {}
    schedules.forEach(s => {
      s.members?.forEach(m => {
        const nome = m.team_member?.user?.nome || 'Desconhecido'
        const id = m.team_member_id
        if (!map[id]) map[id] = { nome, count: 0 }
        map[id].count++
      })
    })
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [schedules])

  const PIE_COLORS = ['#9333ea', '#ec4899', '#3b82f6', '#22c55e', '#f97316']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Gerencial</h1>
        <p className="text-gray-500 mt-1">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Usuários Ativos" value={(users as any[])?.length || 0} description="Cadastrados no sistema" icon={Users} />
          <StatsCard title="Equipes" value={(teams as any[]).length} description="Equipes ativas" icon={TrendingUp} />
          <StatsCard title="Escalas este mês" value={schedules.length} description={format(new Date(), 'MMMM yyyy', { locale: ptBR })} icon={Calendar} />
          <StatsCard title="Músicas" value={(songs as any[]).length} description="No repertório" icon={Music} />
        </div>
      )}

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Escalas por semana */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📊 Escalas por Semana — {format(new Date(), 'MMMM', { locale: ptBR })}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSchedules ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>
            ) : schedules.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                Nenhuma escala este mês
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={schedulesByWeek} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v) => [`${v} escala(s)`, 'Escalas']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="escalas" fill="#9333ea" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Equipes por ministério */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🎯 Equipes por Ministério</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTeams ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>
            ) : teamsByMinistry.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                Nenhuma equipe cadastrada
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={teamsByMinistry}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {teamsByMinistry.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} equipe(s)`, n]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximas escalas + Top membros */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximas escalas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">📅 Próximas Escalas</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/louvor')} className="gap-1 text-xs">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {loadingSchedules ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : upcomingSchedules.length === 0 ? (
              <EmptyState icon={Calendar} title="Nenhuma escala próxima" description="Crie escalas no Dashboard de Louvor" />
            ) : (
              <div className="space-y-2">
                {upcomingSchedules.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="text-center min-w-[40px]">
                      <p className="text-xs text-gray-400 uppercase">{format(parseISO(s.date), 'EEE', { locale: ptBR })}</p>
                      <p className="text-base font-bold text-purple-700">{format(parseISO(s.date), 'dd')}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.title || 'Escala sem título'}</p>
                      <p className="text-xs text-gray-400">{s.members?.length || 0} membros · {s.songs?.length || 0} músicas</p>
                    </div>
                    <Badge variant={s.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                      {s.status === 'published' ? 'Publicada' : 'Rascunho'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Membros mais escalados */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">🏆 Membros Mais Escalados</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSchedules ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : topMembers.length === 0 ? (
              <EmptyState icon={Users} title="Sem dados" description="Crie escalas para ver estatísticas" />
            ) : (
              <div className="space-y-2">
                {topMembers.map((m, i) => (
                  <div key={m.nome} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-purple-300'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.nome}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 bg-purple-200 rounded-full" style={{ width: `${(m.count / topMembers[0].count) * 60}px` }}>
                        <div className="h-2 bg-purple-600 rounded-full" style={{ width: '100%' }} />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">{m.count}x</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerta de configuração inicial */}
      {(teams as any[]).length === 0 && !loadingTeams && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900">Configure o sistema para começar</h3>
                <ol className="list-decimal list-inside text-sm text-amber-800 mt-2 space-y-1">
                  <li>Cadastre os usuários do ministério</li>
                  <li>Crie a equipe de Louvor</li>
                  <li>Adicione membros com suas funções</li>
                  <li>Crie as primeiras escalas</li>
                </ol>
                <Button className="mt-3 bg-amber-600 hover:bg-amber-700" onClick={() => navigate('/gerencial/equipes')}>
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
