# 라이선스 검토 문서

이 문서는 프로젝트에서 사용 중인 모든 폰트, 디자인, API, 라이브러리의 라이선스를 검토한 결과입니다.

## 📋 목차
1. [라이브러리 및 프레임워크](#라이브러리-및-프레임워크)
2. [API 서비스](#api-서비스)
3. [아이콘 및 디자인 리소스](#아이콘-및-디자인-리소스)
4. [폰트](#폰트)
5. [유료 서비스 요약](#유료-서비스-요약)

---

## 라이브러리 및 프레임워크

### ✅ 무료 (오픈소스)

#### 프론트엔드
- **React** (v19.0.0)
  - 라이선스: MIT License
  - 상태: ✅ 무료, 상업적 사용 가능
  - 링크: https://github.com/facebook/react

- **React DOM** (v19.0.0)
  - 라이선스: MIT License
  - 상태: ✅ 무료, 상업적 사용 가능

- **React Router DOM** (v7.0.0)
  - 라이선스: MIT License
  - 상태: ✅ 무료, 상업적 사용 가능

- **Tailwind CSS** (v4.0.0)
  - 라이선스: MIT License
  - 상태: ✅ 무료, 상업적 사용 가능
  - 링크: https://github.com/tailwindlabs/tailwindcss

- **Vite** (v7.0.0)
  - 라이선스: MIT License
  - 상태: ✅ 무료, 상업적 사용 가능

- **TypeScript** (v5.6.0)
  - 라이선스: Apache-2.0 License
  - 상태: ✅ 무료, 상업적 사용 가능

- **Leaflet** (v1.9.4)
  - 라이선스: BSD 2-Clause License
  - 상태: ✅ 무료, 상업적 사용 가능
  - 링크: https://github.com/Leaflet/Leaflet

- **React Leaflet** (v4.2.1)
  - 라이선스: ISC License
  - 상태: ✅ 무료, 상업적 사용 가능

- **FullCalendar** (v6.1.20)
  - 라이선스: MIT License
  - 상태: ✅ 무료, 상업적 사용 가능
  - 링크: https://github.com/fullcalendar/fullcalendar

- **Axios** (v1.7.0)
  - 라이선스: MIT License
  - 상태: ✅ 무료, 상업적 사용 가능

#### 백엔드
- **NestJS** (v11.0.0)
  - 라이선스: MIT License
  - 상태: ✅ 무료, 상업적 사용 가능
  - 링크: https://github.com/nestjs/nest

- **TypeORM** (v0.3.20)
  - 라이선스: MIT License
  - 상태: ✅ 무료, 상업적 사용 가능

- **Passport.js** (v0.7.0)
  - 라이선스: MIT License
  - 상태: ✅ 무료, 상업적 사용 가능

- **bcrypt** (v5.1.1)
  - 라이선스: MIT License
  - 상태: ✅ 무료, 상업적 사용 가능

- **PostgreSQL (pg)** (v8.12.0)
  - 라이선스: MIT License
  - 상태: ✅ 무료, 상업적 사용 가능

---

## API 서비스

### ⚠️ 제한적 무료 (사용량 제한 있음)

#### 1. 카카오맵 API
- **서비스**: 카카오맵 JavaScript API, REST API (로컬 API)
- **라이선스**: 카카오 API 이용약관
- **무료 제공량**: 
  - 일 10만 건 (로컬 API)
  - 월 300만 건 (JavaScript API)
- **유료 전환 기준**: 무료 제공량 초과 시
- **현재 사용량**: 예상 일 수십~수백 건 수준
- **상태**: ⚠️ **무료 제공량 내에서 사용 중** (현재는 무료)
- **주의사항**: 
  - 사용량이 증가하면 유료 전환 필요할 수 있음
  - 카카오 개발자 콘솔에서 사용량 모니터링 필요
  - 필요 시 유료 플랜으로 전환하여 사용
- **문서**: https://developers.kakao.com/docs/latest/ko/local/dev-guide
- **가격 정책**: https://developers.kakao.com/pricing

#### 2. 다음 주소 검색 API (Daum Postcode)
- **서비스**: 다음 주소 검색 API
- **라이선스**: 다음 이용약관
- **무료 제공량**: 무제한 (비상업적/상업적 모두)
- **상태**: ✅ **완전 무료**
- **주의사항**: 
  - 다음 서비스 정책 변경 시 영향 받을 수 있음
  - 현재는 무료로 제공 중
- **문서**: https://postcode.map.daum.net/guide

### ✅ 완전 무료

---

## 아이콘 및 디자인 리소스

### ✅ 무료

#### Heroicons
- **라이브러리**: @heroicons/react (v2.1.0)
- **라이선스**: MIT License
- **상태**: ✅ 무료, 상업적 사용 가능
- **링크**: https://github.com/tailwindlabs/heroicons
- **사용 위치**: 전체 프로젝트 (아이콘)

---

## 폰트

### ✅ 시스템 기본 폰트 사용
- **현재 상태**: 명시적인 웹폰트 사용 없음
- **사용 중인 폰트**: 
  - 시스템 기본 폰트 (브라우저 기본값)
  - Tailwind CSS의 기본 폰트 스택 사용
- **라이선스**: 시스템 폰트는 OS 라이선스에 따름
- **상태**: ✅ **무료** (추가 라이선스 불필요)

### 권장사항
- Google Fonts 사용 시: 대부분 무료 (상업적 사용 가능)
- 예시: Noto Sans KR, Inter, Roboto 등
- 라이선스: SIL Open Font License 또는 Apache 2.0

---

## 유료 서비스 요약

### ⚠️ 주의가 필요한 서비스

#### 1. 카카오맵 API
- **현재 상태**: 무료 제공량 내 사용 중
- **유료 전환 시점**: 
  - 일 10만 건 초과 시 (로컬 API)
  - 월 300만 건 초과 시 (JavaScript API)
- **예상 비용**: 사용량에 따라 결정 (카카오 개발자 콘솔에서 확인)
- **대응 방안**: 
  - 사용량 모니터링 필수
  - 필요 시 유료 플랜으로 전환하여 사용

### ✅ 완전 무료 서비스
- 다음 주소 검색 API
- 모든 오픈소스 라이브러리

---

## 라이선스 준수 사항

### 필수 사항
1. **오픈소스 라이선스 준수**
   - MIT, BSD, Apache-2.0 라이선스는 대부분 attribution(저작자 표시)만 필요
   - 프로젝트에 LICENSE 파일 또는 NOTICE 파일 추가 권장

2. **카카오맵 API 이용약관 준수**
   - 카카오 개발자 콘솔에서 이용약관 확인
   - 사용량 모니터링
   - 정책 변경 시 대응 준비
   - 필요 시 유료 플랜으로 전환

### 권장 사항
1. **라이선스 파일 추가**
   ```bash
   # 프로젝트 루트에 추가
   LICENSE (프로젝트 자체 라이선스)
   NOTICE (사용 중인 오픈소스 라이선스 정리)
   ```

2. **사용량 모니터링**
   - 카카오맵 API 사용량 정기 확인
   - 예상치 초과 시 유료 플랜으로 전환

---

## 결론

### ✅ 현재 상태
- **대부분 무료**: 모든 라이브러리와 대부분의 API가 무료
- **제한적 무료**: 카카오맵 API는 무료 제공량 내에서 사용 중
- **유료 전환 필요 없음**: 현재 사용량 기준으로는 유료 전환 불필요

### ⚠️ 주의사항
1. **카카오맵 API 사용량 모니터링 필수**
   - 일 10만 건 초과 시 유료 전환 필요
   - 현재는 무료 제공량 내에서 안전하게 사용 가능
   - 필요 시 유료 플랜으로 전환하여 사용

3. **라이선스 파일 추가 권장**
   - 프로젝트에 LICENSE 파일 추가
   - 사용 중인 오픈소스 라이선스 정리

---

## 참고 링크

- [카카오 개발자 콘솔](https://developers.kakao.com/)
- [카카오맵 API 가격 정책](https://developers.kakao.com/pricing)
- [다음 주소 검색 API](https://postcode.map.daum.net/guide)
- [Heroicons](https://heroicons.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**최종 업데이트**: 2025-12-31
**검토자**: AI Assistant
**다음 검토 예정일**: 카카오맵 API 사용량 증가 시 또는 분기별
