import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Home } from 'lucide-react'

export function CellsDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Células</h1>
          <p className="text-gray-600 mt-2">Gerencie as células da igreja</p>
        </div>
        <Button className="flex items-center gap-2 bg-cells hover:bg-cells/90">
          <Plus className="h-4 w-4" />
          Nova Célula
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Células Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma célula cadastrada</p>
        </CardContent>
      </Card>
    </div>
  )
}
