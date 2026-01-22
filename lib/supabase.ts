import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase público (anon key) para uso client-side
 * 
 * DECISÃO: Este arquivo é exclusivamente para client-side (browser).
 * - Usa NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - Respeita Row Level Security (RLS) policies
 * - É seguro expor no cliente - as chaves são públicas por design
 * 
 * ⚠️ NUNCA use service_role key aqui - isso é server-only (use lib/supabase-server.ts)
 */

let supabaseInstance: SupabaseClient | null = null

/**
 * Valida e retorna as variáveis de ambiente necessárias
 * @throws {Error} Se alguma env var estiver ausente
 */
function validateEnvVars(): { url: string; anonKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Configure it in your .env.local file (Settings > API > Project URL). ' +
      'This variable must be prefixed with NEXT_PUBLIC_ to be available in the browser.'
    )
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Configure it in your .env.local file (Settings > API > Project API keys > anon public). ' +
      'This variable must be prefixed with NEXT_PUBLIC_ to be available in the browser.'
    )
  }

  return { url: supabaseUrl, anonKey: supabaseAnonKey }
}

/**
 * Cria ou retorna o cliente Supabase singleton
 * DECISÃO: Singleton pattern garante que validação acontece apenas uma vez
 * e o cliente é reutilizado em toda a aplicação
 */
function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Validar env vars antes de criar o cliente
  const { url, anonKey } = validateEnvVars()
  
  supabaseInstance = createClient(url, anonKey)
  return supabaseInstance
}

// DECISÃO: Exportar como const para manter compatibilidade com imports existentes
// A validação acontece na primeira vez que o módulo é carregado
export const supabase = getSupabaseClient()// Exportar também a função para casos que precisem de controle explícito
export { getSupabaseClient }