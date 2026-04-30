import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { songService } from '@/services/songService'
import { SongFormData } from '@/types'

// Hook principal simplificado
export function useSongs() {
  const { data: songs = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['songs'],
    queryFn: () => songService.getSongs(),
  })

  return { songs, loading, refetch }
}

export function useSearchSongs(query: string) {
  return useQuery({
    queryKey: ['songs', 'search', query],
    queryFn: () => songService.searchSongs(query),
    enabled: query.length > 0,
  })
}

export function useSong(songId: string) {
  return useQuery({
    queryKey: ['songs', songId],
    queryFn: () => songService.getSongById(songId),
    enabled: !!songId,
  })
}

export function useCreateSong() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SongFormData) => songService.createSong(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] })
    },
  })
}

export function useUpdateSong() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ songId, data }: { songId: string; data: Partial<SongFormData> }) =>
      songService.updateSong(songId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['songs'] })
      queryClient.invalidateQueries({ queryKey: ['songs', variables.songId] })
    },
  })
}
