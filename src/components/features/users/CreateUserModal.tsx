import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  getAvailableGeneratedEmail,
  isDuplicateGeneratedEmailError,
} from "@/lib/user-email";

const userSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  sobrenome: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  telefone: z.string().optional(),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

type UserFormData = z.infer<typeof userSchema>;

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

  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const nome = watch("nome");
  const sobrenome = watch("sobrenome");

  useEffect(() => {
    let active = true;

    if (!nome || !sobrenome) {
      setGeneratedEmail("");
      return;
    }

    getAvailableGeneratedEmail(nome, sobrenome)
      .then((email) => {
        if (active) setGeneratedEmail(email);
      })
      .catch(() => {
        if (active) setGeneratedEmail("");
      });

    return () => {
      active = false;
    };
  }, [nome, sobrenome]);

  const selectedTeamTypeCodes = useMemo(
    () => getSelectedTeamTypeCodes(selectedProfiles, (profiles as any[]) || []),
    [selectedProfiles, profiles],
  );

  const teamGroups = useMemo(
    () => getTeamsByType((teams as any[]) || [], selectedTeamTypeCodes),
    [teams, selectedTeamTypeCodes],
  );

  const missingTeamGroups = teamGroups.filter(
    (group) => group.teams.length === 0,
  );
  const hasUnselectedTeamGroup = teamGroups.some(
    (group) =>
      group.teams.length > 0 &&
      !group.teams.some((team: any) => selectedTeamIds.includes(team.id)),
  );

  useEffect(() => {
    const availableIds = new Set(
      teamGroups.flatMap((group) => group.teams.map((team: any) => team.id)),
    );
    const autoSelectedIds = teamGroups
      .filter((group) => group.teams.length === 1)
      .map((group) => group.teams[0].id);

    setSelectedTeamIds((prev) =>
      Array.from(
        new Set([
          ...prev.filter((id) => availableIds.has(id)),
          ...autoSelectedIds,
        ]),
      ),
    );
  }, [teamGroups]);

  useEffect(() => {
    if (!open) {
      reset();
      setSelectedProfiles([]);
      setSelectedTeamIds([]);
      setGeneratedEmail("");
      setTelefone("");
    }
  }, [open, reset]);

  const toggleProfile = (profileId: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId],
    );
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId],
    );
  };

  const onSubmit = async (data: UserFormData) => {
    if (!generatedEmail) {
      toast({ variant: "destructive", title: "Preencha nome e sobrenome" });
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
        description: `Nao ha equipe cadastrada para: ${missingTeamGroups.map((group) => group.label).join(", ")}.`,
      });
      return;
    }
    if (hasUnselectedTeamGroup) {
      toast({
        variant: "destructive",
        title: "Selecione as equipes",
        description:
          "Escolha pelo menos uma equipe para cada ministerio selecionado.",
      });
      return;
    }

    try {
      const availableEmail = await getAvailableGeneratedEmail(
        data.nome,
        data.sobrenome,
      );
      if (!availableEmail) {
        toast({
          variant: "destructive",
          title: "Nao foi possivel gerar o login",
        });
        return;
      }
      setGeneratedEmail(availableEmail);

      const result = await createUser.mutateAsync({
        nome: `${data.nome} ${data.sobrenome}`,
        email: availableEmail,
        telefone: telefone || undefined,
        password: data.password,
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
            title: "Usuario criado, mas nao foi adicionado as equipes",
            description: memberError.message,
          });
        }
      }

      const teamNames = selectedTeamIds
        .map(
          (teamId) =>
            (teams as any[]).find((team: any) => team.id === teamId)?.nome,
        )
        .filter(Boolean);

      toast({
        title: "Usuario criado!",
        description:
          teamNames.length > 0
            ? `Login: ${availableEmail} | Equipes: ${teamNames.join(", ")}`
            : `Login: ${availableEmail}`,
      });

      reset();
      setSelectedProfiles([]);
      setSelectedTeamIds([]);
      setGeneratedEmail("");
      setTelefone("");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      if (isDuplicateGeneratedEmailError(error)) {
        toast({
          variant: "destructive",
          title: "Login ja cadastrado",
          description:
            "Tente novamente. O sistema vai sugerir automaticamente o proximo login disponivel.",
        });
        if (nome && sobrenome) {
          const nextEmail = await getAvailableGeneratedEmail(
            nome,
            sobrenome,
          ).catch(() => "");
          setGeneratedEmail(nextEmail);
        }
        return;
      }

      toast({
        variant: "destructive",
        title: "Erro ao criar usuario",
        description: error.message || "Tente novamente mais tarde.",
      });
    }
  };

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
      <DialogContent className="w-[calc(100vw-0.5rem)] sm:w-full max-w-2xl h-[98vh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg">
            Novo Usuario
          </DialogTitle>
          <DialogDescription className="text-sm">
            Crie um novo usuario no sistema
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 px-4 sm:px-6 py-4 overflow-y-auto flex-1"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Ex: Michael"
                autoComplete="off"
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-sm text-red-600">{errors.nome.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sobrenome">Sobrenome *</Label>
              <Input
                id="sobrenome"
                placeholder="Ex: Felipe Cabrera"
                autoComplete="off"
                {...register("sobrenome")}
              />
              {errors.sobrenome && (
                <p className="text-sm text-red-600">
                  {errors.sobrenome.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email (gerado automaticamente)</Label>
            <Input
              value={generatedEmail}
              disabled
              placeholder="Preencha nome e sobrenome"
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">
              Regra: primeira letra do nome + ultimo sobrenome @mkd.com
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <PhoneInput id="telefone" value={telefone} onChange={setTelefone} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimo 8 caracteres"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Perfil do Usuario *</Label>
            <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
              {(profiles as any[])?.map((profile: any) => (
                <div key={profile.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`profile-${profile.id}`}
                    checked={selectedProfiles.includes(profile.id)}
                    onCheckedChange={() => toggleProfile(profile.id)}
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
            <p className="text-sm text-muted-foreground">
              {selectedProfiles.length} perfil(is) selecionado(s)
            </p>
          </div>

          {teamGroups.length > 0 && (
            <div className="space-y-2">
              <Label>Equipes do Usuario *</Label>
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
                        group.teams.filter((team: any) =>
                          selectedTeamIds.includes(team.id),
                        ).length
                      }{" "}
                      selecionada(s)
                    </span>
                  </div>

                  {group.teams.length === 0 ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      Nenhuma equipe cadastrada para este ministerio. Cadastre
                      uma equipe primeiro em Gerencial &gt; Equipes.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {group.teams.map((team: any) => (
                        <label
                          key={team.id}
                          className="flex items-center gap-2 rounded-md bg-purple-50 px-3 py-2 text-sm text-purple-800"
                        >
                          <Checkbox
                            checked={selectedTeamIds.includes(team.id)}
                            onCheckedChange={() => toggleTeam(team.id)}
                            disabled={group.teams.length === 1}
                          />
                          <span className="font-medium">{team.nome}</span>
                          {group.teams.length === 1 && (
                            <span className="ml-auto text-xs text-purple-500">
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

          <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-gray-50 gap-2 flex-shrink-0 flex-col-reverse sm:flex-row">
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
              disabled={
                createUser.isPending ||
                selectedProfiles.length === 0 ||
                !generatedEmail ||
                !nome ||
                !sobrenome ||
                missingTeamGroups.length > 0 ||
                hasUnselectedTeamGroup
              }
              className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
            >
              {createUser.isPending ? "Criando..." : "Criar Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
