import { Music, Video, HandHeart, Home, UsersRound } from 'lucide-react'

export const PROFILE_TO_TEAM_TYPE: Record<string, string> = {
  lider_louvor: 'louvor',
  membro_louvor: 'louvor',
  lider_danca: 'danca',
  membro_danca: 'danca',
  lider_midia: 'midia',
  membro_midia: 'midia',
  lider_obreiros: 'obreiros',
  membro_obreiro: 'obreiros',
  lider_celula: 'celula',
  auxiliar_celula: 'celula',
  membro_celula: 'celula',
}

export const TEAM_TYPE_LABELS: Record<string, string> = {
  louvor: 'Louvor',
  danca: 'Danca',
  midia: 'Midia',
  obreiros: 'Obreiros',
  celula: 'Celula',
}

export const TEAM_TYPE_ROUTES: Record<string, string> = {
  louvor: '/louvor',
  danca: '/danca',
  midia: '/midia',
  obreiros: '/obreiros',
  celula: '/celulas',
}

export const TEAM_TYPE_ICONS: Record<string, typeof Music> = {
  louvor: Music,
  danca: UsersRound,
  midia: Video,
  obreiros: HandHeart,
  celula: Home,
}

export function getSelectedTeamTypeCodes(
  selectedProfileIds: string[],
  profiles: { id: string; codigo: string }[] = [],
) {
  return Array.from(new Set(
    selectedProfileIds
      .map(profileId => profiles.find(profile => profile.id === profileId)?.codigo)
      .map(code => code ? PROFILE_TO_TEAM_TYPE[code] : null)
      .filter((code): code is string => !!code),
  ))
}

export function getTeamsByType<T extends { team_type?: { codigo?: string } }>(
  teams: T[] = [],
  teamTypeCodes: string[] = [],
) {
  return teamTypeCodes.map(code => ({
    code,
    label: TEAM_TYPE_LABELS[code] || code,
    teams: teams.filter(team => team.team_type?.codigo === code),
  }))
}
