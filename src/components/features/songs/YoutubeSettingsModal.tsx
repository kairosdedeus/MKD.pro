import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { youtubeService, YoutubeApiStatus } from "@/services/youtubeService";
import { migrationService, MIGRATIONS } from "@/services/migrationService";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  ExternalLink,
  Database,
  Wifi,
  Settings,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface YoutubeSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = "api" | "migrations" | "deploy";

export function YoutubeSettingsModal({
  open,
  onOpenChange,
}: YoutubeSettingsModalProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("api");

  // ── API Settings ──────────────────────────────────────────────
  const [apiUrl, setApiUrl] = useState(youtubeService.getApiUrl());
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<YoutubeApiStatus | null>(null);

  useEffect(() => {
    if (open) {
      setApiUrl(youtubeService.getApiUrl());
      setStatus(null);
    }
  }, [open]);

  const handleTest = async () => {
    setTesting(true);
    setStatus(null);
    const result = await youtubeService.testConnection(apiUrl);
    setStatus(result);
    setTesting(false);
  };

  const handleSaveApi = () => {
    youtubeService.setApiUrl(apiUrl);
    toast({ title: "✅ URL da API salva!" });
  };

  const handleReset = () => {
    youtubeService.resetApiUrl();
    setApiUrl(youtubeService.getDefaultApiUrl());
    setStatus(null);
    toast({ title: "URL resetada para o padrão" });
  };

  // ── Migrations ────────────────────────────────────────────────
  const [appliedMigrations, setAppliedMigrations] = useState<
    Record<string, boolean>
  >({});
  const [loadingMigrations, setLoadingMigrations] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [expandedSql, setExpandedSql] = useState<string | null>(null);

  const loadMigrations = async () => {
    setLoadingMigrations(true);
    const applied = await migrationService.getAppliedMigrations();
    setAppliedMigrations(applied);
    setLoadingMigrations(false);
  };

  useEffect(() => {
    if (open && tab === "migrations") loadMigrations();
  }, [open, tab]);

  const handleApplyMigration = async (id: string) => {
    const migration = MIGRATIONS.find((m) => m.id === id);
    if (!migration) return;

    setApplyingId(id);
    const result = await migrationService.applyMigration(migration);
    setApplyingId(null);

    if (result.success) {
      toast({ title: `✅ Migration ${id} aplicada!` });
      await loadMigrations();
    } else {
      toast({
        variant: "destructive",
        title: `Erro na migration ${id}`,
        description: result.error,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configurações — YouTube para Áudio
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border px-1">
          {(
            [
              { id: "api", label: "API cobalt", icon: Wifi },
              { id: "migrations", label: "Migrations", icon: Database },
              {
                id: "deploy",
                label: "Deploy Edge Function",
                icon: ExternalLink,
              },
            ] as { id: Tab; label: string; icon: React.ElementType }[]
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors",
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div
          data-dialog-body=""
          className="flex-1 overflow-y-auto px-1 py-4 space-y-4"
        >
          {/* ── Tab: API ── */}
          {tab === "api" && (
            <div className="space-y-5">
              <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2 text-sm">
                <p className="font-medium">Como funciona</p>
                <p className="text-muted-foreground">
                  A conversão usa um microserviço próprio com{" "}
                  <strong>yt-dlp</strong> + seus cookies do YouTube Premium,
                  hospedado no Railway (gratuito). Isso funciona mesmo com
                  vídeos restritos, sem depender de serviços públicos.
                </p>
              </div>

              <div className="space-y-2">
                <Label>URL do microserviço yt-dlp</Label>
                <div className="flex gap-2">
                  <Input
                    value={apiUrl}
                    onChange={(e) => {
                      setApiUrl(e.target.value);
                      setStatus(null);
                    }}
                    placeholder="https://api.cobalt.tools"
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleReset}
                    title="Resetar para padrão"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Padrão: https://cobalt-api.meowing.de — Instância pública com
                  suporte a YouTube (sem captcha). Altere se quiser usar outra
                  instância.
                </p>
              </div>

              {/* Status do teste */}
              {status && (
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-xl p-3 border text-sm",
                    status.ok
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      : "bg-destructive/10 border-destructive/20 text-destructive",
                  )}
                >
                  {status.ok ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      {status.ok ? "Conexão OK" : "Falha na conexão"}
                    </p>
                    {status.latency_ms && (
                      <p className="opacity-80">
                        Latência: {status.latency_ms}ms
                      </p>
                    )}
                    {status.error && (
                      <p className="opacity-80">{status.error}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTest}
                  disabled={testing}
                  className="gap-2"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wifi className="h-4 w-4" />
                  )}
                  {testing ? "Testando..." : "Testar conexão"}
                </Button>
                <Button onClick={handleSaveApi} className="gap-2">
                  Salvar URL
                </Button>
              </div>

              {/* Setup Railway */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <p className="text-sm font-medium">
                  Setup do microserviço (Railway)
                </p>
                <ol className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-bold text-foreground flex-shrink-0">
                      1.
                    </span>
                    <span>
                      Coloque os arquivos de{" "}
                      <code className="bg-muted px-1 rounded">
                        ytdlp-service/
                      </code>{" "}
                      num repositório GitHub privado
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-foreground flex-shrink-0">
                      2.
                    </span>
                    <span>
                      Deploy no{" "}
                      <a
                        href="https://railway.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Railway
                      </a>{" "}
                      → New Project → Deploy from GitHub
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-foreground flex-shrink-0">
                      3.
                    </span>
                    <span>
                      Configure as variáveis:{" "}
                      <code className="bg-muted px-1 rounded">API_KEY</code>{" "}
                      (senha) e{" "}
                      <code className="bg-muted px-1 rounded">COOKIES_B64</code>{" "}
                      (cookies do YouTube Premium)
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-foreground flex-shrink-0">
                      4.
                    </span>
                    <span>
                      No Supabase → Edge Functions → Secrets:{" "}
                      <code className="bg-muted px-1 rounded">
                        YTDLP_SERVICE_URL
                      </code>{" "}
                      e{" "}
                      <code className="bg-muted px-1 rounded">
                        YTDLP_API_KEY
                      </code>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-foreground flex-shrink-0">
                      5.
                    </span>
                    <span>Cole a URL do Railway acima e clique em Testar</span>
                  </li>
                </ol>
                <p className="text-xs text-muted-foreground">
                  Guia completo de cookies:{" "}
                  <code className="bg-muted px-1 rounded">
                    ytdlp-service/README.md
                  </code>
                </p>
              </div>
            </div>
          )}

          {/* ── Tab: Migrations ── */}
          {tab === "migrations" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex gap-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Pré-requisito</p>
                  <p className="text-xs mt-0.5">
                    Execute{" "}
                    <code className="bg-amber-500/20 px-1 rounded">
                      supabase/setup/migrations/000_exec_sql_function.sql
                    </code>{" "}
                    no SQL Editor do Supabase antes de usar esta aba.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {MIGRATIONS.length} migration(s) disponível(is)
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMigrations}
                  disabled={loadingMigrations}
                  className="gap-1.5"
                >
                  {loadingMigrations ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  Verificar
                </Button>
              </div>

              <div className="space-y-2">
                {MIGRATIONS.map((migration) => {
                  const applied = appliedMigrations[migration.id];
                  const isExpanded = expandedSql === migration.id;
                  const isApplying = applyingId === migration.id;

                  return (
                    <div
                      key={migration.id}
                      className="rounded-xl border border-border overflow-hidden"
                    >
                      <div className="flex items-center gap-3 p-3">
                        {/* Status */}
                        <div className="flex-shrink-0">
                          {loadingMigrations ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : applied ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {migration.id}
                            </span>
                            <span className="text-sm font-medium">
                              {migration.name}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {migration.description}
                          </p>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() =>
                              setExpandedSql(isExpanded ? null : migration.id)
                            }
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Ver SQL"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                          {!applied && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApplyMigration(migration.id)}
                              disabled={isApplying}
                              className="h-7 text-xs gap-1"
                            >
                              {isApplying ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Database className="h-3 w-3" />
                              )}
                              {isApplying ? "Aplicando..." : "Aplicar"}
                            </Button>
                          )}
                          {applied && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2">
                              Aplicada
                            </span>
                          )}
                        </div>
                      </div>

                      {/* SQL expandido */}
                      {isExpanded && (
                        <div className="border-t border-border bg-muted/30 p-3">
                          <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                            {migration.sql}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Tab: Deploy ── */}
          {tab === "deploy" && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-1">
                <p className="font-semibold">Deploy da Edge Function</p>
                <p className="text-muted-foreground">
                  A Edge Function precisa ser deployada no Supabase para que a
                  conversão YouTube → MP3 funcione.
                </p>
              </div>

              <div className="space-y-3">
                <p className="font-medium">Passo a passo (sem CLI)</p>
                <ol className="space-y-3 list-none">
                  {[
                    {
                      step: "1",
                      title: "Abrir o dashboard de Edge Functions",
                      content: (
                        <a
                          href="https://supabase.com/dashboard/project/ewuvrindvhjislkrohwh/functions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline flex items-center gap-1"
                        >
                          supabase.com/dashboard → Functions
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ),
                    },
                    {
                      step: "2",
                      title: 'Clicar em "Deploy a new function"',
                      content: (
                        <p className="text-muted-foreground">
                          Nome da função:{" "}
                          <code className="bg-muted px-1 rounded">
                            youtube-to-audio
                          </code>
                        </p>
                      ),
                    },
                    {
                      step: "3",
                      title: "Colar o código",
                      content: (
                        <p className="text-muted-foreground">
                          Copie o conteúdo de{" "}
                          <code className="bg-muted px-1 rounded">
                            supabase/functions/youtube-to-audio/index.ts
                          </code>
                        </p>
                      ),
                    },
                    {
                      step: "4",
                      title: "Configurar secret (opcional)",
                      content: (
                        <p className="text-muted-foreground">
                          Em Secrets, adicione{" "}
                          <code className="bg-muted px-1 rounded">
                            COBALT_API_URL
                          </code>{" "}
                          ={" "}
                          <code className="bg-muted px-1 rounded">
                            https://api.cobalt.tools
                          </code>
                        </p>
                      ),
                    },
                    {
                      step: "5",
                      title: "Testar",
                      content: (
                        <p className="text-muted-foreground">
                          Volte para a aba{" "}
                          <button
                            onClick={() => setTab("api")}
                            className="text-primary underline"
                          >
                            API cobalt
                          </button>{" "}
                          e clique em "Testar conexão"
                        </p>
                      ),
                    },
                  ].map(({ step, title, content }) => (
                    <li key={step} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {step}
                      </span>
                      <div className="space-y-0.5">
                        <p className="font-medium">{title}</p>
                        {content}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-2">
                <p className="font-medium">Via Supabase CLI (alternativa)</p>
                <pre className="text-xs font-mono bg-muted rounded-lg p-3 overflow-x-auto">
                  {`supabase functions deploy youtube-to-audio \\
  --project-ref ewuvrindvhjislkrohwh`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
