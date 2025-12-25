# 프로젝트 이동 스크립트
# 사용법: .\move-project.ps1 -DestinationPath "C:\Dev\Ohun" -KeepGitHistory $true

param(
    [Parameter(Mandatory=$true)]
    [string]$DestinationPath,
    
    [Parameter(Mandatory=$false)]
    [bool]$KeepGitHistory = $true,
    
    [Parameter(Mandatory=$false)]
    [bool]$IncludeNodeModules = $false
)

$SourcePath = "C:\Users\hshs3\Documents\GitHub\Ohun"

Write-Host "프로젝트 이동 시작..." -ForegroundColor Green
Write-Host "원본: $SourcePath" -ForegroundColor Yellow
Write-Host "대상: $DestinationPath" -ForegroundColor Yellow
Write-Host "Git 히스토리 보존: $KeepGitHistory" -ForegroundColor Yellow
Write-Host "node_modules 포함: $IncludeNodeModules" -ForegroundColor Yellow
Write-Host ""

# 대상 폴더 확인
if (Test-Path $DestinationPath) {
    $response = Read-Host "대상 폴더가 이미 존재합니다. 계속하시겠습니까? (y/n)"
    if ($response -ne 'y') {
        Write-Host "취소되었습니다." -ForegroundColor Red
        exit
    }
}

# 원본 폴더 확인
if (-not (Test-Path $SourcePath)) {
    Write-Host "오류: 원본 폴더를 찾을 수 없습니다: $SourcePath" -ForegroundColor Red
    exit 1
}

try {
    # 1. Git 히스토리 보존하는 경우
    if ($KeepGitHistory) {
        Write-Host "Git 히스토리를 보존하면서 복사 중..." -ForegroundColor Cyan
        
        # node_modules 포함 여부에 따라 복사
        if ($IncludeNodeModules) {
            Write-Host "node_modules 포함하여 복사 중..." -ForegroundColor Gray
            robocopy $SourcePath $DestinationPath /E /XD ".git" /R:3 /W:5 /NP /NDL /NJH /NJS
        } else {
            Write-Host "node_modules 제외하고 복사 중..." -ForegroundColor Gray
            robocopy $SourcePath $DestinationPath /E /XD "node_modules" ".git" /R:3 /W:5 /NP /NDL /NJH /NJS
        }
        
        # .git 폴더 별도 복사
        if (Test-Path "$SourcePath\.git") {
            Write-Host ".git 폴더 복사 중..." -ForegroundColor Gray
            robocopy "$SourcePath\.git" "$DestinationPath\.git" /E /R:3 /W:5 /NP /NDL /NJH /NJS
        }
        
    } else {
        # 2. Git 히스토리 없이 깨끗한 복사
        Write-Host "Git 히스토리 없이 복사 중..." -ForegroundColor Cyan
        
        if ($IncludeNodeModules) {
            robocopy $SourcePath $DestinationPath /E /XD ".git" /R:3 /W:5 /NP /NDL /NJH /NJS
        } else {
            robocopy $SourcePath $DestinationPath /E /XD "node_modules" ".git" /R:3 /W:5 /NP /NDL /NJH /NJS
        }
    }
    
    Write-Host "`n복사 완료!" -ForegroundColor Green
    Write-Host "대상 경로: $DestinationPath" -ForegroundColor Cyan
    
    # 3. 새 위치로 이동
    Set-Location $DestinationPath
    
    # 4. Git 히스토리를 보존하지 않은 경우 새로 초기화
    if (-not $KeepGitHistory) {
        Write-Host "`n새 Git 저장소 초기화 중..." -ForegroundColor Cyan
        git init
        git add .
        git commit -m "Initial commit: Move project to new location"
    } else {
        # 5. Git 상태 확인
        Write-Host "`nGit 상태 확인 중..." -ForegroundColor Cyan
        git status
        git remote -v
    }
    
    Write-Host "`n프로젝트 이동 완료!" -ForegroundColor Green
    Write-Host "다음 단계:" -ForegroundColor Yellow
    Write-Host "1. 새 위치에서 프로젝트 확인: cd $DestinationPath" -ForegroundColor White
    Write-Host "2. node_modules가 없으면: cd client && npm install && cd ../server && npm install" -ForegroundColor White
    Write-Host "3. 서버 실행 테스트: cd server && npm run start:dev" -ForegroundColor White
    
} catch {
    Write-Host "오류 발생: $_" -ForegroundColor Red
    exit 1
}

