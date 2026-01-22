# 🔑 Como Obter as Variáveis de Ambiente do Supabase

Este guia mostra exatamente onde encontrar cada variável de ambiente necessária para o projeto.

## 📍 Onde Encontrar no Supabase

### Passo 1: Acesse o Dashboard do Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto **E2ELAB** (ou o nome do seu projeto)

### Passo 2: Acesse as Configurações da API

1. No menu lateral esquerdo, clique em **Settings** (⚙️ Configurações)
2. Clique em **API** no submenu

### Passo 3: Encontre as Credenciais

Na página de API, você verá várias seções. Aqui estão as variáveis que você precisa:

## 🔐 Variáveis Necessárias

### 1. `NEXT_PUBLIC_SUPABASE_URL`

**Onde encontrar:**
- Na seção **Project URL**
- Exemplo: `https://xxxxxxxxxxxxx.supabase.co`
- **Copie este valor completo**

**Como usar:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
```

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Onde encontrar:**
- Na seção **Project API keys**
- Procure pela chave com o rótulo **`anon`** e **`public`**
- É a chave que começa com `eyJhbGc...` (é uma string longa)
- **⚠️ Esta é a chave pública (anon) - pode ser exposta no cliente**

**Como usar:**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwMDAwMDAwLCJleHAiOjE5NTU1NTU1NTV9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. `SUPABASE_SERVICE_ROLE_KEY`

**Onde encontrar:**
- Na mesma seção **Project API keys**
- Procure pela chave com o rótulo **`service_role`** e **`secret`**
- **⚠️ ATENÇÃO: Esta é uma chave SECRETA - NUNCA exponha no cliente!**
- Clique em **Reveal** para mostrar a chave (ela está oculta por padrão)
- É uma string longa que também começa com `eyJhbGc...`

**Como usar:**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTU1NTU1NX0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 📋 Resumo Visual

```
Supabase Dashboard
├── Settings (⚙️)
    └── API
        ├── Project URL → NEXT_PUBLIC_SUPABASE_URL
        └── Project API keys
            ├── anon public → NEXT_PUBLIC_SUPABASE_ANON_KEY
            └── service_role secret → SUPABASE_SERVICE_ROLE_KEY
```

## ✅ Onde Configurar na Vercel

1. Acesse [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto **app-e2elab**
3. Vá em **Settings** > **Environment Variables**
4. Adicione cada variável:
   - Clique em **Add New**
   - Digite o **Name** (ex: `NEXT_PUBLIC_SUPABASE_URL`)
   - Cole o **Value** (o valor que você copiou do Supabase)
   - Marque os ambientes: **Production**, **Preview**, **Development**
   - Clique em **Save**
5. Repita para as outras 2 variáveis

## 🔒 Segurança

- ✅ `NEXT_PUBLIC_*` - Podem ser expostas no cliente (são públicas)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - **NUNCA** exponha no cliente! Use apenas em rotas de API server-side

## 🧪 Testar Localmente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

**Importante:** O arquivo `.env.local` está no `.gitignore` e não será commitado no Git.

## ❓ Problemas Comuns

### "Invalid supabaseUrl"
- Verifique se copiou a URL completa (começa com `https://`)
- Não deve ter espaços ou quebras de linha

### "Invalid API key"
- Verifique se copiou a chave completa (são strings muito longas)
- Certifique-se de que não há espaços extras

### "Permission denied"
- Verifique se está usando a chave correta (anon para cliente, service_role para API)
- Verifique as políticas RLS no Supabase

## 📧 Cadastro sem confirmação de e-mail (apenas salvar no banco)

**Para cadastrar usuários e salvar no banco sem enviar e-mail de confirmação**, desabilite a confirmação no Supabase:

1. Acesse o Dashboard do Supabase
2. Vá em **Settings** (⚙️) > **Authentication**
3. Role até a seção **Email Auth**
4. Localize **Enable email confirmations** ou **Confirm email**
5. **Desabilite** a opção (toggle OFF)
6. Clique em **Save**

Com isso desabilitado, o cadastro **apenas cria o usuário e o perfil no banco**; nenhum e-mail é enviado. O usuário pode fazer login imediatamente após o cadastro.
