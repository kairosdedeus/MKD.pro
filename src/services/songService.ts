import { supabase } from "@/lib/supabaseClient";
import { Song, SongFormData } from "@/types";

export const songService = {
  async searchSongs(query: string) {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .or(`name.ilike.%${query}%,artist.ilike.%${query}%`)
      .order("name")
      .limit(10);

    if (error) throw error;
    return data as Song[];
  },

  async getSongs() {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .order("name");

    if (error) throw error;
    return data as Song[];
  },

  async getSongById(id: string) {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Song;
  },

  async createSong(songData: SongFormData) {
    const { data: authData } = await supabase.auth.getUser();
    const authUserId = authData.user?.id;

    const { data: userProfile } = await supabase
      .from("users_profile")
      .select("id")
      .eq("auth_user_id", authUserId)
      .single();

    // Usa profile_id se disponível, senão usa auth_user_id como prefixo da pasta
    const folderPrefix = userProfile?.id ?? authUserId;

    let audioPath: string | null = null;

    // Upload de áudio se fornecido
    if (songData.audio_file) {
      const fileExt = songData.audio_file.name.split(".").pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folderPrefix}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("audio-musicas")
        .upload(filePath, songData.audio_file, {
          contentType: songData.audio_file.type || "audio/mpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error details:", JSON.stringify(uploadError));
        throw uploadError;
      }
      audioPath = filePath;
    }

    const { data, error } = await supabase
      .from("songs")
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
      .single();

    if (error) throw error;
    return data as Song;
  },

  async updateSong(songId: string, songData: Partial<SongFormData>) {
    const { data, error } = await supabase
      .from("songs")
      .update({
        name: songData.name,
        artist: songData.artist,
        original_key: songData.original_key,
        reference_url: songData.reference_url,
        has_virtual_instruments: songData.has_virtual_instruments,
        notes: songData.notes,
      })
      .eq("id", songId)
      .select()
      .single();

    if (error) throw error;
    return data as Song;
  },

  async uploadSongAudio(songId: string, file: File) {
    const { data: authData } = await supabase.auth.getUser();
    const authUserId = authData.user?.id;

    const { data: userProfile } = await supabase
      .from("users_profile")
      .select("id")
      .eq("auth_user_id", authUserId)
      .single();

    // Usa profile_id se disponível, senão usa auth_user_id como prefixo da pasta
    const folderPrefix = userProfile?.id ?? authUserId;

    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folderPrefix}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("audio-musicas")
      .upload(filePath, file, {
        contentType: file.type || "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error details:", JSON.stringify(uploadError));
      throw uploadError;
    }

    const { data, error } = await supabase
      .from("songs")
      .update({ audio_path: filePath })
      .eq("id", songId)
      .select()
      .single();

    if (error) throw error;
    return data as Song;
  },

  async getAudioUrl(audioPath: string) {
    // Tenta URL pública primeiro (bucket público)
    // Se o bucket for privado, usa signed URL com 1 hora de validade
    try {
      const { data, error } = await supabase.storage
        .from("audio-musicas")
        .createSignedUrl(audioPath, 3600); // 1 hora

      if (error) throw error;
      return data.signedUrl;
    } catch {
      // Fallback para URL pública
      const { data } = supabase.storage
        .from("audio-musicas")
        .getPublicUrl(audioPath);
      return data.publicUrl;
    }
  },

  async addSongToSchedule(
    scheduleId: string,
    songId: string,
    orderIndex: number,
    executionKey?: string,
    notes?: string,
  ) {
    const { data, error } = await supabase
      .from("schedule_songs")
      .insert({
        schedule_id: scheduleId,
        song_id: songId,
        execution_key: executionKey,
        order_index: orderIndex,
        notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateScheduleSong(
    scheduleSongId: string,
    executionKey?: string,
    orderIndex?: number,
    notes?: string,
  ) {
    const { data, error } = await supabase
      .from("schedule_songs")
      .update({
        execution_key: executionKey,
        order_index: orderIndex,
        notes,
      })
      .eq("id", scheduleSongId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeSongFromSchedule(scheduleSongId: string) {
    const { error } = await supabase
      .from("schedule_songs")
      .delete()
      .eq("id", scheduleSongId);

    if (error) throw error;
  },
};
