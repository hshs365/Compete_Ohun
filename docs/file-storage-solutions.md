# 파일 스토리지 솔루션 가이드

## 🚨 현재 문제점

**현재 구조:**
- 웹서버1 (192.168.132.185): 파일을 로컬 디스크에 저장
- 웹서버2 (192.168.132.126): 파일을 로컬 디스크에 저장
- LB 서버 (192.168.132.147): 요청을 두 웹서버로 분산

**문제 시나리오:**
1. 사용자 A가 웹서버1로 요청 → 파일 업로드 → 웹서버1 디스크에 저장
2. 사용자 B가 웹서버2로 요청 → 같은 파일 조회 시도 → **404 에러!** (웹서버2에는 파일이 없음)

## ✅ 해결 방법

### 방법 1: 공유 스토리지 (NFS) - 권장 ⭐

**장점:**
- 두 웹서버가 같은 디렉토리를 공유
- 추가 비용 없음
- 구현 간단

**구현:**

#### 1-1. NFS 서버 설정 (DB 서버 또는 별도 서버)

```bash
# DB 서버(192.168.132.81)에서 NFS 서버 설정
sudo apt update
sudo apt install nfs-kernel-server -y

# 공유 디렉토리 생성
sudo mkdir -p /mnt/shared/uploads
sudo chown webmaster:webmaster /mnt/shared/uploads
sudo chmod 755 /mnt/shared/uploads

# NFS 설정
sudo nano /etc/exports
```

**/etc/exports 내용:**
```
/mnt/shared/uploads 192.168.132.185(rw,sync,no_subtree_check)
/mnt/shared/uploads 192.168.132.126(rw,sync,no_subtree_check)
```

```bash
# NFS 서버 재시작
sudo exportfs -ra
sudo systemctl restart nfs-kernel-server
```

#### 1-2. 웹서버에서 NFS 마운트

**웹서버1 & 웹서버2에서:**
```bash
# NFS 클라이언트 설치
sudo apt install nfs-common -y

# 마운트 포인트 생성
sudo mkdir -p /mnt/shared/uploads

# NFS 마운트
sudo mount -t nfs 192.168.132.81:/mnt/shared/uploads /mnt/shared/uploads

# 자동 마운트 설정 (재부팅 시 자동 마운트)
echo "192.168.132.81:/mnt/shared/uploads /mnt/shared/uploads nfs defaults 0 0" | sudo tee -a /etc/fstab
```

#### 1-3. 서버 코드 수정

**server/src/auth/auth.service.ts:**
```typescript
private async uploadProfileImage(userId: number, file: Express.Multer.File): Promise<string> {
  const fs = require('fs').promises;
  const path = require('path');
  const crypto = require('crypto');
  
  // 공유 스토리지 경로 사용 (환경변수로 설정 가능)
  const uploadDir = process.env.UPLOAD_DIR || '/mnt/shared/uploads/profile';
  
  // 디렉토리가 없으면 생성
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  
  // 파일 확장자 추출
  const ext = path.extname(file.originalname) || '.jpg';
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const filename = `${userId}_${Date.now()}_${randomBytes}${ext}`;
  const filepath = path.join(uploadDir, filename);
  
  // 파일 저장
  await fs.writeFile(filepath, file.buffer);
  
  // URL 반환
  return `/uploads/profile/${filename}`;
}
```

**서버 .env 파일:**
```env
UPLOAD_DIR=/mnt/shared/uploads
```

---

### 방법 2: 클라우드 스토리지 (Cloudflare R2 / AWS S3) - 확장성 좋음 ⭐⭐

**장점:**
- 서버 디스크 사용량 없음
- CDN 연동 가능
- 자동 백업
- 무제한 확장

**단점:**
- 추가 비용 (R2는 무료 제공량 있음)
- 외부 의존성

**구현:**

#### 2-1. Cloudflare R2 설정

```bash
# 패키지 설치
npm install @aws-sdk/client-s3
```

**server/src/config/storage.config.ts:**
```typescript
import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'ohun-uploads';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://your-domain.r2.dev';
```

**server/src/auth/auth.service.ts:**
```typescript
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, R2_BUCKET, R2_PUBLIC_URL } from '../config/storage.config';

private async uploadProfileImage(userId: number, file: Express.Multer.File): Promise<string> {
  const crypto = require('crypto');
  const ext = path.extname(file.originalname) || '.jpg';
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const filename = `profile/${userId}_${Date.now()}_${randomBytes}${ext}`;
  
  // R2에 업로드
  await s3Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));
  
  // 공개 URL 반환
  return `${R2_PUBLIC_URL}/${filename}`;
}
```

---

### 방법 3: 파일 동기화 (rsync) - 비권장 ⚠️

**장점:**
- 구현 간단
- 추가 서버 불필요

**단점:**
- 실시간 동기화 어려움
- 지연 발생 가능
- 복잡한 충돌 처리

**구현:**
```bash
# cron으로 주기적 동기화
*/5 * * * * rsync -av /home/webmaster/my-app/uploads/ webmaster@192.168.132.126:/home/webmaster/my-app/uploads/
```

---

### 방법 4: 별도 파일 서버 - 중간 규모 ⭐

**구조:**
- 파일 서버 (192.168.132.XXX): 파일 저장 전용
- 웹서버1, 웹서버2: 파일 서버에 HTTP 요청으로 업로드/다운로드

**장점:**
- 역할 분리
- 확장 용이

**단점:**
- 추가 서버 필요
- 네트워크 지연 가능

---

## 🎯 권장 사항

### 현재 상황 (VMware 가상머신)
**방법 1: NFS 공유 스토리지** 권장
- 추가 비용 없음
- 구현 간단
- DB 서버에 NFS 서버 설치

### 향후 확장 시
**방법 2: Cloudflare R2** 권장
- 무료 제공량: 10GB 저장, 1백만 건 읽기/월
- CDN 연동으로 빠른 전송
- 자동 백업

## 📝 구현 체크리스트

### NFS 방식 (권장)
- [ ] DB 서버에 NFS 서버 설치
- [ ] 공유 디렉토리 생성 및 권한 설정
- [ ] 웹서버1, 웹서버2에 NFS 마운트
- [ ] 서버 코드에서 공유 경로 사용
- [ ] 환경변수 설정 (UPLOAD_DIR)

### Cloudflare R2 방식
- [ ] Cloudflare R2 버킷 생성
- [ ] API 키 발급
- [ ] @aws-sdk/client-s3 패키지 설치
- [ ] 서버 코드 수정
- [ ] 환경변수 설정

## 🔄 마이그레이션 계획

**현재 → NFS 방식:**
1. NFS 서버 설정
2. 기존 파일을 NFS로 이동
3. 서버 코드 수정
4. 테스트

**NFS → R2 방식 (향후):**
1. R2 버킷 생성
2. 기존 파일을 R2로 업로드
3. 서버 코드 수정
4. 점진적 마이그레이션
