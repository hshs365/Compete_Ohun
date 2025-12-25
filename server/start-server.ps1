# 서버 실행 스크립트

Write-Host "서버 실행 중..." -ForegroundColor Green

Set-Location $PSScriptRoot

# .env 파일 확인
if (-not (Test-Path .env)) {
    Write-Host "경고: .env 파일이 없습니다!" -ForegroundColor Yellow
    Write-Host ".env 파일을 생성하고 데이터베이스 설정을 확인하세요." -ForegroundColor Yellow
}

# node_modules 확인
if (-not (Test-Path node_modules)) {
    Write-Host "node_modules가 없습니다. npm install을 실행합니다..." -ForegroundColor Yellow
    npm install
}

# 서버 실행
Write-Host "개발 서버를 시작합니다..." -ForegroundColor Cyan
npm run start:dev

