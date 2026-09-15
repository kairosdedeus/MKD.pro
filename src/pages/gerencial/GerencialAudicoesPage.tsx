import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  X,
  Users,
  Mail,
  Sparkles,
  CheckCircle2,
  Clock3,
  Eye,
  Download,
  Video,
  Trash2,
  FileText,
  RefreshCw,
  ClipboardList,
  ArrowUpRight,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  audicaoService,
  type AudicaoStatus,
  type AudicaoSubmission,
} from "@/services/audicaoService";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonList } from "@/components/shared/SkeletonLoader";

const statusStyles = {
  pendente:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  aprovado:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  reprovado: "border-destructive/30 bg-destructive/10 text-destructive",
};

const getDisplayStatus = (status?: string): AudicaoStatus =>
  status === "aprovado" || status === "reprovado" ? status : "pendente";

const statusLabels: Record<AudicaoStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

const questionLabels: Array<{ key: keyof AudicaoSubmission; label: string }> = [
  { key: "nome", label: "Nome" },
  { key: "sobrenome", label: "Sobrenome" },
  { key: "email", label: "E-mail" },
  { key: "telefone", label: "Telefone" },
  { key: "data_nascimento", label: "Data de nascimento" },
  { key: "ministerio", label: "Ministério" },
  { key: "instrumentos", label: "Instrumentos" },
  { key: "outro_instrumento", label: "Outro instrumento" },
  { key: "encontro_deus", label: "Como foi o encontro com Deus?" },
  { key: "data_encontro", label: "Data do encontro" },
  { key: "escola_lideres", label: "Escola de líderes" },
  { key: "data_escola", label: "Data da escola" },
  { key: "celula", label: "Célula" },
  { key: "celula_info", label: "Detalhes da célula" },
  { key: "tempo_igreja", label: "Tempo na igreja" },
  { key: "endereco", label: "Endereço" },
  { key: "mensagem", label: "Mensagem" },
  { key: "chamado", label: "Chamado" },
  { key: "tempo_experiencia", label: "Tempo de experiência" },
  { key: "nivel", label: "Nível" },
  { key: "leitura", label: "Leitura" },
  { key: "experiencia_anterior", label: "Experiência anterior" },
  { key: "experiencia_detalhes", label: "Detalhes da experiência" },
  { key: "disponibilidade", label: "Disponibilidade" },
  { key: "compromisso_cultos", label: "Compromisso com cultos" },
  { key: "compromisso_obs", label: "Observações de compromisso" },
  { key: "vida_devocional", label: "Vida devocional" },
  { key: "vida_devocional_duvidas", label: "Dúvidas sobre vida devocional" },
  { key: "video_metodo", label: "Método de envio do vídeo" },
  { key: "observacoes_video", label: "Observações do vídeo" },
  { key: "declaracao", label: "Declaração" },
  { key: "assinatura", label: "Assinatura" },
  { key: "status", label: "Status" },
  { key: "analise", label: "Análise" },
];

const formatAnswer = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
};

const isDirectVideoUrl = (value?: string | null) => {
  if (!value) return false;

  try {
    const url = new URL(value);
    const pathname = url.pathname.toLowerCase();
    return (
      /\.(mp4|webm|ogg|mov|m4v|avi|3gp)(\?.*)?$/i.test(pathname) ||
      pathname.includes("/video/") ||
      pathname.includes("/media/")
    );
  } catch {
    return /\.(mp4|webm|ogg|mov|m4v|avi|3gp)(\?.*)?$/i.test(String(value));
  }
};

interface SettingSwitchProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingSwitch({
  id,
  title,
  description,
  checked,
  disabled = false,
  onCheckedChange,
}: SettingSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-background p-4 transition-colors hover:bg-muted/30">
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer font-semibold">
          {title}
        </label>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {description}
        </p>
        <span
          className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
            checked
              ? "bg-emerald-500/10 text-emerald-700"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {checked ? "Ativado" : "Desativado"}
        </span>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={title}
        className="shrink-0 data-[state=checked]:bg-emerald-600"
      />
    </div>
  );
}

export function GerencialAudicoesPage() {
  const [responses, setResponses] = useState<AudicaoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AudicaoStatus | "todos">(
    "todos",
  );
  const [selected, setSelected] = useState<AudicaoSubmission | null>(null);
  const [analysisText, setAnalysisText] = useState("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "dados" | "formulario" | "analise"
  >("dados");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [settingsUpdating, setSettingsUpdating] = useState<
    "registration" | "approved-results" | null
  >(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [approvedResultsVisible, setApprovedResultsVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadResponses = async (showRefreshState = false) => {
    if (showRefreshState) setRefreshing(true);
    try {
      const data = await audicaoService.getSubmissions();
      setResponses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadResponses();
    audicaoService
      .getRegistrationStatus()
      .then(setRegistrationOpen)
      .catch(console.error);
    audicaoService
      .areApprovedResultsVisible()
      .then(setApprovedResultsVisible)
      .catch(console.error);
  }, []);

  const filteredResponses = useMemo(() => {
    const term = search.trim().toLowerCase();

    return responses.filter(
      (response) =>
        (statusFilter === "todos" ||
          getDisplayStatus(response.status) === statusFilter) &&
        (!term ||
          [
            response.nome,
            response.sobrenome,
            response.email,
            response.telefone ?? "",
            response.ministerio ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(term)),
    );
  }, [responses, search, statusFilter]);

  const statusCounts = {
    todos: responses.length,
    pendente: responses.filter(
      (response) => getDisplayStatus(response.status) === "pendente",
    ).length,
    aprovado: responses.filter(
      (response) => getDisplayStatus(response.status) === "aprovado",
    ).length,
    reprovado: responses.filter(
      (response) => getDisplayStatus(response.status) === "reprovado",
    ).length,
  };

  const activeFiltersCount =
    Number(Boolean(search)) + Number(statusFilter !== "todos");

  const openSelection = async (response: AudicaoSubmission) => {
    setSelected(response);
    setAnalysisText(response.analise ?? "");
    setVideoPreviewUrl(null);
    setVideoLoading(true);
    setActiveTab("dados");

    try {
      const refreshedUrl = await audicaoService.getPlayableVideoUrl(
        response.video_link,
      );
      setVideoPreviewUrl(refreshedUrl ?? response.video_link ?? null);
    } catch {
      setVideoPreviewUrl(response.video_link ?? null);
    } finally {
      setVideoLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a inscrição de ${selected.nome} ${selected.sobrenome}? Isso removerá o registro e o vídeo salvo no storage.`,
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await audicaoService.deleteSubmission(selected.id, selected.video_link);
      setResponses((current) =>
        current.filter((item) => item.id !== selected.id),
      );
      setSelected(null);
    } catch (error) {
      console.error(error);
      window.alert("Não foi possível excluir a inscrição. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDecision = async (status: AudicaoStatus) => {
    if (!selected) return;

    setUpdating(true);
    try {
      const updated = await audicaoService.updateStatus(
        selected.id,
        status,
        analysisText,
      );

      setResponses((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelected((current) =>
        current && current.id === updated.id ? updated : current,
      );
      setSelected(null);
    } finally {
      setUpdating(false);
    }
  };

  const handleExportApproved = () => {
    const approved = responses.filter((item) => item.status === "aprovado");
    if (approved.length === 0) return;

    const lines = [
      ["Nome", "Sobrenome", "Telefone", "E-mail"].join(","),
      ...approved.map((item) =>
        [
          item.nome ?? "",
          item.sobrenome ?? "",
          item.telefone ?? "",
          item.email ?? "",
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aprovados-audicoes.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleRegistration = (enabled: boolean) => {
    setSettingsUpdating("registration");
    audicaoService
      .setRegistrationStatus(enabled)
      .then(() => setRegistrationOpen(enabled))
      .catch((error) => {
        console.error(error);
        window.alert("Não foi possível atualizar as inscrições.");
      })
      .finally(() => setSettingsUpdating(null));
  };

  const toggleApprovedResults = async (enabled: boolean) => {
    setSettingsUpdating("approved-results");
    try {
      await audicaoService.setApprovedResultsVisible(enabled);
      setApprovedResultsVisible(enabled);
    } catch (error) {
      console.error(error);
      window.alert("Não foi possível atualizar a publicação dos resultados.");
    } finally {
      setSettingsUpdating(null);
    }
  };

  return (
    <div className="min-h-full space-y-5 p-3 sm:p-4 md:space-y-6 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <ClipboardList className="h-4 w-4" />
            Gestão de audições
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Audições Louvor-MKD
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Visualize, analise e gerencie as inscrições da temporada.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Button
            variant="outline"
            onClick={() => loadResponses(true)}
            disabled={loading || refreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Button
            variant="outline"
            onClick={handleExportApproved}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar aprovados
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Publicação e inscrições</CardTitle>
          <p className="text-sm text-muted-foreground">
            Controle o que fica disponível para os participantes.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <SettingSwitch
            id="auditions-registration-switch"
            title="Inscrições abertas"
            description="Exibe o acesso ao formulário e permite novos envios."
            checked={registrationOpen}
            disabled={settingsUpdating !== null}
            onCheckedChange={toggleRegistration}
          />
          <SettingSwitch
            id="approved-results-switch"
            title="Mostrar aprovados no login"
            description="Publica o botão de resultados na tela de login."
            checked={approvedResultsVisible}
            disabled={settingsUpdating !== null}
            onCheckedChange={toggleApprovedResults}
          />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold">{responses.length}</span>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Clock3 className="h-4 w-4 text-amber-500" />
            <span className="text-2xl font-bold">
              {
                responses.filter(
                  (response) =>
                    getDisplayStatus(response.status) === "pendente",
                ).length
              }
            </span>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Aprovados
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-2xl font-bold">
              {
                responses.filter((response) => response.status === "aprovado")
                  .length
              }
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Inscrições
                <Badge variant="secondary" className="gap-2 font-normal">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {responses.length} envio(s)
                </Badge>
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecione uma inscrição para revisar os dados e tomar uma
                decisão.
              </p>
            </div>
            {activeFiltersCount > 0 && (
              <Badge variant="outline" className="w-fit text-xs">
                {activeFiltersCount} filtro(s) ativo(s)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, sobrenome, telefone ou e-mail"
              className="pl-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Filter className="h-4 w-4" />
              Situação
            </div>
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
              {(["todos", "pendente", "aprovado", "reprovado"] as const).map(
                (filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    aria-pressed={statusFilter === filter}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                      statusFilter === filter
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-transparent bg-background text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    <span>
                      {filter === "todos" ? "Todas" : statusLabels[filter]}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
                      {statusCounts[filter]}
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>

          {(search || statusFilter !== "todos") && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Exibindo {filteredResponses.length} inscrição(ões)</span>
              {statusFilter !== "todos" && (
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 text-primary"
                >
                  {statusLabels[statusFilter]}
                </Badge>
              )}
            </div>
          )}

          {loading ? (
            <SkeletonList rows={4} />
          ) : filteredResponses.length === 0 ? (
            <EmptyState
              icon={search || statusFilter !== "todos" ? Search : ClipboardList}
              title={
                search || statusFilter !== "todos"
                  ? "Nenhum resultado"
                  : "Nenhuma inscrição ainda"
              }
              description={
                search || statusFilter !== "todos"
                  ? "Tente remover os filtros ou buscar por outro nome, e-mail ou ministério."
                  : "As novas inscrições aparecerão aqui assim que forem enviadas."
              }
              action={
                search || statusFilter !== "todos"
                  ? {
                      label: "Limpar filtros",
                      onClick: () => {
                        setSearch("");
                        setStatusFilter("todos");
                      },
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredResponses.map((response) => (
                <button
                  key={response.id}
                  type="button"
                  onClick={() => openSelection(response)}
                  className={[
                    "group rounded-2xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selected?.id === response.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">
                        {response.nome || "—"} {response.sobrenome || ""}
                      </h3>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {response.telefone || "Telefone não informado"}
                      </p>
                    </div>
                    <Badge
                      className={[
                        "border text-xs",
                        statusStyles[getDisplayStatus(response.status)],
                      ].join(" ")}
                    >
                      {getDisplayStatus(response.status) === "aprovado"
                        ? "Aprovado"
                        : getDisplayStatus(response.status) === "reprovado"
                          ? "Reprovado"
                          : "Pendente"}
                    </Badge>
                  </div>

                  {response.video_metodo === "whatsapp" && (
                    <Badge
                      variant="outline"
                      className="mt-3 w-fit gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Enviado pelo WhatsApp
                    </Badge>
                  )}

                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{response.email}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>
                      {response.ministerio || "Ministério não informado"}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1">
                      {new Date(response.created_at).toLocaleDateString(
                        "pt-BR",
                      )}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-0 sm:rounded-2xl">
          {selected && (
            <>
              <DialogHeader className="border-b bg-muted/30 px-4 pb-5 pt-5 sm:px-6 sm:pt-6">
                <div className="flex flex-col gap-4 pr-6 sm:flex-row sm:items-start sm:justify-between sm:pr-8">
                  <div className="min-w-0">
                    <DialogTitle className="text-xl sm:text-2xl">
                      {selected.nome} {selected.sobrenome}
                    </DialogTitle>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{selected.email}</span>
                      <span>
                        {selected.telefone || "Telefone não informado"}
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={`w-fit border ${statusStyles[getDisplayStatus(selected.status)]}`}
                  >
                    {statusLabels[getDisplayStatus(selected.status)]}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 px-4 pb-6 pt-4 sm:px-6">
                <div className="grid grid-cols-3 gap-1 rounded-xl border bg-muted/50 p-1">
                  {[
                    { key: "dados", label: "Dados", icon: FileText },
                    { key: "formulario", label: "Formulário", icon: Eye },
                    { key: "analise", label: "Análise", icon: CheckCircle2 },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setActiveTab(key as "dados" | "formulario" | "analise")
                      }
                      className={[
                        "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                        activeTab === key
                          ? "bg-background font-semibold text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {activeTab === "dados" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Contato
                        </p>
                        <p className="mt-1 font-medium">{selected.email}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Telefone
                        </p>
                        <p className="mt-1 font-medium">
                          {selected.telefone || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Ministério
                        </p>
                        <p className="mt-1 font-medium">
                          {selected.ministerio || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Status
                        </p>
                        <Badge
                          className={[
                            "mt-1 border",
                            statusStyles[getDisplayStatus(selected.status)],
                          ].join(" ")}
                        >
                          {getDisplayStatus(selected.status) === "aprovado"
                            ? "Aprovado"
                            : getDisplayStatus(selected.status) === "reprovado"
                              ? "Reprovado"
                              : "Pendente"}
                        </Badge>
                      </div>
                    </div>

                    <div className="rounded-xl border bg-muted/30 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <Video className="h-4 w-4" />
                          Vídeo da audição
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {selected.video_metodo === "whatsapp"
                            ? "WhatsApp"
                            : "Upload"}
                        </Badge>
                      </div>

                      {selected.video_link ? (
                        selected.video_link.includes("wa.me") ? (
                          <div className="mt-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            O vídeo foi enviado por WhatsApp. Use o link abaixo
                            para abrir o material.
                            <a
                              href={selected.video_link}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-1 text-primary underline underline-offset-2"
                            >
                              Abrir vídeo / WhatsApp
                            </a>
                          </div>
                        ) : isDirectVideoUrl(
                            videoPreviewUrl || selected.video_link,
                          ) ? (
                          <div className="mt-3 overflow-hidden rounded-lg border bg-black">
                            {videoLoading ? (
                              <div className="flex min-h-[180px] items-center justify-center text-sm text-white/80">
                                Atualizando link do vídeo...
                              </div>
                            ) : (
                              <video
                                controls
                                playsInline
                                preload="metadata"
                                className="w-full max-h-[240px]"
                                src={videoPreviewUrl || selected.video_link}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="mt-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            O link salvo não é um vídeo direto. Use o botão
                            abaixo para abrir o arquivo no navegador e confirmar
                            a reprodução.
                            <a
                              href={videoPreviewUrl || selected.video_link}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-1 text-primary underline underline-offset-2"
                            >
                              Abrir link do vídeo
                            </a>
                          </div>
                        )
                      ) : (
                        <div className="mt-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                          Vídeo não enviado.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "formulario" && (
                  <div className="rounded-xl border p-4">
                    <p className="mb-3 text-sm font-semibold">
                      Resposta do formulário
                    </p>
                    <div className="space-y-3 text-sm">
                      {questionLabels.map((question) => {
                        const value = selected[question.key];
                        if (
                          question.key === "analise" ||
                          question.key === "status"
                        )
                          return null;
                        if (question.key === "video_link" && !value)
                          return null;

                        return (
                          <div
                            key={question.key}
                            className="border-b border-border pb-2 last:border-b-0 last:pb-0"
                          >
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              {question.label}
                            </p>
                            <p className="mt-1 break-words text-foreground">
                              {formatAnswer(value)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === "analise" && (
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Eye className="h-4 w-4" />
                      Análise
                    </div>
                    <textarea
                      value={analysisText}
                      onChange={(event) => setAnalysisText(event.target.value)}
                      placeholder="Escreva a análise do candidato..."
                      className="mt-3 min-h-[180px] w-full rounded-lg border bg-background p-3 text-sm outline-none ring-0"
                    />
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <Button
                        onClick={() => handleDecision("aprovado")}
                        disabled={updating}
                        className="gap-2 sm:flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {updating ? "Salvando..." : "Aprovar"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDecision("reprovado")}
                        disabled={updating}
                        className="gap-2 sm:flex-1"
                      >
                        {updating ? "Salvando..." : "Reprovar"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="gap-2 sm:flex-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleting ? "Excluindo..." : "Excluir formulário"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
