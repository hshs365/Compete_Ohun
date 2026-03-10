# 모바일 앱 정식 출시 (Capacitor)

Capacitor가 이미 설정되어 있습니다. 웹 빌드 → 동기화 → 네이티브 빌드 순서로 진행하면 됩니다.

---

## 1. 이미 되어 있는 것

- **client/** 에 Capacitor 프로젝트 구성
  - `capacitor.config.ts` — 앱 ID `com.allcourtplay.app`, 웹 폴더 `dist`
  - **android/** — Android 프로젝트
  - **ios/** — iOS 프로젝트 (Mac에서만 빌드 가능)
- **package.json** 스크립트
  - `npm run build:web` — TypeScript 검사 없이 웹만 빌드 (dist 생성)
  - `npm run cap:sync` — dist 내용을 android/ios에 복사
  - `npm run app:build` — build:web + cap:sync 한 번에
  - `npm run cap:android` — Android 앱 실행
  - `npm run cap:ios` — iOS 앱 실행 (Mac 필요)

---

## 2. 일상적인 앱 빌드·실행

```bash
cd client

# 1) 웹 빌드 (TS 오류가 있으면 build:web 사용)
npm run build
# 또는
npm run build:web

# 2) 네이티브 프로젝트에 반영
npm run cap:sync

# 3) 실행
npm run cap:android   # Android 에뮬레이터/연결된 기기
npm run cap:ios        # iOS 시뮬레이터/연결된 기기 (Mac 필요)
```

한 번에 하려면:

```bash
npm run app:build
npm run cap:android
```

---

## 3. API 서버 주소

앱은 빌드된 웹(React)을 웹뷰에서 띄우고, API 호출은 **client 쪽 환경 변수/설정**에 따라 갑니다.

- 이미 `allcourtplay.com` 등 **운영 도메인**을 쓰고 있다면 그대로 두면 됨.
- 로컬 개발 시:
  - Android 에뮬레이터: `http://10.0.2.2:포트`
  - iOS 시뮬레이터: `http://localhost:포트`

---

## 4. Google Play (Android) 정식 출시

1. **서명 키**
   - 키스토어 생성 후 `android/app/build.gradle`에 `signingConfigs` 설정
   - [Android 공식 문서](https://developer.android.com/studio/publish/app-signing) 참고

2. **앱 번들(AAB) 빌드**
   - Android Studio에서 `client/android` 열기
   - Build → Generate Signed Bundle / APK → Android App Bundle 선택 후 서명

3. **Play Console**
   - [Google Play Console](https://play.google.com/console) 에서 앱 등록
   - AAB 업로드, 스토어 등록 정보(설명, 스크린샷, 개인정보처리방침 등) 입력 후 제출

---

## 5. Apple App Store (iOS) 정식 출시

1. **필수**
   - **Mac** + **Apple Developer Program** 가입 (유료)
   - Xcode 설치

2. **Xcode에서**
   - `client/ios/App/App.xcworkspace` 열기
   - 팀·서명·프로비저닝 프로파일 설정
   - Product → Archive → Distribute App → App Store Connect

3. **App Store Connect**
   - [App Store Connect](https://appstoreconnect.apple.com) 에서 앱 등록
   - 빌드 업로드 후 심사 제출

---

## 6. PWA (앱 스토어 없이 “앱처럼” 쓰기)

- `client/public/manifest.json` 과 `index.html` 설정으로 **홈 화면에 추가** 가능
- Android: Chrome → 메뉴 → “앱 설치”
- iOS: Safari → 공유 → “홈 화면에 추가”
- 앱 스토어 심사 없이 빠르게 배포할 때 유용

---

## 요약

| 단계 | 명령/작업 |
|------|-----------|
| 웹 빌드 | `npm run build` 또는 `npm run build:web` |
| 앱에 반영 | `npm run cap:sync` 또는 `npm run app:build` |
| Android 실행 | `npm run cap:android` |
| iOS 실행 (Mac) | `npm run cap:ios` |
| Android 스토어 | AAB 서명 → Play Console 업로드 |
| iOS 스토어 | Xcode Archive → App Store Connect 업로드 |
