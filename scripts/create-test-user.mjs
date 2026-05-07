import { createClient } from '@supabase/supabase-js'

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
const missing = requiredEnv.filter((key) => !process.env[key])

if (missing.length > 0) {
  console.error(`Variáveis obrigatórias ausentes: ${missing.join(', ')}`)
  process.exit(1)
}

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'teste.e2elab@example.com',
  password: process.env.TEST_USER_PASSWORD || 'Teste@123456',
  cpf: process.env.TEST_USER_CPF || '12345678901',
  full_name: process.env.TEST_USER_NAME || 'Usuário de Testes E2ELAB'
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('cpf', TEST_USER.cpf)
    .maybeSingle()

  if (existingProfile?.id) {
    console.log(`Usuário de testes já existe (${existingProfile.email}). Nada a fazer.`)
    return
  }

  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true,
    user_metadata: {
      full_name: TEST_USER.full_name,
      cpf: TEST_USER.cpf
    }
  })

  if (createError) {
    if (createError.message?.toLowerCase().includes('already registered')) {
      console.log('E-mail já cadastrado no Auth. Atualize o CPF/email manualmente no profile, se necessário.')
      return
    }

    throw createError
  }

  const userId = createdUser?.user?.id
  if (!userId) {
    throw new Error('Usuário criado sem ID retornado pelo Supabase Auth.')
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email: TEST_USER.email,
      full_name: TEST_USER.full_name,
      cpf: TEST_USER.cpf,
      phone: '11999999999'
    })

  if (profileError) {
    throw profileError
  }

  console.log('✅ Usuário de testes criado com sucesso:')
  console.log(`   email: ${TEST_USER.email}`)
  console.log(`   senha: ${TEST_USER.password}`)
  console.log(`   cpf:   ${TEST_USER.cpf}`)
}

main().catch((error) => {
  console.error('Erro ao criar usuário de testes:', error.message || error)
  process.exit(1)
})
