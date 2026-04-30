import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Schedule } from '@/types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Publicada',
  completed: 'Concluída',
}

export function exportScheduleToPdf(schedule: Schedule, teamName: string) {
  const doc = new jsPDF()
  const purple = [147, 51, 234] as [number, number, number]
  const gray = [100, 100, 100] as [number, number, number]

  const dateFormatted = format(parseISO(schedule.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const title = schedule.title || `Escala — ${dateFormatted}`

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(...purple)
  doc.rect(0, 0, 210, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Escalas Ministeriais', 14, 12)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(teamName, 14, 20)

  // Status badge
  const status = STATUS_LABELS[schedule.status] || schedule.status
  doc.setFontSize(9)
  doc.text(status, 196, 12, { align: 'right' })

  // ── Título e data ────────────────────────────────────────────────────────
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 40)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray)
  doc.text(dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1), 14, 48)

  let y = 56

  // ── Observações ──────────────────────────────────────────────────────────
  if (schedule.notes) {
    doc.setFontSize(10)
    doc.setTextColor(...gray)
    doc.text('Observações:', 14, y)
    doc.setTextColor(0, 0, 0)
    const lines = doc.splitTextToSize(schedule.notes, 180)
    doc.text(lines, 14, y + 6)
    y += 6 + lines.length * 5 + 4
  }

  // ── Membros ──────────────────────────────────────────────────────────────
  if (schedule.members && schedule.members.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...purple)
    doc.text('👥 Membros', 14, y + 6)
    y += 10

    const membersData = schedule.members.map(m => [
      m.team_member?.user?.nome || '—',
      (m.functions || []).map((f: any) => f.nome).join(', ') || '—',
      m.notes || '',
    ])

    autoTable(doc, {
      startY: y,
      head: [['Nome', 'Função(ões)', 'Observações']],
      body: membersData,
      headStyles: {
        fillColor: purple,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 245, 255] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 70 },
        2: { cellWidth: 40 },
      },
      margin: { left: 14, right: 14 },
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Músicas ──────────────────────────────────────────────────────────────
  if (schedule.songs && schedule.songs.length > 0) {
    // Nova página se não couber
    if (y > 220) { doc.addPage(); y = 20 }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...purple)
    doc.text('🎵 Músicas', 14, y)
    y += 6

    const songsData = schedule.songs
      .sort((a, b) => a.order_index - b.order_index)
      .map((s, i) => [
        String(i + 1),
        s.song?.name || '—',
        s.song?.artist || '—',
        s.song?.original_key || '—',
        s.execution_key || s.song?.original_key || '—',
      ])

    autoTable(doc, {
      startY: y,
      head: [['#', 'Música', 'Artista', 'Tom Original', 'Tom Execução']],
      body: songsData,
      headStyles: {
        fillColor: purple,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 245, 255] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 55 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    })
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} · Página ${i} de ${pageCount}`,
      105, 290, { align: 'center' }
    )
  }

  // ── Salvar ───────────────────────────────────────────────────────────────
  const fileName = `escala-${format(parseISO(schedule.date), 'yyyy-MM-dd')}.pdf`
  doc.save(fileName)
}
