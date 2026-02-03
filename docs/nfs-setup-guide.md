# NFS 공유 스토리지 설정 가이드

## 📋 개요

DB 서버(192.168.132.81)에 NFS 서버를 설치하고, 웹서버1, 웹서버2가 공유 디렉토리를 마운트하여 파일을 공유합니다.

## 🔧 단계별 설정

### 1단계: DB 서버에 NFS 서버 설치 및 설정

**DB 서버(192.168.132.81)에서 실행:**

```bash
# 1. NFS 서버 설치
sudo apt update
sudo apt install nfs-kernel-server -y

# 2. 공유 디렉토리 생성
sudo mkdir -p /mnt/shared/uploads
sudo mkdir -p /mnt/shared/uploads/profile
sudo mkdir -p /mnt/shared/uploads/groups

# 3. 권한 설정 (webmaster 사용자가 접근 가능하도록)
sudo chown -R dbmaster:dbmaster /mnt/shared/uploads
sudo chmod -R 755 /mnt/shared/uploads

# 4. NFS 설정 파일 편집
sudo nano /etc/exports
```

**/etc/exports 파일 내용:**
```
# 웹서버1 (현재 운영 중)
/mnt/shared/uploads 192.168.132.185(rw,sync,no_subtree_check,no_root_squash)

# 웹서버2 (향후 추가 시 주석 해제)
# /mnt/shared/uploads 192.168.132.126(rw,sync,no_subtree_check,no_root_squash)
```

**설정 설명:**
- `rw`: 읽기/쓰기 권한
- `sync`: 동기식 쓰기 (데이터 안정성)
- `no_subtree_check`: 성능 향상
- `no_root_squash`: root 사용자 권한 유지

**⚠️ 참고:** 현재는 웹서버1만 운영 중이므로 웹서버2 라인은 주석 처리되어 있습니다. 웹서버2를 추가할 때 주석을 해제하고 IP 주소를 수정하세요.

```bash
# 5. NFS 서버 재시작
sudo exportfs -ra
sudo systemctl restart nfs-kernel-server
sudo systemctl enable nfs-kernel-server

# 6. 방화벽 설정 (필요한 경우)
sudo ufw allow from 192.168.132.185 to any port nfs
sudo ufw allow from 192.168.132.126 to any port nfs

# 7. 설정 확인
sudo exportfs -v
```

**예상 출력 (현재 웹서버1만):**
```
/mnt/shared/uploads  192.168.132.185(sync,wdelay,hide,no_subtree_check,sec=sys,rw,secure,no_root_squash,no_all_squash)
```

---

### 2단계: 웹서버1에 NFS 클라이언트 설치 및 마운트

**웹서버1(192.168.132.185)에서 실행:**

```bash
# 1. NFS 클라이언트 설치
sudo apt update
sudo apt install nfs-common -y

# 2. 마운트 포인트 생성
sudo mkdir -p /mnt/shared/uploads

# 3. NFS 마운트 테스트
sudo mount -t nfs 192.168.132.81:/mnt/shared/uploads /mnt/shared/uploads

# 4. 마운트 확인
df -h | grep nfs
mount | grep nfs
```

**예상 출력:**
```
192.168.132.81:/mnt/shared/uploads on /mnt/shared/uploads type nfs4 (rw,relatime,vers=4.2,rsize=1048576,wsize=1048576,namlen=255,hard,proto=tcp,timeo=600,retrans=2,sec=sys,clientaddr=192.168.132.185,local_lock=none,addr=192.168.132.81)
```

```bash
# 5. 쓰기 권한 테스트
sudo touch /mnt/shared/uploads/test.txt
sudo rm /mnt/shared/uploads/test.txt
echo "NFS 마운트 성공!"

# 6. 자동 마운트 설정 (재부팅 시 자동 마운트)
echo "192.168.132.81:/mnt/shared/uploads /mnt/shared/uploads nfs defaults 0 0" | sudo tee -a /etc/fstab

# 7. fstab 테스트 (오타 확인)
sudo mount -a
```

---

### 3단계: 웹서버2에 NFS 클라이언트 설치 및 마운트 (향후 추가 시)

**⚠️ 현재는 웹서버2가 없으므로 이 단계는 건너뛰세요.**

**웹서버2를 추가할 때 실행할 명령어:**

```bash
# 1. NFS 클라이언트 설치
sudo apt update
sudo apt install nfs-common -y

# 2. 마운트 포인트 생성
sudo mkdir -p /mnt/shared/uploads

# 3. NFS 마운트 테스트
sudo mount -t nfs 192.168.132.81:/mnt/shared/uploads /mnt/shared/uploads

# 4. 마운트 확인
df -h | grep nfs
mount | grep nfs

# 5. 쓰기 권한 테스트
sudo touch /mnt/shared/uploads/test2.txt
sudo rm /mnt/shared/uploads/test2.txt
echo "NFS 마운트 성공!"

# 6. 자동 마운트 설정
echo "192.168.132.81:/mnt/shared/uploads /mnt/shared/uploads nfs defaults 0 0" | sudo tee -a /etc/fstab

# 7. fstab 테스트
sudo mount -a
```

**웹서버2 추가 시 DB 서버에서도 설정 추가 필요:**
```bash
# DB 서버에서 /etc/exports 파일 편집
sudo nano /etc/exports
# 웹서버2 IP 주소 추가 후
sudo exportfs -ra
sudo systemctl restart nfs-kernel-server
```

---

### 4단계: 서버 환경변수 설정

**웹서버1 & 웹서버2에서:**

```bash
# 서버 디렉토리로 이동
cd /home/webmaster/my-app/server

# .env 파일 편집
nano .env
```

**.env 파일에 추가:**
```env
# 파일 업로드 디렉토리 (NFS 공유 스토리지)
UPLOAD_DIR=/mnt/shared/uploads
```

**또는 기존 .env 파일이 있다면:**
```bash
echo "UPLOAD_DIR=/mnt/shared/uploads" >> /home/webmaster/my-app/server/.env
```

---

### 5단계: 권한 설정 (중요!)

**웹서버1 & 웹서버2에서:**

```bash
# webmaster 사용자가 NFS 디렉토리에 쓰기 가능하도록
# (이미 DB 서버에서 dbmaster로 설정했지만, 웹서버에서도 확인)

# 마운트된 디렉토리 권한 확인
ls -la /mnt/shared/uploads

# webmaster 사용자로 테스트
sudo -u webmaster touch /mnt/shared/uploads/test_webmaster.txt
sudo -u webmaster rm /mnt/shared/uploads/test_webmaster.txt
```

**만약 권한 문제가 있다면:**

```bash
# DB 서버에서 다시 권한 설정
# (DB 서버에서 실행)
sudo chmod -R 777 /mnt/shared/uploads  # 임시로 모든 권한 부여 (테스트용)
# 또는
sudo chown -R webmaster:webmaster /mnt/shared/uploads  # webmaster 소유로 변경
```

---

### 6단계: 백엔드 재시작

**웹서버1 & 웹서버2에서:**

```bash
# PM2로 백엔드 재시작
pm2 restart backend

# 또는 직접 재시작
cd /home/webmaster/my-app/server
npm run start:dev
```

---

## ✅ 테스트 방법

### 1. 파일 업로드 테스트

**웹서버1에서:**
```bash
# 테스트 파일 생성
echo "test from web1" > /mnt/shared/uploads/profile/test_web1.txt
```

**웹서버2에서:**
```bash
# 웹서버1에서 생성한 파일 확인
cat /mnt/shared/uploads/profile/test_web1.txt
# 출력: test from web1

# 웹서버2에서도 파일 생성
echo "test from web2" > /mnt/shared/uploads/profile/test_web2.txt
```

**웹서버1에서:**
```bash
# 웹서버2에서 생성한 파일 확인
cat /mnt/shared/uploads/profile/test_web2.txt
# 출력: test from web2
```

### 2. 애플리케이션 테스트

1. 웹서버1로 요청 → 프로필 이미지 업로드
2. 업로드된 이미지가 `/mnt/shared/uploads/profile/`에 저장되는지 확인
3. 브라우저에서 이미지 URL로 접근하여 정상 표시 확인

**웹서버2 추가 후:**
1. 웹서버1로 요청 → 프로필 이미지 업로드
2. 웹서버2로 요청 → 같은 이미지 조회
3. 정상적으로 이미지가 표시되는지 확인

---

## 🔧 문제 해결

### 문제 1: 마운트 실패

**증상:**
```
mount.nfs: access denied by server
```

**해결:**
```bash
# DB 서버에서 exports 파일 확인
sudo cat /etc/exports

# NFS 서버 재시작
sudo systemctl restart nfs-kernel-server

# 방화벽 확인
sudo ufw status
```

### 문제 2: 권한 거부

**증상:**
```
Permission denied
```

**해결:**
```bash
# DB 서버에서 권한 재설정
sudo chmod -R 777 /mnt/shared/uploads  # 테스트용
# 또는
sudo chown -R webmaster:webmaster /mnt/shared/uploads
```

### 문제 3: 자동 마운트 실패

**증상:**
재부팅 후 마운트가 안 됨

**해결:**
```bash
# fstab 파일 확인
cat /etc/fstab | grep nfs

# 수동 마운트 테스트
sudo mount -a

# NFS 서비스가 시작되기 전에 마운트 시도하는 경우
# fstab에 _netdev 옵션 추가
sudo nano /etc/fstab
# 변경: nfs defaults → nfs defaults,_netdev
```

---

## 📝 요약

**설정 완료 후 (현재):**
- ✅ DB 서버: NFS 서버 실행 중
- ✅ 웹서버1: NFS 마운트 완료
- ⏸️ 웹서버2: 향후 추가 예정
- ✅ 환경변수: `UPLOAD_DIR=/mnt/shared/uploads` 설정
- ✅ 백엔드: 재시작 완료

**파일 저장 위치:**
- 모든 파일이 `/mnt/shared/uploads/`에 저장됨
- 두 웹서버 모두 같은 파일 접근 가능

---

## 🔄 향후 유지보수

### NFS 서버 재시작 시
```bash
# DB 서버에서
sudo systemctl restart nfs-kernel-server
```

### 마운트 해제 (필요한 경우)
```bash
# 웹서버에서
sudo umount /mnt/shared/uploads
```

### 마운트 상태 확인
```bash
# 웹서버에서
mount | grep nfs
df -h | grep nfs
```

---

## 📋 NFS 설정 검증 체크리스트

### 완료된 단계
- [x] DB 서버에 NFS 서버 설치
- [x] /etc/exports 설정
- [x] 웹서버1에 NFS 마운트
- [x] /etc/fstab 자동 마운트 설정
- [x] .env 파일에 UPLOAD_DIR 설정
- [x] 백엔드 재시작

### 검증 단계

**1. 마운트 확인 (웹서버):** `df -h | grep nfs`, `mount | grep nfs`

**2. 쓰기 테스트:**  
`echo "NFS test" > /mnt/shared/uploads/test_nfs.txt` → 양쪽에서 `cat` 확인

**3. 디렉토리 구조:** `ls -la /mnt/shared/uploads/`, `ls -la /mnt/shared/uploads/profile/`

**4. 환경변수:** `cat .../server/.env | grep UPLOAD_DIR`, `pm2 env 0 | grep UPLOAD_DIR`

**5. 정적 파일:** `curl http://localhost:3000/uploads/test_nfs.txt`

**6. 실제 업로드:** 브라우저에서 프로필 이미지 업로드 후 `ls -la /mnt/shared/uploads/profile/` 확인

### 문제 해결
- **마운트 안 보임:** `sudo mount -t nfs 192.168.132.81:/mnt/shared/uploads /mnt/shared/uploads`, `dmesg | tail -20`
- **권한 거부:** DB 서버에서 `sudo ls -la /mnt/shared/uploads`, 필요 시 권한 조정
- **업로드 실패:** `pm2 logs backend`, `pm2 env 0`, 디렉토리 권한 확인
