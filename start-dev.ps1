# Script PowerShell para iniciar backend e frontend simultaneamente

Write-Host "🚀 Iniciando Backend e Frontend..." -ForegroundColor Cyan

# Verifica se estamos no diretório correto
if (-not (Test-Path "scrapping-backend") -or -not (Test-Path "scrapping-front")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto (onde estão scrapping-backend e scrapping-front)" -ForegroundColor Red
    exit 1
}

# Inicia backend em nova janela
Write-Host "📦 Iniciando Backend..." -ForegroundColor Yellow
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd scrapping-backend; Write-Host 'Backend iniciando...' -ForegroundColor Green; uv run uvicorn app.main:app --reload" -PassThru

# Aguarda backend iniciar
Write-Host "⏳ Aguardando backend iniciar..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verifica se backend está rodando
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Backend rodando em http://localhost:8000" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: Backend não iniciou corretamente" -ForegroundColor Red
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# Inicia frontend
Write-Host "🎨 Iniciando Frontend..." -ForegroundColor Yellow
Set-Location scrapping-front
$frontendProcess = Start-Process npm -ArgumentList "run", "dev" -PassThru
Set-Location ..

Write-Host ""
Write-Host "📍 URLs:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8000"
Write-Host "   Frontend: http://localhost:5173"
Write-Host "   API Docs: http://localhost:8000/docs"
Write-Host ""
Write-Host "Pressione qualquer tecla para parar os serviços..." -ForegroundColor Yellow

# Aguarda tecla para parar
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Para processos
Write-Host "🛑 Parando serviços..." -ForegroundColor Yellow
Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue

Write-Host "✅ Serviços parados" -ForegroundColor Green

