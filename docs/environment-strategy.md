# 환경 구성 전략 (Dev/Stg/Prod)

## 📊 현재 상황 분석

### 프로젝트 규모
- 초기 개발 단계
- VMware 가상머신 환경
- 리소스 제한적
- 팀 규모: 소규모

### 엔터프라이즈급 환경 구성의 필요성

#### ✅ 필요한 경우
- 대규모 팀 (10명 이상)
- 복잡한 배포 프로세스
- 운영 환경 안정성 중시
- 자동화된 테스트 필수
- 리소스 여유 있음

#### ❌ 불필요한 경우 (현재 상황)
- 소규모 팀
- 초기 개발 단계
- 리소스 제한적
- 빠른 개발 우선

## 🎯 권장 전략: 단순화된 환경 구성

### 현재 단계: Dev + Prod 2단계 구성

**Dev 환경:**
- 목적: 개발 및 테스트
- 서버: 웹서버1 (192.168.132.185)
- DB: 개발용 DB (또는 운영 DB와 분리)
- 특징: 빠른 배포, 실험적 기능 테스트

**Prod 환경:**
- 목적: 실제 서비스 운영
- 서버: 웹서버1 (현재), 향후 웹서버2 추가
- DB: 운영 DB
- 특징: 안정성 우선, 검증된 기능만 배포

### 향후 확장: Stg 환경 추가 (필요 시)

**Stg (Staging) 환경:**
- 목적: 운영 배포 전 최종 검증
- 시기: 사용자 증가, 복잡한 기능 추가 시
- 구성: 운영과 동일한 환경으로 구성

## 🔧 구현 방법

### 방법 1: 환경변수 기반 분리 (권장)

**장점:**
- 추가 서버 불필요
- 설정 간단
- 비용 절감

**구현:**

#### 1. 환경변수 설정

**개발 환경 (.env.development):**
```env
NODE_ENV=development
DB_HOST=localhost
DB_NAME=ohun_dev
LOG_LEVEL=debug
SMS_VERIFICATION_ENABLED=false  # 개발 중에는 비활성화
```

**운영 환경 (.env.production):**
```env
NODE_ENV=production
DB_HOST=192.168.132.81
DB_NAME=ohun
LOG_LEVEL=info
SMS_VERIFICATION_ENABLED=true
```

#### 2. 코드에서 환경 분기

**server/src/main.ts:**
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  // 개발 환경 설정
  console.log('🔧 Development mode');
} else {
  // 운영 환경 설정
  console.log('🚀 Production mode');
}
```

#### 3. Jenkins 파이프라인 분리

**Jenkinsfile:**
```groovy
parameters {
  choice(name: 'ENVIRONMENT', choices: ['development', 'production'], description: 'Deploy environment')
}

environment {
  NODE_ENV = "${params.ENVIRONMENT}"
}
```

### 방법 2: 별도 서버 구성 (향후)

**구조:**
- Dev 서버: 개발 전용
- Stg 서버: 스테이징 전용
- Prod 서버: 운영 전용

**시기:**
- 사용자 증가 시
- 복잡한 기능 추가 시
- 팀 규모 확장 시

## 📋 현재 단계 권장사항

### 즉시 적용: 환경변수 기반 분리

1. **환경변수 추가**
   - `NODE_ENV`: development / production
   - `SMS_VERIFICATION_ENABLED`: 개발 중 false, 운영 true

2. **코드 수정**
   - 환경에 따른 분기 처리
   - 개발 환경에서는 SMS 인증 우회

3. **Jenkins 파이프라인**
   - 환경 선택 파라미터 추가
   - 환경별 설정 적용

### 향후 확장 계획

1. **Stg 환경 추가** (필요 시)
   - 별도 서버 또는 가상머신
   - 운영과 동일한 구성

2. **자동화 테스트**
   - CI/CD 파이프라인에 테스트 단계 추가
   - Stg 환경에서 자동 테스트

## 🎯 결론

**현재 단계:**
- ✅ Dev/Prod 2단계 구성 권장
- ✅ 환경변수 기반 분리
- ❌ Stg 환경은 아직 불필요

**장점:**
- 빠른 개발 가능
- 리소스 절약
- 설정 간단

**단점:**
- 운영 배포 전 검증 환경 부족 (향후 Stg 추가로 해결)

**추천:**
1. 지금: 환경변수 기반 Dev/Prod 분리
2. 향후: 사용자 증가 시 Stg 환경 추가
