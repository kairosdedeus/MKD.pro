import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useCreateUser, useProfiles } from '@/hooks/useUsers'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const userSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  sobrenome: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  telefone: z.string().optional(),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
})

type UserFormData = z.infer<typeof userSchema>

// Função para remover acentos
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Função para gerar email
function generateEmail(nome: string, sobrenome: string): string {
  const primeiraLetraNome = removeAccents(nome.trim().charAt(0)).toLowerCase()
  const sobrenomes = sobrenome.trim().split(' ').filter(s => s.length > 0)
  const ultimoSobrenome = removeAccents(sobrenomes[sobrenomes.length - 1] || sobrenome).toLowerCase()
  
  return `${primeiraLetraNome}${ultimoSobrenome}@mkd.com`
}

interface CreateUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUserModal({ open, onOpenChange }: CreateUserModalProps) {
  const { toast } = useToast()
  const { data: profiles, isLoading: loadingProfiles } = useProfiles()
  const createUser = useCreateUser()
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [generatedEmail, setGeneratedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  })

  // Watch nome e sobrenome para gerar email automaticamente
  const nome = watch('nome')
  const sobrenome = watch('sobrenome')

  useEffect(() => {
    if (nome && sobrenome) {
      const email = generateEmail(nome, sobrenome)
      setGeneratedEmail(email)
    } else {
      setGeneratedEmail('')
    }
  }, [nome, sobrenome])

  const onSubmit = async (data: UserFormData) => {
    console.log('=== INICIANDO CRIAÇÃO DE USUÁRIO ===')
    console.log('Dados do formulário:', data)
    console.log('Email gerado:', generatedEmail)
    console.log('Perfis selecionados:', selectedProfiles)
    
    if (!generatedEmail) {
      console.error('Email não gerado!')
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Email não foi gerado. Preencha nome e sobrenome.',
      })
      return
    }

    if (selectedProfiles.length === 0) {
      console.error('Nenhum perfil selecionado!')
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione pelo menos um perfil.',
      })
      return
    }

    try {
      const nomeCompleto = `${data.nome} ${data.sobrenome}`
      console.log('Nome completo:', nomeCompleto)
      
      const userData = {
        nome: nomeCompleto,
        email: generatedEmail,
        telefone: data.telefone,
        password: data.password,
        profiles: selectedProfiles,
      }
      
      console.log('Dados para enviar:', userData)
      
      const result = await createUser.mutateAsync(userData)
      
      console.log('Usuário criado com sucesso:', result)
      
      toast({
        title: 'Usuário criado!',
        description: `Usuário criado com sucesso. Login: ${generatedEmail}`,
      })
      reset()
      setSelectedProfiles([])
      setGeneratedEmail('')
      onOpenChange(false)
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao criar usuário',
        description: error.message || 'Tente novamente mais tarde.',
      })
    }
  }

  console.log('Modal renderizado. handleSubmit configurado:', typeof handleSubmit)

  const toggleProfile = (profileId: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    )
  }

  if (loadingProfiles) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <LoadingSpinner />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>
            Crie um novo usuário no sistema
          </DialogDescription>
        </DialogHeader>

        <form 
          onSubmit={(e) => {
            console.log('Form onSubmit disparado', e)
            console.log('Erros do formulário:', errors)
            console.log('Valores do formulário:', { nome, sobrenome })
            handleSubmit(
              onSubmit,
              (errors) => {
                console.log('ERROS DE VALIDAÇÃO:', errors)
              }
            )(e)
          }} 
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="Ex: Michael"
                autoComplete="off"
                {...register('nome')}
              />
              {errors.nome && (
                <p className="text-sm text-red-600">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sobrenome">Sobrenome</Label>
              <Input
                id="sobrenome"
                placeholder="Ex: Felipe Cabrera"
                autoComplete="off"
                {...register('sobrenome')}
              />
              {errors.sobrenome && (
                <p className="text-sm text-red-600">{errors.sobrenome.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email (gerado automaticamente)</Label>
            <Input
              value={generatedEmail}
              disabled
              placeholder="Preencha nome e sobrenome"
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">
              O email será gerado automaticamente: primeira letra do nome + último sobrenome @mkd.com
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <Input
              id="telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              autoComplete="off"
              {...register('telefone')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Perfis</Label>
            <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
              {profiles?.map((profile) => (
                <div key={profile.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`profile-${profile.id}`}
                    checked={selectedProfiles.includes(profile.id)}
                    onCheckedChange={() => toggleProfile(profile.id)}
                  />
                  <label
                    htmlFor={`profile-${profile.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {profile.nome}
                  </label>
                </div>
              ))}
            </div>
            {selectedProfiles.length === 0 && (
              <p className="text-sm text-red-600">Selecione pelo menos um perfil</p>
            )}
            <p className="text-sm text-muted-foreground">
              {selectedProfiles.length} perfil(is) selecionado(s)
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log('Botão Cancelar clicado')
                onOpenChange(false)
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={
                createUser.isPending || 
                selectedProfiles.length === 0 || 
                !generatedEmail ||
                !nome ||
                !sobrenome
              }
            >
              {createUser.isPending ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
