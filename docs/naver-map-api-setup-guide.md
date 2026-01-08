# 네이버 지도 API 설정 가이드

네이버 지도 API를 사용하기 위해 필요한 설정 단계를 안내합니다.

## 1. 네이버 클라우드 플랫폼 계정 생성

1. [네이버 클라우드 플랫폼](https://www.ncloud.com/) 접속
2. 네이버 계정으로 로그인
3. 회원가입 (이미 네이버 계정이 있으면 로그인만 하면 됨)

## 2. 프로젝트 생성

1. 네이버 클라우드 플랫폼 콘솔 접속
2. **Console** → **Services** → **AI·NAVER API** → **AI·NAVER API** 선택
3. **Application 등록** 클릭

## 3. 애플리케이션 등록

### 3.1 기본 정보 입력

- **Application 이름**: `Compete_Ohun` (또는 원하는 이름)
- **API 선택**: 
  - ✅ **Dynamic Map** (필수) - JavaScript로 동적 지도 표시
  - ✅ **Geocoding** (권장) - 주소 검색용 (주소 → 좌표 변환)
  - ✅ **Reverse Geocoding** (권장) - 좌표→주소 변환용
  - ⬜ **Static Map** (선택사항) - 이미지로 지도 표시 (현재 프로젝트에서는 불필요)
  - ⬜ **Directions 5** (선택사항) - 경로 안내 API (현재 프로젝트에서는 불필요)
  - ⬜ **Directions 15** (선택사항) - 경로 안내 API (현재 프로젝트에서는 불필요)

### 3.2 Web Service URL 등록

**중요**: 네이버 지도 API는 도메인 기반 인증을 사용합니다.

#### 개발 환경 (localhost)
```
http://localhost:5173
http://localhost:3000
http://127.0.0.1:5173
http://127.0.0.1:3000
```

#### 프로덕션 환경 (배포 후)
```
https://yourdomain.com
https://www.yourdomain.com
```

**주의사항**:
- `localhost`는 개발 환경에서만 사용 가능
- 프로덕션 배포 시 실제 도메인을 반드시 등록해야 함
- 등록되지 않은 도메인에서는 지도가 표시되지 않음

## 4. API 키 발급

1. 애플리케이션 등록 완료 후
2. **Application Key** 확인
   - **Client ID**: JavaScript API에서 사용
   - **Client Secret**: 서버 사이드에서 사용 (현재는 필요 없음)

## 5. 환경 변수 설정

### 5.1 `.env` 파일 생성/수정

프로젝트 루트의 `.env` 파일에 다음 추가:

```env
# 네이버 지도 API
VITE_NAVER_MAP_CLIENT_ID=your_client_id_here

# 기존 카카오 맵 키 (선택사항 - 교체 완료 전까지 유지)
VITE_KAKAO_JAVASCRIPT_KEY=your_kakao_key_here
```

### 5.2 `.env.example` 파일 업데이트

```env
# 네이버 지도 API
VITE_NAVER_MAP_CLIENT_ID=

# 카카오 맵 API (선택사항)
VITE_KAKAO_JAVASCRIPT_KEY=
```

## 6. 네이버 지도 API 스크립트 로드

네이버 지도 API는 다음과 같이 스크립트를 로드합니다:

```html
<script type="text/javascript" src="https://oapi.map.naver.com/map3.js?ncpClientId=YOUR_CLIENT_ID"></script>
```

또는 React에서는:

```typescript
useEffect(() => {
  const script = document.createElement('script');
  script.src = `https://oapi.map.naver.com/map3.js?ncpClientId=${CLIENT_ID}`;
  script.async = true;
  document.head.appendChild(script);
  
  script.onload = () => {
    // 지도 초기화
  };
}, []);
```

## 7. 필요한 API 서비스

### 7.1 Dynamic Map (동적 지도)
- **용도**: JavaScript로 지도 렌더링, 마커 표시, 인터랙션
- **필수 여부**: ✅ 필수
- **참고**: "Static Map"은 이미지로 지도를 표시하는 것이므로 현재 프로젝트에서는 불필요

### 7.2 Geocoding (주소 → 좌표)
- **용도**: 주소 검색 시 좌표 변환
- **필수 여부**: ⚠️ 권장 (주소 검색 기능 사용 시)

### 7.3 Reverse Geocoding (좌표 → 주소)
- **용도**: 지도 클릭/마커 드래그 시 주소 표시
- **필수 여부**: ⚠️ 권장 (좌표를 주소로 변환할 때)

## 8. API 사용량 및 제한

### 무료 사용량 (월간)
- **Maps**: 300,000건
- **Geocoding**: 100,000건
- **Reverse Geocoding**: 100,000건

### 과금 정책
- 무료 사용량 초과 시 건당 과금
- 자세한 내용은 [네이버 클라우드 플랫폼 요금제](https://www.ncloud.com/product/applicationService/maps) 참고

## 9. 체크리스트

교체 작업 전 확인사항:

- [ ] 네이버 클라우드 플랫폼 계정 생성 완료
- [ ] 애플리케이션 등록 완료
- [ ] Dynamic Map API 활성화 (필수)
- [ ] Geocoding 서비스 활성화 (주소 검색 사용 시)
- [ ] Reverse Geocoding 서비스 활성화 (좌표→주소 변환 사용 시)
- [ ] Web Service URL 등록 (localhost + 프로덕션 도메인)
- [ ] Client ID 발급 완료
- [ ] `.env` 파일에 `VITE_NAVER_MAP_CLIENT_ID` 설정 완료
- [ ] 프로덕션 도메인 확정 (배포 시)

## 10. 주의사항

### 10.1 도메인 등록
- **가장 중요한 설정**: 등록되지 않은 도메인에서는 지도가 표시되지 않음
- 개발 중에는 `localhost`와 `127.0.0.1` 모두 등록 권장
- 프로덕션 배포 전 실제 도메인 반드시 등록

### 10.2 API 키 보안
- Client ID는 프론트엔드에 노출되어도 됨 (네이버 지도 API 설계)
- Client Secret은 서버 사이드에서만 사용 (현재 프로젝트에서는 불필요)
- `.env` 파일은 `.gitignore`에 포함되어 있는지 확인

### 10.3 카카오 맵과의 차이점
- **줌 레벨**: 카카오(1-14) vs 네이버(0-21) - 변환 필요
- **좌표계**: 둘 다 WGS84 사용 (동일)
- **이벤트 처리**: API 구조가 다름
- **마커 관리**: 네이버는 마커 클러스터링이 내장되어 있음

## 11. 참고 자료

- [네이버 지도 API 공식 문서](https://navermaps.github.io/maps.js.ncp/)
- [네이버 지도 API 예제](https://navermaps.github.io/maps.js.ncp/tutorial/1.GettingStarted.html)
- [네이버 클라우드 플랫폼 콘솔](https://console.ncloud.com/)

## 12. 다음 단계

API 키 발급이 완료되면:
1. `.env` 파일에 `VITE_NAVER_MAP_CLIENT_ID` 설정
2. 개발팀에 알림 (교체 작업 시작 가능)
3. 교체 작업 진행

---

**문의사항이 있으면 개발팀에 연락해주세요.**
