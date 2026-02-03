# 팀원 협업 설정 가이드

새로 참여하는 팀원용 체크리스트입니다. 각 항목 상세는 링크된 문서를 참고하세요.

## 📋 설정 순서

1. **프로젝트 클론 및 의존성 설치** → [README.md - 빠른 시작](README.md#빠른-시작)
2. **데이터베이스** → [docs/database-setup.md](docs/database-setup.md) (설치·생성·초기화·원격 접속)
3. **환경 변수** → [docs/environment-setup-guide.md](docs/environment-setup-guide.md), `server/env-template.txt` 참고
4. **카카오 로그인** → [docs/kakao-oauth-setup.md](docs/kakao-oauth-setup.md)
5. **카카오맵(지도)** → [docs/kakao-map-api-setup.md](docs/kakao-map-api-setup.md)
6. **실행** → [README.md - 빠른 시작](README.md#빠른-시작)

## ✅ 체크리스트

- [ ] 클론 및 `npm install --legacy-peer-deps` (server, client)
- [ ] PostgreSQL 설치·실행, DB `ohun` 생성
- [ ] `server/.env` 생성 및 DB·JWT·FRONTEND_URL 설정
- [ ] `client/.env` 생성 및 `VITE_API_BASE_URL`, 카카오맵 키(선택)
- [ ] 서버 실행: `cd server` → `npm run start:dev`
- [ ] 클라이언트 실행: `cd client` → `npm run dev`

## 🆘 문제 발생 시

- **일반 문제 해결**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **bcrypt 관련 오류**: [docs/troubleshooting-bcrypt-error.md](docs/troubleshooting-bcrypt-error.md)
- **DB 연결/원격 접속**: [docs/database-setup.md](docs/database-setup.md) 7장

## 📚 문서 요약

| 항목 | 문서 |
|------|------|
| 프로젝트 개요·빠른 시작 | README.md |
| DB 설정·초기화·원격 접속 | docs/database-setup.md |
| 환경 변수 (Dev/Prod) | docs/environment-setup-guide.md |
| 카카오 로그인 | docs/kakao-oauth-setup.md |
| 카카오맵 API | docs/kakao-map-api-setup.md |
| 네이버 지도 | docs/naver-map-api-setup-guide.md |
| 문제 해결 | TROUBLESHOOTING.md |
| 진행 상황 | PROJECT-PROGRESS.md |
