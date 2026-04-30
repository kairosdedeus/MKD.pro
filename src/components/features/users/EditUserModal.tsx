import { useState, useEffect, useMemo } from 'react'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useProfiles } from '@/hooks/useUsers'
import { useTeams } from '@/hooks/useTeams'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { supabase } from '@/lib/supabaseClient'
import { UserProfile } from '@/types'
import { PhoneInput } from '@/components/ui/phone-input'
import { formatPhone } from '@/hooks/usePhoneMask'

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function generateEmail(nome: string, sobrenome: string): string {
  const first = removeAccents(nome.trim().charAt(0)).toLowerCase()
  const parts = sobrenome.trim().split(' ').filter(s => s.length > 0)
  const last = removeAccents(parts[parts.length - 1] || sobrenome).toLowerCase()
  return `${first}${last}@mkd.com`
}

// Mapeamento perfil → tipo de equipe
const PROFILE_TO_TEAM_TYPE: Record<string, string> = {
  lider_louvor:    'louvor',
  membro_louvor:   'louvor',
  lider_danca:     'danca',
  membro_danca:    'danca',
  lider_midia:     'midia',
  membro_midia:    'midia',
  lider_obreiros:  'obreiros',
  membro_obreiro:  'obreiros',
  lider_celula:    'celula',
  auxiliar_celula: 'celula',
  membro_celula:   'celula',
}

const TEAM_TYPE_LABELS: Record<string, string> = {
  louvor:   '🎵 Louvor',
  danca:    '💃 Dança',
  midia:    '📹 Mídia',
  obreiros: '🤝 Obreiros',
  celula:   '🏠 Célula',
}

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserProfile | null
  onSuccess?: () => void
}

export function EditUserModal({ open, onOpenChange, user, onSuccess }: EditUserModalProps) {
  const { toast } = useToast()
  const { data: profiles, isLoading: loadingProfiles } = useProfiles()
  const { teams, loading: loadingTeams } = useTeams()

  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [currentTeamId, setCurrentTeamId] = useState('')
  const [generatedEmail, setGeneratedEmail] = useState('')
  const [saving, setSaving] = useState(false)

  // Preencher dados ao abrir
  useEffect(() => {
    if (!user || !open) return

    // Separar nome e sobrenome
    const parts = user.nome.trim().split(' ')
    const firstName = parts[0] || ''
    const lastName = parts.slice(1).join(' ') || ''
    setNome(firstName)
    setSobrenome(lastName)
    setTelefone(formatPhone(user.telefone || ''))
    setGeneratedEmail(user.email)

    // Carregar perfis do usuário
    loadUserData(user.id)
  }, [user, open])

  // Atualizar email ao mudar nome/sobrenome
  useEffect(() => {
    if (nome && sobrenome) {
      setGeneratedEmail(generateEmail(nome, sobrenome))
    }
  }, [nome, sobrenome])

  const loadUserData = async (userId: string) => {
    // Buscar perfis do usuário
    const { data: userProfiles } = await (supabase as any)
      .from('user_profiles')
      .select('profile_id')
      .eq('user_id', userId)

    if (userProfiles) {
      setSelectedProfiles(userProfiles.map((up: any) => up.profile_id))
    }

    // Buscar equipe atual do usuário
    const { data: teamMember } = await (supabase as any)
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (teamMember) {
      setCurrentTeamId(teamMember.team_id)
      setSelectedTeamId(teamMember.team_id)
    } else {
      setCurrentTeamId('')
      setSelectedTeamId('')
    }
  }

  // Detectar tipo de equipe baseado nos perfis
  const detectedTeamTypeCode = useMemo(() => {
    const allProfiles = (profiles as any[]) || []
    for (const profileId of selectedProfiles) {
      const profile = allProfiles.find((p: any) => p.id === profileId)
      if (profile && PROFILE_TO_TEAM_TYPE[profile.codigo]) {
        return PROFILE_TO_TEAM_TYPE[profile.codigo]
      }
    }
    return null
  }, [selectedProfiles, profiles])

  // Equipes disponíveis para o tipo detectado
  const availableTeams = useMemo(() => {
    if (!detectedTeamTypeCode) return []
    return (teams as any[]).filter((t: any) => t.team_type?.codigo === detectedTeamTypeCode)
  }, [detectedTeamTypeCode, teams])

  // Auto-selecionar se só tiver uma equipe
  useEffect(() => {
    if (availableTeams.length === 1 && !currentTeamId) {
      setSelectedTeamId(availableTeams[0].id)
    }
  }, [availableTeams.length])

  const handleSave = async () => {
    if (!user) return
    if (!nome.trim() || !sobrenome.trim()) {
      toast({ variant: 'destructive', title: 'Nome e sobrenome são obrigatórios' })
      return
    }
    if (selectedProfiles.length === 0) {
      toast({ variant: 'destructive', title: 'Selecione pelo menos um perfil' })
      return
    }
    if (availableTeams.length > 1 && !selectedTeamId) {
      toast({ variant: 'destructive', title: 'Selecione a equipe' })
      return
    }

    try {
      setSaving(true)
      const nomeCompleto = `${nome.trim()} ${sobrenome.trim()}`

      // 1. Atualizar nome, email e telefone
      const { error: updateError } = await supabase
        .from('users_profile')
        .update({ nome: nomeCompleto, email: generatedEmail, telefone: telefone || null } as any)
        .eq('id', user.id)

      if (updateError) throw updateError

      // 2. Atualizar email no auth.users
      if (generatedEmail !== user.email) {
        await (supabase as any)
          .from('auth.users')
          .update({ email: generatedEmail })
          .eq('id', user.auth_user_id)
        // Nota: atualizar email no auth requer admin API, apenas atualizamos no profile
      }

      // 3. Atualizar perfis
      await (supabase as any).from('user_profiles').delete().eq('user_id', user.id)
      if (selectedProfiles.length > 0) {
        await (supabase as any).from('user_profiles').insert(
          selectedProfiles.map(pid => ({ user_id: user.id, profile_id: pid }))
        )
      }

      // 4. Atualizar equipe
      const teamToAdd = selectedTeamId || (availableTeams.length === 1 ? availableTeams[0].id : null)

      if (currentTeamId && currentTeamId !== teamToAdd) {
        // Remover da equipe antiga
        await (supabase as any)
          .from('team_members')
          .delete()
          .eq('user_id', user.id)
          .eq('team_id', currentTeamId)
      }

      if (teamToAdd && teamToAdd !== currentTeamId) {
        // Adicionar à nova equipe (ignorar se já for membro)
        await (supabase as any)
          .from('team_members')
          .upsert(
            { team_id: teamToAdd, user_id: user.id, ativo: true },
            { onConflict: 'team_id,user_id', ignoreDuplicates: true }
          )
      }

      toast({ title: '✅ Usuário atualizado com sucesso!' })
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error(error)
      toast({ variant: 'destructive', title: 'Erro ao atualizar usuário', description: error.message })
    } finally {
      setSaving(false)
    }
  }

  const toggleProfile = (profileId: string) => {
    setSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    )
  }

  if (loadingProfiles || loadingTeams) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent><LoadingSpinner /></DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>✏️ Editar Usuário</DialogTitle>
          <DialogDescription>Atualize os dados do usuário</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome e Sobrenome */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Michael"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Sobrenome *</Label>
              <Input
                value={sobrenome}
                onChange={e => setSobrenome(e.target.value)}
                placeholder="Ex: Felipe Cabrera"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Email gerado */}
          <div className="space-y-1.5">
            <Label>Email / Login</Label>
            <Input value={generatedEmail} disabled className="bg-gray-50" />
            <p className="text-xs text-muted-foreground">
              Gerado automaticamente: primeira letra do nome + último sobrenome @mkd.com
            </p>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label>Telefone (opcional)</Label>
            <PhoneInput
              value={telefone}
              onChange={setTelefone}
            />
          </div>

          {/* Perfis */}
          <div className="space-y-2">
            <Label>Perfil do Usuário *</Label>
            <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
              {(profiles as any[])?.map((profile: any) => (
                <div key={profile.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-profile-${profile.id}`}
                    checked={selectedProfiles.includes(profile.id)}
                    onCheckedChange={() => toggleProfile(profile.id)}
                  />
                  <label htmlFor={`edit-profile-${profile.id}`} className="text-sm font-medium cursor-pointer">
                    {profile.nome}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{selectedProfiles.length} perfil(is) selecionado(s)</p>
          </div>

          {/* Equipe — aparece após selecionar perfil com ministério */}
          {detectedTeamTypeCode && (
            <div className="space-y-2">
              <Label>
                Equipe de {TEAM_TYPE_LABELS[detectedTeamTypeCode] || detectedTeamTypeCode}
                {availableTeams.length > 1 && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {availableTeams.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    ⚠️ Nenhuma equipe de {TEAM_TYPE_LABELS[detectedTeamTypeCode]} cadastrada.
                  </p>
                </div>
              ) : availableTeams.length === 1 ? (
                <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-sm font-medium text-purple-800">{availableTeams[0].nome}</span>
                  <span className="text-xs text-purple-500 ml-auto">Única equipe disponível</span>
                </div>
              ) : (
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map((team: any) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || selectedProfiles.length === 0 || !nome || !sobrenome}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saving ? 'Salvando...' : '💾 Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
