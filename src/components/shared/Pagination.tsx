import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <p className="text-sm text-muted-foreground">
        Mostrando <strong className="text-foreground">{start}–{end}</strong> de <strong className="text-foreground">{totalItems}</strong>
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {getPages().map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-muted-foreground text-sm">…</span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8 text-sm"
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </Button>
          )
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function usePagination<T>(items: T[], pageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(items.length / pageSize)
  const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  const reset = () => setCurrentPage(1)
  return { currentPage, totalPages, paginatedItems, goToPage, reset }
}
