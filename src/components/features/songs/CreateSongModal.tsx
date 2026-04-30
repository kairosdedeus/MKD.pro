import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { songService } from '@/services/songService'
import { SongFormData } from '@/types'
import { Upload } from 'lucide-react'

interface CreateSongModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateSongModal({ open, onOpenChange, onSuccess }: CreateSongModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState('')
  const [artist, setArtist] = useState('')
  const [originalKey, setOriginalKey] = useState('')
  const [referenceUrl, setReferenceUrl] = useState('')
  const [hasVirtualInstruments, setHasVirtualInstruments] = useState(false)
  const [notes, setNotes] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)

  const resetForm = () => {
    setName('')
    setArtist('')
    setOriginalKey('')
    setReferenceUrl('')
    setHasVirtualInstruments(false)
    setNotes('')
    setAudioFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione um arquivo de áudio válido (MP3, WAV, OGG)',
          variant: 'destructive',
        })
        return
      }

      // Validar tamanho (máximo 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 50MB',
          variant: 'destructive',
        })
        return
      }

      setAudioFile(file)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite o nome da música',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      const formData: SongFormData = {
        name: name.trim(),
        artist: artist.trim() || undefined,
        original_key: originalKey.trim() || undefined,
        reference_url: referenceUrl.trim() || undefined,
        has_virtual_instruments: hasVirtualInstruments,
        notes: notes.trim() || undefined,
        audio_file: audioFile || undefined,
      }

      await songService.createSong(formData)

      toast({
        title: 'Música criada!',
        description: 'A música foi adicionada ao repertório',
      })

      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao criar música:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a música',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Música</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Música *</Label>
            <Input
              id="name"
              placeholder="Ex: Reckless Love"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">Artista</Label>
            <Input
              id="artist"
              placeholder="Ex: Cory Asbury"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originalKey">Tom Original</Label>
              <Input
                id="originalKey"
                placeholder="Ex: C, D, Em"
                value={originalKey}
                onChange={(e) => setOriginalKey(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceUrl">Link de Referência</Label>
              <Input
                id="referenceUrl"
                placeholder="YouTube, Spotify, etc"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audioFile">Arquivo de Áudio</Label>
            <div className="flex items-center gap-2">
              <Input
                id="audioFile"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('audioFile')?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {audioFile ? audioFile.name : 'Selecionar arquivo'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: MP3, WAV, OGG (máximo 50MB)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="hasVirtualInstruments"
              checked={hasVirtualInstruments}
              onCheckedChange={(checked) => setHasVirtualInstruments(checked as boolean)}
            />
            <Label htmlFor="hasVirtualInstruments" className="cursor-pointer">
              Possui instrumentos virtuais
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre a música"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Música'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
