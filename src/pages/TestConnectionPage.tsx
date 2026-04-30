import { useState, useEffect } from 'react'
import { testSupabaseConnection } from '@/utils/supabaseTest'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export function TestConnectionPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [tested, setTested] = useState(false)

  const runTests = async () => {
    setLoading(true)
    setTested(false)
    setResults([])

    try {
      const testResults = await testSupabaseConnection()
      setResults(testResults)
      setTested(true)
    } catch (error) {
      console.error('Erro ao executar testes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Executar testes automaticamente ao carregar a página
    runTests()
  }, [])

  const getIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length
  const warningCount = results.filter(r => r.status === 'warning').length

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Teste de Conexão Supabase</h1>
        <p className="text-gray-600 mt-2">
          Diagnóstico completo da conexão e configuração do banco de dados
        </p>
      </div>

      <div className="mb-6">
        <Button
          onClick={runTests}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Testando...' : 'Executar Testes Novamente'}
        </Button>
      </div>

      {tested && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sucessos</p>
                  <p className="text-2xl font-bold text-green-600">{successCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Erros</p>
                  <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avisos</p>
                  <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resultados dos Testes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg">Executando testes...</span>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Clique em "Executar Testes" para começar
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : result.status === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(result.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold">{result.name}</h3>
                      <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                            Ver detalhes
                          </summary>
                          <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {tested && errorCount > 0 && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">⚠️ Ações Recomendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {results
                .filter(r => r.status === 'error')
                .map((result, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <div>
                      <strong>{result.name}:</strong> {result.message}
                      {result.details && typeof result.details === 'object' && result.details.hint && (
                        <p className="text-gray-700 mt-1">💡 {result.details.hint}</p>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {tested && errorCount === 0 && warningCount === 0 && (
        <Card className="mt-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-green-700">
                🎉 Tudo Funcionando Perfeitamente!
              </h3>
              <p className="text-gray-700 mt-2">
                Sua conexão com o Supabase está configurada corretamente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
