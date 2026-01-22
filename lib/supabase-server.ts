import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Clientes Supabase para uso server-side no Next.js App Router
 * 
 * DECISÕES DE DESIGN:
 * 
 * 1. Public Client (createPublicClient):
 *    - Usa NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 *    - Usar para: queries públicas, operações quando RLS permite anon, validar tokens de usuários
 *    - É seguro expor no cliente (browser) - as chaves são públicas por design
 *    - Respeita Row Level Security (RLS) policies
 * 
 * 2. Admin Client (createAdminClient):
 *    - Usa SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL como fallback) + SUPABASE_SERVICE_ROLE_KEY
 *    - SOMENTE server-side - NUNCA expor no cliente (browser)
 *    - Usar para: operações administrativas, bypass RLS quando necessário, criar/deletar usuários
 *    - Ignora RLS policies - tenha cuidado ao usar
 *    - Service role key é SECRETA - se vazar, seu banco pode ser comprometido
 */

/**
 * Cria um cliente Supabase público (anon key)
 * 
 * USO:
 * - Queries públicas (exames, unidades, etc.)
 * - Validação de tokens de usuários (supabase.auth.getUser())
 * - Operações que respeitam RLS
 * 
 * ⚠️ NOTA: Este cliente respeita RLS. Se precisar bypassar RLS, use createAdminClient().
 * 
 * @throws {Error} Se NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não estiverem configurados
 */
export function createPublicClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Configure it in your .env.local file (Settings > API > Project URL)'
    )
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Configure it in your .env.local file (Settings > API > Project API keys > anon public)'
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}


export function createAdminClient(): SupabaseClient {
  // Aceitar SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL (com fallback)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error(
      'Missing SUPABASE_URL environment variable. ' +
      'Set either SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in your .env.local file'
    )
  }

  // DECISÃO: Service role key é OBRIGATÓRIA - não usar fallback para anon key
  // Usar anon key como service_role seria um risco crítico de segurança
  if (!supabaseServiceRoleKey || supabaseServiceRoleKey.trim() === '') {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'Configure it in your .env.local file (Settings > API > Project API keys > service_role secret). ' +
      'This key is REQUIRED for admin operations and must be kept secret.'
    )
  }

  // Validar formato básico da service_role key (deve começar com eyJ)
  if (!supabaseServiceRoleKey.startsWith('eyJ')) {
    throw new Error(
      'Invalid SUPABASE_SERVICE_ROLE_KEY format. ' +
      'Service role key should start with "eyJ". Verify you copied the complete key.'
    )
  }

  // DECISÃO: Configurar cliente admin sem refresh token e sem persistência de sessão
  // Admin client não precisa de sessão - opera com privilégios de service_role
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * @deprecated Use createPublicClient() instead
 * 
 * Esta função mantém compatibilidade com código existente.
 * Será removida em versão futura - atualize seus imports para createPublicClient().
 */
export function createServerClient(): SupabaseClient {
  return createPublicClient()
}