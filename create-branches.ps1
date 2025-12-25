# 페이지별 Git 브랜치 생성 스크립트
# 사용법: .\create-branches.ps1

Set-Location $PSScriptRoot

# main 브랜치로 이동
git checkout main 2>&1 | Out-Null

# main 브랜치에는 기본 파일들만 추가
Write-Host "main 브랜치에 기본 파일 추가..." -ForegroundColor Yellow
git add .gitignore
git add BRANCH-STRUCTURE.md
git add create-branches.ps1
if (Test-Path "README.md") { git add README.md }
git commit -m "Initial commit: Add base files" 2>&1 | Out-Null

# 각 페이지별 브랜치 생성 및 파일 추가
$branches = @{
    "Pit_auth" = @(
        "client/src/components/LoginPage.tsx",
        "client/src/components/RegisterPage.tsx",
        "client/src/components/CompleteProfilePage.tsx",
        "client/src/components/OAuthCallbackPage.tsx",
        "client/src/contexts/AuthContext.tsx",
        "client/src/utils/api.ts",
        "server/src/auth",
        "server/src/users",
        "server/src/social-accounts"
    )
    
    "Pit_myinfo" = @(
        "client/src/components/MyInfoPage.tsx"
    )
    
    "Pit_myschedule" = @(
        "client/src/components/MySchedulePage.tsx"
    )
    
    "Pit_facility" = @(
        "client/src/components/FacilityReservationPage.tsx"
    )
    
    "Pit_halloffame" = @(
        "client/src/components/HallOfFamePage.tsx"
    )
    
    "Pit_favorites" = @(
        "client/src/components/FavoritesPage.tsx"
    )
    
    "Pit_equipment" = @(
        "client/src/components/SportsEquipmentPage.tsx"
    )
    
    "Pit_eventmatch" = @(
        "client/src/components/EventMatchPage.tsx"
    )
    
    "Pit_notice" = @(
        "client/src/components/NoticePage.tsx"
    )
    
    "Pit_contact" = @(
        "client/src/components/ContactPage.tsx"
    )
    
    "Pit_settings" = @(
        "client/src/components/SettingsPage.tsx",
        "client/src/components/ThemeToggleButton.tsx",
        "client/src/components/ToggleSwitch.tsx"
    )
    
    "Pit_dashboard" = @(
        "client/src/components/Dashboard.tsx",
        "client/src/components/MapPanel.tsx",
        "client/src/components/GroupList.tsx",
        "client/src/components/GroupListPanel.tsx",
        "client/src/components/GroupDetail.tsx",
        "client/src/components/CategoryFilter.tsx",
        "client/src/components/CreateGroupModal.tsx",
        "client/src/components/Ranking.tsx"
    )
    
    "Pit_common" = @(
        "client/src/components/Sidebar.tsx",
        "client/src/App.tsx",
        "client/src/main.tsx",
        "client/src/style.css",
        "client/src/constants/sports.ts"
    )
}

Write-Host "브랜치 생성 시작..." -ForegroundColor Green

foreach ($branchName in $branches.Keys) {
    Write-Host "`n브랜치 생성: $branchName" -ForegroundColor Yellow
    
    # 브랜치 생성 및 체크아웃
    git checkout -b $branchName 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        # 브랜치가 이미 있으면 체크아웃만
        git checkout $branchName 2>&1 | Out-Null
    }
    
    # 해당 브랜치에 파일 추가
    $files = $branches[$branchName]
    foreach ($file in $files) {
        if (Test-Path $file) {
            git add $file
            Write-Host "  - 추가: $file" -ForegroundColor Cyan
        } else {
            Write-Host "  - 경고: 파일을 찾을 수 없음: $file" -ForegroundColor Red
        }
    }
    
    # 공통 파일도 추가 (.gitignore, package.json 등)
    git add .gitignore
    if (Test-Path "client/package.json") { git add client/package.json }
    if (Test-Path "server/package.json") { git add server/package.json }
    
    # 커밋
    git commit -m "Add $branchName page files" 2>&1 | Out-Null
    
    Write-Host "  완료: $branchName" -ForegroundColor Green
}

# 다시 main 브랜치로 돌아가기
git checkout main 2>&1 | Out-Null

Write-Host "`n모든 브랜치 생성 완료!" -ForegroundColor Green
Write-Host "`n생성된 브랜치 목록:" -ForegroundColor Yellow
git branch

