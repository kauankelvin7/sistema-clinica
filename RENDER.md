# Render.com Configuration

Esta aplicação está configurada para deploy no Render.com (100% GRÁTIS).

## Configuração Automática

O Render detectará automaticamente:
- `build.sh` - Script de build
- `runtime.txt` - Versão do Python (3.13.3)
- `backend/requirements.txt` - Dependências

## Variáveis de Ambiente

Configure no painel do Render:

1. `DATABASE_URL` - Fornecido automaticamente pelo PostgreSQL do Render
2. `FRONTEND_URL` - URL do Vercel (ex: https://sistema-clinica.vercel.app)
3. `RENDER` - Definido automaticamente (detecta ambiente de produção)
4. `PYTHON_VERSION` - 3.13.3

## Comando de Start

```bash
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

## PostgreSQL Grátis

O Render oferece PostgreSQL grátis com:
- 90 dias de retenção
- 1GB de armazenamento
- Compartilhamento ilimitado de dados

## Limitações do Plano Grátis

- Servidor hiberna após 15 minutos de inatividade
- Primeiro acesso pode levar ~30 segundos para "acordar"
- 750 horas/mês de servidor (suficiente para uso 24/7)

## Deploy

1. Faça push para GitHub
2. Conecte repositório no Render
3. Configure variáveis de ambiente
4. Deploy automático!
