import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { LogOut, User, KeyRound, ChevronDown } from 'lucide-react'
import { NotificationCenter } from '@/components/shared/NotificationCenter'
import { ThemeSelector } from '@/components/shared/ThemeSelector'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/use-toast'

function splitName(fullName?: string | null) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

export function Header() {
  const { user, logout, setUser } = useAuthStore()
  const { toast } = useToast()
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (!showProfileDialog || !user) return
    const { firstName: currentFirstName, lastName: currentLastName } = splitName(user.nome)
    setFirstName(currentFirstName)
    setLastName(currentLastName)
    setEmail(user.email || '')
    setNewPassword('')
    setConfirmPassword('')
  }, [showProfileDialog, user])

  const handleSaveProfile = async () => {
    if (!user) return

    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const fullName = [trimmedFirstName, trimmedLastName].filter(Boolean).join(' ')
    const emailChanged = trimmedEmail !== user.email
    const passwordChanged = !!newPassword || !!confirmPassword

    if (!trimmedFirstName) {
      toast({ variant: 'destructive', title: 'Informe seu nome' })
      return
    }
    if (!trimmedLastName) {
      toast({ variant: 'destructive', title: 'Informe seu sobrenome' })
      return
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast({ variant: 'destructive', title: 'Informe um email válido' })
      return
    }
    if (passwordChanged && newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'As senhas não coincidem' })
      return
    }
    if (passwordChanged && newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'Senha deve ter pelo menos 8 caracteres' })
      return
    }

    try {
      setSavingProfile(true)

      if (emailChanged) {
        const { data: existingEmail, error: emailCheckError } = await supabase
          .from('users_profile')
          .select('id')
          .eq('email', trimmedEmail)
          .neq('id', user.id)
          .maybeSingle()

        if (emailCheckError) throw emailCheckError
        if (existingEmail) {
          toast({ variant: 'destructive', title: 'Este email já está em uso' })
          return
        }
      }

      const authUpdates: { email?: string; password?: string } = {}
      if (emailChanged) authUpdates.email = trimmedEmail
      if (passwordChanged) authUpdates.password = newPassword

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates)
        if (authError) throw authError
      }

      const { data: updatedProfile, error: profileError } = await supabase
        .from('users_profile')
        .update({
          nome: fullName,
          email: trimmedEmail,
        })
        .eq('id', user.id)
        .select()
        .single()

      if (profileError) throw profileError

      setUser({
        ...user,
        ...updatedProfile,
      })

      toast({
        title: 'Dados atualizados!',
        description: emailChanged
          ? 'Se o Supabase exigir confirmação, valide o novo email antes de usá-lo no login.'
          : undefined,
      })
      setShowProfileDialog(false)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar seus dados',
        description: error.message,
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const initials = user?.nome
    ? user.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <>
      <header className="header-bg border-b">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <h2 className="min-w-0 truncate text-sm font-semibold text-gray-700 sm:text-base">
            Bem-vindo, <span className="text-purple-700">{user?.nome?.split(' ')[0]}</span>
          </h2>

          <div className="flex items-center gap-1">
            <ThemeSelector />
            <NotificationCenter />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                  <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <span className="text-sm text-gray-600 hidden sm:block max-w-48 truncate">{user?.email}</span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium truncate">{user?.nome}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                  <User className="h-4 w-4 mr-2 text-purple-600" />
                  Editar meus dados
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                  <KeyRound className="h-4 w-4 mr-2 text-amber-600" />
                  Alterar senha
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meus dados</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Sobrenome *</Label>
                <Input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email de entrada *</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Preencha a senha apenas se quiser alterá-la.
              </p>
              <div className="space-y-2">
                <Label>Nova senha</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmar nova senha</Label>
                <Input
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">As senhas não coincidem</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowProfileDialog(false)} disabled={savingProfile} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full bg-purple-600 hover:bg-purple-700 sm:w-auto">
              {savingProfile ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
