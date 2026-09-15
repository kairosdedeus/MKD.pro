import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeAudicaoPayload } from "@/services/audicaoService";

const {
  mockUpload,
  mockCreateSignedUrl,
  mockGetPublicUrl,
  mockStorageFrom,
  mockSelect,
  mockInsert,
  mockUpdate,
  mockEq,
  mockMaybeSingle,
  mockSingle,
  mockFrom,
} = vi.hoisted(() => ({
  mockUpload: vi.fn(),
  mockCreateSignedUrl: vi.fn(),
  mockGetPublicUrl: vi.fn(),
  mockStorageFrom: vi.fn(),
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockEq: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockSingle: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    from: mockFrom,
    storage: {
      from: mockStorageFrom,
    },
  },
}));

describe("audicaoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockStorageFrom.mockReturnValue({
      upload: mockUpload,
      createSignedUrl: mockCreateSignedUrl,
      getPublicUrl: mockGetPublicUrl,
    });

    mockUpload.mockResolvedValue({ error: null });
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed.url/audicao-video.mp4" },
      error: null,
    });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://public.url/audicao-video.mp4" },
    });

    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockSingle.mockResolvedValue({
      data: {
        id: "resp-1",
        video_link: "https://signed.url/audicao-video.mp4",
      },
      error: null,
    });

    mockSelect.mockReturnValue({
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      select: mockSelect,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    });

    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq, select: mockSelect });

    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
    });
  });

  it("normaliza nome, sobrenome e email para um envio único", () => {
    const payload = normalizeAudicaoPayload({
      nome: "  João ",
      sobrenome: " Silva ",
      email: " JOAO@EXEMPLO.COM ",
      telefone: "(11) 99999-0000",
      ministerio: "Vocalista",
    });

    expect(payload.nome).toBe("João");
    expect(payload.sobrenome).toBe("Silva");
    expect(payload.email).toBe("joao@exemplo.com");
  });

  it("remove campos fora do schema da tabela de audições", () => {
    const payload = normalizeAudicaoPayload({
      nome: "Maria",
      sobrenome: "Silva",
      email: "maria@email.com",
      assinatura: "Maria Silva",
      declaracao: true,
      video_file: new File(["video"], "video.mp4", { type: "video/mp4" }),
      nome_completo: "Maria Silva",
      campo_inexistente: "valor-ignorado",
    });

    expect(payload).toHaveProperty("assinatura", "Maria Silva");
    expect(payload).not.toHaveProperty("campo_inexistente");
    expect(payload).not.toHaveProperty("video_file");
    expect(payload).not.toHaveProperty("nome_completo");
  });

  it("faz upload do vídeo e retorna uma URL que pode ser reproduzida", async () => {
    const { audicaoService } = await import("@/services/audicaoService");

    mockMaybeSingle.mockResolvedValueOnce({
      data: { enabled: true },
      error: null,
    });

    const result = await audicaoService.submit({
      nome: "João",
      sobrenome: "Silva",
      email: "joao@email.com",
      telefone: "(11) 99999-0000",
      ministerio: "Vocal",
      video_metodo: "upload",
      video_file: new File(["video-data"], "video-teste.mp4", {
        type: "video/mp4",
      }),
    });

    expect(mockStorageFrom).toHaveBeenCalledWith("audio-musicas");
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(mockCreateSignedUrl).toHaveBeenCalled();
    expect(result.video_link).toBe("https://signed.url/audicao-video.mp4");
    expect(result.video_link).toMatch(/\.mp4$/i);
  });

  it("gera uma nova URL assinada sempre que abre o vídeo", async () => {
    const { audicaoService } = await import("@/services/audicaoService");

    const expiredLink =
      "https://ewuvrindvhjislkrohwh.supabase.co/storage/v1/object/sign/audio-musicas/audicoes-louvor/expired/arquivo.mp4?token=abc";

    const freshUrl = await audicaoService.getPlayableVideoUrl(expiredLink);

    expect(mockCreateSignedUrl).toHaveBeenCalledWith(
      "audicoes-louvor/expired/arquivo.mp4",
      60 * 60 * 24,
    );
    expect(freshUrl).toBe("https://signed.url/audicao-video.mp4");
  });
});
