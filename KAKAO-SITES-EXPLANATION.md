# 카카오 사이트 구분 가이드

## 📚 두 가지 사이트

### 1. 카카오 개발자 콘솔 (설정하는 곳) ✅
**URL**: `https://developers.kakao.com/console/app/1358790`

**용도**:
- API 키 발급 및 확인
- 앱 설정 (플랫폼, 제품 설정 등)
- 추가 기능 신청
- 사용량 확인

**여기서 해야 할 일**:
1. ✅ 추가 기능 신청: "앱 설정" > "앱" > "추가 기능 신청"
2. ✅ 카카오맵 활성화: "제품 설정" > "카카오맵" > 상태 ON
3. ✅ 플랫폼 설정: "앱 설정" > "앱" > "플랫폼" > Web 플랫폼 등록
4. ✅ JavaScript 키 확인: "앱 설정" > "앱" > "플랫폼 키"

### 2. 카카오맵 API 가이드 (문서 보는 곳) 📖
**URL**: `https://apis.map.kakao.com/web/guide/`

**용도**:
- API 사용 방법 문서
- 코드 예제
- 샘플 코드

**여기서 할 일**:
- ❌ 설정 불가능 (문서만 볼 수 있음)
- ✅ API 사용 방법 참고
- ✅ 코드 예제 확인

## ✅ 올바른 순서

### 1단계: 카카오 개발자 콘솔에서 설정
1. **추가 기능 신청**
   - `https://developers.kakao.com/console/app/1358790/config/feature`
   - 카카오맵 신청

2. **승인 대기** (몇 분 ~ 몇 시간)

3. **카카오맵 활성화**
   - `https://developers.kakao.com/console/app/1358790/product/kakao-map`
   - 상태를 ON으로 변경

4. **플랫폼 설정**
   - `https://developers.kakao.com/console/app/1358790/config/platform`
   - Web 플랫폼에 `http://localhost:5173` 등록

5. **JavaScript 키 확인**
   - `https://developers.kakao.com/console/app/1358790/config/platform-key`
   - JavaScript 키 복사

### 2단계: 코드에 적용
- `.env` 파일에 JavaScript 키 설정 (이미 완료됨)
- 코드는 이미 작성되어 있음

### 3단계: API 가이드 참고 (선택사항)
- `https://apis.map.kakao.com/web/guide/`
- 필요시 문서 참고

## 🎯 지금 해야 할 일

**카카오 개발자 콘솔로 돌아가세요!**

1. **추가 기능 신청 페이지로 이동**:
   ```
   https://developers.kakao.com/console/app/1358790/config/feature
   ```

2. **또는 사이드바에서**:
   - "앱 설정" > "앱" > "추가 기능 신청"

3. **카카오맵 신청**

## 📝 요약

- **카카오 개발자 콘솔** = 설정하는 곳 ✅ (여기서 작업)
- **카카오맵 API 가이드** = 문서 보는 곳 📖 (참고용)

**지금은 카카오 개발자 콘솔에서 추가 기능 신청을 해야 합니다!**



