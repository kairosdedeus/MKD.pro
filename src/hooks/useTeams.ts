import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamService } from '@/services/teamService'
import { TeamFormData } from '@/types'

// Hook principal simplificado
export function useTeams(teamTypeCode?: string) {
  const { data: teams = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['teams', teamTypeCode],
    queryFn: () => teamService.getTeams(teamTypeCode),
  })

  return { teams, loading, refetch }
}

export function useTeam(teamId: string) {
  return useQuery({
    queryKey: ['teams', teamId],
    queryFn: () => teamService.getTeamById(teamId),
    enabled: !!teamId,
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TeamFormData) => teamService.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useUpdateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: Partial<TeamFormData> }) =>
      teamService.updateTeam(teamId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId] })
    },
  })
}

export function useTeamFunctions(teamTypeId: string) {
  return useQuery({
    queryKey: ['team-functions', teamTypeId],
    queryFn: () => teamService.getTeamFunctions(teamTypeId),
    enabled: !!teamTypeId,
  })
}

export function useTeamTypes() {
  return useQuery({
    queryKey: ['team-types'],
    queryFn: () => teamService.getTeamTypes(),
  })
}
