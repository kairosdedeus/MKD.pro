import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus, Search, Music, Play, Pause, MoreVertical,
  Pencil, Trash2, ExternalLink, ArrowUpDown, X,
} from 'lucide-react'
import { useSongs } from '@/hooks/useSongs'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { CreateSongModal } from '@/components/features/songs/CreateSongModal'
import { EditSongModal } from '@/components/features/songs/EditSongModal'
import { songService } from '@/services/songService'
import { useToast } from '@/components/ui/use-toast'
import { Song } from '@/types'
import { supabase } from '@/lib/supabaseClient'

type SortField = 'name' | 'artist' | 'original_key'
type SortDir = 'asc' | 'desc'

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm']

export function SongsPage() {
  const { toast } = useToast()
  const { songs, loading, refetch } = useSongs()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterKey, setFilterKey] = useState('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [deletingSong, setDeletingSong] = useState<Song | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Reprodutor de áudio
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  // Filtrar e ordenar
  const filtered = songs
    .filter(s => {
      const q = searchQuery.toLowerCase()
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q)
      const matchKey = filterKey === 'all' || s.original_key === filterKey
      return matchSearch && matchKey
    })
    .sort((a, b) => {
      const va = (a[sortField] || '').toLowerCase()
      const vb = (b[sortField] || '').toLowerCase()
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  // Artistas únicos para filtro
  const artists = Array.from(new Set(songs.map(s => s.artist).filter(Boolean))) as string[]

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const handlePlay = async (song: Song) => {
    if (playingId === song.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    if (!song.audio_path) return
    try {
      const url = await songService.getAudioUrl(song.audio_path)
      setAudioUrl(url)
      setPlayingId(song.id)
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = url
          audioRef.current.play()
        }
      }, 50)
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao reproduzir áudio' })
    }
  }

  const handleDelete = async () => {
    if (!deletingSong) return
    try {
      setDeleting(true)
      // Verificar se está em alguma escala
      const { data: inSchedule } = await supabase
        .from('schedule_songs')
        .select('id')
        .eq('song_id', deletingSong.id)
        .limit(1)

      if (inSchedule && inSchedule.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Não é possível excluir',
          description: 'Esta música está sendo usada em uma ou mais escalas.',
        })
        setDeletingSong(null)
        return
      }

      await supabase.from('songs').delete().eq('id', deletingSong.id)
      toast({ title: '✅ Música excluída!' })
      setDeletingSong(null)
      refetch()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Músicas</h1>
          <p className="text-gray-600 mt-2">Gerencie o repertório — {songs.length} música(s)</p>
        </div>
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" /> Nova Música
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-3">
            {/* Busca */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou artista..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filtro por tom */}
            <Select value={filterKey} onValueChange={setFilterKey}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tons</SelectItem>
                {KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Ordenação */}
            <Select value={`${sortField}-${sortDir}`} onValueChange={v => {
              const [f, d] = v.split('-')
              setSortField(f as SortField)
              setSortDir(d as SortDir)
            }}>
              <SelectTrigger className="w-44">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nome A→Z</SelectItem>
                <SelectItem value="name-desc">Nome Z→A</SelectItem>
                <SelectItem value="artist-asc">Artista A→Z</SelectItem>
                <SelectItem value="artist-desc">Artista Z→A</SelectItem>
                <SelectItem value="original_key-asc">Tom A→Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Limpar filtros */}
            {(searchQuery || filterKey !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setFilterKey('all') }}>
                <X className="h-4 w-4 mr-1" /> Limpar
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Music}
              title={searchQuery || filterKey !== 'all' ? 'Nenhuma música encontrada' : 'Nenhuma música cadastrada'}
              description={searchQuery || filterKey !== 'all' ? 'Tente outros filtros' : 'Adicione músicas ao repertório'}
              action={!searchQuery && filterKey === 'all' ? { label: 'Nova Música', onClick: () => setShowCreateModal(true) } : undefined}
            />
          ) : (
            <div className="space-y-1">
              {filtered.map(song => (
                <div
                  key={song.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    playingId === song.id ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50 border-transparent'
                  }`}
                >
                  {/* Ícone / Play */}
                  <button
                    onClick={() => song.audio_path && handlePlay(song)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      song.audio_path
                        ? 'bg-purple-100 hover:bg-purple-200 cursor-pointer'
                        : 'bg-gray-100 cursor-default'
                    }`}
                  >
                    {playingId === song.id
                      ? <Pause className="h-5 w-5 text-purple-600" />
                      : <Play className={`h-5 w-5 ${song.audio_path ? 'text-purple-600' : 'text-gray-400'}`} />
                    }
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{song.name}</p>
                    {song.artist && (
                      <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {song.original_key && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        {song.original_key}
                      </span>
                    )}
                    {song.has_virtual_instruments && (
                      <Badge variant="secondary" className="text-xs">VI</Badge>
                    )}
                    {song.reference_url && (
                      <a href={song.reference_url} target="_blank" rel="noopener noreferrer"
                        className="text-gray-400 hover:text-purple-600 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  {/* Menu ações */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingSong(song)}>
                        <Pencil className="h-4 w-4 mr-2 text-blue-600" /> Editar
                      </DropdownMenuItem>
                      {song.reference_url && (
                        <DropdownMenuItem asChild>
                          <a href={song.reference_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2 text-gray-500" /> Abrir referência
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setDeletingSong(song)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}

          {/* Contador */}
          {filtered.length > 0 && (
            <p className="text-xs text-gray-400 mt-3 text-right">
              {filtered.length} de {songs.length} música(s)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Player de áudio oculto */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        onError={() => { setPlayingId(null); toast({ variant: 'destructive', title: 'Erro ao reproduzir' }) }}
      />

      {/* Modais */}
      <CreateSongModal open={showCreateModal} onOpenChange={setShowCreateModal} onSuccess={refetch} />
      <EditSongModal open={!!editingSong} onOpenChange={o => !o && setEditingSong(null)} song={editingSong} onSuccess={refetch} />

      {/* AlertDialog excluir */}
      <AlertDialog open={!!deletingSong} onOpenChange={o => !o && setDeletingSong(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir música?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deletingSong?.name}"</strong> será excluída permanentemente.
              Músicas em uso em escalas não podem ser excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
