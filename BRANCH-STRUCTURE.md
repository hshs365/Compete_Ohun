# Git 브랜치 구조

페이지별로 `Pit_` 접두사로 시작하는 브랜치를 생성했습니다.

## 브랜치 목록

### Pit_auth - 인증 관련
- `client/src/components/LoginPage.tsx`
- `client/src/components/RegisterPage.tsx`
- `client/src/components/CompleteProfilePage.tsx`
- `client/src/components/OAuthCallbackPage.tsx`
- `client/src/contexts/AuthContext.tsx`
- `client/src/utils/api.ts`
- `server/src/auth/` (전체)
- `server/src/users/` (전체)
- `server/src/social-accounts/` (전체)

### Pit_myinfo - 내정보 페이지
- `client/src/components/MyInfoPage.tsx`

### Pit_myschedule - 내일정 페이지
- `client/src/components/MySchedulePage.tsx`

### Pit_facility - 시설예약 페이지
- `client/src/components/FacilityReservationPage.tsx`

### Pit_halloffame - 명예의전당 페이지
- `client/src/components/HallOfFamePage.tsx`

### Pit_favorites - 즐겨찾기 페이지
- `client/src/components/FavoritesPage.tsx`

### Pit_equipment - 스포츠용품 페이지
- `client/src/components/SportsEquipmentPage.tsx`

### Pit_eventmatch - 이벤트매치 페이지
- `client/src/components/EventMatchPage.tsx`

### Pit_notice - 공지사항 페이지
- `client/src/components/NoticePage.tsx`

### Pit_contact - 문의하기 페이지
- `client/src/components/ContactPage.tsx`

### Pit_settings - 앱설정 페이지
- `client/src/components/SettingsPage.tsx`
- `client/src/components/ThemeToggleButton.tsx`
- `client/src/components/ToggleSwitch.tsx`

### Pit_dashboard - 홈/대시보드
- `client/src/components/Dashboard.tsx`
- `client/src/components/MapPanel.tsx`
- `client/src/components/GroupList.tsx`
- `client/src/components/GroupListPanel.tsx`
- `client/src/components/GroupDetail.tsx`
- `client/src/components/CategoryFilter.tsx`
- `client/src/components/CreateGroupModal.tsx`
- `client/src/components/Ranking.tsx`

### Pit_common - 공통 컴포넌트 및 설정
- `client/src/components/Sidebar.tsx`
- `client/src/App.tsx`
- `client/src/main.tsx`
- `client/src/style.css`
- `client/src/constants/sports.ts`

## 브랜치 생성 방법

PowerShell에서 다음 명령어 실행:

```powershell
.\create-branches.ps1
```

또는 수동으로:

```bash
# 각 브랜치 생성
git checkout -b Pit_auth
git add [해당 파일들]
git commit -m "Add Pit_auth page files"

git checkout -b Pit_myinfo
# ... 반복
```

## 원격 저장소에 푸시

```bash
# 각 브랜치를 원격 저장소에 푸시
git push origin Pit_auth
git push origin Pit_myinfo
# ... 각 브랜치별로 반복
```

또는 모든 브랜치 한번에:

```bash
git push origin --all
```

