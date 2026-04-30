import { supabase } from '@/lib/supabaseClient'
import { Song, SongFormData } from '@/types'

export const songService = {
  async searchSongs(query: string) {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .or(`name.ilike.%${query}%,artist.ilike.%${query}%`)
      .order('name')
      .limit(10)

    if (error) throw error
    return data as Song[]
  },

  async getSongs() {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('name')

    if (error) throw error
    return data as Song[]
  },

  async getSongById(id: string) {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Song
  },

  async createSong(songData: SongFormData) {
    const { data: authData } = await supabase.auth.getUser()
    const { data: userProfile } = await supabase
      .from('users_profile')
      .select('id')
      .eq('auth_user_id', authData.user?.id)
      .single()

    let audioPath: string | null = null

    // Upload de áudio se fornecido
    if (songData.audio_file) {
      const fileExt = songData.audio_file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${userProfile?.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('audio-musicas')
        .upload(filePath, songData.audio_file)

      if (uploadError) throw uploadError
      audioPath = filePath
    }

    const { data, error } = await supabase
      .from('songs')
      .insert({
        name: songData.name,
        artist: songData.artist,
        original_key: songData.original_key,
        reference_url: songData.reference_url,
        audio_path: audioPath,
        has_virtual_instruments: songData.has_virtual_instruments,
        notes: songData.notes,
        created_by: userProfile?.id,
      })
      .select()
      .single()

    if (error) throw error
    return data as Song
  },

  async updateSong(songId: string, songData: Partial<SongFormData>) {
    const { data, error } = await supabase
      .from('songs')
      .update({
        name: songData.name,
        artist: songData.artist,
        original_key: songData.original_key,
        reference_url: songData.reference_url,
        has_virtual_instruments: songData.has_virtual_instruments,
        notes: songData.notes,
      })
      .eq('id', songId)
      .select()
      .single()

    if (error) throw error
    return data as Song
  },

  async uploadSongAudio(songId: string, file: File) {
    const { data: authData } = await supabase.auth.getUser()
    const { data: userProfile } = await supabase
      .from('users_profile')
      .select('id')
      .eq('auth_user_id', authData.user?.id)
      .single()

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${userProfile?.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('audio-musicas')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data, error } = await supabase
      .from('songs')
      .update({ audio_path: filePath })
      .eq('id', songId)
      .select()
      .single()

    if (error) throw error
    return data as Song
  },

  async getAudioUrl(audioPath: string) {
    const { data } = supabase.storage
      .from('audio-musicas')
      .getPublicUrl(audioPath)

    return data.publicUrl
  },

  async addSongToSchedule(scheduleId: string, songId: string, orderIndex: number, executionKey?: string, notes?: string) {
    const { data, error } = await supabase
      .from('schedule_songs')
      .insert({
        schedule_id: scheduleId,
        song_id: songId,
        execution_key: executionKey,
        order_index: orderIndex,
        notes,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateScheduleSong(scheduleSongId: string, executionKey?: string, orderIndex?: number, notes?: string) {
    const { data, error } = await supabase
      .from('schedule_songs')
      .update({
        execution_key: executionKey,
        order_index: orderIndex,
        notes,
      })
      .eq('id', scheduleSongId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async removeSongFromSchedule(scheduleSongId: string) {
    const { error } = await supabase
      .from('schedule_songs')
      .delete()
      .eq('id', scheduleSongId)

    if (error) throw error
  },
}
