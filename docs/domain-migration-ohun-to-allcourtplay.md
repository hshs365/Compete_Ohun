# 도메인 전환: ohun.kr → allcourtplay.com (Cloudflare)

allcourtplay.com을 이미 등록해 두었고, 현재 ohun.kr이 Cloudflare에 연결되어 있을 때 allcourtplay.com으로 서비스를 옮기는 절차입니다.

---

## 1. Cloudflare에서 allcourtplay.com 추가

### 1-1. allcourtplay.com이 아직 Cloudflare에 없는 경우

1. **Cloudflare 대시보드** → **Add a Site** (사이트 추가)
2. **도메인 입력**: `allcourtplay.com` → **Continue**
3. **플랜 선택** (Free 플랜으로 충분)
4. **스캔 후** DNS 레코드 확인 → **Continue**
5. **네임서버 안내**가 나오면, 도메인 등록처(가비아, 카페24, Namecheap 등)에서
   - allcourtplay.com의 **네임서버**를 Cloudflare에서 안내한 2개(예: `xxx.ns.cloudflare.com`, `yyy.ns.cloudflare.com`)로 **변경**
   - 반영에 수분~48시간 걸릴 수 있음
6. Cloudflare에서 **Verify** 후 활성화 완료

### 1-2. allcourtplay.com이 이미 Cloudflare에 있는 경우

해당 사이트를 선택한 뒤 아래 2번부터 진행하면 됩니다.

---

## 2. DNS 레코드 설정 (allcourtplay.com)

Cloudflare **DNS** 탭에서 ohun.kr에 쓰던 것과 **같은 서버**를 가리키도록 추가합니다.

| 타입 | 이름 | 내용 | 프록시 |
|------|------|------|--------|
| **A** | `@` | (현재 ohun.kr이 가리키는 서버 IP) | Proxied (주황색 구름) |
| **CNAME** | `www` | `allcourtplay.com` 또는 동일 서버 호스트명 | Proxied |

- ohun.kr의 A 레코드에 들어가 있는 **IPv4 주소**를 그대로 allcourtplay.com `@` 에 넣으면 됩니다.
- **Proxy status**: **Proxied**(주황색 구름) 권장 → Cloudflare CDN·DDoS 방어·SSL 적용.

---

## 3. SSL/TLS 설정

1. **SSL/TLS** 탭 이동
2. **Overview**: 암호화 모드 **Full** 또는 **Full (strict)** 선택  
   - 백엔드(오리진)에 유효한 인증서가 있으면 **Full (strict)** 권장
3. **Edge Certificates**:
   - **Always Use HTTPS** 켜기
   - 필요 시 **Automatic HTTPS Rewrites** 켜기

---

## 4. (선택) ohun.kr 리다이렉트

기존 사용자가 ohun.kr로 접속해도 allcourtplay.com으로 넘기려면:

1. **Rules** → **Page Rules** (또는 **Redirect Rules**)
2. 규칙 추가:
   - **URL**: `ohun.kr/*` 또는 `*ohun.kr*`
   - **Setting**: **Forwarding URL** (301 - Permanent Redirect)
   - **Destination**: `https://allcourtplay.com/$1` (또는 `https://www.allcourtplay.com/$1`)

이렇게 하면 `https://ohun.kr/xxx` → `https://allcourtplay.com/xxx` 로 이동합니다.

---

## 5. 코드·배포 설정 반영

이 저장소에서는 이미 다음이 **allcourtplay.com** 기준으로 수정되어 있습니다.

- **서버 CORS** (`server/src/main.ts`): `https://allcourtplay.com`, `https://www.allcourtplay.com` 허용
- **클라이언트** (`client/vite.config.ts`): `allowedHosts`에 `allcourtplay.com`, `www.allcourtplay.com` 포함
- **문서/가이드**: FRONTEND_URL, nginx `server_name`, curl 예시 등 allcourtplay.com 사용

배포 시 확인할 것:

1. **서버 `.env`**
   - `FRONTEND_URL=https://allcourtplay.com,https://www.allcourtplay.com`
   - 필요 시 `NODE_ENV=production`
2. **웹서버(nginx 등)**
   - `server_name allcourtplay.com www.allcourtplay.com;`
   - 기존 `ohun.kr` 블록은 제거하거나 301 리다이렉트로 대체
3. **배포 후**
   - `https://allcourtplay.com`, `https://www.allcourtplay.com` 접속 및 API 호출 확인
   - CORS/쿠키/로그인 동작 확인

---

## 6. 체크리스트

- [ ] allcourtplay.com Cloudflare에 추가 및 네임서버 전환 완료
- [ ] allcourtplay.com, www DNS 레코드 추가 (A, CNAME)
- [ ] SSL/TLS Full (또는 Full strict) 적용
- [ ] (선택) ohun.kr → allcourtplay.com 301 리다이렉트 규칙 추가
- [ ] 서버/클라이언트 코드 배포 (CORS, allowedHosts 등)
- [ ] 서버 `.env`의 FRONTEND_URL allcourtplay.com으로 변경
- [ ] nginx 등에서 server_name allcourtplay.com으로 변경
- [ ] 브라우저에서 https://allcourtplay.com 접속·로그인·API 동작 확인

이 순서대로 하시면 ohun.kr에서 allcourtplay.com으로 도메인 전환이 완료됩니다.
