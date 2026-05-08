import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useCreateUser, useProfiles } from "@/hooks/useUsers";
import { useTeams } from "@/hooks/useTeams";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { supabase } from "@/lib/supabaseClient";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  getSelectedTeamTypeCodes,
  getTeamsByType,
  TEAM_TYPE_LABELS,
} from "@/lib/team-flow";
import { useQueryClient } from "@tanstack/react-query";
import {
  generateEmailPrefix,
  getAvailableGeneratedEmail,
  isDuplicateGeneratedEmailError,
} from "@/lib/user-email";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const EMAIL_SUFFIX = "@mkd.com";

// Valida o prefixo: só letras minúsculas, números e ponto/hífen (sem espaço, sem acento)
function isValidPrefix(prefix: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*$/.test(prefix);
}

function sanitizePrefix(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9._-]/g, ""); // só permite chars válidos
}

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateUserModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserModalProps) {
  const { toast } = useToast();
  const { data: profiles, isLoading: loadingProfiles } = useProfiles();
  const { teams, loading: loadingTeams } = useTeams();
  const createUser = useCreateUser();
  const queryClient = useQueryClient();

  // Campos do formulário
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [emailPrefix, setEmailPrefix] = useState("");
  const [emailPrefixTouched, setEmailPrefixTouched] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [password, setPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Erros de validação
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fullEmail = emailPrefix ? `${emailPrefix}${EMAIL_SUFFIX}` : "";

  // Sugerir prefixo automaticamente quando nome/sobrenome mudam
  // (só se o usuário ainda não editou manualmente)
  useEffect(() => {
    if (emailPrefixTouched) return;
    if (!nome.trim() || !sobrenome.trim()) {
      setEmailPrefix("");
      return;
    }
    const suggested = generateEmailPrefix(nome.trim(), sobrenome.trim());
    setEmailPrefix(suggested);
  }, [nome, sobrenome, emailPrefixTouched]);

  // Verificar disponibilidade do email com debounce
  useEffect(() => {
    if (!emailPrefix || !isValidPrefix(emailPrefix)) {
      setEmailAvailable(null);
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
          .limit(1);
        setEmailAvailable(!data || data.length === 0);
      } catch {
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [emailPrefix, fullEmail]);

  // Grupos de equipes baseados nos perfis selecionados
  const selectedTeamTypeCodes = useMemo(
    () => getSelectedTeamTypeCodes(selectedProfiles, (profiles as any[]) || []),
    [selectedProfiles, profiles],
  );

  const teamGroups = useMemo(
    () => getTeamsByType((teams as any[]) || [], selectedTeamTypeCodes),
    [teams, selectedTeamTypeCodes],
  );

  const missingTeamGroups = teamGroups.filter((g) => g.teams.length === 0);
  const hasUnselectedTeamGroup = teamGroups.some(
    (g) =>
      g.teams.length > 0 &&
      !g.teams.some((t: any) => selectedTeamIds.includes(t.id)),
  );

  // Auto-selecionar equipes únicas
  useEffect(() => {
    const availableIds = new Set(
      teamGroups.flatMap((g) => g.teams.map((t: any) => t.id)),
    );
    const autoIds = teamGroups
      .filter((g) => g.teams.length === 1)
      .map((g) => g.teams[0].id);
    setSelectedTeamIds((prev) =>
      Array.from(
        new Set([...prev.filter((id) => availableIds.has(id)), ...autoIds]),
      ),
    );
  }, [teamGroups]);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setNome("");
      setSobrenome("");
      setEmailPrefix("");
      setEmailPrefixTouched(false);
      setEmailAvailable(null);
      setPassword("");
      setTelefone("");
      setSelectedProfiles([]);
      setSelectedTeamIds([]);
      setErrors({});
    }
  }, [open]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (nome.trim().length < 2)
      errs.nome = "Nome deve ter pelo menos 2 caracteres";
    if (sobrenome.trim().length < 2)
      errs.sobrenome = "Sobrenome deve ter pelo menos 2 caracteres";
    if (!emailPrefix) errs.email = "Escolha um prefixo para o email";
    else if (!isValidPrefix(emailPrefix))
      errs.email =
        "Prefixo inválido — use apenas letras minúsculas, números, ponto ou hífen";
    else if (emailAvailable === false) errs.email = "Este email já está em uso";
    if (password.length < 8)
      errs.password = "Senha deve ter pelo menos 8 caracteres";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (selectedProfiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Selecione pelo menos um perfil",
      });
      return;
    }
    if (missingTeamGroups.length > 0) {
      toast({
        variant: "destructive",
        title: "Cadastre uma equipe primeiro",
        description: `Não há equipe para: ${missingTeamGroups.map((g) => g.label).join(", ")}.`,
      });
      return;
    }
    if (hasUnselectedTeamGroup) {
      toast({
        variant: "destructive",
        title: "Selecione as equipes",
        description: "Escolha pelo menos uma equipe para cada ministério.",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Verificação final de disponibilidade
      const { data: existing } = await supabase
        .from("users_profile")
        .select("id")
        .ilike("email", fullEmail)
        .limit(1);

      if (existing && existing.length > 0) {
        setErrors((e) => ({ ...e, email: "Este email já está em uso" }));
        setEmailAvailable(false);
        return;
      }

      const result = await createUser.mutateAsync({
        nome: `${nome.trim()} ${sobrenome.trim()}`,
        email: fullEmail,
        telefone: telefone || undefined,
        password,
        profiles: selectedProfiles,
      });

      if (selectedTeamIds.length > 0 && result?.id) {
        const { error: memberError } = await supabase
          .from("team_members")
          .upsert(
            selectedTeamIds.map((teamId) => ({
              team_id: teamId,
              user_id: result.id,
              ativo: true,
            })),
            { onConflict: "team_id,user_id", ignoreDuplicates: true },
          );

        if (memberError && memberError.code !== "23505") {
          toast({
            variant: "destructive",
            title: "Usuário criado, mas não foi adicionado às equipes",
            description: memberError.message,
          });
        }
      }

      const teamNames = selectedTeamIds
        .map((id) => (teams as any[]).find((t: any) => t.id === id)?.nome)
        .filter(Boolean);

      toast({
        title: "✅ Usuário criado!",
        description:
          teamNames.length > 0
            ? `Login: ${fullEmail} | Equipes: ${teamNames.join(", ")}`
            : `Login: ${fullEmail}`,
      });

      queryClient.invalidateQueries({ queryKey: ["teams"] });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      if (isDuplicateGeneratedEmailError(error)) {
        setErrors((e) => ({ ...e, email: "Este email já está em uso" }));
        setEmailAvailable(false);
        return;
      }
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    !submitting &&
    nome.trim().length >= 2 &&
    sobrenome.trim().length >= 2 &&
    emailPrefix.length > 0 &&
    isValidPrefix(emailPrefix) &&
    emailAvailable === true &&
    password.length >= 8 &&
    selectedProfiles.length > 0 &&
    missingTeamGroups.length === 0 &&
    !hasUnselectedTeamGroup;

  if (loadingProfiles || loadingTeams) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <LoadingSpinner />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>Crie um novo usuário no sistema</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          data-dialog-body=""
          className="space-y-4 px-4 py-4 sm:px-5"
        >
          {/* Nome + Sobrenome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Ex: Michael"
                autoComplete="off"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sobrenome">Sobrenome *</Label>
              <Input
                id="sobrenome"
                placeholder="Ex: Cabrera"
                autoComplete="off"
                value={sobrenome}
                onChange={(e) => setSobrenome(e.target.value)}
              />
              {errors.sobrenome && (
                <p className="text-xs text-destructive">{errors.sobrenome}</p>
              )}
            </div>
          </div>

          {/* Email com prefixo editável */}
          <div className="space-y-1.5">
            <Label htmlFor="emailPrefix">Email *</Label>
            <div className="flex items-center gap-0">
              <div className="relative flex-1">
                <Input
                  id="emailPrefix"
                  placeholder="prefixo"
                  value={emailPrefix}
                  onChange={(e) => {
                    const clean = sanitizePrefix(e.target.value);
                    setEmailPrefix(clean);
                    setEmailPrefixTouched(true);
                    setEmailAvailable(null);
                  }}
                  className="rounded-r-none border-r-0 font-mono text-sm pr-8"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                {/* Indicador de status */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {checkingEmail && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {!checkingEmail && emailAvailable === true && emailPrefix && (
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
            {/* Feedback */}
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email}</p>
            ) : emailAvailable === true && emailPrefix ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                ✓ {fullEmail} disponível
              </p>
            ) : emailAvailable === false ? (
              <p className="text-xs text-destructive">
                Este email já está em uso
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sugerido automaticamente — você pode editar. Apenas letras
                minúsculas, números, ponto e hífen.
              </p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-1.5">
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <PhoneInput id="telefone" value={telefone} onChange={setTelefone} />
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          {/* Perfis */}
          <div className="space-y-2">
            <Label>Perfil do Usuário *</Label>
            <div className="border rounded-2xl p-3 max-h-48 overflow-y-auto space-y-2 sm:rounded-md sm:p-4">
              {(profiles as any[])?.map((profile: any) => (
                <div key={profile.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`profile-${profile.id}`}
                    checked={selectedProfiles.includes(profile.id)}
                    onCheckedChange={() =>
                      setSelectedProfiles((prev) =>
                        prev.includes(profile.id)
                          ? prev.filter((id) => id !== profile.id)
                          : [...prev, profile.id],
                      )
                    }
                  />
                  <label
                    htmlFor={`profile-${profile.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {profile.nome}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedProfiles.length} perfil(is) selecionado(s)
            </p>
          </div>

          {/* Equipes */}
          {teamGroups.length > 0 && (
            <div className="space-y-2">
              <Label>Equipes do Usuário *</Label>
              {teamGroups.map((group) => (
                <div
                  key={group.code}
                  className="rounded-2xl border p-3 space-y-2 sm:rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {TEAM_TYPE_LABELS[group.code] || group.code}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {
                        group.teams.filter((t: any) =>
                          selectedTeamIds.includes(t.id),
                        ).length
                      }{" "}
                      selecionada(s)
                    </span>
                  </div>
                  {group.teams.length === 0 ? (
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                      Nenhuma equipe cadastrada. Cadastre em Gerencial →
                      Equipes.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {group.teams.map((team: any) => (
                        <label
                          key={team.id}
                          className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-sm text-foreground"
                        >
                          <Checkbox
                            checked={selectedTeamIds.includes(team.id)}
                            onCheckedChange={() =>
                              setSelectedTeamIds((prev) =>
                                prev.includes(team.id)
                                  ? prev.filter((id) => id !== team.id)
                                  : [...prev, team.id],
                              )
                            }
                            disabled={group.teams.length === 1}
                          />
                          <span className="font-medium">{team.nome}</span>
                          {group.teams.length === 1 && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              Selecionada automaticamente
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              {submitting ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
