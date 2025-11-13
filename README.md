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

