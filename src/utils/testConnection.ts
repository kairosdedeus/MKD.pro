/**
 * Utilitário para testar a conexão com o Supabase
 * Execute este arquivo para verificar se as credenciais estão corretas
 */

import { supabase } from '@/lib/supabaseClient'

export async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...\n')

  // 1. Verificar variáveis de ambiente
  console.log('1️⃣ Verificando variáveis de ambiente:')
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('❌ Variáveis de ambiente não configuradas!')
    console.log('   Crie um arquivo .env na raiz do projeto com:')
    console.log('   VITE_SUPABASE_URL=sua-url')
    console.log('   VITE_SUPABASE_ANON_KEY=sua-chave')
    return false
  }

  console.log('✅ URL:', url)
  console.log('✅ Key:', key.substring(0, 20) + '...\n')

  // 2. Testar conexão básica
  console.log('2️⃣ Testando conexão básica:')
  try {
    const { data, error } = await supabase.from('profiles').select('count')
    if (error) throw error
    console.log('✅ Conexão estabelecida com sucesso!\n')
  } catch (error: any) {
    console.error('❌ Erro na conexão:', error.message)
    return false
  }

  // 3. Verificar tabelas essenciais
  console.log('3️⃣ Verificando tabelas essenciais:')
  const tables = [
    'profiles',
    'users_profile',
    'team_types',
    'teams',
    'schedules',
    'songs',
  ]

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1)
      if (error) throw error
      console.log(`✅ Tabela "${table}" existe`)
    } catch (error: any) {
      console.error(`❌ Tabela "${table}" não encontrada:`, error.message)
      console.log('   Execute o schema SQL no Supabase!')
      return false
    }
  }
  console.log('')

  // 4. Verificar dados iniciais
  console.log('4️⃣ Verificando dados iniciais:')
  
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) throw profilesError
    console.log(`✅ ${profiles?.length || 0} perfis encontrados`)

    const { data: teamTypes, error: teamTypesError } = await supabase
      .from('team_types')
      .select('*')
    
    if (teamTypesError) throw teamTypesError
    console.log(`✅ ${teamTypes?.length || 0} tipos de equipe encontrados`)

    if (!profiles?.length || !teamTypes?.length) {
      console.log('⚠️  Dados iniciais não encontrados. Execute o schema SQL completo!')
    }
  } catch (error: any) {
    console.error('❌ Erro ao verificar dados:', error.message)
    return false
  }
  console.log('')

  // 5. Verificar autenticação
  console.log('5️⃣ Verificando sistema de autenticação:')
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      console.log('✅ Usuário autenticado:', session.user.email)
    } else {
      console.log('ℹ️  Nenhum usuário autenticado (normal se não fez login)')
    }
  } catch (error: any) {
    console.error('❌ Erro na autenticação:', error.message)
  }
  console.log('')

  // 6. Verificar storage
  console.log('6️⃣ Verificando storage:')
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    if (error) throw error
    
    const audioBucket = buckets?.find(b => b.name === 'audio-musicas')
    if (audioBucket) {
      console.log('✅ Bucket "audio-musicas" configurado')
    } else {
      console.log('⚠️  Bucket "audio-musicas" não encontrado')
      console.log('   Execute a parte de storage do schema SQL')
    }
  } catch (error: any) {
    console.error('❌ Erro ao verificar storage:', error.message)
  }
  console.log('')

  console.log('🎉 Teste de conexão concluído!')
  console.log('📝 Se todos os itens estão ✅, você está pronto para usar o sistema!')
  
  return true
}

// Função auxiliar para exibir informações do projeto
export async function showProjectInfo() {
  console.log('\n📊 Informações do Projeto Supabase:\n')
  
  try {
    // Contar usuários
    const { count: usersCount } = await supabase
      .from('users_profile')
      .select('*', { count: 'exact', head: true })
    console.log(`👥 Usuários cadastrados: ${usersCount || 0}`)

    // Contar equipes
    const { count: teamsCount } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
    console.log(`👨‍👩‍👧‍👦 Equipes criadas: ${teamsCount || 0}`)

    // Contar escalas
    const { count: schedulesCount } = await supabase
      .from('schedules')
      .select('*', { count: 'exact', head: true })
    console.log(`📅 Escalas criadas: ${schedulesCount || 0}`)

    // Contar músicas
    const { count: songsCount } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
    console.log(`🎵 Músicas cadastradas: ${songsCount || 0}`)

    console.log('')
  } catch (error: any) {
    console.error('Erro ao buscar informações:', error.message)
  }
}

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testSupabaseConnection().then(success => {
    if (success) {
      showProjectInfo()
    }
  })
}
