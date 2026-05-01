import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Search, Music, Play, Pause, MoreVertical, Pencil, Trash2, ExternalLink, ArrowUpDown, X } from 'lucide-react'
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

const KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','Cm','Dm','Em','Fm','Gm','Am','Bm']

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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  const filtered = songs
    .filter(s => {
      const q = searchQuery.toLowerCase()
      return (!q || s.name.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q))
        && (filterKey === 'all' || s.original_key === filterKey)
    })
    .sort((a, b) => {
      const va = (a[sortField] || '').toLowerCase()
      const vb = (b[sortField] || '').toLowerCase()
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  const handlePlay = async (song: Song) => {
    if (playingId === song.id) { audioRef.current?.pause(); setPlayingId(null); return }
    if (!song.audio_path) return
    try {
      const url = await songService.getAudioUrl(song.audio_path)
      setPlayingId(song.id)
      setTimeout(() => { if (audioRef.current) { audioRef.current.src = url; audioRef.current.play() } }, 50)
    } catch { toast({ variant: 'destructive', title: 'Erro ao reproduzir áudio' }) }
  }

  const handleDelete = async () => {
    if (!deletingSong) return
    try {
      setDeleting(true)
      const { data: inSchedule } = await supabase.from('schedule_songs').select('id').eq('song_id', deletingSong.id).limit(1)
      if (inSchedule && inSchedule.length > 0) {
        toast({ variant: 'destructive', title: 'Não é possível excluir', description: 'Esta música está em uso em escalas.' })
        setDeletingSong(null); return
      }
      await supabase.from('songs').delete().eq('id', deletingSong.id)
      toast({ title: '✅ Música excluída!' })
      setDeletingSong(null); refetch()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message })
    } finally { setDeleting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Músicas</h1>
          <p className="text-muted-foreground mt-1">Gerencie o repertório — {songs.length} música(s)</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" /> Nova Música
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou artista..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={filterKey} onValueChange={setFilterKey}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Tom" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tons</SelectItem>
                {KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={`${sortField}-${sortDir}`} onValueChange={v => {
              const [f, d] = v.split('-'); setSortField(f as SortField); setSortDir(d as SortDir)
            }}>
              <SelectTrigger className="w-44">
                <ArrowUpDown className="h-4 w-4 mr-2" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nome A→Z</SelectItem>
                <SelectItem value="name-desc">Nome Z→A</SelectItem>
                <SelectItem value="artist-asc">Artista A→Z</SelectItem>
                <SelectItem value="artist-desc">Artista Z→A</SelectItem>
                <SelectItem value="original_key-asc">Tom A→Z</SelectItem>
              </SelectContent>
            </Select>
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
            <EmptyState icon={Music}
              title={searchQuery || filterKey !== 'all' ? 'Nenhuma música encontrada' : 'Nenhuma música cadastrada'}
              description={searchQuery || filterKey !== 'all' ? 'Tente outros filtros' : 'Adicione músicas ao repertório'}
              action={!searchQuery && filterKey === 'all' ? { label: 'Nova Música', onClick: () => setShowCreateModal(true) } : undefined}
            />
          ) : (
            <div className="space-y-1">
              {filtered.map(song => (
                <div key={song.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    playingId === song.id ? 'bg-primary/5 border-primary/20' : 'hover:bg-accent border-transparent'
                  }`}
                >
                  <button onClick={() => song.audio_path && handlePlay(song)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      song.audio_path ? 'bg-primary/10 hover:bg-primary/20 cursor-pointer' : 'bg-muted cursor-default'
                    }`}
                  >
                    {playingId === song.id
                      ? <Pause className="h-5 w-5 text-primary" />
                      : <Play className={`h-5 w-5 ${song.audio_path ? 'text-primary' : 'text-muted-foreground'}`} />
                    }
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{song.name}</p>
                    {song.artist && <p className="text-xs text-muted-foreground truncate">{song.artist}</p>}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {song.original_key && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        {song.original_key}
                      </span>
                    )}
                    {song.has_virtual_instruments && <Badge variant="secondary" className="text-xs">VI</Badge>}
                    {song.reference_url && (
                      <a href={song.reference_url} target="_blank" rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        onClick={e => e.stopPropagation()}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingSong(song)}>
                        <Pencil className="h-4 w-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      {song.reference_url && (
                        <DropdownMenuItem asChild>
                          <a href={song.reference_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" /> Abrir referência
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingSong(song)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
          {filtered.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-right">
              {filtered.length} de {songs.length} música(s)
            </p>
          )}
        </CardContent>
      </Card>

      <audio ref={audioRef} onEnded={() => setPlayingId(null)}
        onError={() => { setPlayingId(null); toast({ variant: 'destructive', title: 'Erro ao reproduzir' }) }} />

      <CreateSongModal open={showCreateModal} onOpenChange={setShowCreateModal} onSuccess={refetch} />
      <EditSongModal open={!!editingSong} onOpenChange={o => !o && setEditingSong(null)} song={editingSong} onSuccess={refetch} />

      <AlertDialog open={!!deletingSong} onOpenChange={o => !o && setDeletingSong(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir música?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deletingSong?.name}"</strong> será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
