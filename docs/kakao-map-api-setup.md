# 카카오맵 API 설정 (지도·지오코딩)

## 목적

- 홈 화면 카카오 지도 표시
- 주소 ↔ 좌표 변환 (지오코딩·역지오코딩)

## 1. 카카오 개발자 콘솔

- [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
- 내 애플리케이션 → 애플리케이션 추가 (예: Ohun)
- 앱 키 탭에서 **REST API 키** 복사

## 2. 플랫폼·로컬 API

- 플랫폼 → Web 플랫폼 등록: `http://localhost:5173` (및 운영 도메인)
- 제품 설정 → **로컬** 활성화 (주소 검색, 좌표 변환용)

## 3. 클라이언트 환경 변수

**client/.env** (또는 client/.env.local):

```env
VITE_KAKAO_REST_API_KEY=여기에_REST_API_키
```

- `VITE_` 접두사 필수. 적용 후 클라이언트 재시작.

## 4. 확인

- 브라우저 콘솔: `import.meta.env.VITE_KAKAO_REST_API_KEY` 출력 확인
- 주소 입력 시 마커 이동, "주소 찾기" 동작 확인

## 문제 해결

- API 키 미반영: `.env` 경로·`VITE_` 접두사·클라이언트 재시작 확인
- CORS: 개발자 콘솔 플랫폼 도메인 확인
- 403/Quota: [카카오 개발자 콘솔 → 통계](https://developers.kakao.com/)에서 사용량 확인 (로컬 API 일 10만 건 무료)

참고: [카카오 로컬 API 가이드](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
