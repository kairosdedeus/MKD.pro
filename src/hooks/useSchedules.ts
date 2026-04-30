import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleService } from '@/services/scheduleService'
import { ScheduleFormData } from '@/types'

// Hook principal para buscar escalas por mês
export function useSchedules(teamId: string, date: Date) {
  const { data: schedules = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['schedules', teamId, date.getMonth(), date.getFullYear()],
    queryFn: () => scheduleService.getSchedulesByMonth(teamId, date),
    enabled: !!teamId,
  })

  return { schedules, loading, refetch }
}

export function useSchedulesByMonth(teamId: string, date: Date) {
  return useQuery({
    queryKey: ['schedules', teamId, date.getMonth(), date.getFullYear()],
    queryFn: () => scheduleService.getSchedulesByMonth(teamId, date),
    enabled: !!teamId,
  })
}

export function useScheduleByDate(teamId: string, date: string) {
  return useQuery({
    queryKey: ['schedules', teamId, date],
    queryFn: () => scheduleService.getScheduleByDate(teamId, date),
    enabled: !!teamId && !!date,
  })
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ScheduleFormData) => scheduleService.createSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ scheduleId, data }: { scheduleId: string; data: Partial<ScheduleFormData> }) =>
      scheduleService.updateSchedule(scheduleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (scheduleId: string) => scheduleService.deleteSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}

export function useCheckConflicts(userId: string, date: string) {
  return useQuery({
    queryKey: ['conflicts', userId, date],
    queryFn: () => scheduleService.checkConflicts(userId, date),
    enabled: !!userId && !!date,
  })
}
