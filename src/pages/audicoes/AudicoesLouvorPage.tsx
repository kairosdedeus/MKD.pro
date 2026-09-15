import { useEffect, useMemo, useState } from "react";
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
  mensagem: "",
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
  discipulado: "",
  discipulador: "",
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
  vida_devocional_duvidas: "",
  video_metodo: "upload" as "upload" | "whatsapp",
  video_link: "",
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

const fieldBaseClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-2 [color-scheme:light] dark:[color-scheme:dark]";

const choiceClass =
  "flex cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-muted/50 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10";

const isFilled = (value: unknown) => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().length > 0;
  return value !== undefined && value !== null;
};

const getFieldClass = (invalid: boolean) =>
  `${fieldBaseClass} ${invalid ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "focus:border-primary focus:ring-primary/20"}`;

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export function AudicoesLouvorPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [currentSection, setCurrentSection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [registrationsOpen, setRegistrationsOpen] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    audicaoService
      .getRegistrationStatus()
      .then((open) => {
        if (isMounted) setRegistrationsOpen(open);
      })
      .catch(() => {
        if (isMounted) setRegistrationsOpen(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalSections = 6;

  const updateField = (
    field: string,
    value: string | boolean | string[] | File | null,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: false }));
  };

  const validateCurrentSection = () => {
    const errors: Record<string, boolean> = {};
    const requiredBySection: Record<number, string[]> = {
      1: ["nome_completo", "data_nascimento", "telefone", "email", "mensagem"],
      2: ["encontro_deus", "escola_lideres", "celula", "tempo_igreja"],
      3: ["ministerio", "chamado", "tempo_experiencia", "nivel", "leitura"],
      4: ["disponibilidade", "compromisso_cultos", "vida_devocional"],
      5: ["video_metodo"],
      6: ["declaracao", "assinatura"],
    };

    const required = requiredBySection[currentSection] ?? [];
    required.forEach((field) => {
      const value = form[field as keyof typeof form];
      if (!isFilled(value)) {
        errors[field] = true;
      }
    });

    if (currentSection === 2) {
      if (
        ["Sim", "Em andamento"].includes(form.encontro_deus) &&
        !form.data_encontro
      ) {
        errors.data_encontro = true;
      }
      if (form.escola_lideres === "Concluí" && !form.data_escola) {
        errors.data_escola = true;
      }
      if (form.celula === "Sim" && !form.celula_info) {
        errors.celula_info = true;
      }
      if (form.discipulado === "Sim" && !form.discipulador) {
        errors.discipulador = true;
      }
    }

    if (currentSection === 3) {
      if (form.experiencia_anterior === "Sim" && !form.experiencia_detalhes) {
        errors.experiencia_detalhes = true;
      }
    }

    if (currentSection === 4) {
      if (form.compromisso_cultos === "Parcialmente" && !form.compromisso_obs) {
        errors.compromisso_obs = true;
      }
      if (
        form.vida_devocional === "Tenho dúvidas" &&
        !form.vida_devocional_duvidas
      ) {
        errors.vida_devocional_duvidas = true;
      }
    }

    if (
      currentSection === 5 &&
      form.video_metodo === "upload" &&
      !form.video_file
    ) {
      errors.video_file = true;
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Revise os campos destacados antes de continuar.",
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

  const progress = useMemo(
    () => Math.round((currentSection / totalSections) * 100),
    [currentSection],
  );

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
            ? "https://w.app/audicaomkd"
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

  if (registrationsOpen === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm text-muted-foreground shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
          Verificando inscrições...
        </div>
      </div>
    );
  }

  if (!registrationsOpen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-5 text-foreground">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
          <div className="mb-4 text-6xl">⏳</div>
          <h2 className="mb-3 text-3xl font-bold">Inscrições encerradas</h2>
          <p className="text-base text-muted-foreground">
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
      <div className="flex min-h-screen items-center justify-center bg-background p-5 text-foreground">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
          <div className="mb-4 text-6xl">✅</div>
          <h2 className="mb-4 text-3xl font-bold">
            Inscrição Enviada com Sucesso!
          </h2>
          <p className="text-base text-muted-foreground">
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
    <div className="min-h-screen bg-background p-3 text-foreground sm:p-5">
      <div className="mx-auto max-w-[800px] overflow-hidden rounded-2xl border border-border bg-card shadow-xl sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-primary/20 bg-primary p-4 text-primary-foreground sm:p-5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/login")}
            className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
          >
            ← Voltar para o login
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold sm:text-2xl">
              🎵 Audição - Equipe de Louvor MKD
            </h1>
            <p className="text-sm opacity-90">Igreja MKD | Modelo M12</p>
          </div>
          <div className="hidden w-[170px] sm:block" />
        </div>

        <div className="h-1.5 w-full bg-muted">
          <div
            className="h-full bg-primary-foreground/80 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="border-b border-border py-4 text-center text-sm text-muted-foreground">
          Passo {currentSection} de {totalSections}
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-8 pt-2 sm:px-7">
          {currentSection === 1 && (
            <div className="space-y-8">
              <h2 className="border-b-2 border-primary pb-2 text-2xl font-bold text-primary">
                📋 Dados Pessoais
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="block font-semibold">Nome completo</label>
                  <Input
                    value={form.nome_completo}
                    aria-invalid={Boolean(fieldErrors.nome_completo)}
                    className={getFieldClass(
                      Boolean(fieldErrors.nome_completo),
                    )}
                    onChange={(e) =>
                      updateField("nome_completo", e.target.value)
                    }
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold">
                    Data de nascimento
                  </label>
                  <Input
                    type="date"
                    value={form.data_nascimento}
                    aria-invalid={Boolean(fieldErrors.data_nascimento)}
                    className={getFieldClass(
                      Boolean(fieldErrors.data_nascimento),
                    )}
                    onChange={(e) =>
                      updateField("data_nascimento", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold">
                    Telefone / WhatsApp
                  </label>
                  <Input
                    type="tel"
                    inputMode="tel"
                    value={form.telefone}
                    aria-invalid={Boolean(fieldErrors.telefone)}
                    className={getFieldClass(Boolean(fieldErrors.telefone))}
                    onChange={(e) =>
                      updateField("telefone", formatPhone(e.target.value))
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block font-semibold">E-mail</label>
                  <Input
                    type="email"
                    value={form.email}
                    aria-invalid={Boolean(fieldErrors.email)}
                    className={getFieldClass(Boolean(fieldErrors.email))}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block font-semibold">Endereço</label>
                  <textarea
                    value={form.endereco}
                    onChange={(e) => updateField("endereco", e.target.value)}
                    placeholder="Rua, número, bairro, cidade"
                    className={`${getFieldClass(false)} min-h-[100px]`}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block font-semibold">
                    Fale um pouco sobre você
                  </label>
                  <textarea
                    value={form.mensagem}
                    maxLength={600}
                    aria-invalid={Boolean(fieldErrors.mensagem)}
                    className={`${getFieldClass(Boolean(fieldErrors.mensagem))} min-h-[130px]`}
                    onChange={(e) => updateField("mensagem", e.target.value)}
                    placeholder="Conte um pouco sobre sua vida, sua caminhada e o que te move a servir no louvor."
                  />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Limite de 600 caracteres</span>
                    <span>{form.mensagem.length}/600</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    if (validateCurrentSection()) setCurrentSection(2);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Próximo →
                </Button>
              </div>
            </div>
          )}

          {currentSection === 2 && (
            <div className="space-y-8">
              <h2 className="border-b-2 border-primary pb-2 text-2xl font-bold text-primary">
                ✝️ Jornada no M12
              </h2>

              <div className="rounded-md border-l-4 border-primary bg-primary/10 p-4 text-sm text-foreground">
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
                    <label key={option} className={choiceClass}>
                      <input
                        type="radio"
                        checked={form.encontro_deus === option}
                        onChange={() => {
                          updateField("encontro_deus", option);
                          if (option !== "Sim" && option !== "Em andamento") {
                            updateField("data_encontro", "");
                          }
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {(["Sim", "Em andamento"].includes(form.encontro_deus) ||
                form.data_encontro) && (
                <div className="space-y-2">
                  <label className="block font-semibold">
                    Data do Encontro com Deus
                  </label>
                  <Input
                    type="date"
                    value={form.data_encontro}
                    aria-invalid={Boolean(fieldErrors.data_encontro)}
                    className={getFieldClass(
                      Boolean(fieldErrors.data_encontro),
                    )}
                    onChange={(e) =>
                      updateField("data_encontro", e.target.value)
                    }
                  />
                </div>
              )}

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
                    <label key={option} className={choiceClass}>
                      <input
                        type="radio"
                        checked={form.escola_lideres === option}
                        onChange={() => {
                          updateField("escola_lideres", option);
                          if (option !== "Concluí")
                            updateField("data_escola", "");
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {form.escola_lideres === "Concluí" && (
                <div className="space-y-2">
                  <label className="block font-semibold">
                    Data de conclusão da Escola de Líderes
                  </label>
                  <Input
                    type="date"
                    value={form.data_escola}
                    aria-invalid={Boolean(fieldErrors.data_escola)}
                    className={getFieldClass(Boolean(fieldErrors.data_escola))}
                    onChange={(e) => updateField("data_escola", e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="block font-semibold">
                  Você participa regularmente de uma Célula?
                </label>
                <div className="space-y-2">
                  {["Sim", "Não"].map((option) => (
                    <label key={option} className={choiceClass}>
                      <input
                        type="radio"
                        checked={form.celula === option}
                        onChange={() => {
                          updateField("celula", option);
                          if (option !== "Sim") updateField("celula_info", "");
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {form.celula === "Sim" && (
                <div className="space-y-2">
                  <label className="block font-semibold">
                    Nome da Célula e Líder
                  </label>
                  <Input
                    value={form.celula_info}
                    aria-invalid={Boolean(fieldErrors.celula_info)}
                    className={getFieldClass(Boolean(fieldErrors.celula_info))}
                    onChange={(e) => updateField("celula_info", e.target.value)}
                    placeholder="Ex: Célula Família - Líder João"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block font-semibold">
                  Há quanto tempo frequenta a Igreja MKD?
                </label>
                <select
                  value={form.tempo_igreja}
                  aria-invalid={Boolean(fieldErrors.tempo_igreja)}
                  className={getFieldClass(Boolean(fieldErrors.tempo_igreja))}
                  onChange={(e) => updateField("tempo_igreja", e.target.value)}
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
                    <label key={option} className={choiceClass}>
                      <input
                        type="radio"
                        checked={form.discipulado === option}
                        onChange={() => {
                          updateField("discipulado", option);
                          if (option !== "Sim") updateField("discipulador", "");
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {form.discipulado === "Sim" && (
                <div className="space-y-2">
                  <label className="block font-semibold">
                    Nome do discipulador
                  </label>
                  <Input
                    value={form.discipulador}
                    aria-invalid={Boolean(fieldErrors.discipulador)}
                    className={getFieldClass(Boolean(fieldErrors.discipulador))}
                    onChange={(e) =>
                      updateField("discipulador", e.target.value)
                    }
                    placeholder="Nome do seu discipulador"
                  />
                </div>
              )}

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
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Próximo →
                </Button>
              </div>
            </div>
          )}

          {currentSection === 3 && (
            <div className="space-y-8">
              <h2 className="border-b-2 border-primary pb-2 text-2xl font-bold text-primary">
                🎸 Chamado e Ministério
              </h2>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Qual ministério deseja integrar?
                </label>
                <div className="space-y-2">
                  {["Vocalista", "Instrumentista", "Ambos"].map((option) => (
                    <label key={option} className={choiceClass}>
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
                      <label key={instrument} className={choiceClass}>
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
                  aria-invalid={Boolean(fieldErrors.chamado)}
                  className={`${getFieldClass(Boolean(fieldErrors.chamado))} min-h-[110px]`}
                  onChange={(e) => updateField("chamado", e.target.value)}
                  placeholder="Conte-nos sobre sua experiência espiritual e como sente o chamado para servir no louvor..."
                />
              </div>

              <div className="space-y-2">
                <label className="block font-semibold">
                  Há quanto tempo toca ou canta?
                </label>
                <select
                  value={form.tempo_experiencia}
                  aria-invalid={Boolean(fieldErrors.tempo_experiencia)}
                  className={getFieldClass(
                    Boolean(fieldErrors.tempo_experiencia),
                  )}
                  onChange={(e) =>
                    updateField("tempo_experiencia", e.target.value)
                  }
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
                    <label key={option} className={choiceClass}>
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
                  {["Partitura", "Cifra", "Ambos", "Tablatura", "Não"].map(
                    (option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"
                      >
                        <input
                          type="radio"
                          checked={form.leitura === option}
                          onChange={() => updateField("leitura", option)}
                        />
                        <span>{option}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Já participou de equipe de louvor anteriormente?
                </label>
                <div className="space-y-2">
                  {["Sim", "Não"].map((option) => (
                    <label key={option} className={choiceClass}>
                      <input
                        type="radio"
                        checked={form.experiencia_anterior === option}
                        onChange={() => {
                          updateField("experiencia_anterior", option);
                          if (option !== "Sim")
                            updateField("experiencia_detalhes", "");
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {form.experiencia_anterior === "Sim" && (
                <div className="space-y-2">
                  <label className="block font-semibold">
                    Igreja/Ministério anterior e tempo
                  </label>
                  <textarea
                    value={form.experiencia_detalhes}
                    aria-invalid={Boolean(fieldErrors.experiencia_detalhes)}
                    className={`${getFieldClass(Boolean(fieldErrors.experiencia_detalhes))} min-h-[80px]`}
                    onChange={(e) =>
                      updateField("experiencia_detalhes", e.target.value)
                    }
                    placeholder="Se sim, onde e por quanto tempo?"
                  />
                </div>
              )}

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
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Próximo →
                </Button>
              </div>
            </div>
          )}

          {currentSection === 4 && (
            <div className="space-y-8">
              <h2 className="border-b-2 border-primary pb-2 text-2xl font-bold text-primary">
                📅 Disponibilidade e Compromisso
              </h2>

              <div className="rounded-md border-l-4 border-primary bg-primary/10 p-4 text-sm text-foreground">
                <strong>Atenção:</strong> Fazer parte da equipe de louvor exige
                compromisso, pontualidade e dedicação aos ensaios e cultos.
              </div>

              <div className="space-y-3">
                <label className="block font-semibold">
                  Disponibilidade para ensaios (marque os dias):
                </label>
                <div className="grid gap-2 md:grid-cols-2">
                  {disponibilidadeOptions.map((day) => (
                    <label key={day} className={choiceClass}>
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
                    <label key={option} className={choiceClass}>
                      <input
                        type="radio"
                        checked={form.compromisso_cultos === option}
                        onChange={() => {
                          updateField("compromisso_cultos", option);
                          if (option !== "Parcialmente")
                            updateField("compromisso_obs", "");
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {form.compromisso_cultos === "Parcialmente" && (
                <div className="space-y-2">
                  <label className="block font-semibold">
                    Se parcialmente, explique:
                  </label>
                  <textarea
                    value={form.compromisso_obs}
                    aria-invalid={Boolean(fieldErrors.compromisso_obs)}
                    className={`${getFieldClass(Boolean(fieldErrors.compromisso_obs))} min-h-[90px]`}
                    onChange={(e) =>
                      updateField("compromisso_obs", e.target.value)
                    }
                    placeholder="Explique suas limitações de disponibilidade..."
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="block font-semibold">
                  Compreende que o ministério exige vida devocional consistente?
                </label>
                <div className="space-y-2">
                  {["Sim, compreendo e aceito", "Tenho dúvidas", "Não"].map(
                    (option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"
                      >
                        <input
                          type="radio"
                          checked={form.vida_devocional === option}
                          onChange={() => {
                            updateField("vida_devocional", option);
                            if (option !== "Tenho dúvidas")
                              updateField("vida_devocional_duvidas", "");
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              {form.vida_devocional === "Tenho dúvidas" && (
                <div className="space-y-2">
                  <label className="block font-semibold">
                    Descreva suas dúvidas (até 300 caracteres)
                  </label>
                  <textarea
                    value={form.vida_devocional_duvidas}
                    maxLength={300}
                    aria-invalid={Boolean(fieldErrors.vida_devocional_duvidas)}
                    className={`${getFieldClass(Boolean(fieldErrors.vida_devocional_duvidas))} min-h-[90px]`}
                    onChange={(e) =>
                      updateField("vida_devocional_duvidas", e.target.value)
                    }
                    placeholder="Escreva em poucas palavras as suas dúvidas..."
                  />
                  <p className="text-right text-xs text-slate-500 dark:text-slate-400">
                    {form.vida_devocional_duvidas.length}/300
                  </p>
                </div>
              )}

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
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Próximo →
                </Button>
              </div>
            </div>
          )}

          {currentSection === 5 && (
            <div className="space-y-8">
              <h2 className="border-b-2 border-primary pb-2 text-2xl font-bold text-primary">
                🎬 Vídeo de Avaliação
              </h2>

              <div className="rounded-md border-l-4 border-primary bg-primary/10 p-4 text-sm text-foreground">
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
                    <label key={option.value} className={choiceClass}>
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
                    aria-invalid={Boolean(fieldErrors.video_file)}
                    className={getFieldClass(Boolean(fieldErrors.video_file))}
                    onChange={(event) =>
                      updateField("video_file", event.target.files?.[0] ?? null)
                    }
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aceitamos arquivos de vídeo para envio direto no sistema.
                  </p>
                </div>
              )}

              {form.video_metodo === "whatsapp" && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-foreground shadow-sm">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Envio pelo WhatsApp
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Abra o WhatsApp pelo botão abaixo e envie seu vídeo para a equipe.
                  </p>
                  <a
                    href="https://w.app/audicaomkd"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:w-auto"
                  >
                    Abrir WhatsApp
                  </a>
                </div>
              )}

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
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Próximo →
                </Button>
              </div>
            </div>
          )}

          {currentSection === 6 && (
            <div className="space-y-8">
              <h2 className="border-b-2 border-primary pb-2 text-2xl font-bold text-primary">
                ✅ Declaração Final
              </h2>

              <div className="rounded-md border-l-4 border-primary bg-primary/10 p-4 text-sm text-foreground">
                <strong>Antes de enviar, revise todas as informações!</strong>
              </div>

              <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <label className="flex items-start gap-3 font-semibold">
                  <input
                    type="checkbox"
                    checked={form.declaracao}
                    onChange={(e) =>
                      updateField("declaracao", e.target.checked)
                    }
                  />
                  <span>
                    Declaro que todas as informações são verdadeiras e estou
                    ciente que:
                  </span>
                </label>
                <ul className="ml-8 list-disc space-y-1 text-sm text-slate-700 dark:text-slate-300">
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
                  aria-invalid={Boolean(fieldErrors.assinatura)}
                  className={getFieldClass(Boolean(fieldErrors.assinatura))}
                  onChange={(e) => updateField("assinatura", e.target.value)}
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
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
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
