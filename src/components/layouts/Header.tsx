import * as React from "react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { LogoCompact } from "@/components/shared/Logo";
import {
  LogOut,
  User,
  KeyRound,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { ThemeSelector } from "@/components/shared/ThemeSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { useTeams } from "@/hooks/useTeams";
import {
  TEAM_TYPE_ROUTES,
  TEAM_TYPE_LABELS,
  TEAM_TYPE_ICONS,
} from "@/lib/team-flow";
import { cn } from "@/lib/utils";

const EMAIL_SUFFIX = "@mkd.com";

function sanitizePrefix(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}

function isValidPrefix(prefix: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*$/.test(prefix);
}

function splitName(fullName?: string | null) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

export function Header() {
  const { user, logout, setUser, profiles } = useAuthStore();
  const { teams } = useTeams();
  const location = useLocation();
  const { toast } = useToast();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailPrefix, setEmailPrefix] = useState("");
  const [originalPrefix, setOriginalPrefix] = useState("");
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const isManagement = profiles.some(
    (profile) => profile.codigo === "gerencial",
  );

  // Calcular dashboards permitidos
  const allowedDashboards = React.useMemo(() => {
    const visibleTeams = (teams as any[]).filter((team: any) => {
      if (!team.team_type?.codigo) return false;
      if (isManagement) return true;
      return (team.members || []).some(
        (member: any) => member.user_id === user?.id,
      );
    });

    const byType = new Map<string, any[]>();
    visibleTeams.forEach((team: any) => {
      const code = team.team_type.codigo;
      byType.set(code, [...(byType.get(code) || []), team]);
    });

    return Array.from(byType.entries()).map(([code, groupedTeams]) => {
      const Icon = TEAM_TYPE_ICONS[code];
      return {
        code,
        name:
          TEAM_TYPE_LABELS[code] || groupedTeams[0]?.team_type?.nome || code,
        href: TEAM_TYPE_ROUTES[code] || `/${code}`,
        icon: Icon,
        teams: groupedTeams,
      };
    });
  }, [teams, user?.id, isManagement, profiles]);

  const fullEmail = emailPrefix ? `${emailPrefix}${EMAIL_SUFFIX}` : "";
  const emailChanged = emailPrefix !== originalPrefix;

  useEffect(() => {
    if (!showProfileDialog || !user) return;
    const { firstName: fn, lastName: ln } = splitName(user.nome);
    setFirstName(fn);
    setLastName(ln);

    // Extrair prefixo do email atual
    // Se o email já é @mkd.com, extrai o prefixo
    // Se é outro domínio (legado), usa a parte antes do @ como sugestão
    const currentEmail = user.email || "";
    let prefix: string;
    if (currentEmail.endsWith(EMAIL_SUFFIX)) {
      prefix = currentEmail.slice(0, -EMAIL_SUFFIX.length);
    } else {
      // Email legado: gerar sugestão a partir do nome
      const parts = (user.nome || "").trim().split(/\s+/).filter(Boolean);
      const first = parts[0]?.charAt(0) || "";
      const last = parts[parts.length - 1] || "";
      prefix = sanitizePrefix(`${first}${last}`);
    }
    setEmailPrefix(prefix);
    setOriginalPrefix(prefix);
    setEmailAvailable(null);
    setChangePassword(false);
    setNewPassword("");
    setConfirmPassword("");
  }, [showProfileDialog, user]);

  // Verificar disponibilidade do email com debounce
  useEffect(() => {
    if (!emailPrefix || !isValidPrefix(emailPrefix)) {
      setEmailAvailable(null);
      return;
    }
    if (!emailChanged) {
      setEmailAvailable(true);
      return;
    }

    setCheckingEmail(true);
    setEmailAvailable(null);

    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from("users_profile")
          .select("id")
          .ilike("email", fullEmail)
          .neq("id", user?.id || "")
          .limit(1);
        setEmailAvailable(!data || data.length === 0);
      } catch {
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [emailPrefix, fullEmail, emailChanged, user?.id]);

  const handleSaveProfile = async () => {
    if (!user) return;

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst) {
      toast({ variant: "destructive", title: "Informe seu nome" });
      return;
    }
    if (!trimmedLast) {
      toast({ variant: "destructive", title: "Informe seu sobrenome" });
      return;
    }
    if (!emailPrefix || !isValidPrefix(emailPrefix)) {
      toast({ variant: "destructive", title: "Prefixo de email inválido" });
      return;
    }
    if (emailChanged && emailAvailable === false) {
      toast({ variant: "destructive", title: "Este email já está em uso" });
      return;
    }
    if (changePassword) {
      if (newPassword.length < 8) {
        toast({
          variant: "destructive",
          title: "Senha deve ter pelo menos 8 caracteres",
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({ variant: "destructive", title: "As senhas não coincidem" });
        return;
      }
    }

    try {
      setSavingProfile(true);
      const fullName = [trimmedFirst, trimmedLast].filter(Boolean).join(" ");

      // 1. Atualizar nome no users_profile
      const { data: updatedProfile, error: profileError } = await supabase
        .from("users_profile")
        .update({ nome: fullName, email: fullEmail } as any)
        .eq("id", user.id)
        .select()
        .single();

      if (profileError) throw profileError;

      // 2. Atualizar email no auth.users se mudou
      if (emailChanged) {
        const { data: profileData } = await supabase
          .from("users_profile")
          .select("auth_user_id")
          .eq("id", user.id)
          .single();

        const authUserId = (profileData as any)?.auth_user_id;

        if (authUserId) {
          try {
            const { data: rpcResult, error: rpcError } = await (
              supabase as any
            ).rpc("update_user_email", {
              p_auth_user_id: authUserId,
              p_new_email: fullEmail,
            });

            if (rpcError || (rpcResult && !rpcResult.success)) {
              const errMsg =
                rpcResult?.error || rpcError?.message || "Erro desconhecido";
              toast({
                title: "⚠️ Perfil atualizado",
                description: `Email salvo no perfil. Para atualizar o login execute: supabase/utils/atualizar-email-usuario.sql (${errMsg})`,
              });
            } else {
              setOriginalPrefix(emailPrefix);
            }
          } catch {
            // Função SQL não existe ainda
            toast({
              title: "⚠️ Perfil atualizado",
              description:
                "Execute supabase/utils/atualizar-email-usuario.sql no Supabase para atualizar o login.",
            });
          }
        }
      }

      // 3. Atualizar senha se solicitado
      if (changePassword && newPassword) {
        const { error: pwError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (pwError) throw pwError;
      }

      // 4. Atualizar store local
      setUser({ ...user, ...updatedProfile });

      toast({
        title: "✅ Dados atualizados!",
        description: emailChanged
          ? `Login atualizado para ${fullEmail}`
          : changePassword
            ? "Senha alterada com sucesso"
            : undefined,
      });
      setShowProfileDialog(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar seus dados",
        description: error.message,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const canSave =
    !savingProfile &&
    firstName.trim().length >= 1 &&
    lastName.trim().length >= 1 &&
    isValidPrefix(emailPrefix) &&
    (!emailChanged || emailAvailable === true) &&
    (!changePassword ||
      (newPassword.length >= 8 && newPassword === confirmPassword));

  const initials = user?.nome
    ? user.nome
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <>
      <header className="header-bg border-b">
        <div className="flex flex-col gap-2 px-3 py-2 sm:px-6">
          <div className="flex items-center justify-between gap-3 pl-14 md:pl-0">
            <div className="flex min-w-0 items-center gap-2.5">
              <LogoCompact className="hidden flex-shrink-0 sm:flex" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold leading-tight text-foreground sm:text-sm">
                  Olá,{" "}
                  <span className="text-primary">
                    {user?.nome?.split(" ")[0]}
                  </span>
                </p>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  Acesse seus dashboards rapidamente
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <div className="flex">
                <ThemeSelector />
              </div>
              <NotificationCenter />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex h-9 items-center gap-1.5 rounded-full px-1.5 sm:gap-2 sm:px-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                      {initials}
                    </div>
                    <span className="text-sm text-muted-foreground hidden sm:block max-w-48 truncate">
                      {user?.email}
                    </span>
                    <ChevronDown className="hidden h-3 w-3 text-muted-foreground sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium truncate">
                        {user?.nome}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                    <User className="h-4 w-4 mr-2 text-primary" />
                    Editar meus dados
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setShowProfileDialog(true);
                    }}
                  >
                    <KeyRound className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-500" />
                    Alterar senha
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 dark:text-red-500 focus:text-red-600 dark:focus:text-red-500"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {allowedDashboards.length > 0 && (
            <nav className="flex max-w-full gap-1.5 overflow-x-auto py-1">
              {allowedDashboards.map((dashboard) => {
                const isActive = location.pathname === dashboard.href;
                return (
                  <NavLink
                    key={dashboard.code}
                    to={dashboard.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium leading-none transition-all whitespace-nowrap",
                      isActive
                        ? "border-border bg-background text-foreground shadow-sm"
                        : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <dashboard.icon className="h-4 w-4 flex-shrink-0" />
                    {dashboard.name}
                  </NavLink>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Meus dados</DialogTitle>
          </DialogHeader>

          <div data-dialog-body="" className="space-y-4 px-4 py-4 sm:px-5">
            {/* Nome + Sobrenome */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  placeholder="Ex: Michael"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sobrenome *</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  placeholder="Ex: Cabrera"
                />
              </div>
            </div>

            {/* Email com prefixo editável */}
            <div className="space-y-1.5">
              <Label>Email / Login *</Label>
              <div className="flex items-center gap-0">
                <div className="relative flex-1">
                  <Input
                    value={emailPrefix}
                    onChange={(e) => {
                      setEmailPrefix(sanitizePrefix(e.target.value));
                      setEmailAvailable(null);
                    }}
                    className="rounded-r-none border-r-0 font-mono text-sm pr-8"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="prefixo"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {checkingEmail && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!checkingEmail &&
                      emailChanged &&
                      emailAvailable === true && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    {!checkingEmail && emailAvailable === false && (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                <div className="flex items-center h-10 px-3 rounded-r-md border border-l-0 bg-muted text-muted-foreground text-sm font-mono select-none">
                  {EMAIL_SUFFIX}
                </div>
              </div>
              {emailAvailable === false ? (
                <p className="text-xs text-destructive">
                  Este email já está em uso
                </p>
              ) : emailChanged && emailAvailable === true ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  ✓ {fullEmail} disponível — login será atualizado
                </p>
              ) : !emailChanged ? (
                <p className="text-xs text-muted-foreground">
                  Login atual:{" "}
                  <span className="font-mono">
                    {originalPrefix}
                    {EMAIL_SUFFIX}
                  </span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Apenas letras minúsculas, números, ponto e hífen.
                </p>
              )}
            </div>

            {/* Checkbox alterar senha */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="changePassword"
                  checked={changePassword}
                  onCheckedChange={(v) => {
                    setChangePassword(v as boolean);
                    if (!v) {
                      setNewPassword("");
                      setConfirmPassword("");
                    }
                  }}
                />
                <label
                  htmlFor="changePassword"
                  className="text-sm font-medium cursor-pointer"
                >
                  Deseja alterar a senha?
                </label>
              </div>

              {changePassword && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label>Nova senha</Label>
                    <Input
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirmar nova senha</Label>
                    <Input
                      type="password"
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-destructive">
                        As senhas não coincidem
                      </p>
                    )}
                    {confirmPassword &&
                      newPassword === confirmPassword &&
                      newPassword.length >= 8 && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          ✓ Senhas coincidem
                        </p>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowProfileDialog(false)}
              disabled={savingProfile}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={!canSave}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground sm:w-auto"
            >
              {savingProfile ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
