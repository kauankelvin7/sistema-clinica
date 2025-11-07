# Script de Backup Automatico do Render
# Execute este script para fazer backup antes de migrar

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  BACKUP DO RENDER" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Python esta disponivel
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Erro: Python nao encontrado!" -ForegroundColor Red
    exit
}

Write-Host "Para fazer o backup, voce precisa da DATABASE_URL do Render" -ForegroundColor Yellow
Write-Host ""
Write-Host "Como pegar:" -ForegroundColor Cyan
Write-Host "1. Acesse: https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Clique no seu PostgreSQL Database" -ForegroundColor White
Write-Host "3. Va na aba Connect" -ForegroundColor White
Write-Host "4. Copie a External Connection String" -ForegroundColor White
Write-Host "   (Algo como: postgresql://usuario:senha@...)" -ForegroundColor Gray
Write-Host ""

# Executar script Python
Write-Host "Iniciando backup..." -ForegroundColor Green
Write-Host ""

Set-Location backend
python backup_render.py

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Read-Host "Pressione ENTER para continuar"
