# 프로젝트 이동 가이드

## 현재 상태

- 현재 위치: `C:\Users\hshs3\Documents\GitHub\Ohun`
- Git 상태: 로컬 저장소 초기화됨
- 원격 저장소: git@github.com:hshs365/ohun.git

## 이동 계획

### 옵션 1: Git 히스토리 보존하면서 이동 (권장)

이 경우 모든 Git 커밋 히스토리가 보존됩니다.

```powershell
# 1. 새 위치로 프로젝트 복사 (예: C:\Dev\Ohun)
xcopy /E /I /H /Y "C:\Users\hshs3\Documents\GitHub\Ohun" "C:\Dev\Ohun"

# 2. 새 위치로 이동
cd C:\Dev\Ohun

# 3. .git 폴더가 복사되었는지 확인
Test-Path .git

# 4. Git 상태 확인
git status

# 5. 원격 저장소 연결 확인/재설정 (필요시)
git remote -v
# git remote set-url origin git@github.com:hshs365/ohun.git
```

### 옵션 2: Git 히스토리 없이 깨끗한 시작

새 Git 저장소로 시작하고 싶다면:

```powershell
# 1. 새 위치로 프로젝트 복사 (node_modules 제외)
robocopy "C:\Users\hshs3\Documents\GitHub\Ohun" "C:\Dev\Ohun" /E /XD node_modules .git /XF .gitignore

# 2. 새 위치로 이동
cd C:\Dev\Ohun

# 3. 새 Git 저장소 초기화
git init

# 4. .gitignore 확인
Test-Path .gitignore

# 5. 모든 파일 추가
git add .

# 6. 초기 커밋
git commit -m "Initial commit: Move project to new location"

# 7. 원격 저장소 연결 (GitHub에서 새 저장소 생성 후)
# git remote add origin git@github.com:hshs365/ohun.git
# git branch -M main
# git push -u origin main
```

## 주의사항

1. **실행 중인 프로세스 종료**
   - 서버 (포트 3000)
   - 클라이언트 (포트 5173)
   - 기타 개발 도구

2. **node_modules 포함 여부**
   - 포함: 더 빠른 이동, 하지만 용량 큼
   - 제외: 깔끔하지만 나중에 `npm install` 필요

3. **.env 파일 확인**
   - server/.env 파일이 복사되었는지 확인
   - 민감한 정보가 포함되어 있을 수 있음

4. **기존 폴더 정리**
   - 이동이 성공적으로 완료된 후 기존 폴더 삭제 가능
   - 하지만 먼저 새 위치에서 정상 작동하는지 확인

## 추천 방법

**옵션 1 (Git 히스토리 보존)**을 권장합니다:
- 모든 작업 히스토리 보존
- 브랜치 구조 유지
- 나중에 참조하기 쉬움

## 자동화 스크립트

필요하시면 PowerShell 스크립트로 자동화할 수 있습니다.

