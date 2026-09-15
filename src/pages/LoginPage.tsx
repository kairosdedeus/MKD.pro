import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ThemeSelector } from "@/components/shared/ThemeSelector";
import { Logo } from "@/components/shared/Logo";
import { CheckCircle2, Eye, EyeOff, Loader2, Users } from "lucide-react";
import {
  audicaoService,
  AUDICOES_REGISTRATION_CHANGED_EVENT,
  type AudicaoApprovedParticipant,
} from "@/services/audicaoService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approvedDialogOpen, setApprovedDialogOpen] = useState(false);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [approvedParticipants, setApprovedParticipants] = useState<
    AudicaoApprovedParticipant[]
  >([]);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { toast } = useToast();
  const [auditionsOpen, setAuditionsOpen] = useState<boolean | null>(null);
  const [approvedResultsVisible, setApprovedResultsVisible] = useState(false);

  useEffect(() => {
    const syncRegistrationState = () => {
      setAuditionsOpen(null);
      audicaoService
        .getRegistrationStatus()
        .then(setAuditionsOpen)
        .catch(console.error);
    };

    syncRegistrationState();

    window.addEventListener(
      AUDICOES_REGISTRATION_CHANGED_EVENT,
      syncRegistrationState,
    );
    window.addEventListener("storage", syncRegistrationState);

    audicaoService
      .areApprovedResultsVisible()
      .then(setApprovedResultsVisible)
      .catch(console.error);

    return () => {
      window.removeEventListener(
        AUDICOES_REGISTRATION_CHANGED_EVENT,
        syncRegistrationState,
      );
      window.removeEventListener("storage", syncRegistrationState);
    };
  }, []);

  const openApprovedResults = async () => {
    setApprovedDialogOpen(true);
    setApprovedLoading(true);
    try {
      setApprovedParticipants(await audicaoService.getApprovedParticipants());
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Não foi possível carregar os resultados",
        description: "Tente novamente em alguns instantes.",
      });
    } finally {
      setApprovedLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/app");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: err.message || "Verifique suas credenciais.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Barra superior com seletor de tema */}
      <div className="flex items-center justify-between p-4">
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {approvedResultsVisible && (
            <button
              type="button"
              onClick={openApprovedResults}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Resultado das audições
            </button>
          )}
          <ThemeSelector />
        </div>
      </div>

      {/* Conteúdo central */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[360px]">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              {/* Container arredondado com fundo preto */}
              <div className="w-24 h-24 rounded-2xl bg-black flex items-center justify-center shadow-2xl ring-1 ring-white/10">
                <Logo size="lg" variant="default" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              MKD
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Entre com suas credenciais
            </p>
            {auditionsOpen === true && (
              <button
                type="button"
                onClick={() => navigate("/audicoes-louvor")}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground shadow-md transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span aria-hidden="true">♫</span>
                Inscreva-se nas audições
              </button>
            )}
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold text-sm mt-2"
              disabled={loading}
              style={{ backgroundColor: "hsl(var(--primary))" }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>
      </div>

      <Dialog open={approvedDialogOpen} onOpenChange={setApprovedDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Resultado das audições
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Parabéns aos participantes aprovados! Estamos felizes em ter vocês
              conosco.
            </p>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
            {approvedLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando resultados...
              </div>
            ) : approvedParticipants.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Nenhum resultado publicado no momento.
              </div>
            ) : (
              approvedParticipants.map((participant) => (
                <div
                  key={`${participant.nome}-${participant.sobrenome}-${participant.telefone}`}
                  className="rounded-xl border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-5 w-5 text-emerald-500" />
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {participant.nome} {participant.sobrenome}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Telefone: {participant.telefone || "Não informado"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Líder: {participant.discipulador || "Não informado"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
