# 운동모임 웹사이트 로그인/회원가입 시스템 설계

## 1. 전체 로그인/회원가입 플로우

```
[사용자]
    │
    ├─▶ [일반 로그인 선택]
    │       │
    │       ├─▶ 이메일/비밀번호 입력
    │       │       │
    │       │       ├─▶ 로그인 성공
    │       │       │       │
    │       │       │       └─▶ [메인 화면]
    │       │       │
    │       │       └─▶ 로그인 실패 → 에러 메시지
    │       │
    │       └─▶ [회원가입 선택]
    │               │
    │               ├─▶ 이메일/비밀번호 입력
    │               │       │
    │               │       └─▶ [추가 정보 입력 단계]
    │               │               │
    │               │               └─▶ 약관 동의 + 필수 정보 입력
    │               │                       │
    │               │                       └─▶ [회원가입 완료] → [메인 화면]
    │
    └─▶ [소셜 로그인 선택]
            │
            ├─▶ [카카오 로그인] / [구글 로그인]
            │       │
            │       └─▶ OAuth 인증 서버로 리다이렉트
            │               │
            │               ├─▶ 사용자 동의 및 로그인
            │               │       │
            │               └─▶ [Callback URL로 리다이렉트]
            │                       │
            │                       └─▶ 백엔드에서 OAuth 토큰 교환
            │                               │
            │                               ├─▶ [기존 회원 조회]
            │                               │       │
            │                               │       ├─▶ 기존 회원 발견
            │                               │       │       │
            │                               │       │       ├─▶ 이미 연동된 소셜 계정 → [로그인 완료] → [메인 화면]
            │                               │       │       │
            │                               │       │       └─▶ 미연동 소셜 계정 → [소셜 계정 연동] → [로그인 완료] → [메인 화면]
            │                               │       │
            │                               │       └─▶ 신규 사용자
            │                               │               │
            │                               │               └─▶ [추가 정보 입력 단계 (필수)]
            │                               │                       │
            │                               │                       └─▶ 약관 동의 + 필수 정보 입력
            │                               │                               │
            │                               │                               └─▶ [회원가입 완료] → [메인 화면]
```

### 설계 이유
- **소셜 로그인 후 추가 정보 필수**: 운동모임 서비스 특성상 닉네임, 성별, 연령대, 지역 등이 필수이므로 소셜 로그인만으로는 부족
- **OAuth Callback 처리**: 보안을 위해 서버 사이드에서 토큰 교환 및 사용자 정보 조회 수행
- **소셜 계정 연동 로직**: 기존 회원의 경우 소셜 계정을 추가 연동할 수 있도록 설계

---

## 2. 소셜 로그인 후 추가 정보 입력 UX 흐름

### 플로우 상세

```
[소셜 로그인 성공 후]
    │
    ├─▶ 백엔드에서 신규 사용자 판단
    │       │
    │       └─▶ JWT 토큰 발급 (임시 회원 상태)
    │               │
    │               └─▶ 프론트엔드로 리다이렉트 (토큰 포함)
    │
    └─▶ [추가 정보 입력 페이지로 리다이렉트]
            │
            ├─▶ 페이지 헤더: "추가 정보를 입력해주세요"
            │       │
            │       └─▶ 안내 문구: "서비스를 이용하기 위해 몇 가지 정보가 필요합니다"
            │
            ├─▶ [필수 정보 입력 섹션]
            │       │
            │       ├─▶ 닉네임 입력
            │       │       └─▶ 실시간 중복 검사 (API 호출)
            │       │
            │       ├─▶ 성별 선택 (라디오 버튼)
            │       │       └─▶ 남성 / 여성 / 선택안함 (단, 운동모임 특성상 필수)
            │       │
            │       ├─▶ 생년월일 또는 연령대 선택
            │       │       └─▶ 연령대 선택 권장 (개인정보 최소화)
            │       │           └─▶ 드롭다운: 20대 초반 / 20대 후반 / 30대 초반 등
            │       │
            │       └─▶ 거주 지역 선택
            │               └─▶ 시/도 + 시/군/구 선택 (2단계 드롭다운)
            │
            ├─▶ [선택 정보 입력 섹션]
            │       │
            │       ├─▶ 관심 운동 종목 (체크박스 다중 선택)
            │       │       └─▶ 배드민턴, 축구, 농구, 테니스, 등산 등
            │       │
            │       └─▶ 운동 수준 선택 (라디오 버튼)
            │               └─▶ 초급 / 중급 / 상급
            │
            ├─▶ [약관 동의 섹션]
            │       │
            │       ├─▶ 전체 동의 체크박스
            │       │       │
            │       │       └─▶ 체크 시 모든 약관 자동 동의
            │       │
            │       ├─▶ 서비스 이용약관 (필수) ✓
            │       │       └─▶ [내용보기] 링크 → 모달로 약관 내용 표시
            │       │
            │       ├─▶ 개인정보 처리방침 (필수) ✓
            │       │       └─▶ [내용보기] 링크 → 모달로 약관 내용 표시
            │       │
            │       └─▶ 마케팅 수신 동의 (선택)
            │               └─▶ SMS / 이메일 각각 선택 가능
            │
            └─▶ [완료 버튼]
                    │
                    ├─▶ 필수 정보 검증
                    │       │
                    │       ├─▶ 검증 실패 → 에러 메시지 표시 (필드별)
                    │       │
                    │       └─▶ 검증 성공
                    │               │
                    │               └─▶ API 호출: POST /api/auth/social/complete
                    │                       │
                    │                       ├─▶ 성공 → [회원가입 완료] 토스트 → [메인 화면]
                    │                       │
                    │                       └─▶ 실패 → 에러 메시지 표시
```

### UX 설계 이유
- **단계별 입력**: 필수 → 선택 → 약관 순서로 정보 부담 감소
- **실시간 검증**: 닉네임 중복 검사 등 즉시 피드백 제공
- **연령대 선택 권장**: 생년월일보다 연령대가 개인정보 최소화에 부합
- **약관 명확성**: 필수/선택 구분, 내용보기 기능으로 투명성 확보

---

## 3. DB 테이블 설계

### User 테이블 (서비스 회원 정보)

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    
    -- 로그인 정보 (일반 로그인용)
    email VARCHAR(255) UNIQUE, -- NULL 허용 (소셜 로그인만 있는 경우)
    password_hash VARCHAR(255), -- NULL 허용 (소셜 로그인만 있는 경우)
    
    -- 서비스 필수 정보
    nickname VARCHAR(50) NOT NULL UNIQUE,
    gender VARCHAR(10), -- 'male', 'female', 'other'
    age_range VARCHAR(20), -- '20-24', '25-29', '30-34' 등
    birth_date DATE, -- 선택적 (연령대만 있을 수도 있음)
    residence_sido VARCHAR(50) NOT NULL, -- 시/도
    residence_sigungu VARCHAR(50) NOT NULL, -- 시/군/구
    
    -- 선택 정보
    interested_sports TEXT[], -- 관심 운동 종목 배열 ['배드민턴', '축구']
    skill_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
    
    -- 약관 동의
    terms_service_agreed BOOLEAN NOT NULL DEFAULT false,
    terms_privacy_agreed BOOLEAN NOT NULL DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    marketing_email_consent BOOLEAN DEFAULT false,
    marketing_sms_consent BOOLEAN DEFAULT false,
    
    -- 계정 상태
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'suspended', 'deleted'
    is_profile_complete BOOLEAN NOT NULL DEFAULT false, -- 추가 정보 입력 완료 여부
    
    -- 메타 정보
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    
    -- 인덱스
    INDEX idx_email (email),
    INDEX idx_nickname (nickname),
    INDEX idx_status (status),
    INDEX idx_residence (residence_sido, residence_sigungu)
);
```

### SocialAccount 테이블 (소셜 계정 연동 정보)

```sql
CREATE TABLE social_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    
    -- 소셜 제공자 정보
    provider VARCHAR(20) NOT NULL, -- 'kakao', 'google'
    provider_user_id VARCHAR(255) NOT NULL, -- 소셜 서비스의 사용자 ID
    
    -- 소셜 서비스에서 받은 정보 (참고용, 서비스에는 사용 안 함)
    provider_email VARCHAR(255),
    provider_name VARCHAR(255),
    provider_profile_image_url TEXT,
    
    -- 연동 상태
    is_primary BOOLEAN DEFAULT false, -- 주요 로그인 계정 여부
    
    -- 메타 정보
    linked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    
    -- 제약조건
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(provider, provider_user_id), -- 같은 소셜 계정은 한 번만 연동
    
    -- 인덱스
    INDEX idx_user_id (user_id),
    INDEX idx_provider_user (provider, provider_user_id)
);
```

### 설계 이유

1. **User와 SocialAccount 분리**
   - 이유: 하나의 User가 여러 소셜 계정을 가질 수 있음
   - 소셜 계정 정보 변경 시 User 테이블 영향 없음
   - 소셜 계정 연결 해제 시에도 User 정보 보존

2. **email, password_hash NULL 허용**
   - 이유: 소셜 로그인만 사용하는 경우 일반 로그인 정보 불필요
   - UNIQUE 제약으로 일반 로그인 시에만 email 중복 방지

3. **status와 is_profile_complete 분리**
   - 이유: 소셜 로그인 성공 후에도 추가 정보 미입력 상태 구분 필요
   - `status='pending'` + `is_profile_complete=false`: 추가 정보 입력 필요
   - `status='active'` + `is_profile_complete=true`: 정상 사용자

4. **age_range와 birth_date 분리**
   - 이유: 개인정보 최소화 원칙 (연령대만 수집 가능)
   - birth_date는 선택적 (필요 시에만 수집)

5. **interested_sports를 배열 타입**
   - 이유: 다중 선택이 일반적이며, PostgreSQL 배열 타입으로 간단히 처리 가능
   - 또는 별도 테이블로 정규화 가능 (선호)

---

## 4. 프론트엔드에서 처리해야 할 분기 케이스

### 케이스 1: 로그인/회원가입 진입점 분기

```typescript
// App.tsx 또는 라우터 가드
const AuthGuard = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // 추가 정보 미입력 상태 체크
  if (!user.isProfileComplete) {
    return <Navigate to="/auth/complete-profile" />;
  }
  
  return <Outlet />;
};
```

### 케이스 2: 소셜 로그인 Callback 처리

```typescript
// OAuthCallback.tsx
const OAuthCallback = () => {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // CSRF 방지용
  const provider = searchParams.get('provider'); // 'kakao' 또는 'google'
  
  useEffect(() => {
    if (code && state) {
      handleOAuthCallback(code, state, provider);
    }
  }, [code, state, provider]);
  
  const handleOAuthCallback = async (code: string, state: string, provider: string) => {
    try {
      // 백엔드로 code 전송하여 토큰 교환 및 사용자 조회
      const response = await fetch(`/api/auth/social/callback?code=${code}&state=${state}&provider=${provider}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.isNewUser && !data.isProfileComplete) {
        // 신규 사용자 + 추가 정보 미입력
        // 토큰을 쿠키/로컬스토리지에 저장하고 추가 정보 입력 페이지로
        localStorage.setItem('temp_token', data.token);
        navigate('/auth/complete-profile', { 
          state: { provider, providerEmail: data.providerEmail } 
        });
      } else if (data.isProfileComplete) {
        // 기존 사용자 또는 추가 정보 입력 완료 사용자
        // 정상 로그인 처리
        localStorage.setItem('access_token', data.token);
        navigate('/');
      }
    } catch (error) {
      // 에러 처리
      navigate('/login', { state: { error: '소셜 로그인에 실패했습니다.' } });
    }
  };
  
  return <LoadingSpinner message="로그인 처리 중..." />;
};
```

### 케이스 3: 추가 정보 입력 페이지

```typescript
// CompleteProfilePage.tsx
const CompleteProfilePage = () => {
  const [formData, setFormData] = useState({
    nickname: '',
    gender: '',
    ageRange: '',
    residenceSido: '',
    residenceSigungu: '',
    interestedSports: [] as string[],
    skillLevel: '',
    termsServiceAgreed: false,
    termsPrivacyAgreed: false,
    marketingConsent: false,
  });
  
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const location = useLocation();
  const provider = location.state?.provider; // 소셜 로그인 정보
  
  // 닉네임 중복 검사 (디바운스 처리)
  useEffect(() => {
    if (formData.nickname.length >= 2) {
      const timer = setTimeout(() => {
        checkNicknameAvailability(formData.nickname);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.nickname]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.nickname || !formData.gender || !formData.ageRange || 
        !formData.residenceSido || !formData.residenceSigungu ||
        !formData.termsServiceAgreed || !formData.termsPrivacyAgreed) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }
    
    if (nicknameAvailable === false) {
      alert('이미 사용 중인 닉네임입니다.');
      return;
    }
    
    try {
      const token = localStorage.getItem('temp_token') || getCookie('temp_token');
      const response = await fetch('/api/auth/social/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const data = await response.json();
        // 임시 토큰 제거, 정식 토큰 저장
        localStorage.removeItem('temp_token');
        localStorage.setItem('access_token', data.token);
        navigate('/', { state: { message: '회원가입이 완료되었습니다.' } });
      } else {
        const error = await response.json();
        alert(error.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      alert('회원가입 처리 중 오류가 발생했습니다.');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* 폼 필드들 */}
    </form>
  );
};
```

### 케이스 4: 일반 로그인/회원가입 분기

```typescript
// LoginPage.tsx
const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  const handleEmailLogin = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!data.isProfileComplete) {
        // 일반 회원가입 후 추가 정보 미입력 상태
        navigate('/auth/complete-profile');
      } else {
        // 정상 로그인
        navigate('/');
      }
    } catch (error) {
      // 에러 처리
    }
  };
  
  const handleEmailSignup = async (email: string, password: string) => {
    // 일반 회원가입 API 호출
    // 성공 시 추가 정보 입력 페이지로 이동
    navigate('/auth/complete-profile');
  };
  
  // ...
};
```

### 분기 케이스 정리

1. **소셜 로그인 Callback**
   - 신규 사용자 + 추가 정보 미입력 → `/auth/complete-profile`
   - 기존 사용자 + 추가 정보 완료 → `/` (메인)
   - 기존 사용자 + 추가 정보 미입력 → `/auth/complete-profile`

2. **일반 로그인**
   - 로그인 성공 + 추가 정보 완료 → `/`
   - 로그인 성공 + 추가 정보 미입력 → `/auth/complete-profile` (이론적으로 발생하지 않아야 함)

3. **라우터 가드**
   - 인증되지 않은 사용자 → `/login`
   - 인증되었으나 추가 정보 미입력 → `/auth/complete-profile`
   - 인증 + 추가 정보 완료 → 정상 접근 허용

---

## 5. 백엔드 API 설계 예시

### 인증 관련 API

#### 1. 일반 로그인
```
POST /api/auth/login
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "user123",
    "isProfileComplete": true
  }
}

Response (401):
{
  "error": "INVALID_CREDENTIALS",
  "message": "이메일 또는 비밀번호가 올바르지 않습니다."
}
```

#### 2. 일반 회원가입 (이메일 중복 체크 + 임시 회원 생성)
```
POST /api/auth/signup
Request:
{
  "email": "newuser@example.com",
  "password": "password123"
}

Response (201):
{
  "token": "temp_jwt_token", // 임시 토큰
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "isProfileComplete": false
  },
  "message": "이메일 인증이 필요합니다." // 선택적
}

Response (409):
{
  "error": "EMAIL_ALREADY_EXISTS",
  "message": "이미 가입된 이메일입니다."
}
```

#### 3. 소셜 로그인 Callback 처리
```
POST /api/auth/social/callback
Query Parameters:
  - code: OAuth 인증 코드
  - state: CSRF 방지용 state
  - provider: 'kakao' | 'google'

Response (200):
{
  "token": "jwt_token",
  "isNewUser": true, // 신규 사용자 여부
  "isProfileComplete": false, // 추가 정보 입력 완료 여부
  "user": {
    "id": 3,
    "isProfileComplete": false
  },
  "providerEmail": "user@gmail.com" // 참고용 (선택적 표시)
}
```

#### 4. 추가 정보 입력 완료 (소셜 로그인)
```
POST /api/auth/social/complete
Headers:
  Authorization: Bearer {temp_token}

Request:
{
  "nickname": "운동러버",
  "gender": "male",
  "ageRange": "25-29",
  "residenceSido": "서울특별시",
  "residenceSigungu": "강남구",
  "interestedSports": ["배드민턴", "축구"],
  "skillLevel": "intermediate",
  "termsServiceAgreed": true,
  "termsPrivacyAgreed": true,
  "marketingConsent": false
}

Response (200):
{
  "token": "new_jwt_token", // 정식 토큰으로 재발급
  "user": {
    "id": 3,
    "nickname": "운동러버",
    "isProfileComplete": true
  }
}

Response (400):
{
  "error": "VALIDATION_ERROR",
  "fields": {
    "nickname": "닉네임은 필수입니다.",
    "termsServiceAgreed": "서비스 이용약관에 동의해주세요."
  }
}

Response (409):
{
  "error": "NICKNAME_ALREADY_EXISTS",
  "message": "이미 사용 중인 닉네임입니다."
}
```

#### 5. 추가 정보 입력 완료 (일반 회원가입)
```
POST /api/auth/complete-profile
Headers:
  Authorization: Bearer {temp_token}

Request: (위와 동일)

Response: (위와 동일)
```

#### 6. 닉네임 중복 검사
```
GET /api/auth/check-nickname?nickname=운동러버

Response (200):
{
  "available": true
}

Response (409):
{
  "available": false,
  "message": "이미 사용 중인 닉네임입니다."
}
```

#### 7. 현재 사용자 정보 조회
```
GET /api/auth/me
Headers:
  Authorization: Bearer {token}

Response (200):
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "운동러버",
    "isProfileComplete": true,
    "socialAccounts": [
      {
        "provider": "kakao",
        "isPrimary": true
      }
    ]
  }
}
```

### API 설계 이유

1. **소셜 로그인 Callback은 서버 사이드에서만 처리**
   - 이유: OAuth 클라이언트 시크릿 보안, 토큰 교환 안전성

2. **임시 토큰과 정식 토큰 분리**
   - 이유: 추가 정보 입력 완료 전에는 제한된 권한만 부여
   - JWT Claims에 `isProfileComplete: false` 포함하여 API 접근 제한 가능

3. **닉네임 중복 검사 별도 API**
   - 이유: 실시간 검증 UX, 폼 제출 전 중복 방지

4. **일반 회원가입과 소셜 추가 정보 완료 분리**
   - 이유: 로직 명확성, 향후 확장성 (이메일 인증 등)

---

## 6. 실무에서 흔히 발생하는 실수와 주의점

### 1. 소셜 로그인 후 자동 회원가입 처리

**실수 예시:**
```typescript
// ❌ 잘못된 예시
const handleSocialCallback = async (code) => {
  const socialUser = await exchangeToken(code);
  let user = await findUserBySocialId(socialUser.id);
  
  if (!user) {
    // 자동으로 회원가입 완료 처리
    user = await createUser({
      email: socialUser.email,
      name: socialUser.name,
      // ... 다른 정보를 소셜에서 가져옴
    });
  }
  
  // 바로 로그인 처리
  return { token: generateToken(user) };
};
```

**문제점:**
- 소셜 서비스의 이메일/이름을 그대로 사용 → 서비스 특성에 맞지 않을 수 있음
- 필수 정보(닉네임, 성별, 지역 등)가 없어도 회원가입 완료 처리
- 추가 정보 입력 단계를 거치지 않음

**올바른 예시:**
```typescript
// ✅ 올바른 예시
const handleSocialCallback = async (code, provider) => {
  const socialUser = await exchangeToken(code, provider);
  
  // SocialAccount 테이블에서 기존 연동 확인
  let socialAccount = await findSocialAccount(provider, socialUser.id);
  
  if (socialAccount) {
    // 기존 사용자 - 연동된 User 조회
    const user = await findUserById(socialAccount.userId);
    if (user.isProfileComplete) {
      return { token: generateToken(user), isNewUser: false, isProfileComplete: true };
    } else {
      // 추가 정보 미입력 상태
      return { token: generateTempToken(user), isNewUser: false, isProfileComplete: false };
    }
  }
  
  // 신규 사용자 - SocialAccount만 생성, User는 미생성
  const tempUser = await createTempUser(); // 또는 SocialAccount만 생성하고 user_id는 NULL
  await createSocialAccount({
    userId: tempUser.id,
    provider,
    providerUserId: socialUser.id,
    providerEmail: socialUser.email, // 참고용
  });
  
  // 임시 토큰 발급 (추가 정보 입력 후 정식 토큰 발급)
  return { 
    token: generateTempToken(tempUser), 
    isNewUser: true, 
    isProfileComplete: false 
  };
};
```

### 2. 개인정보 최소 수집 원칙 위반

**실수 예시:**
- 생년월일 전체를 필수로 수집
- 소셜 로그인 시 소셜 서비스의 프로필 사진을 자동으로 가져와서 저장

**주의점:**
- 연령대만 수집하고 생년월일은 선택적으로
- 소셜 서비스의 정보는 참고용으로만 사용하고, 서비스에는 사용자가 직접 입력한 정보만 저장

### 3. 소셜 계정 연동 시 중복 User 생성

**실수 예시:**
```typescript
// ❌ 잘못된 예시 - 같은 소셜 계정으로 여러 번 회원가입 가능
const handleSocialCallback = async (code) => {
  const socialUser = await exchangeToken(code);
  let user = await findUserBySocialId(socialUser.id);
  
  if (!user) {
    // User 생성
    user = await createUser({ ... });
    // SocialAccount 생성 (중복 체크 없음)
    await createSocialAccount({ userId: user.id, ... });
  }
  
  return { token: generateToken(user) };
};
```

**문제점:**
- 같은 소셜 계정으로 여러 번 회원가입 시도 시 중복 User 생성 가능
- SocialAccount 테이블에 UNIQUE 제약이 없으면 중복 데이터 발생

**해결책:**
- SocialAccount 테이블에 `UNIQUE(provider, provider_user_id)` 제약 추가
- 트랜잭션 내에서 User와 SocialAccount를 원자적으로 생성

### 4. JWT 토큰에 민감 정보 포함

**주의점:**
- JWT에는 최소한의 정보만 포함 (id, email, isProfileComplete 정도)
- 비밀번호, 생년월일 등 민감 정보는 절대 포함하지 않음

```typescript
// ✅ 올바른 JWT Claims 예시
const tokenPayload = {
  userId: user.id,
  email: user.email,
  isProfileComplete: user.isProfileComplete,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24시간
};
```

### 5. 추가 정보 입력 페이지 우회 가능

**문제점:**
- 클라이언트 사이드 라우팅만으로 보호하면 API 우회 가능
- 직접 API 호출하여 추가 정보 없이 서비스 이용 가능

**해결책:**
```typescript
// ✅ 백엔드 API 미들웨어 예시
const requireProfileComplete = async (req, res, next) => {
  const user = await findUserById(req.user.userId);
  
  if (!user.isProfileComplete) {
    return res.status(403).json({
      error: 'PROFILE_INCOMPLETE',
      message: '추가 정보 입력이 필요합니다.',
      redirectTo: '/auth/complete-profile'
    });
  }
  
  next();
};

// 보호가 필요한 API에 적용
app.get('/api/groups', requireAuth, requireProfileComplete, getGroups);
```

### 6. 소셜 계정 연결 해제 시 User 삭제 문제

**주의점:**
- User에 연결된 모든 소셜 계정을 해제하면 로그인 불가능
- 일반 로그인 계정도 없는 경우 계정 복구 불가능

**해결책:**
- 마지막 소셜 계정 해제 시 경고 메시지 표시
- 일반 로그인 계정이 없으면 소셜 계정 해제 제한 또는 이메일/비밀번호 설정 강제

### 7. OAuth State 파라미터 누락 (CSRF 공격)

**주의점:**
- OAuth Callback에서 state 파라미터 검증 필수
- CSRF 공격으로 인한 인증 코드 탈취 방지

```typescript
// ✅ State 검증 예시
const generateOAuthState = () => {
  return crypto.randomBytes(32).toString('hex');
};

const validateOAuthState = (receivedState, storedState) => {
  return crypto.timingSafeEqual(
    Buffer.from(receivedState),
    Buffer.from(storedState)
  );
};

// OAuth 시작 시 state 저장 (세션 또는 Redis)
const state = generateOAuthState();
sessionStorage.setItem('oauth_state', state);
redirectToOAuthProvider(state);

// Callback에서 state 검증
const storedState = sessionStorage.getItem('oauth_state');
if (!validateOAuthState(receivedState, storedState)) {
  throw new Error('Invalid state parameter');
}
```

### 8. 이메일 인증 누락 (일반 회원가입)

**주의점:**
- 일반 회원가입 시 이메일 인증을 하지 않으면 가짜 이메일로 가입 가능
- 스팸 계정 생성 방지 필요

**권장 사항:**
- 이메일 인증 완료 후 추가 정보 입력 단계 진행
- 또는 추가 정보 입력 완료 후 이메일 인증 요구 (이 경우 인증 전까지 일부 기능 제한)

---

## 추가 고려사항

### 보안
- 비밀번호 해싱: bcrypt (cost factor 10-12)
- JWT 토큰: 짧은 만료 시간 + Refresh Token 패턴 권장
- Rate Limiting: 로그인 시도, 닉네임 중복 검사 등에 적용

### 확장성
- 여러 소셜 계정 연동: 현재 설계로 이미 지원
- 이메일 변경: 별도 인증 프로세스 필요
- 계정 통합: 같은 이메일을 가진 일반 계정과 소셜 계정 통합 기능

### 사용자 경험
- 소셜 로그인 후 자동 입력: 소셜에서 받은 정보를 폼에 자동 채우기 (수정 가능)
- 진행 상황 표시: 추가 정보 입력 단계 진행률 표시
- 임시 저장: 브라우저 새로고침 시 입력 내용 유지 (로컬스토리지)


