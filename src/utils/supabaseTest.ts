/**
 * Utilitário para testar conexão e funcionalidades do Supabase
 * Execute este arquivo para diagnosticar problemas de conexão
 */

import { supabase } from '@/lib/supabaseClient'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

const results: TestResult[] = []

function addResult(result: TestResult) {
  results.push(result)
  const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️'
  console.log(`${icon} ${result.name}: ${result.message}`)
  if (result.details) {
    console.log('   Detalhes:', result.details)
  }
}

export async function testSupabaseConnection() {
  console.log('🔍 Iniciando testes de conexão com Supabase...\n')
  console.log('=' .repeat(60))

  // 1. Verificar variáveis de ambiente
  await testEnvironmentVariables()

  // 2. Testar conexão básica
  await testBasicConnection()

  // 3. Verificar tabelas essenciais
  await testEssentialTables()

  // 4. Verificar dados iniciais
  await testInitialData()

  // 5. Testar autenticação
  await testAuthentication()

  // 6. Testar RLS (Row Level Security)
  await testRLS()

  // 7. Testar storage
  await testStorage()

  // 8. Resumo final
  printSummary()

  return results
}

async function testEnvironmentVariables() {
  console.log('\n📋 1. Verificando variáveis de ambiente...')
  
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    addResult({
      name: 'Variáveis de Ambiente',
      status: 'error',
      message: 'Variáveis não configuradas',
      details: { url: !!url, key: !!key }
    })
    return
  }

  addResult({
    name: 'Variáveis de Ambiente',
    status: 'success',
    message: 'Configuradas corretamente',
    details: { 
      url: url.substring(0, 30) + '...', 
      keyLength: key.length 
    }
  })
}

async function testBasicConnection() {
  console.log('\n🔌 2. Testando conexão básica...')
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) throw error

    addResult({
      name: 'Conexão Básica',
      status: 'success',
      message: 'Conexão estabelecida com sucesso'
    })
  } catch (error: any) {
    addResult({
      name: 'Conexão Básica',
      status: 'error',
      message: 'Falha na conexão',
      details: error.message
    })
  }
}

async function testEssentialTables() {
  console.log('\n📊 3. Verificando tabelas essenciais...')
  
  const tables = [
    'profiles',
    'users_profile',
    'user_profiles',
    'team_types',
    'teams',
    'team_members',
    'schedules',
    'songs',
    'cells'
  ]

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1)

      if (error) throw error

      addResult({
        name: `Tabela: ${table}`,
        status: 'success',
        message: 'Existe e acessível'
      })
    } catch (error: any) {
      addResult({
        name: `Tabela: ${table}`,
        status: 'error',
        message: 'Não encontrada ou inacessível',
        details: error.message
      })
    }
  }
}

async function testInitialData() {
  console.log('\n📦 4. Verificando dados iniciais...')
  
  try {
    // Verificar perfis
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')

    if (profilesError) throw profilesError

    addResult({
      name: 'Perfis do Sistema',
      status: profiles && profiles.length >= 12 ? 'success' : 'warning',
      message: `${profiles?.length || 0} perfis encontrados (esperado: 12)`,
      details: profiles?.map(p => p.codigo)
    })

    // Verificar tipos de equipe
    const { data: teamTypes, error: teamTypesError } = await supabase
      .from('team_types')
      .select('*')

    if (teamTypesError) throw teamTypesError

    addResult({
      name: 'Tipos de Equipe',
      status: teamTypes && teamTypes.length >= 5 ? 'success' : 'warning',
      message: `${teamTypes?.length || 0} tipos encontrados (esperado: 5)`,
      details: teamTypes?.map(t => t.codigo)
    })

    // Verificar funções de equipe
    const { data: functions, error: functionsError } = await supabase
      .from('team_functions')
      .select('*')

    if (functionsError) throw functionsError

    addResult({
      name: 'Funções de Equipe',
      status: functions && functions.length > 0 ? 'success' : 'warning',
      message: `${functions?.length || 0} funções encontradas`,
      details: functions?.map(f => f.nome)
    })

  } catch (error: any) {
    addResult({
      name: 'Dados Iniciais',
      status: 'error',
      message: 'Erro ao verificar dados',
      details: error.message
    })
  }
}

async function testAuthentication() {
  console.log('\n🔐 5. Testando autenticação...')
  
  try {
    // Verificar sessão atual
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      addResult({
        name: 'Sessão Atual',
        status: 'success',
        message: 'Usuário autenticado',
        details: { email: session.user.email }
      })

      // Verificar perfil do usuário
      const { data: userProfile, error: profileError } = await supabase
        .from('users_profile')
        .select('*, user_profiles(profile:profiles(*))')
        .eq('auth_user_id', session.user.id)
        .single()

      if (profileError) throw profileError

      addResult({
        name: 'Perfil do Usuário',
        status: 'success',
        message: 'Perfil encontrado',
        details: {
          nome: userProfile.nome,
          email: userProfile.email,
          perfis: userProfile.user_profiles?.length || 0
        }
      })
    } else {
      addResult({
        name: 'Sessão Atual',
        status: 'warning',
        message: 'Nenhum usuário autenticado'
      })

      // Testar login com credenciais de teste
      await testLogin()
    }
  } catch (error: any) {
    addResult({
      name: 'Autenticação',
      status: 'error',
      message: 'Erro ao verificar autenticação',
      details: error.message
    })
  }
}

async function testLogin() {
  console.log('\n🔑 Testando login...')
  
  const testCredentials = [
    { email: 'admin@igreja.com', password: 'senha123' },
    { email: 'admin@igreja.com', password: 'Admin@2024' },
  ]

  for (const cred of testCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cred.email,
        password: cred.password,
      })

      if (error) {
        addResult({
          name: `Login: ${cred.email}`,
          status: 'error',
          message: `Falha: ${error.message}`,
          details: { 
            code: error.status,
            hint: getLoginErrorHint(error.message)
          }
        })
      } else {
        addResult({
          name: `Login: ${cred.email}`,
          status: 'success',
          message: 'Login bem-sucedido!',
          details: { userId: data.user?.id }
        })

        // Fazer logout após teste
        await supabase.auth.signOut()
        break
      }
    } catch (error: any) {
      addResult({
        name: `Login: ${cred.email}`,
        status: 'error',
        message: 'Erro inesperado',
        details: error.message
      })
    }
  }
}

function getLoginErrorHint(errorMessage: string): string {
  if (errorMessage.includes('Invalid login credentials')) {
    return 'Senha incorreta ou usuário não existe. Execute o SQL de reset de senha.'
  }
  if (errorMessage.includes('Email not confirmed')) {
    return 'Email não confirmado. Marque "Auto Confirm User" ao criar o usuário.'
  }
  if (errorMessage.includes('User not found')) {
    return 'Usuário não existe. Crie o usuário primeiro.'
  }
  return 'Erro desconhecido. Verifique os logs do Supabase.'
}

async function testRLS() {
  console.log('\n🔒 6. Testando Row Level Security (RLS)...')
  
  try {
    // Verificar se RLS está habilitado
    const tables = ['users_profile', 'teams', 'schedules', 'songs']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)

      if (error && error.message.includes('row-level security')) {
        addResult({
          name: `RLS: ${table}`,
          status: 'success',
          message: 'RLS ativo (bloqueou acesso não autenticado)'
        })
      } else if (!error) {
        addResult({
          name: `RLS: ${table}`,
          status: 'warning',
          message: 'RLS pode não estar configurado corretamente'
        })
      }
    }
  } catch (error: any) {
    addResult({
      name: 'RLS',
      status: 'error',
      message: 'Erro ao testar RLS',
      details: error.message
    })
  }
}

async function testStorage() {
  console.log('\n💾 7. Testando Storage...')
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) throw error

    const audioBucket = buckets?.find(b => b.name === 'audio-musicas')

    if (audioBucket) {
      addResult({
        name: 'Storage: audio-musicas',
        status: 'success',
        message: 'Bucket configurado',
        details: { public: audioBucket.public }
      })
    } else {
      addResult({
        name: 'Storage: audio-musicas',
        status: 'warning',
        message: 'Bucket não encontrado',
        details: 'Execute a parte de storage do schema.sql'
      })
    }
  } catch (error: any) {
    addResult({
      name: 'Storage',
      status: 'error',
      message: 'Erro ao verificar storage',
      details: error.message
    })
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO DOS TESTES\n')

  const success = results.filter(r => r.status === 'success').length
  const errors = results.filter(r => r.status === 'error').length
  const warnings = results.filter(r => r.status === 'warning').length

  console.log(`✅ Sucessos: ${success}`)
  console.log(`❌ Erros: ${errors}`)
  console.log(`⚠️  Avisos: ${warnings}`)
  console.log(`📝 Total: ${results.length}`)

  if (errors > 0) {
    console.log('\n❌ PROBLEMAS ENCONTRADOS:\n')
    results
      .filter(r => r.status === 'error')
      .forEach(r => {
        console.log(`   • ${r.name}: ${r.message}`)
        if (r.details) {
          console.log(`     → ${JSON.stringify(r.details)}`)
        }
      })
  }

  if (warnings > 0) {
    console.log('\n⚠️  AVISOS:\n')
    results
      .filter(r => r.status === 'warning')
      .forEach(r => {
        console.log(`   • ${r.name}: ${r.message}`)
      })
  }

  console.log('\n' + '='.repeat(60))

  if (errors === 0 && warnings === 0) {
    console.log('🎉 TUDO FUNCIONANDO PERFEITAMENTE!')
  } else if (errors === 0) {
    console.log('✅ Sistema funcional, mas com alguns avisos.')
  } else {
    console.log('❌ Corrija os erros antes de continuar.')
  }

  console.log('='.repeat(60) + '\n')
}

// Exportar função para uso em componentes
export function getTestResults() {
  return results
}
