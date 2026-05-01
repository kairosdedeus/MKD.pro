import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from '@/components/shared/Pagination'

describe('usePagination', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }))

  it('retorna a primeira página por padrão', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    expect(result.current.currentPage).toBe(1)
    expect(result.current.paginatedItems).toHaveLength(10)
    expect(result.current.paginatedItems[0].id).toBe(1)
  })

  it('calcula o total de páginas corretamente', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    expect(result.current.totalPages).toBe(3)
  })

  it('navega para a próxima página', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    act(() => result.current.goToPage(2))
    expect(result.current.currentPage).toBe(2)
    expect(result.current.paginatedItems[0].id).toBe(11)
  })

  it('última página tem itens restantes', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    act(() => result.current.goToPage(3))
    expect(result.current.paginatedItems).toHaveLength(5)
  })

  it('não vai além da última página', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    act(() => result.current.goToPage(99))
    expect(result.current.currentPage).toBe(3)
  })

  it('não vai abaixo da página 1', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    act(() => result.current.goToPage(-5))
    expect(result.current.currentPage).toBe(1)
  })

  it('lista vazia retorna 0 páginas', () => {
    const { result } = renderHook(() => usePagination([], 10))
    expect(result.current.totalPages).toBe(0)
    expect(result.current.paginatedItems).toHaveLength(0)
  })
})
