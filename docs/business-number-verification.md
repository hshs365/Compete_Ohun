# 사업자등록번호 진위확인 (국세청 API 연동)

네이버클라우드와 유사하게, **사업자번호를 국세청(공공데이터포털) API로 조회해 사용자 입력 정보와 일치하는지 확인**하는 기능을 지원합니다.

## 동작 방식

1. **API 키 미설정**  
   - `DATA_GO_KR_SERVICE_KEY`가 없으면 **형식 검증만** 수행합니다.  
   - 사업자번호 형식(XXX-XX-XXXXX)과 중복 여부만 확인합니다.

2. **API 키 설정 + 대표자명·개업일자 입력**  
   - 공공데이터포털 **국세청_사업자등록정보 진위확인 API**를 호출합니다.  
   - 사업자번호 + 개업일자 + 대표자명이 국세청 정보와 **일치할 때만** 검증 성공으로 처리합니다.

## API 키 발급

1. [공공데이터포털](https://www.data.go.kr) 로그인  
2. [국세청_사업자등록정보 진위확인및상태조회](https://www.data.go.kr/data/15081808/openapi.do) 페이지에서 **활용신청**  
3. 승인 후 **마이페이지 → 인증키**에서 서비스 키 복사  
4. 서버 `.env`에 추가:
   ```env
   DATA_GO_KR_SERVICE_KEY=발급받은_인증키
   ```

## 사용하는 API

- **진위확인**: 사업자번호(b_no) + 개업일자(start_dt, YYYYMMDD) + 대표자명(p_nm)  
  → 국세청 데이터와 일치 여부 확인  
- 호출 제한: 1회 100건, 1일 100만건 (무료)

## 백엔드 API

### 비로그인 검증 (회원가입 단계)

- **POST** `/api/auth/verify-business-number-registration`  
- Body:
  - `businessNumber` (필수): `XXX-XX-XXXXX`
  - `representativeName` (선택): 대표자명 → 있으면 국세청 진위확인 호출
  - `openingDate` (선택): 개업일자 `YYYYMMDD` 또는 `YYYY-MM-DD`  
- 응답: `{ verified: boolean, message?: string, apiUsed?: boolean }`

### 로그인 후 검증 (사업자번호 등록/변경)

- **POST** `/api/auth/verify-business-number` (JWT 필요)  
- Body: `VerifyBusinessNumberDto`  
  - `businessNumber` (필수)  
  - `representativeName` (선택)  
  - `openingDate` (선택)  
- 대표자명·개업일자를 보내면 국세청 API로 일치 여부 확인 후 `businessNumberVerified` 갱신

## 프론트엔드 연동 예시 (네이버클라우드 스타일)

1. 사업자번호 입력  
2. (선택) 대표자명, 개업일자 입력  
3. **검증** 버튼 클릭 → `POST /api/auth/verify-business-number-registration`  
   - `representativeName`, `openingDate`를 함께 보내면 국세청 진위확인 사용  
4. 응답 `verified: true`이면 다음 단계(회원가입 완료 등) 진행  
5. `verified: false`이면 `message`를 화면에 표시

API 키를 넣지 않아도, 기존처럼 **형식 검증 + 중복 검사**만으로 동작합니다.
