/**
 * Traduz mensagens de erro do Supabase e outras mensagens para português brasileiro
 */
export function translateError(error: any): string {
  if (!error) return 'Ocorreu um erro desconhecido'

  const errorMessage = error.message || error.toString()

  // Mensagens de erro do Supabase Auth
  const errorTranslations: Record<string, string> = {
    // Erros de autenticação
    'Invalid login credentials': 'Credenciais inválidas. Verifique seu CPF/e-mail e senha.',
    'Email not confirmed': 'E-mail não confirmado. Verifique sua caixa de entrada.',
    'User already registered': 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.',
    'already registered': 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.',
    'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
    'Signup is disabled': 'Cadastro temporariamente desabilitado. Entre em contato com o suporte.',
    'User not found': 'Usuário não encontrado. Verifique suas credenciais.',
    'Invalid email': 'E-mail inválido. Verifique o formato do e-mail.',
    'Invalid password': 'Senha inválida. A senha deve ter pelo menos 6 caracteres.',
    'signup_disabled': 'Cadastro temporariamente desabilitado. Entre em contato com o suporte.',
    
    // Erros de banco de dados
    'duplicate key value violates unique constraint': 'Este registro já existe no sistema.',
    'violates foreign key constraint': 'Erro de referência. Dados relacionados não encontrados.',
    'null value in column': 'Campo obrigatório não preenchido.',
    'new row violates row-level security policy': 'Você não tem permissão para realizar esta ação.',
    
    // Erros genéricos
    'Network request failed': 'Erro de conexão. Verifique sua internet e tente novamente.',
    'Failed to fetch': 'Erro ao conectar com o servidor. Tente novamente.',
    'Request timeout': 'Tempo de espera esgotado. Tente novamente.',
  }

  // Verificar se há tradução direta
  for (const [key, translation] of Object.entries(errorTranslations)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return translation
    }
  }

  // Traduções parciais (contém)
  if (errorMessage.toLowerCase().includes('invalid login')) {
    return 'Credenciais inválidas. Verifique seu CPF/e-mail e senha.'
  }
  
  if (errorMessage.toLowerCase().includes('email')) {
    if (errorMessage.toLowerCase().includes('already')) {
      return 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.'
    }
    if (errorMessage.toLowerCase().includes('invalid')) {
      return 'E-mail inválido. Verifique o formato do e-mail.'
    }
  }

  if (errorMessage.toLowerCase().includes('password')) {
    if (errorMessage.toLowerCase().includes('weak') || errorMessage.toLowerCase().includes('at least')) {
      return 'A senha deve ter pelo menos 6 caracteres.'
    }
    return 'Senha inválida. Verifique sua senha.'
  }

  if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.'
  }

  if (errorMessage.toLowerCase().includes('timeout')) {
    return 'Tempo de espera esgotado. Tente novamente.'
  }

  if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('unauthorized')) {
    return 'Você não tem permissão para realizar esta ação.'
  }

  if (errorMessage.toLowerCase().includes('not found')) {
    return 'Registro não encontrado.'
  }

  // Log do erro completo para debug (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.error('Erro não traduzido:', errorMessage)
  }

  // Se não houver tradução específica, retornar mensagem genérica em português
  // Mas tentar extrair informações úteis do erro
  if (errorMessage && errorMessage.length < 200) {
    return `Erro: ${errorMessage}. Por favor, tente novamente.`
  }
  
  return 'Ocorreu um erro. Por favor, tente novamente. Se o problema persistir, entre em contato com o suporte.'
}

