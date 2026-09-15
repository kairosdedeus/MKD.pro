import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { audicaoService } from "@/services/audicaoService";

const today = new Date().toISOString().slice(0, 10);

const initialForm = {
  nome_completo: "",
  data_nascimento: "",
  telefone: "",
  email: "",
  endereco: "",
  encontro_deus: "",
  data_encontro: "",
  escola_lideres: "",
  data_escola: "",
  celula: "",
  celula_info: "",
  tempo_igreja: "",
  ministerio: "",
  instrumentos: [] as string[],
  outro_instrumento: "",
  chamado: "",
  tempo_experiencia: "",
  nivel: "",
  leitura: "",
  experiencia_anterior: "",
  experiencia_detalhes: "",
  disponibilidade: [] as string[],
  compromisso_cultos: "",
  compromisso_obs: "",
  vida_devocional: "",
  video_metodo: "upload" as "upload" | "whatsapp",
  video_file: null as File | null,
  declaracao: false,
  assinatura: "",
  data_envio: today,
};

const instrumentOptions = [
  "Violão",
  "Guitarra",
  "Baixo",
  "Teclado/Piano",
  "Bateria",
  "Percussão",
  "Saxofone",
  "Trompete",
];

const disponibilidadeOptions = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

export function AudicoesLouvorPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [currentSection, setCurrentSection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const registrationsOpen = audicaoService.isRegistrationOpen();

  const totalSections = 6;

  const updateField = (
    field: string,
    value: string | boolean | string[] | File | null,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateCurrentSection = () => {
    const fieldsBySection: Record<number, string[]> = {
      1: ["nome_completo", "data_nascimento", "telefone", "email"],
      2: ["encontro_deus", "escola_lideres", "celula", "tempo_igreja"],
      3: ["ministerio", "chamado", "tempo_experiencia"],
      4: ["disponibilidade", "compromisso_cultos", "vida_devocional"],
      6: ["declaracao", "assinatura"],
    };

    const required = fieldsBySection[currentSection] ?? [];
    const invalid = required.find((field) => {
      const value = form[field as keyof typeof form];
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === "boolean") return !value;
      return !String(value).trim();
    });

    if (currentSection === 5) {
      if (form.video_metodo === "upload" && !form.video_file) {
        toast({
          variant: "destructive",
          title: "Vídeo obrigatório",
          description: "Selecione um arquivo de vídeo para enviar no sistema.",
        });
        return false;
      }

      if (
        form.video_metodo === "whatsapp" )
      ) {
        toast({
          variant: "destructive",
          title: "Envio do vídeo",
          description:
            "Informe o link do vídeo ou use o WhatsApp 67984213816 para envio direto.",
        });
        return false;
      }
    }

    if (invalid) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description:
          "Preencha todos os campos obrigatórios antes de continuar.",
      });
      return false;
    }

    return true;
  };

  const toggleInstrument = (instrument: string) => {
    setForm((current) => {
      const next = current.instrumentos.includes(instrument)
        ? current.instrumentos.filter((item) => item !== instrument)
        : [...current.instrumentos, instrument];
      return { ...current, instrumentos: next };
    });
  };

  const toggleAvailability = (day: string) => {
    setForm((current) => {
      const next = current.disponibilidade.includes(day)
        ? current.disponibilidade.filter((item) => item !== day)
        : [...current.disponibilidade, day];
      return { ...current, disponibilidade: next };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateCurrentSection()) return;

    setLoading(true);

    try {
      await audicaoService.submit({
        ...form,
        data_envio: new Date().toISOString(),
        video_link:
          form.video_metodo === "whatsapp"
            ? "https://wa.me/67984213816"
            : form.video_link,
      });

      setSubmitted(true);
      toast({
        title: "✅ Inscrição enviada!",
        description: "Sua participação foi registrada com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Não foi possível enviar",
        description: error.message || "Tente novamente em instantes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = useMemo(
    () => Math.round((currentSection / totalSections) * 100),
    [currentSection],
  );

  if (!registrationsOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white">
        <div className="mx-auto mt-20 max-w-2xl rounded-[20px] border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-sm">
          <div className="mb-4 text-6xl">⏳</div>
          <h2 className="mb-3 text-3xl font-bold">Inscrições encerradas</h2>
          <p className="text-base text-white/80">
            A temporada de audições para o louvor está temporariamente fechada.
            Volte em breve para acompanhar a abertura das inscrições.
          </p>
          <Button className="mt-6" onClick={() => navigate("/login")}>
            Voltar para a página inicial
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-600 p-5 text-white">
        <div className="mx-auto mt-16 max-w-2xl rounded-[20px] border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-sm">
          <div className="mb-4 text-6xl">✅</div>
          <h2 className="mb-4 text-3xl font-bold">
            Inscrição Enviada com Sucesso!
          </h2>
          <p className="text-base text-white/85">
            Obrigado pelo seu interesse em servir na equipe de louvor da Igreja
            MKD. Nossa equipe analisará sua inscrição e entrará em contato em
            breve.
          </p>
          <Button className="mt-6" onClick={() => navigate("/login")}>
            Enviar nova inscrição
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#667eea] p-5 text-slate-800">
      <div className="mx-auto max-w-[800px] overflow-hidden rounded-[20px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-10 text-center text-white">
          <h1 className="text-3xl font-bold">
            🎵 Audição - Equipe de Louvor MKD
          </h1>
          <p className="mt-2 text-lg opacity-90">Igreja MKD | Modelo M12</p>
        </div>

        <div className="h-[5px] w-full bg-[#e0e0e0]">
          <div
            className="h-full bg-gradient-to-r from-[#667eea] to-[#764ba2] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="py-4 text-center text-sm text-slate-600">
          Passo {currentSection} de {totalSections}
        </div>

        <form onSubmit={handleSubmit} className="px-7 pb-8 pt-2">
          {currentSection === 1 && (
            <div className="space-y-6">
              <h2 className="border-b-4 border-[#667eea] pb-2 text-2xl font-bold text-[#667eea]">
                📋 Dados Pessoais
              </h2>

              <div className="space-y-2">
                <label className="block font-semibold">Nome Completo</label>
                <Input
                  value={form.nome_completo}
                  onChange={(e) => updateField("nome_completo", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">
                  Data de Nascimento
                </label>
                <Input
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) =>
                    updateField("data_nascimento", e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">Telefone/WhatsApp</label>
                <Input
                  value={form.telefone}
                  onChange={(e) => updateField("telefone", e.target.value)}
                  required
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">E-mail</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">Endereço</label>
                <textarea
                  value={form.endereco}
                  onChange={(e) => updateField("endereco", e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                  className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/10"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    if (validateCurrentSection()) setCurrentSection(2);
                  }}
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white"
                >
                  Próximo →
                </Button>
              </div>
            </div>
          )}

          {currentSection === 2 && (
            <div className="space-y-6">
              <h2 className="border-b-4 border-[#667eea] pb-2 text-2xl font-bold text-[#667eea]">
                ✝️ Jornada no M12
              </h2>

              <div className="rounded-md border-l-4 border-[#667eea] bg-[#e8eaf6] p-4 text-sm text-slate-700">
                <strong>Importante:</strong> Para fazer parte da equipe de
                louvor, é necessário estar em comunhão com a igreja e ter
                passado pelos processos do M12.
              </div>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Você já participou do Encontro com Deus?
                </label>
                <div className="space-y-2">
                  {["Sim", "Não", "Em andamento"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] p-3"
                    >
                      <input
                        type="radio"
                        checked={form.encontro_deus === option}
                        onChange={() => updateField("encontro_deus", option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">
                  Data do Encontro com Deus
                </label>
                <Input
                  value={form.data_encontro}
                  onChange={(e) => updateField("data_encontro", e.target.value)}
                  placeholder="Mês/Ano (ex: Janeiro/2024)"
                />
              </div>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Você concluiu a Escola de Líderes?
                </label>
                <div className="space-y-2">
                  {[
                    "Concluí",
                    "Cursando",
                    "Não iniciei",
                    "Pretendo iniciar",
                  ].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] p-3"
                    >
                      <input
                        type="radio"
                        checked={form.escola_lideres === option}
                        onChange={() => updateField("escola_lideres", option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">
                  Data de conclusão da Escola de Líderes
                </label>
                <Input
                  value={form.data_escola}
                  onChange={(e) => updateField("data_escola", e.target.value)}
                  placeholder="Mês/Ano"
                />
              </div>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Você participa regularmente de uma Célula?
                </label>
                <div className="space-y-2">
                  {["Sim", "Não"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] p-3"
                    >
                      <input
                        type="radio"
                        checked={form.celula === option}
                        onChange={() => updateField("celula", option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">
                  Nome da Célula e Líder
                </label>
                <Input
                  value={form.celula_info}
                  onChange={(e) => updateField("celula_info", e.target.value)}
                  placeholder="Ex: Célula Família - Líder João"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">
                  Há quanto tempo frequenta a Igreja MKD?
                </label>
                <select
                  value={form.tempo_igreja}
                  onChange={(e) => updateField("tempo_igreja", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/10"
                >
                  <option value="">Selecione...</option>
                  <option value="Menos de 6 meses">Menos de 6 meses</option>
                  <option value="6 meses a 1 ano">6 meses a 1 ano</option>
                  <option value="1 a 2 anos">1 a 2 anos</option>
                  <option value="2 a 5 anos">2 a 5 anos</option>
                  <option value="Mais de 5 anos">Mais de 5 anos</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Você está sendo discipulado?
                </label>
                <div className="space-y-2">
                  {["Sim", "Não"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] p-3"
                    >
                      <input
                        type="radio"
                        checked={form.discipulado === option}
                        onChange={() => updateField("discipulado", option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">
                  Nome do Discipulador
                </label>
                <Input
                  value={form.discipulador}
                  onChange={(e) => updateField("discipulador", e.target.value)}
                  placeholder="Nome do seu discipulador"
                />
              </div>

              <div className="flex justify-between gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentSection(1)}
                >
                  ← Voltar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (validateCurrentSection()) setCurrentSection(3);
                  }}
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white"
                >
                  Próximo →
                </Button>
              </div>
            </div>
          )}

          {currentSection === 3 && (
            <div className="space-y-6">
              <h2 className="border-b-4 border-[#667eea] pb-2 text-2xl font-bold text-[#667eea]">
                🎸 Chamado e Ministério
              </h2>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Qual ministério deseja integrar?
                </label>
                <div className="space-y-2">
                  {["Vocalista", "Instrumentista", "Ambos"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] p-3"
                    >
                      <input
                        type="radio"
                        checked={form.ministerio === option}
                        onChange={() => updateField("ministerio", option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {(form.ministerio === "Instrumentista" ||
                form.ministerio === "Ambos") && (
                <div className="space-y-3">
                  <label className="block font-semibold">
                    Qual(is) instrumento(s) toca?
                  </label>
                  <div className="grid gap-2 md:grid-cols-2">
                    {instrumentOptions.map((instrument) => (
                      <label
                        key={instrument}
                        className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] p-3"
                      >
                        <input
                          type="checkbox"
                          checked={form.instrumentos.includes(instrument)}
                          onChange={() => toggleInstrument(instrument)}
                        />
                        <span>{instrument}</span>
                      </label>
                    ))}
                  </div>
                  <Input
                    value={form.outro_instrumento}
                    onChange={(e) =>
                      updateField("outro_instrumento", e.target.value)
                    }
                    placeholder="Outro instrumento (especifique)"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block font-semibold">
                  Como descreve seu chamado para o ministério de louvor?
                </label>
                <textarea
                  value={form.chamado}
                  onChange={(e) => updateField("chamado", e.target.value)}
                  placeholder="Conte-nos sobre sua experiência espiritual e como sente o chamado para servir no louvor... (mínimo 100 palavras)"
                  minLength={100}
                  className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/10"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">
                  Há quanto tempo toca ou canta?
                </label>
                <select
                  value={form.tempo_experiencia}
                  onChange={(e) =>
                    updateField("tempo_experiencia", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/10"
                >
                  <option value="">Selecione...</option>
                  <option value="Menos de 1 ano">Menos de 1 ano</option>
                  <option value="1 a 3 anos">1 a 3 anos</option>
                  <option value="3 a 5 anos">3 a 5 anos</option>
                  <option value="5 a 10 anos">5 a 10 anos</option>
                  <option value="Mais de 10 anos">Mais de 10 anos</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Nível de proficiência
                </label>
                <div className="space-y-2">
                  {[
                    "Iniciante",
                    "Intermediário",
                    "Avançado",
                    "Profissional",
                  ].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] p-3"
                    >
                      <input
                        type="radio"
                        checked={form.nivel === option}
                        onChange={() => updateField("nivel", option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Sabe ler partitura ou cifra?
                </label>
                <div className="space-y-2">
                  {["Partitura", "Cifra", "Ambos", "Não"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] p-3"
                    >
                      <input
                        type="radio"
                        checked={form.leitura === option}
                        onChange={() => updateField("leitura", option)}
                      />
                      <span>
                        {option === "Partitura"
                          ? "Sim, partitura"
                          : option === "Cifra"
                            ? "Sim, cifra"
                            : option === "Ambos"
                              ? "Ambos"
                              : "Não"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Já participou de equipe de louvor anteriormente?
                </label>
                <div className="space-y-2">
                  {["Sim", "Não"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] p-3"
                    >
                      <input
                        type="radio"
                        checked={form.experiencia_anterior === option}
                        onChange={() =>
                          updateField("experiencia_anterior", option)
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">
                  Igreja/Ministério anterior e tempo
                </label>
                <textarea
                  value={form.experiencia_detalhes}
                  onChange={(e) =>
                    updateField("experiencia_detalhes", e.target.value)
                  }
                  placeholder="Se sim, onde e por quanto tempo?"
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/10"
                />
              </div>

              <div className="flex justify-between gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentSection(2)}
                >
                  ← Voltar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (validateCurrentSection()) setCurrentSection(4);
                  }}
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white"
                >
                  Próximo →
                </Button>
              </div>
            </div>
          )}

          {currentSection === 4 && (
            <div className="space-y-6">
              <h2 className="border-b-4 border-[#667eea] pb-2 text-2xl font-bold text-[#667eea]">
                📅 Disponibilidade e Compromisso
              </h2>

              <div className="rounded-md border-l-4 border-[#667eea] bg-[#e8eaf6] p-4 text-sm text-slate-700">
                <strong>Atenção:</strong> Fazer parte da equipe de louvor exige
                compromisso, pontualidade e dedicação aos ensaios e cultos.
              </div>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Disponibilidade para ensaios (marque os dias):
                </label>
                <div className="grid gap-2 md:grid-cols-2">
                  {disponibilidadeOptions.map((day) => (
                    <label
                      key={day}
                      className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] p-3"
                    >
                      <input
                        type="checkbox"
                        checked={form.disponibilidade.includes(day)}
                        onChange={() => toggleAvailability(day)}
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Está disposto(a) a participar de todos os cultos e eventos?
                </label>
                <div className="space-y-2">
                  {["Sim, totalmente", "Parcialmente", "Não"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] p-3"
                    >
                      <input
                        type="radio"
                        checked={form.compromisso_cultos === option}
                        onChange={() =>
                          updateField("compromisso_cultos", option)
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">
                  Se parcialmente, explique:
                </label>
                <textarea
                  value={form.compromisso_obs}
                  onChange={(e) =>
                    updateField("compromisso_obs", e.target.value)
                  }
                  placeholder="Explique suas limitações de disponibilidade..."
                  className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/10"
                />
              </div>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Compreende que o ministério exige vida devocional consistente?
                </label>
                <div className="space-y-2">
                  {["Sim, compreendo e aceito", "Tenho dúvidas", "Não"].map(
                    (option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] p-3"
                      >
                        <input
                          type="radio"
                          checked={form.vida_devocional === option}
                          onChange={() =>
                            updateField("vida_devocional", option)
                          }
                        />
                        <span>{option}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentSection(3)}
                >
                  ← Voltar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (validateCurrentSection()) setCurrentSection(5);
                  }}
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white"
                >
                  Próximo →
                </Button>
              </div>
            </div>
          )}

          {currentSection === 5 && (
            <div className="space-y-6">
              <h2 className="border-b-4 border-[#667eea] pb-2 text-2xl font-bold text-[#667eea]">
                🎬 Vídeo de Avaliação
              </h2>

              <div className="rounded-md border-l-4 border-[#667eea] bg-[#e8eaf6] p-4 text-sm text-slate-700">
                <strong>Instruções importantes:</strong>
                <br />• Grave um vídeo de <strong>máximo 5 minutos</strong>
                <br />• <strong>Vocalistas:</strong> cante uma música de
                louvor/adoração
                <br />• <strong>Instrumentistas:</strong> toque uma música
                completa
                <br />• <strong>Ambos:</strong> demonstre ambas as habilidades
                <br />• Use boa qualidade de áudio e imagem
              </div>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Como você vai enviar o vídeo?
                </label>
                <div className="space-y-2">
                  {[
                    { value: "upload", label: "Adicionar arquivo no sistema" },
                    { value: "whatsapp", label: "Enviar pelo WhatsApp" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] p-3"
                    >
                      <input
                        type="radio"
                        checked={form.video_metodo === option.value}
                        onChange={() =>
                          updateField("video_metodo", option.value)
                        }
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {form.video_metodo === "upload" && (
                <div className="space-y-2">
                  <label className="block font-semibold">
                    Arquivo de vídeo
                  </label>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(event) =>
                      updateField("video_file", event.target.files?.[0] ?? null)
                    }
                  />
                  <p className="text-xs text-slate-500">
                    Aceitamos arquivos de vídeo para envio direto no sistema.
                  </p>
                </div>
              )}

              {form.video_metodo === "whatsapp" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  Envie o vídeo para o WhatsApp: <strong>67984213816</strong>
                </div>
              )}

              {form.video_metodo === "upload" && (
                <div className="space-y-2">
                  <label className="block font-semibold">
                    Link do vídeo (opcional)
                  </label>
                  <Input
                    value={form.video_link}
                    onChange={(e) => updateField("video_link", e.target.value)}
                    placeholder="https://youtube.com/watch?v=... ou link do Google Drive"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block font-semibold">
                  Qual música escolheu para apresentar?
                </label>
                <Input
                  value={form.musica_escolhida}
                  onChange={(e) =>
                    updateField("musica_escolhida", e.target.value)
                  }
                  required
                  placeholder="Nome da música e artista"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">
                  Observações sobre sua apresentação
                </label>
                <textarea
                  value={form.observacoes_video}
                  onChange={(e) =>
                    updateField("observacoes_video", e.target.value)
                  }
                  placeholder="Alguma informação adicional sobre o vídeo?"
                  className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/10"
                />
              </div>

              <div className="flex justify-between gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentSection(4)}
                >
                  ← Voltar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (validateCurrentSection()) setCurrentSection(6);
                  }}
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white"
                >
                  Próximo →
                </Button>
              </div>
            </div>
          )}

          {currentSection === 6 && (
            <div className="space-y-6">
              <h2 className="border-b-4 border-[#667eea] pb-2 text-2xl font-bold text-[#667eea]">
                ✅ Declaração Final
              </h2>

              <div className="rounded-md border-l-4 border-[#667eea] bg-[#e8eaf6] p-4 text-sm text-slate-700">
                <strong>Antes de enviar, revise todas as informações!</strong>
              </div>

              <div className="space-y-3 rounded-xl bg-[#f8f9fa] p-4">
                <label className="flex items-start gap-3 font-semibold">
                  <input
                    type="checkbox"
                    checked={form.declaracao}
                    onChange={(e) =>
                      updateField("declaracao", e.target.checked)
                    }
                    required
                  />
                  <span>
                    Declaro que todas as informações são verdadeiras e estou
                    ciente que:
                  </span>
                </label>
                <ul className="ml-8 list-disc space-y-1 text-sm text-slate-700">
                  <li>
                    Fazer parte da equipe de louvor é um privilégio e
                    responsabilidade
                  </li>
                  <li>Devo manter vida de comunhão com Deus consistente</li>
                  <li>Preciso estar em submissão à liderança da igreja</li>
                  <li>
                    Meu testemunho deve honrar a Deus dentro e fora da igreja
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">
                  Assinatura Digital (digite seu nome completo)
                </label>
                <Input
                  value={form.assinatura}
                  onChange={(e) => updateField("assinatura", e.target.value)}
                  required
                  placeholder="Digite seu nome completo como assinatura"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">Data</label>
                <Input type="date" value={form.data_envio} readOnly />
              </div>

              <div className="flex justify-between gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentSection(5)}
                >
                  ← Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white"
                >
                  {loading ? "Enviando..." : "🚀 Enviar Inscrição"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
