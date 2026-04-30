import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { songService } from '@/services/songService'
import { Song, SongFormData } from '@/types'
import { Upload, X } from 'lucide-react'

interface EditSongModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  song: Song | null
  onSuccess?: () => void
}

export function EditSongModal({ open, onOpenChange, song, onSuccess }: EditSongModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [artist, setArtist] = useState('')
  const [originalKey, setOriginalKey] = useState('')
  const [referenceUrl, setReferenceUrl] = useState('')
  const [hasVirtualInstruments, setHasVirtualInstruments] = useState(false)
  const [notes, setNotes] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)

  useEffect(() => {
    if (song && open) {
      setName(song.name)
      setArtist(song.artist || '')
      setOriginalKey(song.original_key || '')
      setReferenceUrl(song.reference_url || '')
      setHasVirtualInstruments(song.has_virtual_instruments)
      setNotes(song.notes || '')
      setAudioFile(null)
    }
  }, [song, open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
    if (!validTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Arquivo inválido', description: 'Use MP3, WAV ou OGG' })
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Arquivo muito grande', description: 'Máximo 50MB' })
      return
    }
    setAudioFile(file)
  }

  const handleSubmit = async () => {
    if (!song) return
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Nome obrigatório' })
      return
    }
    try {
      setLoading(true)

      const formData: Partial<SongFormData> = {
        name: name.trim(),
        artist: artist.trim() || undefined,
        original_key: originalKey.trim() || undefined,
        reference_url: referenceUrl.trim() || undefined,
        has_virtual_instruments: hasVirtualInstruments,
        notes: notes.trim() || undefined,
      }

      await songService.updateSong(song.id, formData)

      // Upload de novo áudio se selecionado
      if (audioFile) {
        await songService.uploadSongAudio(song.id, audioFile)
      }

      toast({ title: '✅ Música atualizada!' })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error(error)
      toast({ variant: 'destructive', title: 'Erro ao atualizar música' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>✏️ Editar Música</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Música *</Label>
            <Input placeholder="Ex: Reckless Love" value={name} onChange={e => setName(e.target.value)} autoComplete="off" />
          </div>

          <div className="space-y-2">
            <Label>Artista / Banda</Label>
            <Input placeholder="Ex: Cory Asbury" value={artist} onChange={e => setArtist(e.target.value)} autoComplete="off" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tom Original</Label>
              <Input placeholder="Ex: C, D, Em" value={originalKey} onChange={e => setOriginalKey(e.target.value)} autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label>Link de Referência</Label>
              <Input placeholder="YouTube, Spotify..." value={referenceUrl} onChange={e => setReferenceUrl(e.target.value)} autoComplete="off" />
            </div>
          </div>

          {/* Áudio */}
          <div className="space-y-2">
            <Label>Arquivo de Áudio</Label>
            {song?.audio_path && !audioFile && (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <span>✅ Áudio já cadastrado</span>
                <span className="text-xs text-green-500 ml-auto">Selecione um novo para substituir</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input id="audioFileEdit" type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
              <Button type="button" variant="outline" onClick={() => document.getElementById('audioFileEdit')?.click()} className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                {audioFile ? audioFile.name : 'Selecionar novo arquivo'}
              </Button>
              {audioFile && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setAudioFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">MP3, WAV, OGG — máximo 50MB</p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="editHasVI"
              checked={hasVirtualInstruments}
              onCheckedChange={v => setHasVirtualInstruments(v as boolean)}
            />
            <Label htmlFor="editHasVI" className="cursor-pointer">Possui instrumentos virtuais</Label>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea placeholder="Observações sobre a música" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
            {loading ? 'Salvando...' : '💾 Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
