import { create } from 'zustand'
import { authService } from '@/services/authService'
import { userService } from '@/services/userService'
import { UserProfile, Profile } from '@/types'

interface AuthState {
  user: UserProfile | null
  profiles: Profile[]
  currentProfile: Profile | null
  loading: boolean
  setUser: (user: UserProfile | null) => void
  setProfiles: (profiles: Profile[]) => void
  setCurrentProfile: (profile: Profile | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profiles: [],
  currentProfile: null,
  loading: true,

  setUser: (user) => set({ user }),
  setProfiles: (profiles) => set({ profiles }),
  setCurrentProfile: (profile) => set({ currentProfile: profile }),

  login: async (email, password) => {
    await authService.login({ email, password })
    const userProfile = await userService.getCurrentUserProfile()
    
    if (userProfile) {
      const profiles = userProfile.user_profiles.map((up) => up.profile)
      set({
        user: userProfile,
        profiles,
        currentProfile: profiles[0] || null,
      })
    }
  },

  logout: async () => {
    await authService.logout()
    set({ user: null, profiles: [], currentProfile: null })
  },

  initialize: async () => {
    try {
      const session = await authService.getSession()
      
      if (session) {
        const userProfile = await userService.getCurrentUserProfile()
        
        if (userProfile) {
          const profiles = userProfile.user_profiles.map((up) => up.profile)
          set({
            user: userProfile,
            profiles,
            currentProfile: profiles[0] || null,
          })
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      set({ loading: false })
    }
  },
}))

// Initialize auth on app load
useAuthStore.getState().initialize()
