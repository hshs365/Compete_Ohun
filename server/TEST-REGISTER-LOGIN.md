# 일반 회원가입/로그인 테스트 가이드

## 현재 상태
✅ 서버 실행 중 (포트 3000)
✅ 데이터베이스 연결 성공
✅ 회원가입/로그인 API 구현 완료

## 테스트 단계

### 1. 프론트엔드에서 회원가입 테스트

1. 브라우저에서 `http://localhost:5173/register` 접속
2. 회원가입 폼 작성:
   - 이메일: `test@example.com`
   - 비밀번호: `Test1234!` (대문자, 소문자, 숫자 포함, 8자 이상)
   - 비밀번호 확인: `Test1234!`
   - 닉네임: `테스트유저`
   - 성별: 선택
   - 거주 지역: 시/도, 시/군/구 입력
   - 약관 동의 체크
3. "회원가입" 버튼 클릭
4. 성공 시 메인 페이지로 이동

### 2. 데이터베이스 확인

회원가입 성공 후 데이터베이스에서 확인:

```bash
psql -U postgres -d ohun
```

```sql
-- users 테이블 확인
SELECT id, email, nickname, "isProfileComplete", status FROM users;

-- 상세 정보 확인
SELECT * FROM users WHERE email = 'test@example.com';
```

### 3. 로그인 테스트

1. 브라우저에서 `http://localhost:5173/login` 접속
2. 방금 가입한 이메일과 비밀번호 입력
3. "로그인" 버튼 클릭
4. 성공 시 메인 페이지로 이동

### 4. API 직접 테스트 (선택사항)

Postman 또는 curl로 테스트:

#### 회원가입
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "Test1234!",
    "nickname": "테스트유저2",
    "gender": "male",
    "residenceSido": "서울특별시",
    "residenceSigungu": "강남구",
    "termsServiceAgreed": true,
    "termsPrivacyAgreed": true
  }'
```

#### 로그인
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

## 예상 결과

### 회원가입 성공 시
- 데이터베이스 `users` 테이블에 새 레코드 생성
- JWT 토큰 발급
- 메인 페이지로 리다이렉트

### 로그인 성공 시
- JWT 토큰 발급
- 메인 페이지로 리다이렉트

## 문제 해결

### 회원가입 실패
- 이메일 중복 확인
- 비밀번호 규칙 확인 (대문자, 소문자, 숫자 포함, 8자 이상)
- 필수 항목 모두 입력 확인

### 로그인 실패
- 이메일/비밀번호 정확성 확인
- 데이터베이스에 해당 이메일로 가입된 사용자가 있는지 확인

