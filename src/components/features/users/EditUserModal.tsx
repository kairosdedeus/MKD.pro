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
import { useProfiles } from "@/hooks/useUsers";
import { useTeams } from "@/hooks/useTeams";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { supabase } from "@/lib/supabaseClient";
import { UserProfile } from "@/types";
import { PhoneInput } from "@/components/ui/phone-input";
import { formatPhone } from "@/hooks/usePhoneMask";
import {
  getSelectedTeamTypeCodes,
  getTeamsByType,
  TEAM_TYPE_LABELS,
} from "@/lib/team-flow";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

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

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onSuccess?: () => void;
}

export function EditUserModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserModalProps) {
  const { toast } = useToast();
  const { data: profiles, isLoading: loadingProfiles } = useProfiles();
  const { teams, loading: loadingTeams } = useTeams();
  const queryClient = useQueryClient();

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [emailPrefix, setEmailPrefix] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [telefone, setTelefone] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fullEmail = emailPrefix ? `${emailPrefix}${EMAIL_SUFFIX}` : "";
  const emailChanged = fullEmail !== originalEmail;

  // Carregar dados do usuário
  useEffect(() => {
    if (!user || !open) return;

    const parts = user.nome.trim().split(" ");
    setNome(parts[0] || "");
    setSobrenome(parts.slice(1).join(" ") || "");
    setTelefone(formatPhone(user.telefone || ""));

    // Extrair prefixo do email atual
    const currentPrefix = user.email.replace(EMAIL_SUFFIX, "");
    setEmailPrefix(currentPrefix);
    setOriginalEmail(user.email);
    setEmailAvailable(null);

    loadUserData(user.id);
  }, [user, open]);

  // Verificar disponibilidade quando o prefixo muda (só se mudou)
  useEffect(() => {
    if (!emailPrefix || !isValidPrefix(emailPrefix)) {
      setEmailAvailable(null);
      return;
    }

    // Se voltou ao email original, não precisa verificar
    if (fullEmail === originalEmail) {
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
  }, [emailPrefix, fullEmail, originalEmail, user?.id]);

  const loadUserData = async (userId: string) => {
    const { data: userProfiles } = await (supabase as any)
      .from("user_profiles")
      .select("profile_id")
      .eq("user_id", userId);
    setSelectedProfiles((userProfiles || []).map((up: any) => up.profile_id));

    const { data: teamMembers } = await (supabase as any)
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .eq("ativo", true);
    setSelectedTeamIds((teamMembers || []).map((m: any) => m.team_id));
  };

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

  const handleSave = async () => {
    if (!user) return;

    if (!nome.trim() || !sobrenome.trim()) {
      toast({
        variant: "destructive",
        title: "Nome e sobrenome são obrigatórios",
      });
      return;
    }
    if (!emailPrefix || !isValidPrefix(emailPrefix)) {
      toast({ variant: "destructive", title: "Email inválido" });
      return;
    }
    if (emailChanged && emailAvailable === false) {
      toast({ variant: "destructive", title: "Este email já está em uso" });
      return;
    }
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
      setSaving(true);
      const nomeCompleto = `${nome.trim()} ${sobrenome.trim()}`;

      // 1. Atualizar users_profile
      const { error: profileError } = await supabase
        .from("users_profile")
        .update({
          nome: nomeCompleto,
          email: fullEmail,
          telefone: telefone || null,
        } as any)
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 2. Se o email mudou, atualizar auth.users via função SQL
      if (emailChanged) {
        // Buscar auth_user_id
        const { data: profileData } = await supabase
          .from("users_profile")
          .select("auth_user_id")
          .eq("id", user.id)
          .single();

        const authUserId = (profileData as any)?.auth_user_id;

        if (authUserId) {
          const { data: authResult, error: authError } = await (
            supabase as any
          ).rpc("update_user_email", {
            p_auth_user_id: authUserId,
            p_new_email: fullEmail,
          });

          if (authError) {
            // Não bloquear — o perfil já foi atualizado
            console.error("Erro ao atualizar email no auth:", authError);
            toast({
              variant: "destructive",
              title: "Email atualizado no perfil, mas falhou no login",
              description:
                "Execute o script supabase/utils/atualizar-email-usuario.sql no Supabase.",
            });
          } else if (authResult && !authResult.success) {
            toast({
              variant: "destructive",
              title: "Erro ao atualizar email de login",
              description: authResult.error,
            });
          } else {
            // Sucesso — atualizar email original para refletir mudança
            setOriginalEmail(fullEmail);
          }
        }
      }

      // 3. Atualizar perfis
      await (supabase as any)
        .from("user_profiles")
        .delete()
        .eq("user_id", user.id);
      await (supabase as any).from("user_profiles").insert(
        selectedProfiles.map((profileId) => ({
          user_id: user.id,
          profile_id: profileId,
        })),
      );

      // 4. Atualizar equipes
      await (supabase as any)
        .from("team_members")
        .delete()
        .eq("user_id", user.id);
      if (selectedTeamIds.length > 0) {
        await (supabase as any).from("team_members").upsert(
          selectedTeamIds.map((teamId) => ({
            team_id: teamId,
            user_id: user.id,
            ativo: true,
          })),
          { onConflict: "team_id,user_id", ignoreDuplicates: true },
        );
      }

      toast({
        title: "✅ Usuário atualizado!",
        description: emailChanged
          ? `Email de login atualizado para ${fullEmail}`
          : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar usuário",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const canSave =
    !saving &&
    nome.trim().length >= 2 &&
    sobrenome.trim().length >= 2 &&
    emailPrefix.length > 0 &&
    isValidPrefix(emailPrefix) &&
    (emailAvailable === true || !emailChanged) &&
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
          <DialogTitle className="text-base sm:text-lg">
            Editar Usuário
          </DialogTitle>
          <DialogDescription className="text-sm">
            Atualize os dados do usuário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          {/* Nome + Sobrenome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Michael"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sobrenome *</Label>
              <Input
                value={sobrenome}
                onChange={(e) => setSobrenome(e.target.value)}
                placeholder="Ex: Cabrera"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Email editável */}
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
                ✓ {fullEmail} disponível — o login será atualizado
              </p>
            ) : !emailChanged ? (
              <p className="text-xs text-muted-foreground">
                Login atual: <span className="font-mono">{originalEmail}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números, ponto e hífen.
              </p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-1.5">
            <Label>Telefone (opcional)</Label>
            <PhoneInput value={telefone} onChange={setTelefone} />
          </div>

          {/* Perfis */}
          <div className="space-y-2">
            <Label>Perfil do Usuário *</Label>
            <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
              {(profiles as any[])?.map((profile: any) => (
                <div key={profile.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-profile-${profile.id}`}
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
                    htmlFor={`edit-profile-${profile.id}`}
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
                  className="rounded-lg border p-3 space-y-2"
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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
