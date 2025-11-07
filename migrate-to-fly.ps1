# 🚀 Script de Migração Automática: Render → Fly.io
# Execute cada seção uma por vez, seguindo as instruções

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  MIGRAÇÃO RENDER → FLY.IO" -ForegroundColor Yellow
Write-Host "  Sistema Clínica Homologação" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ========================================
# ETAPA 1: PRÉ-REQUISITOS
# ========================================
Write-Host "[1/9] Verificando pré-requisitos..." -ForegroundColor Yellow

# Verificar se Fly CLI está instalado
if (!(Get-Command fly -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Fly CLI não encontrado!" -ForegroundColor Red
    Write-Host "Instalando Fly CLI..." -ForegroundColor Yellow
    iwr https://fly.io/install.ps1 -useb | iex
    Write-Host "✅ Fly CLI instalado! FECHE e REABRA o PowerShell." -ForegroundColor Green
    exit
} else {
    Write-Host "✅ Fly CLI encontrado!" -ForegroundColor Green
}

# ========================================
# ETAPA 2: LOGIN NO FLY.IO
# ========================================
Write-Host ""
Write-Host "[2/9] Fazendo login no Fly.io..." -ForegroundColor Yellow
fly auth login

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no login. Execute novamente." -ForegroundColor Red
    exit
}

# ========================================
# ETAPA 3: BACKUP DO RENDER (MANUAL)
# ========================================
Write-Host ""
Write-Host "[3/9] BACKUP DOS DADOS DO RENDER" -ForegroundColor Yellow
Write-Host "⚠️  IMPORTANTE: Faça backup ANTES de continuar!" -ForegroundColor Red
Write-Host ""
Write-Host "Opção 1 - Via Render Dashboard:" -ForegroundColor Cyan
Write-Host "  1. Acesse: https://dashboard.render.com" -ForegroundColor White
Write-Host "  2. Selecione seu Database PostgreSQL" -ForegroundColor White
Write-Host "  3. Clique em 'Backups'" -ForegroundColor White
Write-Host "  4. 'Create Backup Now'" -ForegroundColor White
Write-Host "  5. Aguarde e faça download do .sql" -ForegroundColor White
Write-Host ""
Write-Host "Opção 2 - Via pg_dump (mais rápido):" -ForegroundColor Cyan
Write-Host "  pg_dump 'sua_database_url_do_render' > backups/backup_render.sql" -ForegroundColor White
Write-Host ""

$confirmBackup = Read-Host "Você JÁ FEZ o backup? (s/n)"
if ($confirmBackup -ne "s") {
    Write-Host "❌ Faça o backup primeiro e execute novamente!" -ForegroundColor Red
    exit
}
Write-Host "✅ Backup confirmado!" -ForegroundColor Green

# ========================================
# ETAPA 4: CRIAR APP NO FLY.IO
# ========================================
Write-Host ""
Write-Host "[4/9] Criando app no Fly.io..." -ForegroundColor Yellow
Write-Host "ℹ️  Quando perguntar, responda:" -ForegroundColor Cyan
Write-Host "   - App name: sistema-clinica-api" -ForegroundColor White
Write-Host "   - Region: gru (São Paulo)" -ForegroundColor White
Write-Host "   - PostgreSQL: Yes" -ForegroundColor White
Write-Host "   - Configuration: Development" -ForegroundColor White
Write-Host "   - Redis: No" -ForegroundColor White
Write-Host ""

Set-Location backend
fly launch --no-deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao criar app. Verifique os logs." -ForegroundColor Red
    exit
}

# ========================================
# ETAPA 5: CONFIGURAR SECRETS
# ========================================
Write-Host ""
Write-Host "[5/9] Configurando variáveis de ambiente..." -ForegroundColor Yellow

# Frontend URL
fly secrets set FRONTEND_URL=https://sistema-clinica-seven.vercel.app

Write-Host "✅ Secrets configurados!" -ForegroundColor Green

# ========================================
# ETAPA 6: IMPORTAR DADOS (MANUAL)
# ========================================
Write-Host ""
Write-Host "[6/9] IMPORTAÇÃO DOS DADOS" -ForegroundColor Yellow
Write-Host "⚠️  Agora vamos importar os dados do Render para o Fly.io" -ForegroundColor Red
Write-Host ""
Write-Host "Execute os seguintes comandos EM OUTRO TERMINAL:" -ForegroundColor Cyan
Write-Host ""
Write-Host "# 1. Criar proxy para o banco Fly.io" -ForegroundColor White
Write-Host "fly proxy 5432 -a sistema-clinica-api-db" -ForegroundColor Yellow
Write-Host ""
Write-Host "# 2. Em OUTRO PowerShell, importar dados:" -ForegroundColor White
Write-Host "cd C:\Users\Kauan\Desktop\sistema_clinica_homologacao\backups" -ForegroundColor Yellow
Write-Host "psql 'postgresql://postgres:senha@localhost:5432/sistema_clinica_api' < backup_render.sql" -ForegroundColor Yellow
Write-Host ""
Write-Host "# 3. Verificar dados importados:" -ForegroundColor White
Write-Host "fly postgres connect -a sistema-clinica-api-db" -ForegroundColor Yellow
Write-Host "SELECT COUNT(*) FROM pacientes;" -ForegroundColor Yellow
Write-Host "SELECT COUNT(*) FROM medicos;" -ForegroundColor Yellow
Write-Host "\q" -ForegroundColor Yellow
Write-Host ""

$confirmImport = Read-Host "Você JÁ IMPORTOU os dados? (s/n)"
if ($confirmImport -ne "s") {
    Write-Host "⚠️  Importe os dados e execute novamente a partir daqui!" -ForegroundColor Yellow
    exit
}
Write-Host "✅ Dados importados!" -ForegroundColor Green

# ========================================
# ETAPA 7: DEPLOY NO FLY.IO
# ========================================
Write-Host ""
Write-Host "[7/9] Fazendo deploy no Fly.io..." -ForegroundColor Yellow
Write-Host "⏳ Isso pode levar 2-3 minutos..." -ForegroundColor Cyan

fly deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy realizado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no deploy. Verifique os logs com: fly logs" -ForegroundColor Red
    exit
}

# ========================================
# ETAPA 8: VERIFICAR DEPLOY
# ========================================
Write-Host ""
Write-Host "[8/9] Verificando status do app..." -ForegroundColor Yellow

fly status

Write-Host ""
Write-Host "URL da sua API:" -ForegroundColor Cyan
fly info | Select-String "Hostname"

# ========================================
# ETAPA 9: PRÓXIMOS PASSOS
# ========================================
Write-Host ""
Write-Host "[9/9] MIGRAÇÃO CONCLUÍDA! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Testar API:" -ForegroundColor Yellow
Write-Host "   fly open /api/health" -ForegroundColor White
Write-Host ""
Write-Host "2. Ver logs:" -ForegroundColor Yellow
Write-Host "   fly logs" -ForegroundColor White
Write-Host ""
Write-Host "3. Atualizar Vercel:" -ForegroundColor Yellow
Write-Host "   - Acesse: https://vercel.com/seu-projeto/settings" -ForegroundColor White
Write-Host "   - Environment Variables → VITE_API_URL" -ForegroundColor White
Write-Host "   - Mude para: https://sistema-clinica-api.fly.dev" -ForegroundColor White
Write-Host "   - Redeploy do frontend" -ForegroundColor White
Write-Host ""
Write-Host "4. Testar sistema completo:" -ForegroundColor Yellow
Write-Host "   - Abra o frontend" -ForegroundColor White
Write-Host "   - Gere um atestado" -ForegroundColor White
Write-Host "   - Verifique se os dados aparecem" -ForegroundColor White
Write-Host ""
Write-Host "5. Se tudo funcionar, pode desligar o Render! ✅" -ForegroundColor Green
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  COMANDOS ÚTEIS:" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ver status:        fly status" -ForegroundColor White
Write-Host "Ver logs:          fly logs" -ForegroundColor White
Write-Host "Abrir dashboard:   fly dashboard" -ForegroundColor White
Write-Host "SSH no container:  fly ssh console" -ForegroundColor White
Write-Host "Redeploy:          fly deploy" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Migração completa! Boa sorte!" -ForegroundColor Green
