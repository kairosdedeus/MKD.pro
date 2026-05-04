import { useState } from "react";
import {
  Plus,
  Users as UsersIcon,
  Pencil,
  Trash2,
  MoreVertical,
  PowerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { CreateTeamModal } from "@/components/features/teams/CreateTeamModal";
import { EditTeamModal } from "@/components/features/teams/EditTeamModal";
import { useTeams } from "@/hooks/useTeams";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Team } from "@/types";

const MINISTRY_COLORS: Record<string, string> = {
  louvor: "bg-primary/10 text-primary",
  danca: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  midia: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  obreiros: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  celula: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

export function TeamsPage() {
  const { toast } = useToast();
  const { teams, loading, refetch } = useTeams();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deactivatingTeam, setDeactivatingTeam] = useState<Team | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const handleDeactivate = async () => {
    if (!deactivatingTeam) return;
    try {
      setDeactivating(true);
      await (supabase as any)
        .from("teams")
        .update({ ativo: false })
        .eq("id", deactivatingTeam.id);
      toast({ title: "✅ Equipe desativada!" });
      setDeactivatingTeam(null);
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao desativar",
        description: error.message,
      });
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Equipes</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as equipes dos ministérios
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Nova Equipe
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Todas as Equipes</span>
            <span className="text-sm font-normal text-muted-foreground">
              {teams.length} equipe(s)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ministério</TableHead>
                  <TableHead>Líder</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.nome}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          MINISTRY_COLORS[(team as any).team_type?.codigo] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {(team as any).team_type?.nome || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(team as any).leader?.nome ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">
                              {(team as any).leader.nome
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <span className="text-sm">
                              {(team as any).leader.nome}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {team.members?.length || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={team.ativo ? "default" : "secondary"}>
                        {team.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingTeam(team)}
                          >
                            <Pencil className="h-4 w-4 mr-2 text-blue-600" />{" "}
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeactivatingTeam(team)}
                          >
                            <PowerOff className="h-4 w-4 mr-2" /> Desativar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={UsersIcon}
              title="Nenhuma equipe cadastrada"
              description="Crie sua primeira equipe para começar"
              action={{
                label: "Nova Equipe",
                onClick: () => setCreateModalOpen(true),
              }}
            />
          )}
        </CardContent>
      </Card>

      <CreateTeamModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={refetch}
      />

      <EditTeamModal
        open={!!editingTeam}
        onOpenChange={(o) => !o && setEditingTeam(null)}
        team={editingTeam}
        onSuccess={refetch}
      />

      <AlertDialog
        open={!!deactivatingTeam}
        onOpenChange={(o) => !o && setDeactivatingTeam(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              A equipe <strong>"{deactivatingTeam?.nome}"</strong> será
              desativada e não aparecerá mais nos dashboards. As escalas
              existentes serão mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivating}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeactivate}
              disabled={deactivating}
            >
              {deactivating ? "Desativando..." : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
