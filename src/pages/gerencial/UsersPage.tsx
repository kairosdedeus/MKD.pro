import { useState } from 'react'
import {
  Plus, User, Pencil, Trash2, MoreVertical,
  PowerOff, Power, KeyRound, History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination, usePagination } from '@/components/shared/Pagination'
import { CreateUserModal } from '@/components/features/users/CreateUserModal'
import { EditUserModal } from '@/components/features/users/EditUserModal'
import { useUsers } from '@/hooks/useUsers'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabaseClient'
import { UserProfile } from '@/types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function UsersPage() {
  const { toast } = useToast()
  const { data: users, isLoading, refetch } = useUsers()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null)
  const [deactivatingUser, setDeactivatingUser] = useState<UserProfile | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<UserProfile | null>(null)
  const [historyUser, setHistoryUser] = useState<UserProfile | null>(null)
  const [historyData, setHistoryData] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [processing, setProcessing] = useState(false)

  const { currentPage, totalPages, paginatedItems: pagedUsers, goToPage } = usePagination(users || [], 10)

  // ── Excluir ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingUser) return
    try {
      setProcessing(true)
      const { data: teamMembers } = await (supabase as any)
        .from('team_members').select('id').eq('user_id', deletingUser.id)

      if (teamMembers?.length) {
        const tmIds = teamMembers.map((tm: any) => tm.id)
        const { data: sms } = await (supabase as any)
          .from('schedule_members').select('id').in('team_member_id', tmIds)
        if (sms?.length) {
          await (supabase as any).from('schedule_member_functions')
            .delete().in('schedule_member_id', sms.map((s: any) => s.id))
          await (supabase as any).from('schedule_members').delete().in('team_member_id', tmIds)
        }
        await (supabase as any).from('team_member_functions').delete().in('team_member_id', tmIds)
        await (supabase as any).from('team_members').delete().eq('user_id', deletingUser.id)
      }

      await (supabase as any).from('user_profiles').delete().eq('user_id', deletingUser.id)
      await (supabase as any).from('users_profile').delete().eq('id', deletingUser.id)

      if (deletingUser.auth_user_id) {
        await (supabase as any).from('auth.identities').delete().eq('user_id', deletingUser.auth_user_id)
        await (supabase as any).from('auth.users').delete().eq('id', deletingUser.auth_user_id)
      }

      toast({ title: '✅ Usuário excluído!' })
      setDeletingUser(null)
      refetch()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message })
    } finally {
      setProcessing(false)
    }
  }

  // ── Desativar / Reativar ──────────────────────────────────────────────────
  const handleToggleActive = async (user: UserProfile) => {
    try {
      await (supabase as any)
        .from('users_profile')
        .update({ ativo: !user.ativo })
        .eq('id', user.id)
      toast({ title: user.ativo ? '⏸ Usuário desativado' : '▶ Usuário reativado' })
      setDeactivatingUser(null)
      refetch()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message })
    }
  }

  // ── Resetar Senha ─────────────────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return
    if (newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'Senha deve ter pelo menos 8 caracteres' })
      return
    }
    try {
      setResetting(true)
      const { error } = await (supabase as any).rpc('reset_user_password', {
        p_email: resetPasswordUser.email,
        p_new_password: newPassword,
      })
      if (error) throw error
      toast({ title: '✅ Senha redefinida com sucesso!' })
      setResetPasswordUser(null)
      setNewPassword('')
    } catch (error: any) {
      // Fallback: tentar via SQL direto
      try {
        await (supabase as any).rpc('exec_sql', {
          sql: `UPDATE auth.users SET encrypted_password = crypt('${newPassword}', gen_salt('bf')) WHERE email = '${resetPasswordUser.email}'`
        })
        toast({ title: '✅ Senha redefinida!' })
        setResetPasswordUser(null)
        setNewPassword('')
      } catch {
        toast({
          variant: 'destructive',
          title: 'Não foi possível redefinir a senha pelo sistema',
          description: 'Use o SQL Editor do Supabase: supabase/utils/resetar-senha.sql',
        })
      }
    } finally {
      setResetting(false)
    }
  }

  // ── Histórico de Escalas ──────────────────────────────────────────────────
  const handleViewHistory = async (user: UserProfile) => {
    setHistoryUser(user)
    setHistoryData([])
    setLoadingHistory(true)
    try {
      const { data } = await (supabase as any)
        .from('schedule_members')
        .select(`
          id,
          schedule:schedules (
            id, date, title, status,
            team:teams ( nome, team_type:team_types ( nome ) )
          ),
          team_member:team_members ( user_id ),
          functions:schedule_member_functions (
            function:team_functions ( nome )
          )
        `)
        .eq('team_member.user_id', user.id)
        .order('schedule(date)', { ascending: false })
        .limit(20)

      setHistoryData(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingHistory(false)
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600 mt-2">Gerencie os usuários do sistema</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Todos os Usuários</span>
            <span className="text-sm font-normal text-gray-400">{users?.length || 0} usuário(s)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email / Login</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedUsers.map(user => (
                  <TableRow key={user.id} className={!user.ativo ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                          user.ativo ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {user.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{user.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{user.email}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{user.telefone || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={user.ativo ? 'default' : 'secondary'}>
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs text-gray-400">Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Pencil className="h-4 w-4 mr-2 text-blue-600" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewHistory(user)}>
                            <History className="h-4 w-4 mr-2 text-purple-600" /> Histórico de Escalas
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setResetPasswordUser(user); setNewPassword('') }}>
                            <KeyRound className="h-4 w-4 mr-2 text-amber-600" /> Redefinir Senha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeactivatingUser(user)}>
                            {user.ativo
                              ? <><PowerOff className="h-4 w-4 mr-2 text-orange-500" /> Desativar</>
                              : <><Power className="h-4 w-4 mr-2 text-green-600" /> Reativar</>
                            }
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeletingUser(user)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={User}
              title="Nenhum usuário cadastrado"
              description="Crie seu primeiro usuário para começar"
              action={{ label: 'Novo Usuário', onClick: () => setCreateModalOpen(true) }}
            />
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={users?.length || 0}
            pageSize={10}
            onPageChange={goToPage}
          />
        </CardContent>
      </Card>

      {/* Modal Criar */}
      <CreateUserModal open={createModalOpen} onOpenChange={setCreateModalOpen} onSuccess={refetch} />

      {/* Modal Editar */}
      <EditUserModal
        open={!!editingUser}
        onOpenChange={o => !o && setEditingUser(null)}
        user={editingUser}
        onSuccess={refetch}
      />

      {/* AlertDialog Desativar/Reativar */}
      <AlertDialog open={!!deactivatingUser} onOpenChange={o => !o && setDeactivatingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deactivatingUser?.ativo ? 'Desativar usuário?' : 'Reativar usuário?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deactivatingUser?.ativo
                ? `"${deactivatingUser?.nome}" não conseguirá fazer login enquanto estiver desativado.`
                : `"${deactivatingUser?.nome}" poderá fazer login novamente.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={deactivatingUser?.ativo ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}
              onClick={() => deactivatingUser && handleToggleActive(deactivatingUser)}
            >
              {deactivatingUser?.ativo ? 'Desativar' : 'Reativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Excluir */}
      <AlertDialog open={!!deletingUser} onOpenChange={o => !o && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deletingUser?.nome}</strong> ({deletingUser?.email}) será removido completamente,
              incluindo histórico de escalas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={processing}>
              {processing ? 'Excluindo...' : 'Excluir permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Redefinir Senha */}
      <Dialog open={!!resetPasswordUser} onOpenChange={o => !o && setResetPasswordUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>🔑 Redefinir Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Usuário: <strong>{resetPasswordUser?.nome}</strong></p>
              <p className="text-sm text-gray-600">Email: <strong>{resetPasswordUser?.email}</strong></p>
            </div>
            <div className="space-y-2">
              <Label>Nova Senha *</Label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              {newPassword && newPassword.length < 8 && (
                <p className="text-xs text-red-500">Mínimo 8 caracteres</p>
              )}
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                ⚠️ Se o botão não funcionar, use o SQL Editor do Supabase:
                <br /><code className="font-mono">supabase/utils/resetar-senha.sql</code>
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setResetPasswordUser(null)}>Cancelar</Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetting || !newPassword || newPassword.length < 8}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {resetting ? 'Redefinindo...' : '🔑 Redefinir Senha'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico de Escalas */}
      <Dialog open={!!historyUser} onOpenChange={o => !o && setHistoryUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📅 Histórico de Escalas — {historyUser?.nome}</DialogTitle>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : historyData.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <History className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Nenhuma escala encontrada para este usuário</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyData.map((item: any) => {
                const schedule = item.schedule
                if (!schedule) return null
                const fns = (item.functions || []).map((f: any) => f.function?.nome).filter(Boolean)
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="text-center min-w-[48px]">
                      <p className="text-xs text-gray-400 uppercase">
                        {format(parseISO(schedule.date), 'EEE', { locale: ptBR })}
                      </p>
                      <p className="text-lg font-bold text-purple-700">
                        {format(parseISO(schedule.date), 'dd')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(parseISO(schedule.date), 'MMM', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{schedule.title || 'Escala sem título'}</p>
                      <p className="text-xs text-gray-400">{schedule.team?.nome}</p>
                      {fns.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {fns.map((fn: string) => (
                            <span key={fn} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                              {fn}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant={schedule.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                      {schedule.status === 'published' ? 'Publicada' : schedule.status === 'completed' ? 'Concluída' : 'Rascunho'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
