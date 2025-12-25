# Git 브랜치 푸시 가이드

페이지별로 `Pit_` 접두사로 시작하는 브랜치들이 생성되었습니다.

## 생성된 브랜치 목록

1. **Pit_auth** - 인증 관련 (로그인, 회원가입, OAuth)
2. **Pit_myinfo** - 내정보 페이지
3. **Pit_myschedule** - 내일정 페이지
4. **Pit_facility** - 시설예약 페이지
5. **Pit_halloffame** - 명예의전당 페이지
6. **Pit_favorites** - 즐겨찾기 페이지
7. **Pit_equipment** - 스포츠용품 페이지
8. **Pit_eventmatch** - 이벤트매치 페이지
9. **Pit_notice** - 공지사항 페이지
10. **Pit_contact** - 문의하기 페이지
11. **Pit_settings** - 앱설정 페이지
12. **Pit_dashboard** - 홈/대시보드 페이지
13. **Pit_common** - 공통 컴포넌트 및 설정

## 원격 저장소에 푸시하는 방법

### 1. 원격 저장소 연결 (처음 한 번만)

```bash
# GitHub 저장소 URL로 변경하세요
git remote add origin https://github.com/사용자명/저장소명.git

# 또는 SSH 사용 시
git remote add origin git@github.com:사용자명/저장소명.git
```

### 2. 모든 브랜치 한번에 푸시

```bash
# 모든 브랜치를 원격 저장소에 푸시
git push origin --all

# 또는 각 브랜치를 개별적으로 푸시
git push origin Pit_auth
git push origin Pit_myinfo
git push origin Pit_myschedule
# ... 각 브랜치별로 반복
```

### 3. 브랜치별로 푸시 (권장)

```powershell
# PowerShell에서 실행
$branches = @(
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

foreach ($branch in $branches) {
    Write-Host "푸시 중: $branch" -ForegroundColor Yellow
    git push origin $branch
}
```

## 브랜치 구조 확인

```bash
# 모든 브랜치 목록 보기
git branch -a

# 브랜치별 커밋 확인
git log Pit_auth --oneline
```

## 브랜치 전환

```bash
# 특정 브랜치로 전환
git checkout Pit_auth

# main 브랜치로 돌아가기
git checkout main
```

