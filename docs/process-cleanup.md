# 프로세스 정리 가이드

작업 중 멈추거나 에러가 난 것 같을 때 참고용입니다.

---

## 1. 지금 뭐가 돌고 있는지

| 터미널 | 위치 | 실행 중인 명령 |
|--------|------|----------------|
| 1 | `server/` | `npm run start:dev` (백엔드) |
| 2 | `client/` | `npm run dev` (프론트 Vite) |

---

## 2. "작업하다 멈춤" / 에러 날 때 할 일

1. **저장**  
   수정한 파일 전부 저장 (Ctrl+S 또는 Cmd+S).

2. **클라이언트만 재시작**  
   - 터미널 2에서 **Ctrl+C**로 `npm run dev` 중지  
   - 다시 실행: `npm run dev`  
   - 브라우저에서 **Ctrl+Shift+R** (강력 새로고침)

3. **그래도 이상하면 둘 다 재시작**  
   - 터미널 1: **Ctrl+C** → `npm run start:dev`  
   - 터미널 2: **Ctrl+C** → `npm run dev`  
   - 브라우저 **Ctrl+Shift+R**

4. **PowerShell에서 여러 명령 쓸 때**  
   `&&` 대신 **세미콜론(;)** 사용  
   - 예: `cd client; npm install`

---

## 3. 이미 반영된 수정 (참고)

- **TacticalBoardCanvas**: `react-draggable` 제거됨 → HTML5 드래그만 사용, 별도 설치 없음.
- **package.json**: `react-draggable` 의존성 제거됨.
- **NaverMapPanel**: props에 `selectedRegion` 한 번만 선언된 상태 (중복 없음).

---

## 4. 한 번에 정리하고 다시 켜기

```powershell
# 터미널 1 (서버)
cd C:\Compete_Ohun\server
npm run start:dev

# 터미널 2 (클라이언트) - 서버 뜬 다음에
cd C:\Compete_Ohun\client
npm run dev
```

브라우저: http://localhost:5173/

---

작업이 자꾸 멈추면: **저장 → dev 서버 한 번 끄고 다시 켜기 → 브라우저 강력 새로고침** 순서로 해보면 됩니다.
