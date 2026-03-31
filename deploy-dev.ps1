# deploy-dev.ps1 — Instituto Levi Felix
# Uso: .\deploy-dev.ps1 "fix: descricao do que foi feito"
# Executa: commit -> push -> VPS git pull -> rebuild DEV

param(
    [Parameter(Mandatory = $true)]
    [string]$CommitMessage
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==> [1/4] Verificando alteracoes locais..." -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "==> [2/4] Commit e push..." -ForegroundColor Cyan
git add -A
# Remove arquivos .env do staging se tiverem entrado
git restore --staged .env* 2>$null
git commit -m $CommitMessage
git push origin main

Write-Host ""
Write-Host "==> [3/4] Conectando na VPS e sincronizando..." -ForegroundColor Cyan
ssh root@78.142.242.249 "cd /opt/ilf && git pull origin main"

Write-Host ""
Write-Host "==> [4/4] Rebuild e deploy DEV..." -ForegroundColor Cyan
ssh root@78.142.242.249 "docker compose -f /opt/ilf/docker-compose.dev.yml up --build -d"

Write-Host ""
Write-Host "==> Verificando status dos containers..." -ForegroundColor Cyan
ssh root@78.142.242.249 "docker compose -f /opt/ilf/docker-compose.dev.yml ps"

Write-Host ""
Write-Host "==> Tail de logs (ultimas 20 linhas)..." -ForegroundColor Cyan
ssh root@78.142.242.249 "docker compose -f /opt/ilf/docker-compose.dev.yml logs app --tail=20"

Write-Host ""
Write-Host "✅ Deploy DEV concluido! Acesse: https://dev.alunos.institutolevifelix.com.br" -ForegroundColor Green
Write-Host ""