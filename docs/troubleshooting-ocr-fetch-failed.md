# 사업자등록증 OCR "fetch failed" / 네이버클라우드 호출 수 0

## 현상

- 서버 로그: `[BusinessRegistrationOcrService] CLOVA OCR request failed: fetch failed`
- 네이버클라우드 CLOVA OCR 콘솔: **일반 OCR API 호출 수 0**
- 브라우저 콘솔: `Failed to load resource: net::ERR_UPLOAD_FILE_CHANGED` (나타날 수 있음)

## 원인 요약

1. **서버 → NCP 연결 실패**  
   요청이 **서버까지는 도달**하지만, 서버가 **네이버클라우드 CLOVA OCR API**를 호출할 때 `fetch`가 실패합니다.  
   그래서 NCP에는 요청이 한 건도 기록되지 않고, 호출 수가 0으로 보입니다.

2. **클라이언트 업로드 실패 (ERR_UPLOAD_FILE_CHANGED)**  
   압축된 이미지(Blob 기반 File)가 전송 직전/도중 무효화되면, 서버로 업로드가 완료되지 않을 수 있습니다.  
   이 경우에도 서버는 OCR를 호출하지 않으므로 NCP 호출 수는 0입니다.

---

## 1. 서버 "fetch failed" 점검

### 1.1 환경 변수

`.env`에 다음이 **반드시** 설정되어 있어야 합니다.

- `NCP_OCR_INVOKE_URL`: CLOVA OCR **Document API** Invoke URL (사업자등록증 도메인)
- `NCP_OCR_SECRET`: 해당 도메인의 Secret Key

서버 기동 시 로그에 다음이 보이면 OCR은 비활성 상태입니다.

- `CLOVA OCR 미설정: NCP_OCR_SECRET, NCP_OCR_INVOKE_URL를 .env에 설정하고...`

이 경우에는 NCP 호출 자체가 이루어지지 않습니다.

### 1.2 Invoke URL 확인

- NCP 콘솔: **AI Services > CLOVA OCR > Domain**
- **사업자등록증(KR)** 등 문서 타입에 맞는 **도메인** 생성 후, **API Gateway 연동**으로 **Invoke URL** 발급
- `NCP_OCR_INVOKE_URL`에는 이 **Invoke URL 전체**를 넣습니다 (예: `https://xxxxx.apigw.ntruss.com/...`).
- **일반 OCR Reader URL이 아니라, Document API(도메인 기반) Invoke URL**을 사용해야 합니다.

### 1.3 localhost에서 테스트 가능 여부

- **가능합니다.** 다만 NCP로 요청을 보내는 쪽은 **API 서버**이므로, **서버가 돌아가는 PC**에서 NCP(apigw.ntruss.com)로 나가는 HTTPS가 되어야 합니다.
- **서버와 클라이언트가 같은 PC**인 경우: 브라우저는 `localhost:5173`, 서버는 `localhost:3000`이어도 되고, **그 PC**에서 방법 A를 실행하면 됩니다.
- **서버를 다른 PC에서 돌리는 경우**(예: 개발 노트북에서 브라우저만 쓰고, API는 다른 서버 PC의 주소로 연결): 방법 A는 **서버가 돌아가는 그 PC**에서 실행해야 합니다. 개발 노트북에서 실행하면 의미 없습니다.
- 일반적인 가정/사무실 인터넷에서는 서버 PC에서 NCP로 나가는 연결이 **막혀 있지 않은 경우가 많고**, localhost(또는 서버 주소)로 OCR 테스트는 그대로 하시면 됩니다.

### 1.4 `*.apigw.ntruss.com` 막힘 여부 확인 방법

서버가 NCP로 나가는 HTTPS를 할 수 있는지 아래 중 편한 방법으로 확인하면 됩니다.

**방법 A: 터미널에서 연결 테스트**

- **중요:** 이 확인은 **서버(Node)가 실행 중인 PC**에서 해야 합니다.  
  클라이언트(브라우저)나 개발용 노트북이 아니라, `npm run start:dev` 등으로 **API 서버가 돌아가는 그 PC**에서 PowerShell/CMD를 열고 실행하세요.  
  NCP로 `fetch`를 보내는 쪽이 서버이기 때문에, **서버 PC**에서 `apigw.ntruss.com`으로 나가는 연결이 되어야 OCR이 동작합니다.

서버가 돌아가는 **그 PC**에서 PowerShell 또는 CMD를 열고 실행합니다.

- **PowerShell:**
  ```powershell
  try { (Invoke-WebRequest -Uri "https://apigw.ntruss.com" -Method Head -UseBasicParsing -TimeoutSec 10).StatusCode } catch { $_.Exception.Message }
  ```
  - 숫자(예: 200, 403, 404)가 나오면 → NCP로 **HTTPS 연결 가능**.
  - "연결할 수 없습니다", "타임아웃" 등 메시지가 나오면 → 방화벽/네트워크/DNS 문제 가능.

- **CMD 또는 Git Bash 등에서 curl 사용 가능한 경우:**
  ```bash
  curl -I -s -o NUL -w "%{http_code}" https://apigw.ntruss.com
  ```
  - 숫자(200, 403, 404 등)가 나오면 연결 가능, 에러 메시지가 나오면 연결 실패.

실제 사용 중인 Invoke URL이 있다면, 그 URL의 호스트만 따로 테스트할 수도 있습니다.

```powershell
# 예: Invoke URL이 https://abc123.apigw.ntruss.com/custom/v1/... 형태라면
try { (Invoke-WebRequest -Uri "https://abc123.apigw.ntruss.com" -Method Head -UseBasicParsing -TimeoutSec 10).StatusCode } catch { $_.Exception.Message }
```

- **결과가 숫자(예: 200, 403, 404 등)** 이면 → 해당 PC에서 NCP로 **HTTPS 연결은 가능**한 상태입니다. (OCR 실패 원인은 URL/Secret, 요청 형식 등 다른 쪽을 보면 됩니다.)
- **연결 실패(타임아웃, "could not resolve host" 등)** 이면 → 방화벽/프록시/회사망에서 아웃바운드가 막혀 있거나 DNS 문제일 수 있습니다.

**방법 B: 서버 로그의 `cause` 확인 (가장 정확)**

1. 서버를 띄운 뒤, **사업자등록증 OCR**을 한 번 실행해 보세요.
2. 실패 시 터미널에 찍히는 로그에서 다음 형식을 찾습니다.  
   `CLOVA OCR request failed: ... | cause: ... (host: ...)`
3. **cause** 내용으로 대략 구분할 수 있습니다.
   - `cause: getaddrinfo ENOTFOUND ...` → **DNS 실패** (도메인 오타이거나, 해당 PC/네트워크에서 NCP 도메인을 못 찾는 경우)
   - `cause: connect ECONNREFUSED` → **연결 거부** (방화벽/프록시가 막거나, URL이 잘못된 경우)
   - `cause: ... certificate ...` 또는 `UNABLE_TO_VERIFY_LEAF_SIGNATURE` → **SSL 인증서** 문제
   - `cause: ... timeout` → **타임아웃** (중간에서 끊거나 매우 느린 경우)

즉, **localhost 환경이어도 NCP로 나가는 연결만 되면 OCR 호출은 가능**하고, 막혀 있는지는 **방법 A(curl)** 또는 **방법 B(로그 cause)** 로 확인하시면 됩니다.

### 1.5 서버 로그로 원인 확인

수정 후에는 실패 시 로그에 다음이 함께 출력됩니다.

- `cause:` … Node가 보고한 하위 오류 (네트워크/SSL 등)
- `(host: ...)` … 사용 중인 Invoke URL의 호스트 (URL 전체는 보안상 숨김)

예:

- `cause: ... certificate ...` → SSL 인증서 문제 가능성
- `cause: ... ECONNREFUSED` → 방화벽/프록시 또는 URL 잘못
- `cause: ... getaddrinfo ...` → DNS 문제(도메인 오타, 네트워크 제한)
- **ConnectTimeoutError (attempted address: clovaocr-api-kr.ncloud.com:80)** → 연결 타임아웃. **:80**이면 HTTP(80)로 접속 중일 수 있음. 사업자등록증 OCR은 **API Gateway Invoke URL**(`https://xxxxx.apigw.ntruss.com/...`, HTTPS 443)을 써야 함. NCP 콘솔 **CLOVA OCR > Domain > 해당 도메인 > API Gateway 연동**에서 발급한 Invoke URL을 `NCP_OCR_INVOKE_URL`에 넣었는지 확인.

---

## 2. 클라이언트 ERR_UPLOAD_FILE_CHANGED

- 압축 결과인 **Blob 기반 File**을 그대로 업로드하면, 전송 시점에 Blob이 무효화되며 `ERR_UPLOAD_FILE_CHANGED`가 날 수 있습니다.
- 코드에서는 **압축 직후** 해당 File을 `arrayBuffer()`로 읽어, 그 버퍼로 만든 **새 File**을 FormData에 넣도록 변경해 두었습니다.
  - 내 정보 비즈니스 전환: `MyInfoPage.tsx`
  - 회원가입 사업자등록증 검증: `Step5BusinessVerification.tsx`
- 같은 현상이 계속되면, 업로드 전에 **파일 선택을 다시 하지 않았는지**, **탭/창을 바꾸거나 새로고침하지 않았는지** 확인해 보세요.

---

## 3. 체크리스트

| 확인 항목 | 내용 |
|-----------|------|
| `.env` | `NCP_OCR_INVOKE_URL`, `NCP_OCR_SECRET` 설정 여부 |
| NCP 도메인 | 사업자등록증용 Document API 도메인 생성·API Gateway 연동 후 Invoke URL 사용 |
| 서버 → NCP | 서버가 NCP Invoke URL로 HTTPS(443) 아웃바운드 가능한지 |
| 서버 로그 | `CLOVA OCR request failed` 뒤의 `cause`, `host` 확인 |
| 클라이언트 | 업로드 직전 파일 재선택/탭 전환 없이 한 번만 전송 |

위 항목을 순서대로 확인하면, "fetch failed"와 NCP 호출 수 0 원인을 좁혀갈 수 있습니다.
