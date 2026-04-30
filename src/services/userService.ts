import { supabase } from '@/lib/supabaseClient'
import { UserFormData, UserProfile, UserProfileWithProfiles } from '@/types'

export const userService = {
  async getUsers() {
    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    return data as UserProfile[]
  },

  async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as UserProfile
  },

  async getCurrentUserProfile() {
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) return null

    const { data, error } = await supabase
      .from('users_profile')
      .select(`
        *,
        user_profiles (
          profile:profiles (*)
        )
      `)
      .eq('auth_user_id', authData.user.id)
      .single()

    if (error) throw error
    return data as UserProfileWithProfiles
  },

  async getUserProfiles(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        profile:profiles (*)
      `)
      .eq('user_id', userId)

    if (error) throw error
    return data
  },

  async createUser(userData: UserFormData) {
    try {
      // 1. Criar usuário no auth.users usando a função SQL
      const { data: authResult, error: authError } = await (supabase as any)
        .rpc('create_user_with_auth', {
          p_nome: userData.nome,
          p_email: userData.email,
          p_password: userData.password || 'senha123',
          p_telefone: userData.telefone || null,
        })

      if (authError) {
        console.error('Erro ao criar usuário no auth:', authError)
        throw new Error('Erro ao criar credenciais de login: ' + authError.message)
      }

      const userProfileId = authResult.user_profile_id

      // 2. Adicionar perfis
      if (userData.profiles && userData.profiles.length > 0) {
        const userProfiles = userData.profiles.map((profileId) => ({
          user_id: userProfileId,
          profile_id: profileId,
        }))

        const { error: userProfilesError } = await (supabase as any)
          .from('user_profiles')
          .insert(userProfiles)

        if (userProfilesError) {
          console.error('Erro ao adicionar perfis:', userProfilesError)
          throw new Error('Erro ao atribuir perfis ao usuário')
        }
      }

      // 3. Buscar o perfil criado para retornar
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', userProfileId)
        .single()

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError)
        throw new Error('Erro ao buscar dados do usuário criado')
      }

      return profileData as UserProfile
    } catch (error: any) {
      console.error('Erro completo ao criar usuário:', error)
      throw error
    }
  },

  async updateUser(userId: string, userData: Partial<UserFormData>) {
    const { data, error } = await (supabase as any)
      .from('users_profile')
      .update({
        nome: userData.nome,
        telefone: userData.telefone,
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    // Atualizar perfis se fornecido
    if (userData.profiles) {
      await (supabase as any).from('user_profiles').delete().eq('user_id', userId)

      if (userData.profiles.length > 0) {
        const userProfiles = userData.profiles.map((profileId) => ({
          user_id: userId,
          profile_id: profileId,
        }))

        const { error: userProfilesError } = await (supabase as any)
          .from('user_profiles')
          .insert(userProfiles)

        if (userProfilesError) throw userProfilesError
      }
    }

    return data as UserProfile
  },

  async deactivateUser(userId: string) {
    const { data, error } = await (supabase as any)
      .from('users_profile')
      .update({ ativo: false })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data as UserProfile
  },

  async getProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('nome')

    if (error) throw error
    return data
  },
}
