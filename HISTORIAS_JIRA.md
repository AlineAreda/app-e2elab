# Histórias de Usuário - E2E LAB

## 📋 EPIC 1: Autenticação e Gerenciamento de Usuários

### US-001: Login com CPF ou Email
**Como** um usuário  
**Eu quero** fazer login usando meu CPF ou email  
**Para que** eu possa acessar a plataforma de forma flexível

**Critérios de Aceitação:**
- O sistema deve aceitar login com CPF (formato: 000.000.000-00 ou apenas números)
- O sistema deve aceitar login com email
- O sistema deve validar automaticamente se o identificador é CPF ou email
- Se o usuário não existir, redirecionar para página de cadastro
- Exibir mensagens de erro traduzidas em português
- Validar campos obrigatórios antes de submeter

**Tecnologias:** Next.js, Supabase Auth, RPC function `get_user_email_by_cpf`

---

### US-002: Cadastro de Novos Usuários
**Como** um novo usuário  
**Eu quero** criar minha conta na plataforma  
**Para que** eu possa agendar exames

**Critérios de Aceitação:**
- Formulário deve coletar: Nome Completo, CPF, Email, Telefone, Data de Nascimento, Senha
- CPF deve ser validado (algoritmo de validação de CPF)
- CPF deve ser formatado automaticamente (000.000.000-00)
- Telefone deve ser formatado automaticamente ((00) 00000-0000)
- Senha deve ter no mínimo 6 caracteres
- Confirmar senha deve coincidir
- Email não pode estar duplicado
- Criar perfil automaticamente após cadastro no Supabase Auth
- Login automático após cadastro bem-sucedido
- Redirecionar para página de exames após cadastro

**Tecnologias:** Next.js, Supabase Auth, Tabela `profiles`

---

### US-003: Verificação Automática de Usuário Existente
**Como** um usuário  
**Eu quero** que o sistema verifique se meu CPF/email já está cadastrado  
**Para que** eu seja redirecionado automaticamente para cadastro se não existir

**Critérios de Aceitação:**
- Ao sair do campo de identificador (onBlur), verificar se usuário existe
- Se for CPF, usar RPC `get_user_email_by_cpf` para buscar email
- Se usuário não existir, redirecionar para página de cadastro com identificador pré-preenchido
- Exibir indicador de "Verificando..." durante a busca
- Não bloquear o usuário de tentar fazer login mesmo se a verificação falhar

**Tecnologias:** Supabase RPC, React hooks

---

### US-004: Recuperação de Senha
**Como** um usuário que esqueceu a senha  
**Eu quero** recuperar minha senha  
**Para que** eu possa acessar minha conta novamente

**Critérios de Aceitação:**
- Página/formulário de recuperação de senha
- Enviar email de recuperação via Supabase Auth
- Exibir mensagem de sucesso após envio
- Link de recuperação deve funcionar corretamente
- Validar formato de email antes de enviar

**Tecnologias:** Supabase Auth (resetPassword)

---

### US-005: Gerenciamento de Perfil do Usuário
**Como** um usuário autenticado  
**Eu quero** visualizar e editar meus dados pessoais  
**Para que** eu possa manter minhas informações atualizadas

**Critérios de Aceitação:**
- Visualizar dados do perfil (nome, CPF, email, telefone, data de nascimento)
- Editar informações (exceto CPF que é imutável)
- Validar dados antes de salvar
- Exibir mensagens de sucesso/erro
- Atualizar dados no Supabase

**Tecnologias:** Supabase, Tabela `profiles`

---

## 📋 EPIC 2: Catálogo de Exames

### US-006: Listagem de Exames Disponíveis
**Como** um usuário autenticado  
**Eu quero** ver todos os exames disponíveis  
**Para que** eu possa escolher qual exame desejo agendar

**Critérios de Aceitação:**
- Exibir exames em grid responsivo (3 colunas desktop, 2 tablet, 1 mobile)
- Cada card deve mostrar: Nome, Categoria, Descrição, Duração, Preço
- Ordenar exames por nome (alfabético)
- Exibir apenas exames ativos (`active = true`)
- Botão "Ver Detalhes" em cada card
- Loading state durante carregamento
- Mensagem quando não houver exames

**Tecnologias:** Next.js, Supabase, Tabela `exams`

---

### US-007: Busca de Exames
**Como** um usuário autenticado  
**Eu quero** buscar exames por nome, descrição ou categoria  
**Para que** eu encontre rapidamente o exame que procuro

**Critérios de Aceitação:**
- Campo de busca com ícone de lupa
- Busca deve funcionar a partir de 3 caracteres
- Buscar em: nome, descrição e categoria
- Busca case-insensitive
- Exibir mensagem quando busca tiver menos de 3 caracteres
- Exibir mensagem quando nenhum resultado for encontrado
- Botão para limpar busca
- Resultados atualizados em tempo real

**Tecnologias:** React useMemo, Filtros client-side

---

### US-008: Detalhes do Exame
**Como** um usuário autenticado  
**Eu quero** ver informações detalhadas de um exame  
**Para que** eu possa entender melhor o exame antes de agendar

**Critérios de Aceitação:**
- Exibir: Nome, Categoria, Descrição completa, Duração, Preço
- Exibir informações de preparo (se houver)
- Exibir alerta de jejum necessário (se aplicável) com horas de jejum
- Botão "Agendar Exame" que leva para página de agendamento
- Botão "Voltar" para retornar à listagem
- Loading state durante carregamento
- Tratamento de erro se exame não for encontrado

**Tecnologias:** Next.js Dynamic Routes, Supabase

---

### US-009: Categorização de Exames
**Como** um usuário autenticado  
**Eu quero** ver exames organizados por categoria  
**Para que** eu encontre exames similares mais facilmente

**Critérios de Aceitação:**
- Exibir categoria em cada card de exame
- Filtrar exames por categoria (futuro)
- Agrupar exames por categoria (futuro)

**Tecnologias:** Supabase, Campo `category` na tabela `exams`

---

## 📋 EPIC 3: Sistema de Agendamentos

### US-010: Agendamento de Exames
**Como** um usuário autenticado  
**Eu quero** agendar um exame selecionando unidade, data e horário  
**Para que** eu possa realizar meu exame no local e horário desejados

**Critérios de Aceitação:**
- Selecionar unidade de uma lista (dropdown)
- Exibir informações da unidade selecionada (nome, endereço, cidade, telefone)
- Selecionar data (próximos 30 dias, excluindo domingos)
- Selecionar horário disponível (baseado no dia da semana)
- Exibir preço total do exame
- Botão "Confirmar Agendamento" desabilitado até todos os campos estarem preenchidos
- Criar registro na tabela `appointments` com status 'scheduled'
- Exibir toast de sucesso após agendamento
- Redirecionar para página "Meus Agendamentos" após sucesso
- Validar que usuário está autenticado

**Tecnologias:** Supabase, Tabela `appointments`, date-fns, Sonner (toast)

---

### US-011: Visualização de Agendamentos
**Como** um usuário autenticado  
**Eu quero** ver todos os meus agendamentos  
**Para que** eu possa acompanhar meus exames agendados

**Critérios de Aceitação:**
- Listar todos os agendamentos do usuário autenticado
- Exibir para cada agendamento: Nome do exame, Data formatada, Horário, Unidade, Status, Preço
- Ordenar por data (mais próximos primeiro)
- Exibir badge de status com cores diferentes (Agendado=azul, Concluído=verde, Cancelado=vermelho)
- Botão "Cancelar" para agendamentos com status 'scheduled'
- Mensagem quando não houver agendamentos
- Link para ver exames disponíveis quando não houver agendamentos
- Loading state durante carregamento

**Tecnologias:** Supabase JOIN (appointments, exams, units), date-fns

---

### US-012: Cancelamento de Agendamentos
**Como** um usuário autenticado  
**Eu quero** cancelar um agendamento  
**Para que** eu possa desmarcar um exame quando necessário

**Critérios de Aceitação:**
- Botão "Cancelar" visível apenas para agendamentos com status 'scheduled'
- Confirmar cancelamento com dialog de confirmação
- Atualizar status do agendamento para 'cancelled'
- Exibir toast de sucesso após cancelamento
- Atualizar lista de agendamentos sem recarregar página
- Validar que o agendamento pertence ao usuário autenticado

**Tecnologias:** Supabase UPDATE, Sonner (toast)

---

### US-013: Status de Agendamentos
**Como** um usuário autenticado  
**Eu quero** ver o status dos meus agendamentos  
**Para que** eu saiba o estado atual de cada exame

**Critérios de Aceitação:**
- Status possíveis: 'scheduled', 'completed', 'cancelled'
- Exibir badge colorido para cada status
- Traduzir status para português (Agendado, Concluído, Cancelado)
- Status deve ser atualizado automaticamente quando necessário

**Tecnologias:** Enum/Status na tabela `appointments`

---

## 📋 EPIC 4: Gestão de Unidades e Horários

### US-014: Listagem de Unidades Disponíveis
**Como** um usuário autenticado  
**Eu quero** ver todas as unidades disponíveis  
**Para que** eu possa escolher a unidade mais próxima

**Critérios de Aceitação:**
- Exibir apenas unidades ativas (`active = true`)
- Ordenar unidades por cidade
- Exibir informações: Nome, Cidade, Endereço, Bairro, Telefone (se disponível)
- Exibir unidades na página inicial (landing page)
- Exibir unidades no formulário de agendamento

**Tecnologias:** Supabase, Tabela `units`

---

### US-015: Seleção de Unidade no Agendamento
**Como** um usuário autenticado  
**Eu quero** selecionar uma unidade ao agendar um exame  
**Para que** eu possa escolher o local mais conveniente

**Critérios de Aceitação:**
- Dropdown com todas as unidades ativas
- Exibir nome da unidade como título
- Exibir endereço completo como subtítulo
- Após seleção, exibir card com informações completas da unidade
- Ícone de localização (MapPin)
- Campo obrigatório

**Tecnologias:** shadcn/ui Select component

---

### US-016: Geração de Horários Disponíveis
**Como** um usuário autenticado  
**Eu quero** ver apenas os horários disponíveis para agendamento  
**Para que** eu escolha um horário que realmente está livre

**Critérios de Aceitação:**
- Segunda a Sexta: horários de 07:00 às 18:30 (intervalos de 30 minutos)
- Sábado: horários de 07:00 às 11:30 (intervalos de 30 minutos)
- Domingo: não permitir agendamento
- Exibir apenas horários disponíveis (não ocupados)
- Gerar horários apenas após seleção de data
- Atualizar horários quando data mudar
- Exibir mensagem quando não houver horários disponíveis

**Tecnologias:** JavaScript Date, Lógica de geração de slots

---

### US-017: Validação de Disponibilidade de Horários
**Como** um sistema  
**Eu quero** validar a disponibilidade real de horários  
**Para que** não haja conflitos de agendamento

**Critérios de Aceitação:**
- Verificar agendamentos existentes na mesma unidade, data e horário
- Não permitir agendamento em horário já ocupado
- Considerar duração do exame ao verificar disponibilidade
- Atualizar disponibilidade em tempo real

**Tecnologias:** Supabase queries, Validação server-side (futuro)

---

## 📋 EPIC 5: APIs e Integrações

### US-018: API para Deletar Usuários
**Como** um administrador/testador  
**Eu quero** deletar usuários via API  
**Para que** eu possa limpar dados de teste

**Critérios de Aceitação:**
- Endpoint: `DELETE /api/users/delete`
- Aceitar email via query parameter ou body JSON
- Validar formato de email
- Deletar perfil da tabela `profiles`
- Deletar agendamentos relacionados
- Deletar usuário do Supabase Auth
- Retornar resposta JSON com sucesso/erro
- Usar `SUPABASE_SERVICE_ROLE_KEY` para operações administrativas
- Retornar 400 para email inválido
- Retornar 404 para usuário não encontrado
- Retornar 500 para erros internos

**Tecnologias:** Next.js API Routes, Supabase Admin API

---

### US-019: Documentação Swagger/OpenAPI
**Como** um desenvolvedor  
**Eu quero** acessar documentação da API  
**Para que** eu entenda os endpoints disponíveis

**Critérios de Aceitação:**
- Rota `/api-docs` com interface Swagger UI
- Documentar endpoint de deletar usuários
- Incluir exemplos de requisição e resposta
- Documentar códigos de status HTTP

**Tecnologias:** swagger-jsdoc, swagger-ui-react

---

### US-020: Integração com Supabase
**Como** um sistema  
**Eu quero** integrar com Supabase para todas as operações de dados  
**Para que** eu tenha um backend robusto e seguro

**Critérios de Aceitação:**
- Configurar cliente Supabase (client-side e server-side)
- Implementar Row Level Security (RLS) nas tabelas
- Criar funções RPC necessárias (`get_user_email_by_cpf`)
- Configurar triggers para criar perfis automaticamente
- Gerenciar autenticação via Supabase Auth
- Configurar variáveis de ambiente corretamente

**Tecnologias:** Supabase, PostgreSQL, RLS Policies

---

## 📋 EPIC 6: Interface e Experiência do Usuário

### US-021: Página Inicial (Landing Page)
**Como** um visitante  
**Eu quero** ver uma página inicial atrativa  
**Para que** eu entenda o propósito da plataforma

**Critérios de Aceitação:**
- Hero section com call-to-action
- Seção de funcionalidades (Agendamento Online, Resultados Digitais, Atendimento de Qualidade)
- Seção de benefícios
- Lista de unidades disponíveis
- Botão para agendar exame (redireciona para login se não autenticado)
- Design responsivo e moderno
- Footer com links legais

**Tecnologias:** Next.js, Tailwind CSS, shadcn/ui

---

### US-022: Header e Navegação
**Como** um usuário  
**Eu quero** ter navegação clara na plataforma  
**Para que** eu possa acessar facilmente as funcionalidades

**Critérios de Aceitação:**
- Header fixo no topo
- Logo da E2ELAB
- Menu de navegação (Exames, Meus Agendamentos)
- Botão de login/logout baseado no estado de autenticação
- Exibir nome do usuário quando autenticado
- Design responsivo (menu hamburger em mobile)

**Tecnologias:** Next.js, React Context (AuthProvider)

---

### US-023: Páginas Legais (Termos e Privacidade)
**Como** um usuário  
**Eu quero** acessar termos de uso e política de privacidade  
**Para que** eu entenda os direitos e deveres

**Critérios de Aceitação:**
- Página `/terms` com termos de uso
- Página `/privacy` com política de privacidade
- Links no footer da página inicial
- Conteúdo em português

**Tecnologias:** Next.js Pages

---

### US-024: Tratamento de Erros e Mensagens
**Como** um usuário  
**Eu quero** ver mensagens de erro claras e em português  
**Para que** eu entenda o que aconteceu e como resolver

**Critérios de Aceitação:**
- Traduzir todos os erros do Supabase para português
- Mensagens específicas para cada tipo de erro
- Exibir erros em componentes visuais (toast, alert)
- Mensagens de sucesso após ações bem-sucedidas
- Loading states durante operações assíncronas

**Tecnologias:** lib/error-messages.ts, Sonner (toast)

---

### US-025: Design Responsivo
**Como** um usuário  
**Eu quero** acessar a plataforma em qualquer dispositivo  
**Para que** eu possa usar a plataforma onde estiver

**Critérios de Aceitação:**
- Layout responsivo para mobile, tablet e desktop
- Componentes adaptáveis (grid de 3 colunas → 2 → 1)
- Menu mobile com hamburger
- Formulários otimizados para mobile
- Touch-friendly (botões e áreas de toque adequadas)

**Tecnologias:** Tailwind CSS, Responsive Design

---

## 📋 EPIC 7: Melhorias e Funcionalidades Futuras

### US-026: Notificações por Email
**Como** um usuário  
**Eu quero** receber emails de confirmação e lembretes  
**Para que** eu não esqueça dos meus agendamentos

**Critérios de Aceitação:**
- Email de confirmação ao agendar
- Email de lembrete 24h antes do exame
- Email de cancelamento quando cancelar
- Templates de email em português

**Tecnologias:** Supabase Edge Functions, Email service

---

### US-027: Resultados de Exames
**Como** um usuário  
**Eu quero** visualizar meus resultados de exames  
**Para que** eu tenha acesso aos resultados digitalmente

**Critérios de Aceitação:**
- Upload de resultados pelo laboratório
- Visualização de resultados em PDF
- Histórico de resultados
- Download de resultados

**Tecnologias:** Supabase Storage, PDF viewer

---

### US-028: Pagamento Online
**Como** um usuário  
**Eu quero** pagar pelo exame online  
**Para que** eu complete o agendamento sem precisar pagar no local

**Critérios de Aceitação:**
- Integração com gateway de pagamento
- Múltiplas formas de pagamento (cartão, PIX)
- Confirmação de pagamento
- Recibo digital

**Tecnologias:** Payment gateway (Stripe, Mercado Pago, etc)

---

### US-029: Avaliação de Atendimento
**Como** um usuário  
**Eu quero** avaliar o atendimento após o exame  
**Para que** eu possa dar feedback sobre minha experiência

**Critérios de Aceitação:**
- Formulário de avaliação após exame concluído
- Sistema de estrelas (1-5)
- Campo de comentários
- Salvar avaliação no banco de dados

**Tecnologias:** Supabase, Formulário de avaliação

---

## 📊 Resumo de Prioridades

### Alta Prioridade (MVP)
- US-001, US-002, US-006, US-007, US-008, US-010, US-011, US-012, US-014, US-015, US-016, US-021, US-022, US-024

### Média Prioridade
- US-003, US-004, US-005, US-009, US-013, US-017, US-023, US-025

### Baixa Prioridade (Futuro)
- US-018, US-019, US-020, US-026, US-027, US-028, US-029

---

## 🔧 Informações Técnicas Importantes

### Tabelas do Banco de Dados
- `profiles` - Perfis de usuários
- `exams` - Catálogo de exames
- `appointments` - Agendamentos
- `units` - Unidades do laboratório

### Funções RPC
- `get_user_email_by_cpf(cpf_param)` - Busca email pelo CPF

### Tecnologias Principais
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase (Auth + Database)
- date-fns
- Sonner (toast notifications)

### Variáveis de Ambiente
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

