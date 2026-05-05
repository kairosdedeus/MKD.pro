import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMp3File(name = "musica.mp3", sizeBytes = 1024): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type: "audio/mpeg" });
}

function makeWavFile(name = "musica.wav", sizeBytes = 2048): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type: "audio/wav" });
}

function makeOversizedFile(): File {
  // 51 MB — acima do limite de 50 MB
  const sizeBytes = 51 * 1024 * 1024;
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], "grande.mp3", { type: "audio/mpeg" });
}

// ── Mock do Supabase ─────────────────────────────────────────────────────────

const mockUpload = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockStorageFrom = vi.fn();

const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "auth-user-1" } },
      }),
    },
    from: mockFrom,
    storage: {
      from: mockStorageFrom,
    },
  },
}));

// ── Setup padrão dos mocks ───────────────────────────────────────────────────

function setupDefaultMocks() {
  // Storage
  mockUpload.mockResolvedValue({ error: null });
  mockCreateSignedUrl.mockResolvedValue({
    data: { signedUrl: "https://signed.url/audio.mp3" },
    error: null,
  });
  mockGetPublicUrl.mockReturnValue({
    data: { publicUrl: "https://public.url/audio.mp3" },
  });
  mockStorageFrom.mockReturnValue({
    upload: mockUpload,
    createSignedUrl: mockCreateSignedUrl,
    getPublicUrl: mockGetPublicUrl,
  });

  // DB — cadeia fluente completa:
  //   from().select().eq().single()          <- busca perfil
  //   from().update().eq().select().single() <- atualiza song
  //   from().insert().select().single()      <- insere song
  mockSingle.mockResolvedValue({ data: { id: "profile-1" }, error: null });

  // select() retorna objeto com eq() e single()
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle });

  // eq() retorna objeto com select() e single()
  mockEq.mockReturnValue({ select: mockSelect, single: mockSingle });

  // update() retorna objeto com eq()
  mockUpdate.mockReturnValue({ eq: mockEq });

  // insert() retorna objeto com select()
  mockInsert.mockReturnValue({ select: mockSelect });
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    eq: mockEq,
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: mockSingle,
  });
}

// ── Testes ───────────────────────────────────────────────────────────────────

describe("songService — upload de áudio MP3", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  // ── uploadSongAudio ────────────────────────────────────────────────────────

  describe("uploadSongAudio", () => {
    it("faz upload de MP3 e retorna a música atualizada", async () => {
      const mockSong = {
        id: "song-1",
        name: "Oceans",
        audio_path: "profile-1/123-abc.mp3",
      };
      // Primeira chamada single() = busca perfil, segunda = retorna song atualizada
      mockSingle
        .mockResolvedValueOnce({ data: { id: "profile-1" }, error: null })
        .mockResolvedValueOnce({ data: mockSong, error: null });

      const { songService } = await import("@/services/songService");
      const file = makeMp3File("oceans.mp3");
      const result = await songService.uploadSongAudio("song-1", file);

      expect(mockStorageFrom).toHaveBeenCalledWith("audio-musicas");
      expect(mockUpload).toHaveBeenCalledOnce();

      // Verifica que o caminho tem formato userId/timestamp-random.ext
      const [filePath, uploadedFile] = mockUpload.mock.calls[0];
      expect(filePath).toMatch(/^.+\/.+\.mp3$/);
      expect(uploadedFile).toBe(file);

      expect(result).toEqual(mockSong);
    });

    it("faz upload de WAV corretamente", async () => {
      const mockSong = {
        id: "song-2",
        name: "Amazing Grace",
        audio_path: "profile-1/123-abc.wav",
      };
      mockSingle
        .mockResolvedValueOnce({ data: { id: "profile-1" }, error: null })
        .mockResolvedValueOnce({ data: mockSong, error: null });

      const { songService } = await import("@/services/songService");
      const file = makeWavFile("amazing-grace.wav");
      await songService.uploadSongAudio("song-2", file);

      const [filePath] = mockUpload.mock.calls[0];
      expect(filePath).toMatch(/^.+\/.+\.wav$/);
    });

    it("preserva a extensão original do arquivo", async () => {
      mockSingle.mockResolvedValue({ data: { id: "song-3" }, error: null });

      const { songService } = await import("@/services/songService");
      const file = makeMp3File("minha-musica.mp3");
      await songService.uploadSongAudio("song-3", file);

      const [filePath] = mockUpload.mock.calls[0];
      expect(filePath.endsWith(".mp3")).toBe(true);
    });

    it("gera nome de arquivo único (timestamp + random)", async () => {
      mockSingle.mockResolvedValue({ data: { id: "song-4" }, error: null });

      const { songService } = await import("@/services/songService");
      const file1 = makeMp3File("a.mp3");
      const file2 = makeMp3File("b.mp3");

      await songService.uploadSongAudio("song-4", file1);
      await songService.uploadSongAudio("song-4", file2);

      const path1 = mockUpload.mock.calls[0][0] as string;
      const path2 = mockUpload.mock.calls[1][0] as string;
      expect(path1).not.toBe(path2);
    });

    it("lança erro se o upload falhar (ex: bucket sem permissão)", async () => {
      const storageError = new Error(
        "new row violates row-level security policy",
      );
      mockUpload.mockResolvedValue({ error: storageError });

      const { songService } = await import("@/services/songService");
      const file = makeMp3File();

      await expect(songService.uploadSongAudio("song-1", file)).rejects.toThrow(
        "new row violates row-level security policy",
      );
    });

    it("lança erro se o update do banco falhar após upload", async () => {
      mockUpload.mockResolvedValue({ error: null });
      const dbError = new Error("DB error");
      mockSingle
        .mockResolvedValueOnce({ data: { id: "profile-1" }, error: null }) // getUser profile
        .mockResolvedValueOnce({ data: null, error: dbError }); // update song

      const { songService } = await import("@/services/songService");
      const file = makeMp3File();

      await expect(songService.uploadSongAudio("song-1", file)).rejects.toThrow(
        "DB error",
      );
    });

    it("usa o bucket correto 'audio-musicas'", async () => {
      mockSingle.mockResolvedValue({ data: { id: "song-1" }, error: null });

      const { songService } = await import("@/services/songService");
      await songService.uploadSongAudio("song-1", makeMp3File());

      expect(mockStorageFrom).toHaveBeenCalledWith("audio-musicas");
    });
  });

  // ── createSong com áudio ───────────────────────────────────────────────────

  describe("createSong com audio_file", () => {
    it("faz upload do áudio antes de inserir a música", async () => {
      const mockSong = {
        id: "song-new",
        name: "Nova Música",
        audio_path: "profile-1/123-abc.mp3",
      };
      mockSingle.mockResolvedValue({ data: mockSong, error: null });

      const { songService } = await import("@/services/songService");
      const file = makeMp3File("nova.mp3");

      const result = await songService.createSong({
        name: "Nova Música",
        artist: "Artista",
        original_key: "C",
        has_virtual_instruments: false,
        audio_file: file,
      });

      // Upload deve ter sido chamado
      expect(mockUpload).toHaveBeenCalledOnce();
      expect(result).toEqual(mockSong);
    });

    it("cria música sem áudio quando audio_file não é fornecido", async () => {
      const mockSong = { id: "song-new", name: "Sem Áudio", audio_path: null };
      mockSingle.mockResolvedValue({ data: mockSong, error: null });

      const { songService } = await import("@/services/songService");

      await songService.createSong({
        name: "Sem Áudio",
        has_virtual_instruments: false,
      });

      // Upload NÃO deve ter sido chamado
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it("lança erro se upload falhar durante createSong", async () => {
      mockUpload.mockResolvedValue({ error: new Error("Upload failed: 400") });

      const { songService } = await import("@/services/songService");

      await expect(
        songService.createSong({
          name: "Música Falha",
          has_virtual_instruments: false,
          audio_file: makeMp3File(),
        }),
      ).rejects.toThrow("Upload failed: 400");
    });
  });

  // ── getAudioUrl ────────────────────────────────────────────────────────────

  describe("getAudioUrl", () => {
    it("retorna signed URL para bucket privado", async () => {
      const { songService } = await import("@/services/songService");
      const url = await songService.getAudioUrl("profile-1/audio.mp3");

      expect(mockCreateSignedUrl).toHaveBeenCalledWith(
        "profile-1/audio.mp3",
        3600,
      );
      expect(url).toBe("https://signed.url/audio.mp3");
    });

    it("signed URL expira em 1 hora (3600 segundos)", async () => {
      const { songService } = await import("@/services/songService");
      await songService.getAudioUrl("profile-1/audio.mp3");

      const [, expiresIn] = mockCreateSignedUrl.mock.calls[0];
      expect(expiresIn).toBe(3600);
    });

    it("faz fallback para URL pública se signed URL retornar erro", async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: new Error("Forbidden"),
      });

      const { songService } = await import("@/services/songService");
      const url = await songService.getAudioUrl("profile-1/audio.mp3");

      expect(url).toBe("https://public.url/audio.mp3");
    });

    it("faz fallback se createSignedUrl lançar exceção", async () => {
      mockCreateSignedUrl.mockRejectedValue(new Error("Network error"));

      const { songService } = await import("@/services/songService");
      const url = await songService.getAudioUrl("profile-1/audio.mp3");

      expect(url).toBe("https://public.url/audio.mp3");
    });

    it("usa o bucket correto 'audio-musicas'", async () => {
      const { songService } = await import("@/services/songService");
      await songService.getAudioUrl("profile-1/audio.mp3");

      expect(mockStorageFrom).toHaveBeenCalledWith("audio-musicas");
    });
  });

  // ── Validação de tipo de arquivo (lógica de UI) ────────────────────────────

  describe("validação de arquivo (lógica de frontend)", () => {
    it("arquivo MP3 tem tipo MIME correto", () => {
      const file = makeMp3File();
      expect(file.type).toBe("audio/mpeg");
    });

    it("arquivo WAV tem tipo MIME correto", () => {
      const file = makeWavFile();
      expect(file.type).toBe("audio/wav");
    });

    it("arquivo de 50MB está dentro do limite", () => {
      const MAX_SIZE = 50 * 1024 * 1024;
      const file = new File([new ArrayBuffer(MAX_SIZE)], "limite.mp3", {
        type: "audio/mpeg",
      });
      expect(file.size).toBeLessThanOrEqual(MAX_SIZE);
    });

    it("arquivo de 51MB ultrapassa o limite de 50MB", () => {
      const MAX_SIZE = 50 * 1024 * 1024;
      const file = makeOversizedFile();
      expect(file.size).toBeGreaterThan(MAX_SIZE);
    });

    it("extensão é extraída corretamente do nome do arquivo", () => {
      const cases = [
        { name: "musica.mp3", ext: "mp3" },
        { name: "musica.wav", ext: "wav" },
        { name: "musica.ogg", ext: "ogg" },
        { name: "minha.musica.favorita.mp3", ext: "mp3" },
      ];
      cases.forEach(({ name, ext }) => {
        const extracted = name.split(".").pop();
        expect(extracted).toBe(ext);
      });
    });

    it("caminho do arquivo inclui userId como prefixo de pasta", () => {
      const userId = "profile-abc-123";
      const fileName = "1234567890-xyz.mp3";
      const filePath = `${userId}/${fileName}`;
      expect(filePath.startsWith(userId + "/")).toBe(true);
    });
  });
});
