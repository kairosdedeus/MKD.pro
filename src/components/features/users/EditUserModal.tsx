import { useState, useEffect, useMemo } from 'react'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useProfiles } from '@/hooks/useUsers'
import { useTeams } from '@/hooks/useTeams'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { supabase } from '@/lib/supabaseClient'
import { UserProfile } from '@/types'
import { PhoneInput } from '@/components/ui/phone-input'
import { formatPhone } from '@/hooks/usePhoneMask'
import { getSelectedTeamTypeCodes, getTeamsByType, TEAM_TYPE_LABELS } from '@/lib/team-flow'
import { useQueryClient } from '@tanstack/react-query'
import { getAvailableGeneratedEmail } from '@/lib/user-email'

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
  const queryClient = useQueryClient()

  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [generatedEmail, setGeneratedEmail] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !open) return

    const parts = user.nome.trim().split(' ')
    setNome(parts[0] || '')
    setSobrenome(parts.slice(1).join(' ') || '')
    setTelefone(formatPhone(user.telefone || ''))
    setGeneratedEmail(user.email)
    loadUserData(user.id)
  }, [user, open])

  useEffect(() => {
    let active = true

    if (!nome || !sobrenome || !user?.id) return

    getAvailableGeneratedEmail(nome, sobrenome, user.id)
      .then(email => {
        if (active) setGeneratedEmail(email)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [nome, sobrenome, user?.id])

  const loadUserData = async (userId: string) => {
    const { data: userProfiles } = await (supabase as any)
      .from('user_profiles')
      .select('profile_id')
      .eq('user_id', userId)

    setSelectedProfiles((userProfiles || []).map((up: any) => up.profile_id))

    const { data: teamMembers } = await (supabase as any)
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .eq('ativo', true)

    setSelectedTeamIds((teamMembers || []).map((member: any) => member.team_id))
  }

  const selectedTeamTypeCodes = useMemo(
    () => getSelectedTeamTypeCodes(selectedProfiles, (profiles as any[]) || []),
    [selectedProfiles, profiles],
  )

  const teamGroups = useMemo(
    () => getTeamsByType((teams as any[]) || [], selectedTeamTypeCodes),
    [teams, selectedTeamTypeCodes],
  )

  const missingTeamGroups = teamGroups.filter(group => group.teams.length === 0)
  const hasUnselectedTeamGroup = teamGroups.some(group =>
    group.teams.length > 0 && !group.teams.some((team: any) => selectedTeamIds.includes(team.id)),
  )

  useEffect(() => {
    const availableIds = new Set(teamGroups.flatMap(group => group.teams.map((team: any) => team.id)))
    const autoSelectedIds = teamGroups
      .filter(group => group.teams.length === 1)
      .map(group => group.teams[0].id)

    setSelectedTeamIds(prev => Array.from(new Set([
      ...prev.filter(id => availableIds.has(id)),
      ...autoSelectedIds,
    ])))
  }, [teamGroups])

  const toggleProfile = (profileId: string) => {
    setSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId],
    )
  }

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId],
    )
  }

  const handleSave = async () => {
    if (!user) return
    if (!nome.trim() || !sobrenome.trim()) {
      toast({ variant: 'destructive', title: 'Nome e sobrenome sao obrigatorios' })
      return
    }
    if (selectedProfiles.length === 0) {
      toast({ variant: 'destructive', title: 'Selecione pelo menos um perfil' })
      return
    }
    if (missingTeamGroups.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Cadastre uma equipe primeiro',
        description: `Nao ha equipe cadastrada para: ${missingTeamGroups.map(group => group.label).join(', ')}.`,
      })
      return
    }
    if (hasUnselectedTeamGroup) {
      toast({
        variant: 'destructive',
        title: 'Selecione as equipes',
        description: 'Escolha pelo menos uma equipe para cada ministerio selecionado.',
      })
      return
    }

    try {
      setSaving(true)
      const nomeCompleto = `${nome.trim()} ${sobrenome.trim()}`

      const { error: updateError } = await supabase
        .from('users_profile')
        .update({ nome: nomeCompleto, email: generatedEmail, telefone: telefone || null } as any)
        .eq('id', user.id)

      if (updateError) throw updateError

      await (supabase as any).from('user_profiles').delete().eq('user_id', user.id)
      await (supabase as any).from('user_profiles').insert(
        selectedProfiles.map(profileId => ({ user_id: user.id, profile_id: profileId })),
      )

      await (supabase as any)
        .from('team_members')
        .delete()
        .eq('user_id', user.id)

      if (selectedTeamIds.length > 0) {
        await (supabase as any)
          .from('team_members')
          .upsert(
            selectedTeamIds.map(teamId => ({ team_id: teamId, user_id: user.id, ativo: true })),
            { onConflict: 'team_id,user_id', ignoreDuplicates: true },
          )
      }

      toast({ title: 'Usuario atualizado com sucesso!' })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar usuario', description: error.message })
    } finally {
      setSaving(false)
    }
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
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>Atualize os dados do usuario</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Michael" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label>Sobrenome *</Label>
              <Input value={sobrenome} onChange={e => setSobrenome(e.target.value)} placeholder="Ex: Felipe Cabrera" autoComplete="off" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email / Login</Label>
            <Input value={generatedEmail} disabled className="bg-gray-50" />
            <p className="text-xs text-muted-foreground">
              Gerado automaticamente: primeira letra do nome + ultimo sobrenome @mkd.com
            </p>
          </div>

          <div className="space-y-2">
            <Label>Telefone (opcional)</Label>
            <PhoneInput value={telefone} onChange={setTelefone} />
          </div>

          <div className="space-y-2">
            <Label>Perfil do Usuario *</Label>
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

          {teamGroups.length > 0 && (
            <div className="space-y-2">
              <Label>Equipes do Usuario *</Label>
              {teamGroups.map(group => (
                <div key={group.code} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{TEAM_TYPE_LABELS[group.code] || group.code}</p>
                    <span className="text-xs text-muted-foreground">
                      {group.teams.filter((team: any) => selectedTeamIds.includes(team.id)).length} selecionada(s)
                    </span>
                  </div>

                  {group.teams.length === 0 ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      Nenhuma equipe cadastrada para este ministerio. Cadastre uma equipe primeiro em Gerencial &gt; Equipes.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {group.teams.map((team: any) => (
                        <label key={team.id} className="flex items-center gap-2 rounded-md bg-purple-50 px-3 py-2 text-sm text-purple-800">
                          <Checkbox
                            checked={selectedTeamIds.includes(team.id)}
                            onCheckedChange={() => toggleTeam(team.id)}
                            disabled={group.teams.length === 1}
                          />
                          <span className="font-medium">{team.nome}</span>
                          {group.teams.length === 1 && (
                            <span className="ml-auto text-xs text-purple-500">Selecionada automaticamente</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              saving ||
              selectedProfiles.length === 0 ||
              !nome ||
              !sobrenome ||
              missingTeamGroups.length > 0 ||
              hasUnselectedTeamGroup
            }
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saving ? 'Salvando...' : 'Salvar Alteracoes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
