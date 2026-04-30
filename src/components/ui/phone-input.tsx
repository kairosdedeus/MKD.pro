import * as React from 'react'
import { Input } from '@/components/ui/input'
import { formatPhone } from '@/hooks/usePhoneMask'
import { cn } from '@/lib/utils'

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function PhoneInput({ value, onChange, className, ...props }: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatPhone(e.target.value))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Control', 'Meta', 'v', 'c', 'a', 'x',
    ]
    // Permite ctrl+v, ctrl+c, etc
    if (e.ctrlKey || e.metaKey) return
    if (allowed.includes(e.key)) return
    // Bloqueia não-números
    if (!/^\d$/.test(e.key)) {
      e.preventDefault()
    }
  }

  // Ao colar, formata automaticamente
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
    onChange(formatPhone(pasted))
  }

  return (
    <Input
      {...props}
      type="tel"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder="(67) 9XXXX-XXXX"
      maxLength={15}
      autoComplete="off"
      className={cn(className)}
    />
  )
}
