import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SimpleCalendarProps {
  selectedDate?: Date
  onDateSelect: (date: Date) => void
  highlightedDates?: Date[]
  className?: string
}

export function SimpleCalendar({
  selectedDate,
  onDateSelect,
  highlightedDates = [],
  className,
}: SimpleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Preencher dias do início do mês
  const startDayOfWeek = monthStart.getDay()
  const previousMonthDays = Array.from({ length: startDayOfWeek }, (_, i) => {
    const date = new Date(monthStart)
    date.setDate(date.getDate() - (startDayOfWeek - i))
    return date
  })

  // Preencher dias do fim do mês
  const endDayOfWeek = monthEnd.getDay()
  const nextMonthDays = Array.from({ length: 6 - endDayOfWeek }, (_, i) => {
    const date = new Date(monthEnd)
    date.setDate(date.getDate() + i + 1)
    return date
  })

  const allDays = [...previousMonthDays, ...daysInMonth, ...nextMonthDays]

  const isHighlighted = (date: Date) => {
    return highlightedDates.some((d) => isSameDay(d, date))
  }

  const isSelected = (date: Date) => {
    return selectedDate ? isSameDay(date, selectedDate) : false
  }

  return (
    <div className={cn('p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Dias do mês */}
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentMonth)
          const highlighted = isHighlighted(date)
          const selected = isSelected(date)

          return (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={cn(
                'aspect-square p-2 text-sm rounded-md transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                !isCurrentMonth && 'text-muted-foreground opacity-50',
                highlighted && 'bg-primary/10 font-semibold',
                selected && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {format(date, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
