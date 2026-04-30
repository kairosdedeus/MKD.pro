import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useCreateUser, useProfiles } from '@/hooks/useUsers'
import { useTeams } from '@/hooks/useTeams'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { supabase } from '@/lib/supabaseClient'
import { PhoneInput } from '@/components/ui/phone-input'

const userSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  sobrenome: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  telefone: z.string().optional(),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
})

type UserFormData = z.infer<typeof userSchema>

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function generateEmail(nome: string, sobrenome: string): string {
  const first = removeAccents(nome.trim().charAt(0)).toLowerCase()
  const parts = sobrenome.trim().split(' ').filter(s => s.length > 0)
  const last = removeAccents(parts[parts.length - 1] || sobrenome).toLowerCase()
  return `${first}${last}@mkd.com`
}

// Mapeamento: código do perfil → código do tipo de equipe
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
  // gerencial não tem equipe específica
}

const TEAM_TYPE_LABELS: Record<string, string> = {
  louvor:   '🎵 Louvor',
  danca:    '💃 Dança',
  midia:    '📹 Mídia',
  obreiros: '🤝 Obreiros',
  celula:   '🏠 Célula',
}

interface CreateUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateUserModal({ open, onOpenChange, onSuccess }: CreateUserModalProps) {
  const { toast } = useToast()
  const { data: profiles, isLoading: loadingProfiles } = useProfiles()
  const { teams, loading: loadingTeams } = useTeams()
  const createUser = useCreateUser()

  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [generatedEmail, setGeneratedEmail] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [telefone, setTelefone] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  })

  const nome = watch('nome')
  const sobrenome = watch('sobrenome')

  // Gerar email automaticamente
  useEffect(() => {
    if (nome && sobrenome) setGeneratedEmail(generateEmail(nome, sobrenome))
    else setGeneratedEmail('')
  }, [nome, sobrenome])

  // Detectar o tipo de equipe baseado nos perfis selecionados
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

  // Auto-selecionar se só tiver uma equipe disponível
  useEffect(() => {
    if (availableTeams.length === 1) {
      setSelectedTeamId(availableTeams[0].id)
    } else {
      setSelectedTeamId('')
    }
  }, [availableTeams.length, detectedTeamTypeCode])

  // Resetar ao fechar
  useEffect(() => {
    if (!open) {
      reset()
      setSelectedProfiles([])
      setGeneratedEmail('')
      setSelectedTeamId('')
      setTelefone('')
    }
  }, [open])

  const onSubmit = async (data: UserFormData) => {
    if (!generatedEmail) {
      toast({ variant: 'destructive', title: 'Preencha nome e sobrenome' })
      return
    }
    if (selectedProfiles.length === 0) {
      toast({ variant: 'destructive', title: 'Selecione pelo menos um perfil' })
      return
    }
    // Obrigar seleção de equipe quando há mais de uma disponível
    if (availableTeams.length > 1 && !selectedTeamId) {
      toast({ variant: 'destructive', title: 'Selecione a equipe', description: 'Há mais de uma equipe disponível para este perfil.' })
      return
    }

    try {
      const nomeCompleto = `${data.nome} ${data.sobrenome}`

      // 1. Criar usuário
      const result = await createUser.mutateAsync({
        nome: nomeCompleto,
        email: generatedEmail,
        telefone: telefone || undefined,
        password: data.password,
        profiles: selectedProfiles,
      })

      // 2. Adicionar à equipe se detectada
      const teamToAdd = selectedTeamId || (availableTeams.length === 1 ? availableTeams[0].id : null)
      if (teamToAdd && result?.id) {
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({ team_id: teamToAdd, user_id: result.id, ativo: true } as any)

        if (memberError && memberError.code !== '23505') {
          console.error('Erro ao adicionar à equipe:', memberError)
          toast({
            variant: 'destructive',
            title: 'Usuário criado, mas não foi adicionado à equipe',
            description: memberError.message,
          })
        }
      }

      const teamName = (teams as any[]).find((t: any) => t.id === teamToAdd)?.nome
      toast({
        title: '✅ Usuário criado!',
        description: teamName
          ? `Login: ${generatedEmail} · Adicionado à equipe ${teamName}`
          : `Login: ${generatedEmail}`,
      })

      reset()
      setSelectedProfiles([])
      setGeneratedEmail('')
      setSelectedTeamId('')
      setTelefone('')
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar usuário',
        description: error.message || 'Tente novamente mais tarde.',
      })
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
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>Crie um novo usuário no sistema</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, errs => console.log('Erros:', errs))} className="space-y-4">

          {/* Nome e Sobrenome */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" placeholder="Ex: Michael" autoComplete="off" {...register('nome')} />
              {errors.nome && <p className="text-sm text-red-600">{errors.nome.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sobrenome">Sobrenome *</Label>
              <Input id="sobrenome" placeholder="Ex: Felipe Cabrera" autoComplete="off" {...register('sobrenome')} />
              {errors.sobrenome && <p className="text-sm text-red-600">{errors.sobrenome.message}</p>}
            </div>
          </div>

          {/* Email gerado */}
          <div className="space-y-1.5">
            <Label>Email (gerado automaticamente)</Label>
            <Input value={generatedEmail} disabled placeholder="Preencha nome e sobrenome" className="bg-gray-50" />
            <p className="text-xs text-muted-foreground">
              Regra: primeira letra do nome + último sobrenome @mkd.com
            </p>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <PhoneInput
              id="telefone"
              value={telefone}
              onChange={setTelefone}
            />
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input id="password" type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" {...register('password')} />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>

          {/* Perfis — escolher PRIMEIRO */}
          <div className="space-y-2">
            <Label>Perfil do Usuário *</Label>
            <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
              {(profiles as any[])?.map((profile: any) => (
                <div key={profile.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`profile-${profile.id}`}
                    checked={selectedProfiles.includes(profile.id)}
                    onCheckedChange={() => toggleProfile(profile.id)}
                  />
                  <label htmlFor={`profile-${profile.id}`} className="text-sm font-medium cursor-pointer">
                    {profile.nome}
                  </label>
                </div>
              ))}
            </div>
            {selectedProfiles.length === 0 && (
              <p className="text-sm text-red-600">Selecione pelo menos um perfil</p>
            )}
            <p className="text-sm text-muted-foreground">{selectedProfiles.length} perfil(is) selecionado(s)</p>
          </div>

          {/* Equipe — aparece APÓS selecionar perfil com ministério */}
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
                    Crie uma equipe primeiro em <strong>Gerencial → Equipes</strong>.
                  </p>
                </div>
              ) : availableTeams.length === 1 ? (
                <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-sm font-medium text-purple-800">{availableTeams[0].nome}</span>
                  <span className="text-xs text-purple-500 ml-auto">Selecionada automaticamente</span>
                </div>
              ) : (
                <>
                  <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    <SelectTrigger className={!selectedTeamId ? 'border-amber-400' : 'border-purple-300'}>
                      <SelectValue placeholder={`Selecione a equipe de ${detectedTeamTypeCode}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeams.map((team: any) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedTeamId && (
                    <p className="text-xs text-amber-600">⚠️ Selecione a equipe para adicionar o membro</p>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                createUser.isPending ||
                selectedProfiles.length === 0 ||
                !generatedEmail ||
                !nome ||
                !sobrenome ||
                (availableTeams.length > 1 && !selectedTeamId)
              }
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createUser.isPending ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
