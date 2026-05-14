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
import { format, parseISO, isFuture, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

const PIE_COLORS = ['#8b5cf6','#ec4899','#3b82f6','#10b981','#f59e0b']

export function GerencialDashboard() {
  const navigate = useNavigate()
  const { data: users, isLoading: loadingUsers } = useUsers()
  const { teams, loading: loadingTeams } = useTeams()
  const { songs, loading: loadingSongs } = useSongs()
  const worshipTeam = (teams as any[]).find((t: any) => t.team_type?.codigo === 'louvor')
  const { schedules, loading: loadingSchedules } = useSchedules(worshipTeam?.id || '', new Date())
  const isLoading = loadingUsers || loadingTeams || loadingSongs

  const upcomingSchedules = useMemo(() =>
    schedules.filter(s => isToday(parseISO(s.date)) || isFuture(parseISO(s.date)))
      .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
    [schedules])

  const teamsByMinistry = useMemo(() => {
    const map: Record<string, number> = {}
    ;(teams as any[]).forEach((t: any) => { const n = t.team_type?.nome || 'Outros'; map[n] = (map[n] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [teams])

  const schedulesByWeek = useMemo(() => {
    const weeks: Record<string, number> = { 'Sem 1': 0, 'Sem 2': 0, 'Sem 3': 0, 'Sem 4': 0 }
    schedules.forEach(s => {
      const d = parseInt(format(parseISO(s.date), 'd'))
      if (d <= 7) weeks['Sem 1']++
      else if (d <= 14) weeks['Sem 2']++
      else if (d <= 21) weeks['Sem 3']++
      else weeks['Sem 4']++
    })
    return Object.entries(weeks).map(([name, escalas]) => ({ name, escalas }))
  }, [schedules])

  const topMembers = useMemo(() => {
    const map: Record<string, { nome: string; count: number }> = {}
    schedules.forEach(s => s.members?.forEach((m: typeof s.members[number]) => {
      const nome = m.team_member?.user?.nome || 'Desconhecido'
      const id = m.team_member_id
      if (!map[id]) map[id] = { nome, count: 0 }
      map[id].count++
    }))
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [schedules])

  const emptyChartMsg = (msg: string) => (
    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">{msg}</div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Gerencial</h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📊 Escalas por Semana — {format(new Date(), 'MMMM', { locale: ptBR })}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSchedules ? emptyChartMsg('Carregando...') : schedules.length === 0 ? emptyChartMsg('Nenhuma escala este mês') : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={schedulesByWeek} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v) => [`${v} escala(s)`, 'Escalas']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Bar dataKey="escalas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">🎯 Equipes por Ministério</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTeams ? emptyChartMsg('Carregando...') : teamsByMinistry.length === 0 ? emptyChartMsg('Nenhuma equipe cadastrada') : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={teamsByMinistry} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {teamsByMinistry.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} equipe(s)`, n]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">📅 Próximas Escalas</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/louvor')} className="gap-1 text-xs">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {loadingSchedules ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
            ) : upcomingSchedules.length === 0 ? (
              <EmptyState icon={Calendar} title="Nenhuma escala próxima" description="Crie escalas no Dashboard de Louvor" />
            ) : (
              <div className="space-y-2">
                {upcomingSchedules.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                    <div className="text-center min-w-[40px]">
                      <p className="text-xs text-muted-foreground uppercase">{format(parseISO(s.date), 'EEE', { locale: ptBR })}</p>
                      <p className="text-base font-bold text-primary">{format(parseISO(s.date), 'dd')}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.title || 'Escala sem título'}</p>
                      <p className="text-xs text-muted-foreground">{s.members?.length || 0} membros · {s.songs?.length || 0} músicas</p>
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">🏆 Membros Mais Escalados</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSchedules ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
            ) : topMembers.length === 0 ? (
              <EmptyState icon={Users} title="Sem dados" description="Crie escalas para ver estatísticas" />
            ) : (
              <div className="space-y-2">
                {topMembers.map((m, i) => (
                  <div key={m.nome} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                      i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-muted-foreground' : i === 2 ? 'bg-amber-600' : 'bg-primary/40'
                    }`}>
                      {i + 1}
                    </div>
                    <p className="text-sm font-medium flex-1 truncate">{m.nome}</p>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden" style={{ width: '60px' }}>
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(m.count / topMembers[0].count) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{m.count}x</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(teams as any[]).length === 0 && !loadingTeams && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Configure o sistema para começar</h3>
                <ol className="list-decimal list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Cadastre os usuários do ministério</li>
                  <li>Crie a equipe de Louvor</li>
                  <li>Adicione membros com suas funções</li>
                  <li>Crie as primeiras escalas</li>
                </ol>
                <Button className="mt-3" onClick={() => navigate('/gerencial/equipes')}>
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
