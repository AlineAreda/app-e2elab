# E2ELAB - Plataforma de Agendamentos de Exames

Plataforma completa para agendamento de exames médicos, desenvolvida com Next.js 14 (App Router), TypeScript, Tailwind CSS e Supabase.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Supabase** - Backend e autenticação
- **date-fns** - Manipulação de datas

## 📋 Funcionalidades

- ✅ Autenticação de usuários (login/cadastro)
- ✅ Listagem de exames disponíveis
- ✅ Detalhes de cada exame
- ✅ Agendamento de exames com seleção de data e horário
- ✅ Visualização de agendamentos do usuário
- ✅ Cancelamento de agendamentos

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <repo-url>
cd e2e-lab
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.local.example .env.local
```

Edite o arquivo `.env.local` e adicione suas credenciais do Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase (opcional, recomendado para deletar usuários)
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
e2e-lab/
├── app/
│   ├── exams/
│   │   ├── [id]/
│   │   │   └── page.tsx          # Detalhes do exame
│   │   └── page.tsx              # Lista de exames
│   ├── login/
│   │   └── page.tsx              # Página de login
│   ├── me/
│   │   └── appointments/
│   │       └── page.tsx          # Meus agendamentos
│   ├── schedule/
│   │   └── [examId]/
│   │       └── page.tsx          # Agendamento
│   ├── layout.tsx                # Layout principal
│   ├── page.tsx                  # Página inicial (redireciona)
│   └── globals.css               # Estilos globais
├── components/
│   ├── ui/                       # Componentes shadcn/ui
│   ├── AuthProvider.tsx          # Provider de autenticação
│   └── Header.tsx                # Cabeçalho
└── lib/
    ├── supabase.ts               # Cliente Supabase (client)
    ├── supabase-server.ts        # Cliente Supabase (server)
    └── utils.ts                  # Utilitários
```

## 🔐 Autenticação

O projeto utiliza Supabase Auth para gerenciar autenticação. O `AuthProvider` verifica automaticamente se o usuário está autenticado e redireciona para `/login` se não estiver.

## 🔌 API Routes

### Deletar Usuário por E-mail

Rota para deletar usuário pelo e-mail (usada pelo time de testes via Postman).

**Endpoint:** `DELETE /api/users/delete`

**Parâmetros:**
- Query parameter: `email` (opcional)
- Body (JSON): `{ "email": "usuario@exemplo.com" }` (opcional)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Usuário deletado com sucesso",
  "deletedUserId": "uuid-do-usuario",
  "deletedEmail": "usuario@exemplo.com"
}
```

**Respostas de Erro:**
- `400` - E-mail inválido ou ausente
- `404` - Usuário não encontrado
- `500` - Erro interno do servidor

**Exemplo de uso no Postman:**

**Opção 1 - Query Parameter:**
1. Método: `DELETE`
2. URL: `http://localhost:3000/api/users/delete?email=teste@exemplo.com`

**Opção 2 - Body (JSON):**
1. Método: `DELETE`
2. URL: `http://localhost:3000/api/users/delete`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "email": "teste@exemplo.com"
}
```

**Nota:** Para deletar usuários, é recomendado configurar a variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` no arquivo `.env.local`. Caso contrário, a rota usará a chave anônima (pode ter limitações).

## 🚀 Deploy

### Deploy na Vercel (Frontend)

A Vercel oferece hospedagem gratuita para projetos Next.js. Siga os passos:

1. **Crie uma conta na Vercel** (se ainda não tiver):
   - Acesse [https://vercel.com](https://vercel.com)
   - Faça login com sua conta GitHub

2. **Importe o projeto**:
   - Clique em "Add New Project"
   - Selecione o repositório `AlineAreda/app-e2elab`
   - A Vercel detectará automaticamente que é um projeto Next.js

3. **Configure as variáveis de ambiente**:
   Na seção "Environment Variables", adicione:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase
   ```

4. **Deploy**:
   - Clique em "Deploy"
   - Aguarde o build completar (geralmente 2-3 minutos)
   - Sua aplicação estará disponível em uma URL como: `https://app-e2elab.vercel.app`

5. **Configurações adicionais** (opcional):
   - Domínio customizado: Vercel permite adicionar seu próprio domínio
   - Deploy automático: Cada push na branch `main` fará deploy automático

### Supabase (Backend)

O Supabase já está configurado como backend. Para garantir que está funcionando:

1. **Acesse o Dashboard do Supabase**:
   - Vá para [https://supabase.com](https://supabase.com)
   - Faça login no seu projeto

2. **Verifique as configurações**:
   - **URL do Projeto**: Encontre em Settings > API > Project URL
   - **Anon Key**: Encontre em Settings > API > Project API keys > `anon` `public`
   - **Service Role Key**: Encontre em Settings > API > Project API keys > `service_role` `secret`

3. **Configure as variáveis de ambiente na Vercel**:
   Use as credenciais do seu projeto Supabase nas variáveis de ambiente da Vercel

4. **Banco de Dados**:
   - Certifique-se de que todas as tabelas estão criadas (`profiles`, `exams`, `appointments`, `units`)
   - Verifique as políticas RLS (Row Level Security)
   - Confirme que as funções RPC estão criadas (ex: `get_user_email_by_cpf`)

### Variáveis de Ambiente Necessárias

Crie um arquivo `.env.local` localmente ou configure na Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

**Importante**: 
- `NEXT_PUBLIC_*` são variáveis públicas e podem ser acessadas no cliente
- `SUPABASE_SERVICE_ROLE_KEY` é privada e só deve ser usada em rotas de API server-side
- Nunca commite arquivos `.env` ou `.env.local` no Git

## 📝 Próximos Passos

Para produção, você precisará:

1. Configurar o banco de dados no Supabase com as tabelas:
   - `exams` - Tabela de exames
   - `appointments` - Tabela de agendamentos
   - Configurar políticas RLS (Row Level Security)

2. Implementar as queries reais no Supabase substituindo os dados mockados

3. Adicionar tratamento de erros mais robusto

4. Implementar notificações por email

5. Adicionar testes

## 📄 Licença

MIT


## Usuário de testes (acesso direto)

Para criar um usuário fixo de testes no seu projeto Supabase e conseguir entrar direto na aplicação, rode:

```bash
SUPABASE_URL="https://seu-projeto.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key" \
npm run seed:test-user
```

Credenciais padrão criadas (podem ser sobrescritas por variáveis de ambiente):

- `TEST_USER_EMAIL=teste.e2elab@example.com`
- `TEST_USER_PASSWORD=Teste@123456`
- `TEST_USER_CPF=12345678901`
- `TEST_USER_NAME=Usuário de Testes E2ELAB`

Exemplo com sobrescrita:

```bash
SUPABASE_URL="https://seu-projeto.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key" \
TEST_USER_EMAIL="qa@empresa.com" \
TEST_USER_PASSWORD="Senha@123456" \
npm run seed:test-user
```
