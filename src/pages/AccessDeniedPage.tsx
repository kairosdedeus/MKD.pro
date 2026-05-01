import { ShieldAlert } from 'lucide-react'

export function AccessDeniedPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <section className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-foreground">Acesso restrito</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Seu perfil nao tem permissao para acessar esta area. Use o menu lateral para navegar pelos dashboards liberados para voce.
        </p>
      </section>
    </div>
  )
}
