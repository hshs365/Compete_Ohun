# Fix branch structure script
# Delete all Pit branches and recreate them based on main branch with all files

Set-Location $PSScriptRoot

Write-Host "Starting branch structure fix..." -ForegroundColor Green

# 1. Switch to main branch
git checkout main 2>&1 | Out-Null
Write-Host "Switched to main branch" -ForegroundColor Yellow

# 2. Get all branch names (except main)
$branches = git branch | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne 'main' -and $_ -notlike '*main*' }
Write-Host "Branches to delete:" -ForegroundColor Yellow
$branches | ForEach-Object { Write-Host "  - $_" -ForegroundColor Cyan }

# 3. Delete all Pit branches
foreach ($branch in $branches) {
    git branch -D $branch 2>&1 | Out-Null
    Write-Host "Deleted: $branch" -ForegroundColor Gray
}
Write-Host "All Pit branches deleted" -ForegroundColor Yellow

# 4. Add all project files to main branch and commit
Write-Host "Adding all project files to main branch..." -ForegroundColor Yellow
git add .
git commit -m "Add complete project to main branch" 2>&1 | Out-Null
Write-Host "Complete project committed to main branch" -ForegroundColor Green

# 5. Create each Pit branch based on main (now with all files included)
Write-Host "Recreating Pit branches based on main..." -ForegroundColor Yellow

$branchList = @(
    "Pit_auth",
    "Pit_myinfo",
    "Pit_myschedule",
    "Pit_facility",
    "Pit_halloffame",
    "Pit_favorites",
    "Pit_equipment",
    "Pit_eventmatch",
    "Pit_notice",
    "Pit_contact",
    "Pit_settings",
    "Pit_dashboard",
    "Pit_common"
)

foreach ($branchName in $branchList) {
    git checkout -b $branchName 2>&1 | Out-Null
    Write-Host "Created: $branchName" -ForegroundColor Cyan
    git checkout main 2>&1 | Out-Null
}

Write-Host "Branch structure fix completed!" -ForegroundColor Green
Write-Host "Created branches:" -ForegroundColor Yellow
git branch

Write-Host "You can now work on each branch with all files available" -ForegroundColor Green
