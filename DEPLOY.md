# 🚀 Guia de Deploy - E2ELAB

Este guia explica como fazer deploy do projeto E2ELAB na Vercel (frontend) e configurar o Supabase (backend).

## 📋 Pré-requisitos

- Conta no GitHub (já configurada ✅)
- Conta na Vercel (gratuita)
- Projeto no Supabase (já configurado ✅)

## 🔧 Passo 1: Configurar Supabase

### 1.1 Obter Credenciais do Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie as seguintes informações:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Chave pública anônima
   - **service_role secret key**: Chave secreta (mantenha privada!)

### 1.2 Verificar Banco de Dados

Certifique-se de que as seguintes tabelas existem:
- ✅ `profiles` - Perfis de usuários
- ✅ `exams` - Exames disponíveis
- ✅ `appointments` - Agendamentos
- ✅ `units` - Unidades do laboratório

## 🌐 Passo 2: Deploy na Vercel

### 2.1 Criar Conta e Conectar GitHub

1. Acesse [https://vercel.com](https://vercel.com)
2. Clique em **Sign Up** e faça login com sua conta GitHub
3. Autorize a Vercel a acessar seus repositórios

### 2.2 Importar Projeto

1. No dashboard da Vercel, clique em **Add New Project**
2. Selecione o repositório **AlineAreda/app-e2elab**
3. A Vercel detectará automaticamente:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 2.3 Configurar Variáveis de Ambiente

Na seção **Environment Variables**, adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sua URL do Supabase | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sua chave anon do Supabase | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Sua chave service_role do Supabase | Production, Preview, Development |

**Importante**: 
- Marque todas as opções (Production, Preview, Development)
- A `SUPABASE_SERVICE_ROLE_KEY` é sensível - mantenha privada!

### 2.4 Fazer Deploy

1. Clique em **Deploy**
2. Aguarde o build completar (2-3 minutos)
3. Quando concluído, você receberá uma URL como: `https://app-e2elab.vercel.app`

### 2.5 Verificar Deploy

1. Acesse a URL fornecida pela Vercel
2. Teste as funcionalidades:
   - ✅ Página inicial carrega
   - ✅ Login funciona
   - ✅ Cadastro funciona
   - ✅ Listagem de exames funciona
   - ✅ Agendamento funciona

## 🔄 Deploy Automático

A Vercel faz deploy automático sempre que você fizer push na branch `main`:

```bash
git add .
git commit -m "Sua mensagem"
git push origin main
```

O deploy será iniciado automaticamente e você receberá uma notificação quando concluir.

## 🌍 Domínio Customizado (Opcional)

1. No dashboard da Vercel, vá em **Settings** > **Domains**
2. Adicione seu domínio customizado
3. Siga as instruções para configurar DNS

## 📊 Monitoramento

- **Analytics**: Vercel oferece analytics básico no plano gratuito
- **Logs**: Acesse logs em tempo real no dashboard
- **Performance**: Métricas de performance disponíveis

## 🐛 Troubleshooting

### Build falha
- Verifique os logs na Vercel
- Certifique-se de que todas as variáveis de ambiente estão configuradas
- Verifique se `package.json` está correto

### Erro de conexão com Supabase
- Verifique se as variáveis de ambiente estão corretas
- Confirme que a URL do Supabase está correta
- Verifique se as políticas RLS permitem acesso

### Imagens não carregam
- Verifique se os arquivos SVG estão na pasta `public/`
- Confirme que os caminhos estão corretos

## 📝 Checklist de Deploy

- [ ] Credenciais do Supabase obtidas
- [ ] Tabelas do banco de dados criadas
- [ ] Conta Vercel criada
- [ ] Projeto importado na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Aplicação testada e funcionando
- [ ] URL de produção anotada

## 🎉 Pronto!

Seu projeto está no ar! Compartilhe a URL com sua equipe e comece a usar.

