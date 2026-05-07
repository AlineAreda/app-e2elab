/**
 * Traduz mensagens de erro do Supabase e outras mensagens para português brasileiro
 */
export function translateError(error: any): string {
  if (!error) return 'Ocorreu um erro desconhecido'

  // Extrair mensagem e código do erro (pode vir em diferentes formatos)
  let errorMessage = error.message || error.toString() || ''
  let errorCode = error.code || error.status || ''
  
  // Se o erro for um objeto com propriedades code e message (resposta JSON do Supabase)
  if (typeof error === 'object' && error.code && error.message) {
    errorCode = error.code
    errorMessage = error.message
  }
  
  // Se o erro for uma string JSON, tentar fazer parse
  if (typeof errorMessage === 'string' && errorMessage.startsWith('{')) {
    try {
      const parsed = JSON.parse(errorMessage)
      if (parsed.code) errorCode = parsed.code
      if (parsed.message) errorMessage = parsed.message
    } catch {
      // Não é JSON válido, continuar com a string original
    }
  }
  
  // Verificar código de erro do Supabase primeiro
  if (errorCode === 'email_not_confirmed' || errorMessage.includes('email_not_confirmed') ||
      errorMessage.toLowerCase().includes('email not confirmed') ||
      errorMessage.toLowerCase().includes('email não confirmado')) {
    return 'Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.'
  }

  // Removido: Não exibir mensagens de rate limit do Supabase que bloqueiam o usuário
  // Se o Supabase retornar rate limit, o usuário pode tentar novamente imediatamente
  // if (errorCode === 'over_email_send_rate_limit' || errorCode === 429 || 
  //     String(errorCode).includes('over_email_send_rate_limit')) {
  //   return 'Erro ao processar cadastro. Tente novamente.'
  // }

  // Mensagens de erro do Supabase Auth
  const errorTranslations: Record<string, string> = {
    // Erros de autenticação
    'Invalid login credentials': 'Credenciais inválidas. Verifique seu CPF/e-mail e senha.',
    'Email not confirmed': 'E-mail não confirmado. Verifique sua caixa de entrada.',
    'User already registered': 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.',
    'already registered': 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.',
    // Removido: Mensagens de rate limit que bloqueiam o usuário
    // 'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    // 'over_email_send_rate_limit': 'Limite de envio de e-mail excedido. Aguarde alguns segundos antes de tentar novamente.',
    // 'For security purposes, you can only request this after': 'Por segurança, você só pode solicitar isso após',
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
    'project is currently paused': 'O projeto Supabase está pausado há mais de 90 dias e não aceita conexões. Crie um novo projeto e configure a aplicação para usar o novo banco.',
    'cannot be restored through the dashboard': 'Este projeto Supabase não pode mais ser reativado pelo dashboard. Configure a aplicação para usar um novo projeto.',
  }

  // Verificar se há tradução direta
  for (const [key, translation] of Object.entries(errorTranslations)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return translation
    }
  }

  // Removido: Não exibir mensagens de rate limit que bloqueiam o usuário
  // Se houver rate limit, o usuário pode tentar novamente imediatamente
  // if (errorMessage.includes('over_email_send_rate_limit') || 
  //     errorMessage.includes('For security purposes, you can only request this after') ||
  //     errorMessage.toLowerCase().includes('rate limit') ||
  //     errorMessage.toLowerCase().includes('too many requests')) {
  //   return 'Erro ao processar cadastro. Tente novamente.'
  // }

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
    // Removido: Não bloquear usuário com mensagens de rate limit
    // if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('rate_limit')) {
    //   return 'Muitas tentativas de cadastro. Aguarde alguns segundos e tente novamente.'
    // }
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

  if (errorMessage.toLowerCase().includes('project is currently paused') ||
      errorMessage.toLowerCase().includes('cannot be restored through the dashboard') ||
      errorMessage.toLowerCase().includes('paused for over 90 days')) {
    return 'O projeto Supabase foi pausado por mais de 90 dias e não pode ser restaurado no dashboard. Crie um novo projeto e atualize as variáveis de ambiente para usar o novo banco.'
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
