# .env 파일 업데이트 방법

현재 `.env` 파일에 다음 내용을 설정하세요:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=ohun

JWT_SECRET=your-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d

PORT=3000
FRONTEND_URL=http://localhost:5173

KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 직접 수정 방법

1. `server` 폴더로 이동
2. `.env` 파일 열기 (없으면 생성)
3. 위 내용 복사하여 붙여넣기
4. 저장

## 서버 실행으로 연결 테스트

```bash
cd server
npm run start:dev
```

서버가 성공적으로 시작되면 연결 성공입니다!


