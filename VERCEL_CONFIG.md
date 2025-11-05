# Configuração de Variáveis de Ambiente no Vercel

## Passo a Passo:

1. Acesse seu projeto no Vercel: https://vercel.com/dashboard
2. Vá em **Settings** → **Environment Variables**
3. Adicione a variável:
   - **Name**: `VITE_API_URL`
   - **Value**: URL do seu backend (exemplo: `https://seu-backend.onrender.com`)
   - **Environment**: Marque `Production`, `Preview` e `Development`
4. Clique em **Save**
5. Faça **Redeploy** do projeto:
   - Vá em **Deployments**
   - Clique nos 3 pontinhos do último deployment
   - Clique em **Redeploy**

## URLs Importantes:

- **Frontend Vercel**: https://sistema-clinica-seven.vercel.app
- **Backend**: [Configure aqui a URL do seu backend]

## Nota:
Seu backend precisa estar rodando em um serviço de hospedagem (Render, Railway, etc.) 
para que o Vercel consiga acessá-lo. O backend em `localhost:8000` só funciona localmente.
